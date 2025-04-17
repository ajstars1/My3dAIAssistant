const VolumeMeterProcessorSource = `
  class VolumeMeterProcessor extends AudioWorkletProcessor {
    _volume
    _updateIntervalMs
    _nextUpdateFrame

    constructor(options) {
      super(options);
      this._volume = 0;
      // Default interval: update ~40 times per second (1000ms / 25ms = 40)
      this._updateIntervalMs = options?.processorOptions?.updateIntervalMs || 25;
      this._nextUpdateFrame = this._updateIntervalMs; // Initialize for first update

      this.port.onmessage = (event) => {
        if (event.data.updateIntervalMs) {
          this._updateIntervalMs = event.data.updateIntervalMs;
          // Reset next update frame based on new interval
          this._nextUpdateFrame = (this._updateIntervalMs / 1000) * sampleRate;
        }
      };
    }

    get intervalInFrames() {
      // Calculate frames based on sample rate (provided globally in AudioWorklet)
      return (this._updateIntervalMs / 1000) * sampleRate;
    }

    process(inputs, outputs, parameters) {
      // Assuming mono input for simplicity
      const inputChannel = inputs[0]?.[0];

      // Guard against empty inputs or no channels
      if (!inputChannel || inputChannel.length === 0) {
        return true; // Keep processor alive
      }

      const samples = inputChannel;
      let sumOfSquares = 0;

      // Calculate Root Mean Square (RMS)
      for (let i = 0; i < samples.length; ++i) {
        sumOfSquares += samples[i] * samples[i];
      }
      const rms = Math.sqrt(sumOfSquares / samples.length);

      // Apply a simple smoothing factor (exponential moving average)
      // Adjust the 0.7 factor for more or less smoothing
      this._volume = Math.max(rms, this._volume * 0.75);

      // Frame-based update logic
      this._nextUpdateFrame -= samples.length;
      if (this._nextUpdateFrame <= 0) {
        // Reset frame counter for next interval
        this._nextUpdateFrame += this.intervalInFrames;
        // Post the calculated volume (can be used for visualization)
        this.port.postMessage({ volume: this._volume });
      }

      // Indicate that the processor should remain active
      return true;
    }
  }`;

export default VolumeMeterProcessorSource;
