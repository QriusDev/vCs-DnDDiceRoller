import type { DiceType, DieAppearanceConfig } from "@/types";

export interface DiceTypeDescriptor {
  type: DiceType;
  label: string;
  faceCount: number;
  defaultAppearance: DieAppearanceConfig;
}

export const DICE_CONFIGS: Record<DiceType, DiceTypeDescriptor> = {
  d4: {
    type: "d4",
    label: "D4",
    faceCount: 4,
    defaultAppearance: {
      primaryColor: "#c2410c",
      numberColor: "#ffffff",
      materialType: "standard",
      roughness: 0.25,
      metalness: 0.1,
    },
  },
  d6: {
    type: "d6",
    label: "D6",
    faceCount: 6,
    defaultAppearance: {
      primaryColor: "#2563eb",
      numberColor: "#ffffff",
      materialType: "standard",
      roughness: 0.25,
      metalness: 0.1,
    },
  },
  d8: {
    type: "d8",
    label: "D8",
    faceCount: 8,
    defaultAppearance: {
      primaryColor: "#059669",
      numberColor: "#ffffff",
      materialType: "standard",
      roughness: 0.25,
      metalness: 0.1,
    },
  },
  d10: {
    type: "d10",
    label: "D10",
    faceCount: 10,
    defaultAppearance: {
      primaryColor: "#7c3aed",
      numberColor: "#ffffff",
      materialType: "standard",
      roughness: 0.25,
      metalness: 0.1,
    },
  },
  d12: {
    type: "d12",
    label: "D12",
    faceCount: 12,
    defaultAppearance: {
      primaryColor: "#db2777",
      numberColor: "#ffffff",
      materialType: "standard",
      roughness: 0.25,
      metalness: 0.1,
    },
  },
  d20: {
    type: "d20",
    label: "D20",
    faceCount: 20,
    defaultAppearance: {
      primaryColor: "#e11d48",
      numberColor: "#ffffff",
      materialType: "standard",
      roughness: 0.25,
      metalness: 0.1,
    },
  },
};
