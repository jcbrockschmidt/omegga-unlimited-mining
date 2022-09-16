type Timeout = NodeJS.Timeout;

/** Set where added elements are automatically removed by some heuristic. */
export interface IExpiringSet<T> {
  add(value: T): void;
  has(value: T): boolean;
  delete(value: T): boolean;
}

export class TimedExpiringSet<T> implements IExpiringSet<T> {
  private persistTime: number;
  private timeouts: Map<T, Timeout>;

  /**
   * Set where added elements persist only for a single set period of time.
   *
   * @param persistTime Time in milliseconds to persist elements in set before
   *   they remove themselves.
   */
  constructor(persistTime: number) {
    this.persistTime = persistTime;
    this.timeouts = new Map();
  }

  add(value: T): void {
    if (this.timeouts.has(value)) {
      const curTimeout = this.timeouts.get(value);
      clearTimeout(curTimeout);
    }
    const timeout = setTimeout(this.delete.bind(this, value), this.persistTime);
    this.timeouts.set(value, timeout);
  }

  has(value: T): boolean {
    return this.timeouts.has(value);
  }

  delete(value: T): boolean {
    if (!this.timeouts.has(value)) return false;

    const timeout = this.timeouts.get(value);
    clearTimeout(timeout);
    this.timeouts.delete(value);
    return true;
  }
}
