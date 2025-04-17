import { getAudioContext, decodeBase64ToArrayBuffer } from "./utils";
import PcmEncodingProcessorSource from "./worklets/audio-processing";
import VolumeMeterProcessorSource from "./worklets/vol-meter";

import { createWorkletScriptUrl } from "./audioworklet-registry";
import EventEmitter from "eventemitter3";

/**
 * Encodes an ArrayBuffer into a Base64 string.
 * @param buffer - The ArrayBuffer to encode.
 * @returns The Base64 encoded string.
 */
function encodeArrayBufferToBase64(buffer: ArrayBuffer): string {
  let binary = "";
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  try {
    return window.btoa(binary);
  } catch (e) {
    console.error("Error encoding ArrayBuffer to Base64:", e);
    return ""; // Return empty string or handle error as needed
  }
}

/**
 * Events emitted by the MicrophoneProcessor.
 */
type MicrophoneProcessorEvents = {
  /** Emitted when a chunk of PCM audio data (encoded as Base64) is available. */
  audioData: (base64EncodedData: string) => void;
  /** Emitted periodically with the current input volume level (RMS). */
  volumeUpdate: (volumeLevel: number) => void;
  /** Emitted when the recording process starts successfully. */
  recordingStarted: () => void;
  /** Emitted when the recording process stops. */
  recordingStopped: () => void;
  /** Emitted when an error occurs during setup or recording. */
  error: (errorMessage: string) => void;
};

/**
 * Captures audio from the microphone, processes it using AudioWorklets 
 * for PCM encoding and volume metering, and emits events.
 */
export class MicrophoneProcessor extends EventEmitter<MicrophoneProcessorEvents> {
  private _mediaStream: MediaStream | null = null;
  private _audioContext: AudioContext | null = null;
  private _audioSourceNode: MediaStreamAudioSourceNode | null = null;
  private _isRecording: boolean = false;
  private _pcmEncoderNode: AudioWorkletNode | null = null;
  private _volumeMeterNode: AudioWorkletNode | null = null;
  private _initializationPromise: Promise<void> | null = null;
  private _targetSampleRate: number;

  /**
   * Creates an instance of MicrophoneProcessor.
   * @param targetSampleRate - The desired sample rate for the output audio (e.g., 16000). Defaults to 16000.
   */
  constructor(targetSampleRate = 16000) {
    super();
    this._targetSampleRate = targetSampleRate;
  }

  /**
   * Checks if recording is currently active.
   */
  get isRecording(): boolean {
    return this._isRecording;
  }

  /**
   * Initializes the microphone and audio context, adds worklets, and starts processing.
   * Emits 'recordingStarted' on success or 'error' on failure.
   */
  async start(): Promise<void> {
    if (this._isRecording || this._initializationPromise) {
      console.warn("Recording is already active or starting.");
      return this._initializationPromise || Promise.resolve();
    }

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      const errorMsg = "getUserMedia is not supported in this browser.";
      this.emit("error", errorMsg);
      throw new Error(errorMsg);
    }

    this._initializationPromise = new Promise(async (resolve, reject) => {
      try {
        this._mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        this._audioContext = await getAudioContext({ sampleRate: this._targetSampleRate, contextId: "microphone-processor" });
        this._audioSourceNode = this._audioContext.createMediaStreamSource(this._mediaStream);

        // --- Setup PCM Encoder Worklet ---
        const pcmEncoderName = "pcm-encoder-processor";
        const pcmEncoderUrl = createWorkletScriptUrl(pcmEncoderName, PcmEncodingProcessorSource);
        await this._audioContext.audioWorklet.addModule(pcmEncoderUrl);
        this._pcmEncoderNode = new AudioWorkletNode(this._audioContext, pcmEncoderName);

        this._pcmEncoderNode.port.onmessage = (event: MessageEvent) => {
          if (event.data.eventType === "audioData" && event.data.audioData) {
            const base64String = encodeArrayBufferToBase64(event.data.audioData);
            if (base64String) {
              this.emit("audioData", base64String);
            }
          }
        };
        this._audioSourceNode.connect(this._pcmEncoderNode);
        // Connect encoder to destination ONLY if you need to hear the raw input
        // this._pcmEncoderNode.connect(this._audioContext.destination);

        // --- Setup Volume Meter Worklet ---
        const volumeMeterName = "volume-meter-processor";
        const volumeMeterUrl = createWorkletScriptUrl(volumeMeterName, VolumeMeterProcessorSource);
        await this._audioContext.audioWorklet.addModule(volumeMeterUrl);
        // Pass update interval via options if desired
        this._volumeMeterNode = new AudioWorkletNode(this._audioContext, volumeMeterName, { 
            // processorOptions: { updateIntervalMs: 50 } // Example: update 20 times/sec
        }); 

        this._volumeMeterNode.port.onmessage = (event: MessageEvent) => {
          if (typeof event.data.volume === 'number') {
            this.emit("volumeUpdate", event.data.volume);
          }
        };
        // Connect source to volume meter independently
        this._audioSourceNode.connect(this._volumeMeterNode);
        // Volume meter does not need to connect to destination
        // this._volumeMeterNode.connect(this._audioContext.destination);

        this._isRecording = true;
        this.emit("recordingStarted");
        resolve();
      } catch (err) {
        const errorMsg = `Error starting microphone processor: ${err instanceof Error ? err.message : String(err)}`;
        console.error(errorMsg, err);
        this.emit("error", errorMsg);
        // Clean up partially initialized resources on error
        this.stop(true); 
        reject(new Error(errorMsg));
      } finally {
        this._initializationPromise = null;
      }
    });
    return this._initializationPromise;
  }

  /**
   * Stops the microphone capture, disconnects nodes, and releases resources.
   * Emits 'recordingStopped'.
   * @param {boolean} [internalCall=false] - Flag to indicate if called during error cleanup.
   */
  stop(internalCall = false): void {
    const performStop = () => {
      if (!this._isRecording && !internalCall) {
        console.warn("Recording is not active.");
        return;
      }

      // Disconnect nodes safely
      try {
          this._audioSourceNode?.disconnect();
      } catch (e) { console.error("Error disconnecting source node:", e); }
      try {
          this._pcmEncoderNode?.disconnect();
      } catch (e) { console.error("Error disconnecting PCM encoder node:", e); }
      try {
          this._volumeMeterNode?.disconnect();
      } catch (e) { console.error("Error disconnecting volume meter node:", e); }

      // Stop media tracks
      this._mediaStream?.getTracks().forEach((track) => {
        try {
            track.stop();
        } catch (e) { console.error("Error stopping media track:", e); }
      });

      // Close AudioContext if we own it (optional, depends on context sharing strategy)
      // Consider if contextId was used and if it should be closed here
      // if (this._audioContext?.close) {
      //     this._audioContext.close().catch(e => console.error("Error closing AudioContext:", e));
      // }

      // Clear references
      this._mediaStream = null;
      this._audioContext = null;
      this._audioSourceNode = null;
      this._pcmEncoderNode = null;
      this._volumeMeterNode = null;
      
      if(this._isRecording) {
        this._isRecording = false;
        if (!internalCall) {
            this.emit("recordingStopped");
        }
      }
    };

    // If initialization is in progress, wait for it to finish (or fail) then stop.
    if (this._initializationPromise) {
      this._initializationPromise
        .catch(() => {}) // Catch potential initialization errors, we still want to stop
        .finally(performStop);
    } else {
      performStop();
    }
  }
}
