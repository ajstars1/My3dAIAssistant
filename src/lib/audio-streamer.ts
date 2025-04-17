import {
  createWorkletScriptUrl,
  audioWorkletRegistry,
  AudioWorkletRegistration
} from "./audioworklet-registry";

/**
 * Handles buffering and playback of streamed PCM audio data using the Web Audio API.
 */
export class AudioPlaybackStreamer {
  private _audioBufferQueue: Float32Array[] = [];
  private _isPlaying: boolean = false;
  private _playbackSampleRate: number = 24000; // Default, can be configured
  private _playbackBufferSize: number = 7680; // Default buffer size for processing
  private _processingBuffer: Float32Array = new Float32Array(0);
  private _scheduledPlaybackTime: number = 0;
  private _gainController: GainNode;
  private _audioContext: AudioContext;
  private _isPlaybackComplete: boolean = false;
  private _playbackCheckIntervalId: number | null = null;
  private _initialBufferingTimeMs: number = 100; // Initial delay before starting playback
  private _lastScheduledSourceNode: AudioBufferSourceNode | null = null;

  /** Callback function triggered when playback queue is empty and stream is marked as complete. */
  public onPlaybackComplete = () => {};

  /**
   * Creates an instance of AudioPlaybackStreamer.
   * @param audioContext - The Web Audio API AudioContext to use for playback.
   * @param config - Optional configuration for sample rate and buffer size.
   */
  constructor(audioContext: AudioContext, config?: { sampleRate?: number, bufferSize?: number }) {
    if (!audioContext) {
        throw new Error("AudioContext must be provided.");
    }
    this._audioContext = audioContext;
    this._playbackSampleRate = config?.sampleRate ?? this._playbackSampleRate;
    this._playbackBufferSize = config?.bufferSize ?? this._playbackBufferSize;

    this._gainController = this._audioContext.createGain();
    this._gainController.connect(this._audioContext.destination);

    // Bind methods to ensure `this` context is correct
    this.addPcmChunk = this.addPcmChunk.bind(this);
    this.stopPlayback = this.stopPlayback.bind(this);
    this.resumePlayback = this.resumePlayback.bind(this);
    this.markStreamComplete = this.markStreamComplete.bind(this);
    this.registerWorklet = this.registerWorklet.bind(this);
    this._scheduleNextAudioBuffer = this._scheduleNextAudioBuffer.bind(this);
  }

  /**
   * Dynamically registers an AudioWorkletProcessor.
   * @param workletName - A unique name for the worklet.
   * @param workletSource - The string source code of the AudioWorkletProcessor class.
   * @param messageHandler - A callback function to handle messages from the worklet.
   */
  async registerWorklet<T extends (messageData: any) => void>(
    workletName: string,
    workletSource: string,
    messageHandler: T,
  ): Promise<this> {
    if (!workletName || !workletSource || !messageHandler) {
        throw new Error("Worklet name, source, and message handler must be provided.");
    }
    
    let contextWorklets = audioWorkletRegistry.get(this._audioContext);
    
    // Check if already registered on this context
    if (contextWorklets && contextWorklets[workletName]) {
      console.warn(`Worklet "${workletName}" already registered for this context. Adding handler.`);
      contextWorklets[workletName].handlers.push(messageHandler);
      return this;
    }

    // Initialize registry for this context if it's the first time
    if (!contextWorklets) {
      contextWorklets = {};
      audioWorkletRegistry.set(this._audioContext, contextWorklets);
    }

    // Create placeholder entry while loading
    const registration: AudioWorkletRegistration = { handlers: [messageHandler] };
    contextWorklets[workletName] = registration;

    try {
        const workletUrl = createWorkletScriptUrl(workletName, workletSource);
        await this._audioContext.audioWorklet.addModule(workletUrl);
        const workletNode = new AudioWorkletNode(this._audioContext, workletName);
        
        // Store the created node
        registration.node = workletNode;

        // Assign the message handler (will be used in _scheduleNextAudioBuffer)
        // Note: The actual connection happens when scheduling buffers

        URL.revokeObjectURL(workletUrl); // Clean up blob URL
    } catch (error) {
        console.error(`Failed to register worklet "${workletName}":`, error);
        // Clean up partial registration on error
        delete contextWorklets[workletName]; 
        if(Object.keys(contextWorklets).length === 0) {
            audioWorkletRegistry.delete(this._audioContext);
        }
        throw new Error(`Failed to register worklet "${workletName}": ${error}`);
    }

    return this;
  }

