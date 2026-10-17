export type DiceType = "d4" | "d6" | "d8" | "d10" | "d12" | "d20";

export const DICE_TYPES: readonly DiceType[] = ["d4", "d6", "d8", "d10", "d12", "d20"] as const;

export const DICE_FACE_COUNTS: Readonly<Record<DiceType, number>> = {
  d4: 4,
  d6: 6,
  d8: 8,
  d10: 10,
  d12: 12,
  d20: 20,
} as const;

export type DiceId = string;

export interface DieAppearanceConfig {
  primaryColor: string;
  numberColor: string;
  materialType: "standard" | "physical";
  roughness: number;
  metalness: number;
}

export interface DieInstance {
  id: DiceId;
  type: DiceType;
  appearance?: Partial<DieAppearanceConfig>;
  createdAt: number;
}

export interface DicePoolState {
  dice: DieInstance[];
  counts: Record<DiceType, number>;
}
