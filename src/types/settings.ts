import type { PhysicsConfig } from "./physics";
import type { DiceThemeId, DiceGeometryStyle } from "./dice";

export type VisualThemeId = "dark-slate" | "classic-felt" | "obsidian-gold";

export interface AudioPreferences {
  masterVolume: number;
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
  theme: VisualThemeId;
  diceTheme: DiceThemeId;
  diceGeometryStyle: DiceGeometryStyle;
  audio: AudioPreferences;
  physics: PhysicsConfig;
  rendering: RenderingPreferences;
}
