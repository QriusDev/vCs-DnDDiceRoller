import type { AggregateRollResult, DieRollResult, RollMode } from "@/types";

export class ResultCalculator {
  static createAggregateResult(
    diceResults: DieRollResult[],
    mode: RollMode = "fair-rng"
  ): AggregateRollResult {
    const total = diceResults.reduce((acc, curr) => acc + curr.value, 0);

    return {
      id: `roll_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      timestamp: Date.now(),
      dice: diceResults,
      total,
      rollMode: mode,
    };
  }

  static evaluateDie(
    type: "d4" | "d6" | "d8" | "d10" | "d12" | "d20",
    value: number
  ): {
    isCriticalHit: boolean;
    isCriticalMiss: boolean;
  } {
    const isD20 = type === "d20";
    return {
      isCriticalHit: isD20 && value === 20,
      isCriticalMiss: isD20 && value === 1,
    };
  }
}
