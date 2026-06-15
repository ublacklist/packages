export class Text implements Iterable<string> {
  constructor(text: string) {
    this.#text = text;
    this.#lineStarts = null;
  }

  get length(): number {
    return this.#text.length;
  }

  get lines(): number {
    return this.#getLineStarts().length;
  }

  append(text: string): Text {
    return new Text(`${this.#text}${text}`);
  }

  line(n: number): string {
    if (n < 1 || n > this.lines) {
      throw new RangeError(
        `Invalid line number ${n} in ${this.lines}-line text`,
      );
    }
    const starts = this.#getLineStarts();
    // biome-ignore lint/style/noNonNullAssertion: `n` is a valid line number
    const from = starts[n - 1]!;
    const to = starts[n];
    return this.#text.slice(from, to === undefined ? undefined : to - 1);
  }

  lineNumberAt(pos: number): number {
    if (pos < 0 || pos > this.length) {
      throw new RangeError(
        `Invalid position ${pos} in ${this.length}-character text`,
      );
    }
    const starts = this.#getLineStarts();
    let lo = 0;
    let hi = starts.length - 1;
    while (lo < hi) {
      const mid = Math.ceil((lo + hi) / 2);
      // biome-ignore lint/style/noNonNullAssertion: `mid` is in range
      if (starts[mid]! <= pos) {
        lo = mid;
      } else {
        hi = mid - 1;
      }
    }
    return lo + 1;
  }

  slice(from: number, to?: number): string {
    return this.#text.slice(from, to);
  }

  toString(): string {
    return this.#text;
  }

  *[Symbol.iterator](): Generator<string> {
    const lines = this.lines;
    for (let n = 1; n <= lines; n++) {
      yield this.line(n);
    }
  }

  #getLineStarts(): number[] {
    if (!this.#lineStarts) {
      const starts = [0];
      for (
        let pos = this.#text.indexOf("\n");
        pos !== -1;
        pos = this.#text.indexOf("\n", pos + 1)
      ) {
        starts.push(pos + 1);
      }
      this.#lineStarts = starts;
    }
    return this.#lineStarts;
  }

  #text: string;
  #lineStarts: number[] | null;
}
