import type { DiceId, DiceType } from "./dice";

export type RollState = "idle" | "preparing" | "rolling" | "settling" | "completed" | "recovered";

export type RollMode = "fair-rng" | "physics";

export interface RollRequest {
  id: string;
  dice: DiceId[];
  mode: RollMode;
  impulseStrength?: number;
  timestamp: number;
}

export interface DieRollResult {
  dieId: DiceId;
  type: DiceType;
  value: number; // For D10: 1-10 mapped (displaying 0 as 10)
  rawFaceValue: number; // Face value on the die (e.g. 0-9 for D10)
  isCriticalHit: boolean; // Natural 20 on D20 only
  isCriticalMiss: boolean; // Natural 1 on D20 only
}

export interface AggregateRollResult {
  id: string;
  timestamp: number;
  dice: DieRollResult[];
  total: number;
  formula: string; // e.g. "2d6 [4, 5] + 1d20 [20] = 29"
  rollMode: RollMode;
  status: "completed" | "recovered";
}

export interface RollHistoryEntry extends AggregateRollResult {
  label?: string;
}
