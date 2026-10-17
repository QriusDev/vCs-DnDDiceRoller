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

  it("should throw error for non-positive sides", () => {
    expect(() => rng.rollDie(0)).toThrow();
    expect(() => rng.rollDie(-5)).toThrow();
  });
});
