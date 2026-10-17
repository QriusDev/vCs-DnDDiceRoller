import type { DiceId, DiceType } from "./dice";

export type RollState = "idle" | "preparing" | "rolling" | "settled" | "reading";

export type RollMode = "physics" | "fair-rng";

export interface RollRequest {
  id: string;
  dice: DiceId[];
  mode: RollMode;
  impulseStrength: number;
  timestamp: number;
}

export interface DieRollResult {
  dieId: DiceId;
  type: DiceType;
  value: number;
  isCriticalHit: boolean;
  isCriticalMiss: boolean;
}

export interface AggregateRollResult {
  id: string;
  timestamp: number;
  dice: DieRollResult[];
  total: number;
  rollMode: RollMode;
}

export interface RollHistoryEntry extends AggregateRollResult {
  label?: string;
}
