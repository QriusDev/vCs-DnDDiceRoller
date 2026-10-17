import type { DiceType, DieInstance } from "@/types";
import { DICE_CONFIGS } from "@/config/diceConfig";

export class DiceFactory {
  static createDie(type: DiceType, customColor?: string): DieInstance {
    const config = DICE_CONFIGS[type];
    const appearance = {
      ...config.defaultAppearance,
      ...(customColor ? { primaryColor: customColor } : {}),
    };

    return {
      id: `${type}_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
      type,
      appearance,
      createdAt: Date.now(),
    };
  }
}
