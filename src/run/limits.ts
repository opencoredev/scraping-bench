import { setTimeout as delay } from "node:timers/promises";
export class Gate {
  private active = 0;
  private nextAt = 0;
  private tokens: number;
  private last = Date.now();
  readonly concurrency: number;
  readonly perSecond: number;
  readonly burst: number;
  constructor(concurrency: number, perSecond = 4, burst = 1) {
    this.concurrency = concurrency;
    this.perSecond = perSecond;
    this.burst = burst;
    if (concurrency < 1 || perSecond <= 0 || burst < 1)
      throw new Error("Invalid limiter settings");
    this.tokens = burst;
  }
  async run<T>(fn: () => Promise<T>, signal?: AbortSignal): Promise<T> {
    while (true) {
      signal?.throwIfAborted();
      const now = Date.now();
      this.tokens = Math.min(
        this.burst,
        this.tokens + ((now - this.last) * this.perSecond) / 1000,
      );
      this.last = now;
      if (this.active < this.concurrency && this.tokens >= 1) {
        this.active++;
        this.tokens--;
        break;
      }
      await delay(
        Math.max(5, Math.min(50, this.nextAt - now || 20)),
        undefined,
        { signal },
      );
    }
    this.nextAt = Date.now() + 1000 / this.perSecond;
    try {
      return await fn();
    } finally {
      this.active--;
    }
  }
}
export async function within<T>(
  work: Promise<T>,
  signal: AbortSignal,
): Promise<T> {
  signal.throwIfAborted();
  let listener: () => void = () => {};
  const abort = new Promise<never>((_, reject) => {
    listener = () => reject(signal.reason);
    signal.addEventListener("abort", listener, { once: true });
  });
  try {
    return await Promise.race([work, abort]);
  } finally {
    signal.removeEventListener("abort", listener);
  }
}
export function random(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state += 0x6d2b79f5;
    let n = state;
    n = Math.imul(n ^ (n >>> 15), n | 1);
    n ^= n + Math.imul(n ^ (n >>> 7), n | 61);
    return ((n ^ (n >>> 14)) >>> 0) / 4294967296;
  };
}
export function shuffle<T>(values: readonly T[], rng: () => number): T[] {
  return values
    .map((value) => ({ value, order: rng() }))
    .sort((a, b) => a.order - b.order)
    .map((x) => x.value);
}
