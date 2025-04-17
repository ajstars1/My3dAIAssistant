const PcmEncodingProcessorSource = `
class PcmEncodingProcessor extends AudioWorkletProcessor {
  // Configuration for the buffer size and encoding
  _bufferSize = 2048; // Number of samples before sending data
  _buffer = new Int16Array(this._bufferSize);
  _currentBufferIndex = 0;

  constructor(options) {
    super(options);
    // Potential future options: bit depth, etc.
  }

  /**
   * Processes incoming audio chunks.
   * @param inputs - Array of inputs, each containing channels of Float32Array data.
   * @param outputs - Array of outputs (not used in this processor).
   * @param parameters - Audio parameters (not used in this processor).
   * @returns {boolean} Always true to keep the processor alive.
   */
  process(inputs, outputs, parameters) {
    // Assuming mono input (inputs[0][0]) for simplicity
    const inputChannel = inputs[0]?.[0];

    if (!inputChannel || inputChannel.length === 0) {
      return true; // No data to process, keep alive
    }

    this._processAudioChunk(inputChannel);
    return true;
  }

  /**
   * Sends the accumulated buffer (if full) as an Int16Array ArrayBuffer.
   */
  _sendBuffer() {
    if (this._currentBufferIndex === 0) return; // Nothing to send

    // Send a copy or the relevant part of the buffer
    const bufferToSend = this._buffer.slice(0, this._currentBufferIndex);
    
    this.port.postMessage(
      {
        eventType: "audioData",
        audioData: bufferToSend.buffer,
      },
      [bufferToSend.buffer] // Transferable object for efficiency
    );
    this._currentBufferIndex = 0; // Reset buffer index
  }

  /**
   * Converts a Float32Array chunk to Int16 and accumulates it in the buffer.
   * Sends the buffer when it reaches the configured size.
   * @param {Float32Array} float32Chunk - The incoming audio data chunk.
   */
  _processAudioChunk(float32Chunk) {
    const chunkLength = float32Chunk.length;

    for (let i = 0; i < chunkLength; i++) {
      // Clamp the value between -1 and 1 before conversion
      const clampedValue = Math.max(-1, Math.min(1, float32Chunk[i]));
      // Convert Float32 (-1.0 to 1.0) to Int16 (-32768 to 32767)
      const int16Value = Math.round(clampedValue * 32767);
      this._buffer[this._currentBufferIndex++] = int16Value;

      // If buffer is full, send it
      if (this._currentBufferIndex >= this._bufferSize) {
        this._sendBuffer();
      }
    }

    // Optional: Send any remaining data if the input stream ends
    // This requires a mechanism to detect stream end, which is not standard in process()
    // Could be handled via a special message through the port if needed.
  }
}
`;

export default PcmEncodingProcessorSource;
