/**
 * Describes the structure for managing an AudioWorkletNode and its message handlers.
 */
export type AudioWorkletRegistration = {
  node?: AudioWorkletNode;
  handlers: Array<(this: MessagePort, ev: MessageEvent) => any>;
};

/**
 * A map storing registered AudioWorklet instances per AudioContext.
 * Key: AudioContext instance
 * Value: Record mapping worklet names to their registration details.
 */
export const audioWorkletRegistry: Map<
  AudioContext,
  Record<string, AudioWorkletRegistration>
> = new Map();

/**
 * Creates a Blob URL from a JavaScript string containing an AudioWorkletProcessor class definition.
 * This URL can be used with `audioContext.audioWorklet.addModule()`.
 *
 * @param workletName - The name to register the processor with (e.g., "my-processor").
 * @param workletSource - A string containing the JavaScript code for the AudioWorkletProcessor class.
 * @returns A Blob URL representing the worklet script.
 */
export const createWorkletScriptUrl = (
  workletName: string,
  workletSource: string,
): string => {
  if (!workletName || !workletSource) {
    throw new Error("Worklet name and source must be provided.");
  }
  try {
    const scriptContent = `registerProcessor("${workletName}", ${workletSource})`;
    const scriptBlob = new Blob([scriptContent], {
      type: "application/javascript",
    });
    return URL.createObjectURL(scriptBlob);
  } catch (error) {
    console.error(`Failed to create worklet script URL for ${workletName}:`, error);
    throw new Error(`Failed to create worklet script URL: ${error}`);
  }
};