  /**
   * Adds a chunk of raw PCM audio data (Int16) to the processing buffer.
   * @param pcmInt16Chunk - An Int16Array or Uint8Array containing the PCM data.
   */
  addPcmChunk(pcmInt16Chunk: Int16Array | Uint8Array) {
    let float32Array: Float32Array;

    // Convert Uint8Array (assuming Int16 little-endian pairs) or Int16Array to Float32
    if (pcmInt16Chunk instanceof Uint8Array) {
        if (pcmInt16Chunk.length % 2 !== 0) {
            console.warn("Received Uint8Array PCM chunk with odd length. Last byte ignored.");
        }
        float32Array = new Float32Array(pcmInt16Chunk.length / 2);
        const dataView = new DataView(pcmInt16Chunk.buffer, pcmInt16Chunk.byteOffset, pcmInt16Chunk.byteLength);
        for (let i = 0; i < float32Array.length; i++) {
            try {
                const int16 = dataView.getInt16(i * 2, true); // true for little-endian
                float32Array[i] = int16 / 32768.0; // Normalize to -1.0 to 1.0
            } catch (e) {
                console.error("Error processing PCM chunk byte pair:", e);
                float32Array[i] = 0; // Assign safe value on error
            }
        }
    } else if (pcmInt16Chunk instanceof Int16Array) {
        float32Array = new Float32Array(pcmInt16Chunk.length);
        for (let i = 0; i < pcmInt16Chunk.length; i++) {
            float32Array[i] = pcmInt16Chunk[i] / 32768.0; // Normalize
        }
    } else {
        console.error("Invalid chunk type provided to addPcmChunk. Expected Int16Array or Uint8Array.");
        return;
    }
    
    // Append the converted Float32 data to the processing buffer
    const combinedBuffer = new Float32Array(this._processingBuffer.length + float32Array.length);
    combinedBuffer.set(this._processingBuffer, 0);
    combinedBuffer.set(float32Array, this._processingBuffer.length);
    this._processingBuffer = combinedBuffer;

    // Process the buffer into playable chunks
    while (this._processingBuffer.length >= this._playbackBufferSize) {
      const bufferChunk = this._processingBuffer.slice(0, this._playbackBufferSize);
      this._audioBufferQueue.push(bufferChunk);
      this._processingBuffer = this._processingBuffer.slice(this._playbackBufferSize);
    }

    // Start playback if not already playing and buffer has enough data
    if (!this._isPlaying && this._audioBufferQueue.length > 0) {
      this._isPlaying = true;
      this._scheduledPlaybackTime = this._audioContext.currentTime + (this._initialBufferingTimeMs / 1000);
      this._scheduleNextAudioBuffer();
    }
  }

  /**
   * Creates an AudioBuffer from Float32Array data.
   */
  private _createAudioBuffer(audioData: Float32Array): AudioBuffer {
    try {
      const audioBuffer = this._audioContext.createBuffer(
        1, // Number of channels (mono)
        audioData.length, // Buffer length in samples
        this._playbackSampleRate, // Sample rate
      );
      // Fill the buffer with data
      audioBuffer.getChannelData(0).set(audioData);
      return audioBuffer;
    } catch (error) {
        console.error("Error creating AudioBuffer:", error);
        // Return an empty buffer as a fallback
        return this._audioContext.createBuffer(1, 1, this._playbackSampleRate);
    }
  }

