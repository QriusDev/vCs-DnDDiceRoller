import { describe, it, expect } from "vitest";
import { clamp, degToRad, radToDeg, randomRange } from "@/utils/math";

describe("Math Utilities", () => {
  it("clamp should constrain numbers to range", () => {
    expect(clamp(5, 0, 10)).toBe(5);
    expect(clamp(-5, 0, 10)).toBe(0);
    expect(clamp(15, 0, 10)).toBe(10);
  });

  it("degToRad and radToDeg should convert angles accurately", () => {
    expect(degToRad(180)).toBeCloseTo(Math.PI);
    expect(degToRad(90)).toBeCloseTo(Math.PI / 2);
    expect(radToDeg(Math.PI)).toBeCloseTo(180);
  });

  it("randomRange should generate values within range", () => {
    for (let i = 0; i < 20; i++) {
      const val = randomRange(5, 10);
      expect(val).toBeGreaterThanOrEqual(5);
      expect(val).toBeLessThan(10);
    }
  });
});
