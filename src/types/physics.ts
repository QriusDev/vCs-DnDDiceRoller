export interface Vector3D {
  x: number;
  y: number;
  z: number;
}

export interface PhysicsConfig {
  gravity: [number, number, number];
  defaultRestitution: number;
  defaultFriction: number;
  linearDamping: number;
  angularDamping: number;
  sleepSpeedLimit: number;
  sleepTimeLimit: number;
}

export interface TrayDimensions {
  width: number;
  length: number;
  wallHeight: number;
  wallThickness: number;
}
