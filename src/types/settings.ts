import type { PhysicsConfig, RollMode, TraySizePreset } from "./index";
import type { DiceThemeId, DiceGeometryStyle } from "./dice";

export type VisualThemeId = "dark-slate" | "classic-felt" | "obsidian-gold";

export type TrayMaterialId =
  "green-velvet" | "navy-velvet" | "burgundy-velvet" | "dark-oak" | "stitched-leather";

export const TRAY_MATERIAL_IDS: readonly TrayMaterialId[] = [
  "green-velvet",
  "navy-velvet",
  "burgundy-velvet",
  "dark-oak",
  "stitched-leather",
] as const;

export interface AudioPreferences {
  masterVolume: number; // 0.0 - 1.0
  muted: boolean;
  sfxVolume: number;
  collisionSoundsEnabled: boolean;
  rollAnnounceEnabled: boolean;
}

export interface RenderingPreferences {
  antialias: boolean;
  shadows: boolean;
  targetFps: number;
  pixelRatioCap: number;
}

export interface AppSettings {
  schemaVersion: number;
  theme: VisualThemeId;
  trayMaterial: TrayMaterialId;
  diceTheme: DiceThemeId;
  diceGeometryStyle: DiceGeometryStyle;
  customBodyColor?: string;
  customNumberColor?: string;
  rollMode: RollMode;
  traySize: TraySizePreset;
  audio: AudioPreferences;
  physics: PhysicsConfig;
  rendering: RenderingPreferences;
}
