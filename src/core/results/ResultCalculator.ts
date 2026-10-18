import type { AggregateRollResult, DieRollResult, RollMode } from "@/types";

export class ResultCalculator {
  static createAggregateResult(
    diceResults: DieRollResult[],
    mode: RollMode = "fair-rng",
    status: "completed" | "recovered" = "completed"
  ): AggregateRollResult {
    const total = diceResults.reduce((acc, curr) => acc + curr.value, 0);
    const formula = this.formatFormula(diceResults, total);

    return {
      id: `roll_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      timestamp: Date.now(),
      dice: diceResults,
      total,
      formula,
      rollMode: mode,
      status,
    };
  }

  static evaluateDie(
    type: "d4" | "d6" | "d8" | "d10" | "d12" | "d20",
    value: number
  ): {
    isCriticalHit: boolean;
    isCriticalMiss: boolean;
  } {
    // Critical hit/miss strictly applies to D20 dice (Natural 20 and Natural 1)
    const isD20 = type === "d20";
    return {
      isCriticalHit: isD20 && value === 20,
      isCriticalMiss: isD20 && value === 1,
    };
  }

  /**
   * Generates a readable breakdown formula such as:
   * "2d6 [4, 5] + 1d20 [20] = 29"
   */
  static formatFormula(dice: DieRollResult[], total: number): string {
    if (dice.length === 0) {
      return "0";
    }

    // Group dice by type
    const groups = new Map<string, number[]>();
    for (const d of dice) {
      if (!groups.has(d.type)) {
        groups.set(d.type, []);
      }
      groups.get(d.type)!.push(d.value);
    }

    const parts: string[] = [];
    for (const [type, values] of groups.entries()) {
      parts.push(`${values.length}${type} [${values.join(", ")}]`);
    }

    return `${parts.join(" + ")} = ${total}`;
  }
}
