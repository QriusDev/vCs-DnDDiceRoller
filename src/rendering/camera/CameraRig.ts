import * as THREE from "three";

export class CameraRig {
  readonly camera: THREE.PerspectiveCamera;

  constructor(width: number, height: number) {
    const aspect = width > 0 && height > 0 ? width / height : 1;
    this.camera = new THREE.PerspectiveCamera(45, aspect, 0.1, 100);
    this.resetPosition();
  }

  resetPosition(): void {
    // Angled tabletop perspective view looking down into the tray
    this.camera.position.set(0, 24, 16);
    this.camera.lookAt(0, 0, 0);
  }

  handleResize(width: number, height: number): void {
    if (width <= 0 || height <= 0) return;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
  }
}
