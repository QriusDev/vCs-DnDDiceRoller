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

export type DiceGeometryStyle = "sharp" | "rounded";

export const DICE_GEOMETRY_STYLES: readonly DiceGeometryStyle[] = ["sharp", "rounded"] as const;

export type DiceThemeId =
  | "classic-ivory"
  | "obsidian-gold"
  | "royal-purple-gem"
  | "cyber-neon"
  | "crimson-dragon"
  | "walnut-wood";

export const DICE_THEME_IDS: readonly DiceThemeId[] = [
  "classic-ivory",
  "obsidian-gold",
  "royal-purple-gem",
  "cyber-neon",
  "crimson-dragon",
  "walnut-wood",
] as const;

export type DiceId = string;

export interface Point3D {
  x: number;
  y: number;
  z: number;
}

export interface DieFaceMetadata {
  faceIndex: number;
  value: number;
  normal: Point3D;
  center: Point3D;
  vertices: Point3D[];
}

export interface DieGeometryMetadata {
  dieType: DiceType;
  geometryStyle: DiceGeometryStyle;
  faces: DieFaceMetadata[];
  boundingRadius: number;
  boundingBox: {
    min: Point3D;
    max: Point3D;
  };
  hullVertices: Point3D[];
  hullFaces: number[][];
}

export interface DieAppearanceConfig {
  primaryColor: string;
  numberColor: string;
  materialType: "standard" | "physical";
  roughness: number;
  metalness: number;
  themeId?: DiceThemeId;
  geometryStyle?: DiceGeometryStyle;
}

export interface DiceVisualRequest {
  type: DiceType;
  geometryStyle: DiceGeometryStyle;
  theme: DiceThemeId;
  customBodyColor?: string;
  customNumberColor?: string;
}

export interface DiceThemeConfig {
  id: DiceThemeId;
  label: string;
  bodyColor: string;
  numberColor: string;
  roughness: number;
  metalness: number;
  transmission?: number;
  opacity?: number;
  transparent?: boolean;
  emissive?: string;
  emissiveIntensity?: number;
  clearcoat?: number;
  clearcoatRoughness?: number;
  proceduralStyle: "plain" | "marble" | "wood" | "neon" | "gem";
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
