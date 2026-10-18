import * as THREE from "three";

export class CameraRig {
  readonly camera: THREE.PerspectiveCamera;
  private readonly defaultPosition = new THREE.Vector3(0, 24, 16);
  private readonly defaultTarget = new THREE.Vector3(0, 0, 0);

  // Orbit state
  private isOrbiting = false;
  private previousMousePosition = { x: 0, y: 0 };
  private spherical: THREE.Spherical;
  private target = new THREE.Vector3(0, 0, 0);

  constructor(width: number, height: number) {
    const aspect = width > 0 && height > 0 ? width / height : 1;
    this.camera = new THREE.PerspectiveCamera(45, aspect, 0.1, 100);

    const offset = new THREE.Vector3().subVectors(this.defaultPosition, this.defaultTarget);
    this.spherical = new THREE.Spherical().setFromVector3(offset);

    this.resetPosition();
  }

  resetPosition(): void {
    this.target.copy(this.defaultTarget);
    this.camera.position.copy(this.defaultPosition);
    this.camera.lookAt(this.target);

    const offset = new THREE.Vector3().subVectors(this.defaultPosition, this.target);
    this.spherical.setFromVector3(offset);
  }

  handleResize(width: number, height: number): void {
    if (width <= 0 || height <= 0) return;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
  }

  /**
   * Pointer orbit controls (Right-click or Middle-click drag)
   */
  startOrbit(clientX: number, clientY: number): void {
    this.isOrbiting = true;
    this.previousMousePosition = { x: clientX, y: clientY };
  }

  updateOrbit(clientX: number, clientY: number): boolean {
    if (!this.isOrbiting) return false;

    const deltaX = clientX - this.previousMousePosition.x;
    const deltaY = clientY - this.previousMousePosition.y;
    this.previousMousePosition = { x: clientX, y: clientY };

    // Rotate spherical coordinates
    this.spherical.theta -= deltaX * 0.008;
    this.spherical.phi -= deltaY * 0.008;

    // Constrain polar angle so camera stays above the floor
    this.spherical.phi = Math.max(0.15, Math.min(Math.PI / 2 - 0.05, this.spherical.phi));

    // Update camera position
    const newPos = new THREE.Vector3().setFromSpherical(this.spherical).add(this.target);
    this.camera.position.copy(newPos);
    this.camera.lookAt(this.target);

    return true;
  }

  endOrbit(): void {
    this.isOrbiting = false;
  }

  isCurrentlyOrbiting(): boolean {
    return this.isOrbiting;
  }

  /**
   * Zoom camera along spherical radius
   */
  handleZoom(deltaY: number): void {
    const zoomFactor = deltaY * 0.02;
    this.spherical.radius = Math.max(12, Math.min(45, this.spherical.radius + zoomFactor));

    const newPos = new THREE.Vector3().setFromSpherical(this.spherical).add(this.target);
    this.camera.position.copy(newPos);
    this.camera.lookAt(this.target);
  }
}