  /**
   * Schedules the next available audio buffer for playback.
   * Manages the scheduling timing and checks for stream completion.
   */
  private _scheduleNextAudioBuffer() {
    const scheduleLookaheadTime = 0.2; // Seconds to schedule ahead

    while (
      this._audioBufferQueue.length > 0 &&
      this._scheduledPlaybackTime < this._audioContext.currentTime + scheduleLookaheadTime
    ) {
      const audioDataChunk = this._audioBufferQueue.shift()!;
      const audioBuffer = this._createAudioBuffer(audioDataChunk);
      const sourceNode = this._audioContext.createBufferSource();
      sourceNode.buffer = audioBuffer;

      // Connect to gain controller for volume control
      sourceNode.connect(this._gainController);

      // Connect source to registered worklets
      const contextWorklets = audioWorkletRegistry.get(this._audioContext);
      if (contextWorklets) {
        Object.values(contextWorklets).forEach((registration) => {
          if (registration.node) {
            sourceNode.connect(registration.node);
            // Re-assign handler each time? Or only once in registerWorklet?
            // If handler logic depends on state outside the worklet, maybe re-assign. 
            // If handler is static, assign once.
            if (!registration.node.port.onmessage) { // Assign only if not already set
                 registration.node.port.onmessage = (event: MessageEvent) => {
                    // Ensure port exists before using it as context
                    const portContext = registration.node?.port;
                    if (!portContext) return;
                    registration.handlers.forEach((handler) => {
                        try {
                            handler.call(portContext, event.data);
                        } catch (e) {
                            console.error("Error in worklet message handler:", e);
                        }
                    });
                };
                // Connect worklet output if needed (e.g., for effects to reach destination)
                 registration.node.connect(this._audioContext.destination);
            }
          }
        });
      }

      // Handle the end of the *last* scheduled buffer in the queue
      if (this._audioBufferQueue.length === 0) {
          // Clear previous handler if any
          if (this._lastScheduledSourceNode) {
              this._lastScheduledSourceNode.onended = null;
          }
          this._lastScheduledSourceNode = sourceNode;
          sourceNode.onended = () => {
              // Check if this is *still* the last node and the queue is *still* empty
              if (this._lastScheduledSourceNode === sourceNode && this._audioBufferQueue.length === 0) {
                  this._lastScheduledSourceNode = null;
                  if (this._isPlaybackComplete) { // Only trigger if stream was marked complete
                      this.onPlaybackComplete();
                  }
              }
          };
      }


      // Schedule playback, ensuring it's not in the past
      const startTime = Math.max(this._scheduledPlaybackTime, this._audioContext.currentTime);
      sourceNode.start(startTime);

      // Update the time for the next buffer
      this._scheduledPlaybackTime = startTime + audioBuffer.duration;
    }

    // Check if playback should stop or continue scheduling
    if (this._audioBufferQueue.length === 0 && this._processingBuffer.length === 0) {
      // Queue and processing buffer are empty
      if (this._isPlaybackComplete) {
        // Stream is marked complete, stop playback
        this._isPlaying = false;
        if (this._playbackCheckIntervalId) {
          clearInterval(this._playbackCheckIntervalId);
          this._playbackCheckIntervalId = null;
        }
        // Note: onPlaybackComplete is triggered by the 'onended' event of the last buffer
      } else {
        // Stream not marked complete yet, keep checking for new data
        if (!this._playbackCheckIntervalId) {
          this._playbackCheckIntervalId = window.setInterval(() => {
            // If new data arrived, schedule it
            if (this._audioBufferQueue.length > 0 || this._processingBuffer.length >= this._playbackBufferSize) {
              this._scheduleNextAudioBuffer();
            }
          }, 50); // Check every 50ms
        }
      }
    } else {
      // Buffers still available, schedule the next check
      const timeUntilNextSchedule = (this._scheduledPlaybackTime - this._audioContext.currentTime) * 1000;
      // Schedule slightly before the next buffer is needed
      setTimeout(this._scheduleNextAudioBuffer, Math.max(0, timeUntilNextSchedule - 50)); 
    }
  }

