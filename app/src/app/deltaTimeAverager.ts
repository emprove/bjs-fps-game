export class DeltaTimeAverager {
  #samples: number[] = [];
  #maxSamples: number;
  #stableThreshold: number; // in seconds, e.g. 0.05 for 20 FPS
  #requiredStableFrames: number;
  #allowedUnstableFrames: number;

  constructor(
    maxSamples: number,
    stableThreshold: number,
    requiredStableFrames: number,
    allowedUnstableFrames: number,
  ) {
    this.#maxSamples = maxSamples;
    this.#stableThreshold = stableThreshold;
    this.#requiredStableFrames = requiredStableFrames;
    this.#allowedUnstableFrames = allowedUnstableFrames;
  }

  addSample(dt: number) {
    this.#samples.push(dt);
    if (this.#samples.length > this.#maxSamples) {
      this.#samples.shift();
    }
  }

  get average(): number {
    if (this.#samples.length === 0) {
      return 0;
    }
    return this.#samples.reduce((a, b) => a + b, 0) / this.#samples.length;
  }

  get isStable(): boolean {
    if (this.#samples.length < this.#requiredStableFrames) {
      return false;
    }
    const unstableCount = this.#samples
      .slice(-this.#requiredStableFrames)
      .filter((dt) => dt > this.#stableThreshold).length;

    return unstableCount <= this.#allowedUnstableFrames;
  }
}
