export type AudioContextConfig = AudioContextOptions & {
  contextId?: string;
};

const audioContextRegistry: Map<string, AudioContext> = new Map();

/**
 * Retrieves or creates an AudioContext, ensuring user interaction has occurred.
 */
export const getAudioContext: (
  options?: AudioContextConfig,
) => Promise<AudioContext> = (() => {
  let interactionPromise: Promise<void> | null = null;

  const ensureInteraction = () => {
    if (!interactionPromise) {
      interactionPromise = new Promise((resolve) => {
        const resolveOnce = () => resolve();
        window.addEventListener("pointerdown", resolveOnce, { once: true });
        window.addEventListener("keydown", resolveOnce, { once: true });
      });
    }
    return interactionPromise;
  };

  return async (options?: AudioContextConfig) => {
    const contextId = options?.contextId;

    if (contextId && audioContextRegistry.has(contextId)) {
      const existingCtx = audioContextRegistry.get(contextId);
      if (existingCtx && existingCtx.state !== "closed") {
        return existingCtx;
      }
    }

    try {
      // Attempt to create context directly (works after first interaction)
      const newCtx = new AudioContext(options);
      if (contextId) {
        audioContextRegistry.set(contextId, newCtx);
      }
      return newCtx;
    } catch (e) {
      // If direct creation fails, wait for interaction
      await ensureInteraction();
      // Retry creation after interaction
      const newCtx = new AudioContext(options);
      if (contextId) {
        audioContextRegistry.set(contextId, newCtx);
      }
      return newCtx;
    }
  };
})();

/**
 * Converts a Blob to a JSON object.
 */
export const convertBlobToJson = (blob: Blob): Promise<any> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        if (reader.result) {
          const json = JSON.parse(reader.result as string);
          resolve(json);
        } else {
          reject(new Error("FileReader result is null"));
        }
      } catch (error) {
        reject(new Error(`Failed to parse Blob as JSON: ${error}`));
      }
    };
    reader.onerror = () => {
      reject(new Error("FileReader error"));
    };
    reader.readAsText(blob);
  });

/**
 * Converts a base64 string to an ArrayBuffer.
 */
export function decodeBase64ToArrayBuffer(base64: string): ArrayBuffer {
  try {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
  } catch (e) {
    console.error("Failed to decode base64 string:", e);
    // Return an empty buffer or re-throw, depending on desired error handling
    return new ArrayBuffer(0);
  }
}