  /**
   * Stops playback immediately, clears buffers, and resets state.
   */
  stopPlayback(): void {
    this._isPlaying = false;
    this._isPlaybackComplete = true; // Assume stopping means completion unless resumed
    this._audioBufferQueue = [];
    this._processingBuffer = new Float32Array(0);
    // We don't reset scheduled time here, let the fade handle it

    if (this._playbackCheckIntervalId) {
      clearInterval(this._playbackCheckIntervalId);
      this._playbackCheckIntervalId = null;
    }

    // Cancel scheduled nodes and fade out current sound
    try {
        // Stop all scheduled sources (future ones)
         // Note: This API might not exist directly, need alternative like tracking sources
        // Or rely on gain fade out
        
        // Fade out gain smoothly
        this._gainController.gain.cancelScheduledValues(this._audioContext.currentTime);
        this._gainController.gain.linearRampToValueAtTime(0, this._audioContext.currentTime + 0.1);
    } catch (e) {
        console.error("Error during gain fade out:", e);
        // Fallback: set gain to 0 immediately
        this._gainController.gain.setValueAtTime(0, this._audioContext.currentTime);
    }
    
    // Disconnect gain node after fade to ensure silence, then recreate for potential resume
    setTimeout(() => {
        try {
            this._gainController.disconnect();
        } catch (e) { console.error("Error disconnecting gain node:", e); }
        // Recreate gain node for potential future playback
        this._gainController = this._audioContext.createGain();
        this._gainController.connect(this._audioContext.destination);
    }, 200); // Wait slightly longer than fade duration
    
    // Stop any tracked source nodes explicitly if possible/needed
     if (this._lastScheduledSourceNode) {
         try {
             this._lastScheduledSourceNode.stop();
             this._lastScheduledSourceNode.disconnect();
         } catch(e) { console.error("Error stopping last source node:", e); }
         this._lastScheduledSourceNode = null;
     }
  }

  /**
   * Resumes playback if the audio context was suspended.
   * Resets the playback completion flag and scheduled time.
   */
  async resumePlayback(): Promise<void> {
    try {
      if (this._audioContext.state === "suspended") {
        await this._audioContext.resume();
        console.log("AudioContext resumed.");
      }
      this._isPlaybackComplete = false;
      // Reset scheduled time relative to current time plus buffer
      this._scheduledPlaybackTime = this._audioContext.currentTime + (this._initialBufferingTimeMs / 1000);
      // Ensure gain is back to 1
      this._gainController.gain.cancelScheduledValues(this._audioContext.currentTime);
      this._gainController.gain.setValueAtTime(1, this._audioContext.currentTime);
      
      // Restart scheduling if needed
      if (this._isPlaying && (this._audioBufferQueue.length > 0 || this._processingBuffer.length > 0)) {
           this._scheduleNextAudioBuffer();
       }
    } catch (error) {
        console.error("Error resuming playback:", error);
    }
  }

  /**
   * Marks the incoming audio stream as complete.
   * Playback will continue until the buffer is empty, then `onPlaybackComplete` will be called.
   */
  markStreamComplete(): void {
    this._isPlaybackComplete = true;
    // Process any remaining data in the processing buffer
    if (this._processingBuffer.length > 0) {
      this._audioBufferQueue.push(this._processingBuffer);
      this._processingBuffer = new Float32Array(0);
      // Ensure scheduling continues if it was paused waiting for data
      if (this._isPlaying && !this._playbackCheckIntervalId && this._audioBufferQueue.length > 0) {
          this._scheduleNextAudioBuffer();
      }
    } else if (this._audioBufferQueue.length === 0 && !this._lastScheduledSourceNode) {
        // If buffer and queue are already empty and nothing is scheduled,
        // call complete immediately.
        this.onPlaybackComplete();
    }
    // The `onended` event of the last buffer will trigger onPlaybackComplete otherwise.
  }
}
