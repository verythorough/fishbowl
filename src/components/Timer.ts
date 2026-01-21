export class Timer {
  private intervalId: number | null = null;
  private callbacks: {
    onTick: (remaining: number) => void;
    onComplete: () => void;
  };

  constructor(callbacks: { onTick: (remaining: number) => void; onComplete: () => void }) {
    this.callbacks = callbacks;
  }

  start(seconds: number): void {
    this.stop(); // Clear any existing timer

    let remaining = seconds;
    this.callbacks.onTick(remaining);

    this.intervalId = window.setInterval(() => {
      remaining--;
      this.callbacks.onTick(remaining);

      if (remaining <= 0) {
        this.stop();
        this.callbacks.onComplete();
      }
    }, 1000);
  }

  stop(): void {
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  pause(): void {
    this.stop();
  }

  resume(remainingSeconds: number): void {
    this.start(remainingSeconds);
  }

  isRunning(): boolean {
    return this.intervalId !== null;
  }
}
