export interface RandomProvider {
  next(): number; // [0, 1)
  rollDie(sides: number): number; // [1, sides]
}

export class CryptoRandomProvider implements RandomProvider {
  next(): number {
    const array = new Uint32Array(1);
    crypto.getRandomValues(array);
    return array[0] / (0xffffffff + 1);
  }

  rollDie(sides: number): number {
    if (sides <= 0) {
      throw new Error(`Invalid sides count: ${sides}`);
    }
    const max = 0xffffffff;
    const bucketSize = Math.floor(max / sides);
    const limit = bucketSize * sides;

    const array = new Uint32Array(1);
    let val: number;
    do {
      crypto.getRandomValues(array);
      val = array[0];
    } while (val >= limit);

    return (val % sides) + 1;
  }
}
