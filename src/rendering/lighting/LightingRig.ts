import * as THREE from "three";

export class LightingRig {
  readonly group: THREE.Group;
  private readonly ambientLight: THREE.AmbientLight;
  private readonly mainLight: THREE.DirectionalLight;
  private readonly fillLight: THREE.DirectionalLight;

  constructor() {
    this.group = new THREE.Group();
    this.group.name = "LightingRig";

    // Soft ambient illumination
    this.ambientLight = new THREE.AmbientLight(0xf1f5f9, 0.6);
    this.group.add(this.ambientLight);

    // Key directional light with high-quality soft shadows
    this.mainLight = new THREE.DirectionalLight(0xfffbeb, 1.2);
    this.mainLight.position.set(10, 25, 12);
    this.mainLight.castShadow = true;
    this.mainLight.shadow.mapSize.width = 2048;
    this.mainLight.shadow.mapSize.height = 2048;
    this.mainLight.shadow.camera.near = 0.5;
    this.mainLight.shadow.camera.far = 50;
    this.mainLight.shadow.camera.left = -15;
    this.mainLight.shadow.camera.right = 15;
    this.mainLight.shadow.camera.top = 15;
    this.mainLight.shadow.camera.bottom = -15;
    this.mainLight.shadow.bias = -0.0005;
    this.group.add(this.mainLight);

    // Subtle blue-ish fill light from the opposite side
    this.fillLight = new THREE.DirectionalLight(0x93c5fd, 0.4);
    this.fillLight.position.set(-10, 15, -12);
    this.group.add(this.fillLight);
  }

  dispose(): void {
    this.mainLight.dispose();
    this.ambientLight.dispose();
    this.fillLight.dispose();
  }
}
