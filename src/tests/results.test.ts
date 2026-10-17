import { describe, it, expect } from "vitest";
import { ResultCalculator } from "@/core/results/ResultCalculator";
import type { DieRollResult } from "@/types";

describe("ResultCalculator", () => {
  it("should calculate aggregate total correctly", () => {
    const dice: DieRollResult[] = [
      { dieId: "1", type: "d20", value: 18, isCriticalHit: false, isCriticalMiss: false },
      { dieId: "2", type: "d6", value: 5, isCriticalHit: false, isCriticalMiss: false },
      { dieId: "3", type: "d4", value: 3, isCriticalHit: false, isCriticalMiss: false },
    ];

    const result = ResultCalculator.createAggregateResult(dice);
    expect(result.total).toBe(26);
    expect(result.dice).toHaveLength(3);
    expect(result.rollMode).toBe("fair-rng");
  });

  it("should evaluate natural 20 as critical hit", () => {
    const crit = ResultCalculator.evaluateDie("d20", 20);
    expect(crit.isCriticalHit).toBe(true);
    expect(crit.isCriticalMiss).toBe(false);

    const normal = ResultCalculator.evaluateDie("d20", 19);
    expect(normal.isCriticalHit).toBe(false);
    expect(normal.isCriticalMiss).toBe(false);
  });

  it("should evaluate natural 1 as critical miss", () => {
    const miss = ResultCalculator.evaluateDie("d20", 1);
    expect(miss.isCriticalHit).toBe(false);
    expect(miss.isCriticalMiss).toBe(true);
  });

  it("should not mark criticals on non-d20 dice", () => {
    const d6Max = ResultCalculator.evaluateDie("d6", 6);
    expect(d6Max.isCriticalHit).toBe(false);
    expect(d6Max.isCriticalMiss).toBe(false);

    const d6Min = ResultCalculator.evaluateDie("d6", 1);
    expect(d6Min.isCriticalHit).toBe(false);
    expect(d6Min.isCriticalMiss).toBe(false);
  });
});
