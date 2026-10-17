import type { TrayDimensions } from "@/types";

export const DEFAULT_TRAY_DIMENSIONS: TrayDimensions = {
  width: 14,
  length: 18,
  wallHeight: 3.5,
  wallThickness: 0.6,
};

export const PHYSICS_TIMESTEP = 1 / 60;
export const MAX_SUBSTEPS = 10;
