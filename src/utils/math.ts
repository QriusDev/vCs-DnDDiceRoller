export function clamp(val: number, min: number, max: number): number {
  return Math.min(Math.max(val, min), max);
}

export function degToRad(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

export function radToDeg(radians: number): number {
  return (radians * 180) / Math.PI;
}

export function randomRange(min: number, max: number): number {
  return min + Math.random() * (max - min);
}
