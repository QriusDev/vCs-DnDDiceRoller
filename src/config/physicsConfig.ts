import type { TrayDimensions, TraySizePreset } from "@/types";

export const TRAY_SIZE_PRESETS: Record<TraySizePreset, TrayDimensions> = {
  small: {
    preset: "small",
    width: 11,
    length: 14,
    wallHeight: 3.2,
    wallThickness: 0.6,
  },
  standard: {
    preset: "standard",
    width: 15,
    length: 19,
    wallHeight: 3.5,
    wallThickness: 0.6,
  },
  large: {
    preset: "large",
    width: 20,
    length: 25,
    wallHeight: 4.0,
    wallThickness: 0.8,
  },
};

export const DEFAULT_TRAY_DIMENSIONS: TrayDimensions = TRAY_SIZE_PRESETS.standard;

export const PHYSICS_TIMESTEP = 1 / 60;
export const MAX_SUBSTEPS = 10;

export const PHYSICS_BOUNDS = {
  gravityMagnitude: { min: 9.8, max: 25.0, default: 14.5 },
  restitution: { min: 0.2, max: 0.8, default: 0.45 },
  friction: { min: 0.1, max: 0.9, default: 0.35 },
  linearImpulse: { min: 5.0, max: 50.0, default: 18.0 },
  angularSpin: { min: 10.0, max: 60.0, default: 28.0 },
};
