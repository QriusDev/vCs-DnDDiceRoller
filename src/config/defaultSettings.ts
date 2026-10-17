import type { AppSettings } from "@/types";

export const DEFAULT_SETTINGS: AppSettings = {
  theme: "dark-slate",
  diceTheme: "obsidian-gold",
  diceGeometryStyle: "sharp",
  audio: {
    masterVolume: 0.8,
    sfxVolume: 1.0,
    collisionSoundsEnabled: true,
    rollAnnounceEnabled: false,
  },
  physics: {
    gravity: [0, -9.82, 0],
    defaultRestitution: 0.4,
    defaultFriction: 0.3,
    linearDamping: 0.1,
    angularDamping: 0.1,
    sleepSpeedLimit: 0.1,
    sleepTimeLimit: 0.5,
  },
  rendering: {
    antialias: true,
    shadows: true,
    targetFps: 60,
    pixelRatioCap: 2,
  },
};
