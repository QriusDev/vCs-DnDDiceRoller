import * as THREE from "three";
import { CameraRig } from "../camera/CameraRig";
import { LightingRig } from "../lighting/LightingRig";
import { MaterialFactory } from "../materials/MaterialFactory";
import { TrayMesh } from "../geometries/TrayMesh";
import { PhysicsWorld } from "@/core/physics/PhysicsWorld";
import type { AppSettings } from "@/types";

export class SceneManager {
  private readonly container: HTMLElement;
  private readonly scene: THREE.Scene;
  private readonly renderer: THREE.WebGLRenderer;
  private readonly cameraRig: CameraRig;
  private readonly lightingRig: LightingRig;
  private readonly materialFactory: MaterialFactory;
  private readonly trayMesh: TrayMesh;
  private readonly physicsWorld: PhysicsWorld;

  // Placeholder demonstration meshes for Phase 1
  private readonly demoDiceGroup: THREE.Group;
  private readonly demoDiceGeometries: THREE.BufferGeometry[] = [];

  private animationFrameId: number | null = null;
  private resizeObserver: ResizeObserver | null = null;
  private readonly clock: THREE.Clock;
  private isDisposed = false;

  constructor(container: HTMLElement, settings: AppSettings) {
    this.container = container;
    this.clock = new THREE.Clock();

    const width = container.clientWidth || 800;
    const height = container.clientHeight || 600;

    // 1. Scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0a0f1d);

    // 2. Camera
    this.cameraRig = new CameraRig(width, height);

    // 3. Renderer
    this.renderer = new THREE.WebGLRenderer({
      antialias: settings.rendering.antialias,
      powerPreference: "high-performance",
    });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(
      Math.min(window.devicePixelRatio, settings.rendering.pixelRatioCap)
    );
    this.renderer.shadowMap.enabled = settings.rendering.shadows;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.1;

    this.container.appendChild(this.renderer.domElement);

    // 4. Material Factory & Lighting
    this.materialFactory = new MaterialFactory();
    this.lightingRig = new LightingRig();
    this.scene.add(this.lightingRig.group);

    // 5. Tray Mesh
    this.trayMesh = new TrayMesh(this.materialFactory);
    this.scene.add(this.trayMesh.group);

    // 6. Physics World
    this.physicsWorld = new PhysicsWorld(settings.physics);

    // 7. Demonstration dice meshes for Phase 1 visual verification
    this.demoDiceGroup = new THREE.Group();
    this.demoDiceGroup.name = "DemoDiceGroup";
    this.setupDemoDice();
    this.scene.add(this.demoDiceGroup);

    // 8. Resize handling
    this.setupResizeObserver();

    // 9. Start loop
    this.startLoop();
  }

  private setupDemoDice(): void {
    // We add 3 showcase geometric dice (d20, d6, d8) gently resting/rotating in the tray
    // to verify lighting, shadows, materials, and the animation loop in Phase 1.
    const d20Geo = new THREE.IcosahedronGeometry(0.9, 0);
    this.demoDiceGeometries.push(d20Geo);
    const d20Mat = this.materialFactory.createPlaceholderDieMaterial(0xe11d48);
    const d20Mesh = new THREE.Mesh(d20Geo, d20Mat);
    d20Mesh.position.set(-3, 1.2, 0);
    d20Mesh.castShadow = true;
    d20Mesh.receiveShadow = true;
    d20Mesh.name = "demo_d20";
    this.demoDiceGroup.add(d20Mesh);

    const d6Geo = new THREE.BoxGeometry(1.2, 1.2, 1.2);
    this.demoDiceGeometries.push(d6Geo);
    const d6Mat = this.materialFactory.createPlaceholderDieMaterial(0x2563eb);
    const d6Mesh = new THREE.Mesh(d6Geo, d6Mat);
    d6Mesh.position.set(0, 1.2, 0);
    d6Mesh.castShadow = true;
    d6Mesh.receiveShadow = true;
    d6Mesh.name = "demo_d6";
    this.demoDiceGroup.add(d6Mesh);

    const d8Geo = new THREE.OctahedronGeometry(0.9, 0);
    this.demoDiceGeometries.push(d8Geo);
    const d8Mat = this.materialFactory.createPlaceholderDieMaterial(0x059669);
    const d8Mesh = new THREE.Mesh(d8Geo, d8Mat);
    d8Mesh.position.set(3, 1.2, 0);
    d8Mesh.castShadow = true;
    d8Mesh.receiveShadow = true;
    d8Mesh.name = "demo_d8";
    this.demoDiceGroup.add(d8Mesh);
  }

  private setupResizeObserver(): void {
    this.resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        this.handleResize(width, height);
      }
    });
    this.resizeObserver.observe(this.container);
  }

  handleResize(width: number, height: number): void {
    if (this.isDisposed || width <= 0 || height <= 0) return;
    this.cameraRig.handleResize(width, height);
    this.renderer.setSize(width, height);
  }

  private startLoop(): void {
    const animate = (): void => {
      if (this.isDisposed) return;
      this.animationFrameId = requestAnimationFrame(animate);

      const delta = Math.min(this.clock.getDelta(), 0.1);

      // Step physics
      this.physicsWorld.step(delta);

      // Subtle rotation on showcase dice to demonstrate active animation
      const elapsed = this.clock.getElapsedTime();
      const d20 = this.demoDiceGroup.getObjectByName("demo_d20");
      const d6 = this.demoDiceGroup.getObjectByName("demo_d6");
      const d8 = this.demoDiceGroup.getObjectByName("demo_d8");

      if (d20) {
        d20.rotation.x = elapsed * 0.5;
        d20.rotation.y = elapsed * 0.7;
        d20.position.y = 1.0 + Math.sin(elapsed * 2) * 0.15;
      }
      if (d6) {
        d6.rotation.x = elapsed * 0.6;
        d6.rotation.z = elapsed * 0.4;
        d6.position.y = 1.0 + Math.sin(elapsed * 2 + 1) * 0.15;
      }
      if (d8) {
        d8.rotation.y = elapsed * 0.8;
        d8.rotation.z = elapsed * 0.5;
        d8.position.y = 1.0 + Math.sin(elapsed * 2 + 2) * 0.15;
      }

      this.renderer.render(this.scene, this.cameraRig.camera);
    };

    this.animationFrameId = requestAnimationFrame(animate);
  }

  dispose(): void {
    if (this.isDisposed) return;
    this.isDisposed = true;

    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }

    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    }

    // Dispose showcase geometries
    for (const geo of this.demoDiceGeometries) {
      geo.dispose();
    }
    this.demoDiceGeometries.length = 0;

    // Dispose tray, lighting, materials, physics
    this.trayMesh.dispose();
    this.lightingRig.dispose();
    this.materialFactory.dispose();
    this.physicsWorld.destroy();

    // Dispose renderer
    this.renderer.dispose();
    if (this.renderer.domElement.parentElement) {
      this.renderer.domElement.parentElement.removeChild(this.renderer.domElement);
    }
  }
}
