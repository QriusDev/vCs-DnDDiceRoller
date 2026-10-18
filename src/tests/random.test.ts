import { describe, it, expect } from "vitest";
import { CryptoRandomProvider } from "@/core/random/RandomProvider";
import { DICE_TYPES, DICE_FACE_COUNTS } from "@/types";

describe("CryptoRandomProvider", () => {
  const rng = new CryptoRandomProvider();

  it("should generate random floats in [0, 1)", () => {
    for (let i = 0; i < 50; i++) {
      const val = rng.next();
      expect(val).toBeGreaterThanOrEqual(0);
      expect(val).toBeLessThan(1);
    }
  });

  it("should generate fair rolls within bounds for all supported dice types", () => {
    for (const type of DICE_TYPES) {
      const sides = DICE_FACE_COUNTS[type];
      const rolls = new Set<number>();

      for (let i = 0; i < 100; i++) {
        const roll = rng.rollDie(sides);
        expect(roll).toBeGreaterThanOrEqual(1);
        expect(roll).toBeLessThanOrEqual(sides);
        expect(Number.isInteger(roll)).toBe(true);
        rolls.add(roll);
      }

      // Over 100 rolls on d4, should see multiple distinct face values
      expect(rolls.size).toBeGreaterThan(1);
    }
  });

  it("should perform statistical distribution check across 10,000 rolls", () => {
    // Chi-square test on D6 with 12,000 rolls
    // Expected count for each face = 2,000
    const sides = 6;
    const totalRolls = 12000;
    const expected = totalRolls / sides;
    const counts = new Array(sides).fill(0);

    for (let i = 0; i < totalRolls; i++) {
      const roll = rng.rollDie(sides);
      counts[roll - 1]++;
    }

    // Every face should be sampled reasonably close to expected (e.g. ±10%)
    for (let i = 0; i < sides; i++) {
      expect(counts[i]).toBeGreaterThan(expected * 0.88);
      expect(counts[i]).toBeLessThan(expected * 1.12);
    }

    // Chi-square statistic: sum of (observed - expected)^2 / expected
    let chiSquare = 0;
    for (let i = 0; i < sides; i++) {
      const diff = counts[i] - expected;
      chiSquare += (diff * diff) / expected;
    }

    // For 5 degrees of freedom (df = 5), critical value at alpha = 0.001 is 20.515
    // Rejecting the hypothesis of uniform distribution only if chiSquare > 20.515
    expect(chiSquare).toBeLessThan(20.515);
  });

  it("should throw error for non-positive sides", () => {
    expect(() => rng.rollDie(0)).toThrow();
    expect(() => rng.rollDie(-5)).toThrow();
  });
});
