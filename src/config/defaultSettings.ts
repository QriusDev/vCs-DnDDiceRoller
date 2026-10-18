import type { AppSettings } from "@/types";
import { PHYSICS_BOUNDS } from "./physicsConfig";

export const SETTINGS_SCHEMA_VERSION = 1;

export const DEFAULT_SETTINGS: AppSettings = {
  schemaVersion: SETTINGS_SCHEMA_VERSION,
  theme: "dark-slate",
  trayMaterial: "green-velvet",
  diceTheme: "obsidian-gold",
  diceGeometryStyle: "sharp",
  customBodyColor: undefined,
  customNumberColor: undefined,
  rollMode: "fair-rng",
  traySize: "standard",
  audio: {
    masterVolume: 0.8,
    muted: false,
    sfxVolume: 1.0,
    collisionSoundsEnabled: true,
    rollAnnounceEnabled: false,
  },
  physics: {
    gravityMagnitude: PHYSICS_BOUNDS.gravityMagnitude.default,
    gravity: [0, -PHYSICS_BOUNDS.gravityMagnitude.default, 0],
    defaultRestitution: PHYSICS_BOUNDS.restitution.default,
    defaultFriction: PHYSICS_BOUNDS.friction.default,
    linearDamping: 0.12,
    angularDamping: 0.12,
    sleepSpeedLimit: 0.15,
    sleepTimeLimit: 0.35,
    linearImpulseMin: 12.0,
    linearImpulseMax: 22.0,
    angularSpinMin: 15.0,
    angularSpinMax: 35.0,
    traySize: "standard",
  },
  rendering: {
    antialias: true,
    shadows: true,
    targetFps: 60,
    pixelRatioCap: 2,
  },
};
