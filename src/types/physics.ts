export type TraySizePreset = "small" | "standard" | "large";

export interface Vector3D {
  x: number;
  y: number;
  z: number;
}

export interface Quaternion4D {
  x: number;
  y: number;
  z: number;
  w: number;
}

export interface PhysicsConfig {
  gravityMagnitude: number; // 9.8 - 25 m/s²
  gravity: [number, number, number];
  defaultRestitution: number; // 0.2 - 0.8
  defaultFriction: number;
  linearDamping: number;
  angularDamping: number;
  sleepSpeedLimit: number;
  sleepTimeLimit: number;
  linearImpulseMin: number; // 5 - 50 N·s
  linearImpulseMax: number;
  angularSpinMin: number; // rad/s
  angularSpinMax: number;
  traySize: TraySizePreset;
}

export interface TrayDimensions {
  preset: TraySizePreset;
  width: number;
  length: number;
  wallHeight: number;
  wallThickness: number;
}

export type CollisionTargetType = "floor" | "wall" | "die";

export interface CollisionEventData {
  dieId: string;
  targetType: CollisionTargetType;
  targetId?: string;
  impactVelocity: number;
  contactPoint?: Vector3D;
  timestamp: number;
}
