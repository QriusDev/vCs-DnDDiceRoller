import * as THREE from "three";
import { CameraRig } from "../camera/CameraRig";
import { LightingRig } from "../lighting/LightingRig";
import { MaterialFactory } from "../materials/MaterialFactory";
import { TrayMesh } from "../geometries/TrayMesh";
import { PhysicsWorld } from "@/core/physics/PhysicsWorld";
import { DiceMaterialManager } from "../materials/DiceMaterialManager";
import { DieMesh } from "../geometries/DieMesh";
import { DiceFactory } from "@/core/dice/DiceFactory";
import type { AppSettings, DiceGeometryStyle, DiceThemeId, DiceType } from "@/types";

export class SceneManager {
  private readonly container: HTMLElement;
  private readonly scene: THREE.Scene;
  private readonly renderer: THREE.WebGLRenderer;
  private readonly cameraRig: CameraRig;
  private readonly lightingRig: LightingRig;
  private readonly materialFactory: MaterialFactory;
  private readonly diceMaterialManager: DiceMaterialManager;
  private readonly trayMesh: TrayMesh;
  private readonly physicsWorld: PhysicsWorld;

  // The 6 showcase polyhedral dice (D4, D6, D8, D10, D12, D20)
  private readonly showcaseDiceGroup: THREE.Group;
  private readonly showcaseDice: Map<DiceType, DieMesh> = new Map();

  private animationFrameId: number | null = null;
  private resizeObserver: ResizeObserver | null = null;
  private readonly clock: THREE.Clock;
  private isDisposed = false;

  // Interactive inspection rotation state
  private isPointerDown = false;
  private previousPointerX = 0;
  private previousPointerY = 0;
  private selectedDie: DieMesh | null = null;
  private autoRotate = true;

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
    this.renderer.toneMappingExposure = 1.15;

    this.container.appendChild(this.renderer.domElement);

    // 4. Material Factory & Lighting
    this.materialFactory = new MaterialFactory();
    this.diceMaterialManager = new DiceMaterialManager();
    this.lightingRig = new LightingRig();
    this.scene.add(this.lightingRig.group);

    // 5. Tray Mesh
    this.trayMesh = new TrayMesh(this.materialFactory);
    this.scene.add(this.trayMesh.group);

    // 6. Physics World
    this.physicsWorld = new PhysicsWorld(settings.physics);

    // 7. Showcase all six mathematically correct 3D dice
    this.showcaseDiceGroup = new THREE.Group();
    this.showcaseDiceGroup.name = "ShowcaseDiceGroup";
    this.setupShowcaseDice(
      settings.diceGeometryStyle || "sharp",
      settings.diceTheme || "obsidian-gold"
    );
    this.scene.add(this.showcaseDiceGroup);

    // 8. Resize & Pointer Interaction handling
    this.setupResizeObserver();
    this.setupPointerInteractions();

    // 9. Start render loop
    this.startLoop();
  }

  private setupShowcaseDice(style: DiceGeometryStyle, theme: DiceThemeId): void {
    const diceTypes: DiceType[] = ["d4", "d6", "d8", "d10", "d12", "d20"];
    const positions: [number, number, number][] = [
      [-5.0, 1.1, 0],
      [-3.0, 1.1, 0],
      [-1.0, 1.1, 0],
      [1.0, 1.1, 0],
      [3.0, 1.1, 0],
      [5.0, 1.1, 0],
    ];

    diceTypes.forEach((type, idx) => {
      const dieMesh = DiceFactory.createVisualDie(
        {
          type,
          geometryStyle: style,
          theme,
        },
        this.diceMaterialManager
      );

      const [x, y, z] = positions[idx];
      dieMesh.position.set(x, y, z);
      this.showcaseDiceGroup.add(dieMesh);
      this.showcaseDice.set(type, dieMesh);
    });
  }

  updateGeometryStyle(style: DiceGeometryStyle): void {
    for (const die of this.showcaseDice.values()) {
      die.setGeometryStyle(style);
    }
  }

  updateTheme(themeId: DiceThemeId, customBodyColor?: string, customNumberColor?: string): void {
    for (const die of this.showcaseDice.values()) {
      die.setTheme(themeId, customBodyColor, customNumberColor);
    }
  }

  getShowcaseDie(type: DiceType): DieMesh | undefined {
    return this.showcaseDice.get(type);
  }

  private setupPointerInteractions(): void {
    const dom = this.renderer.domElement;
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const onPointerDown = (e: MouseEvent): void => {
      this.isPointerDown = true;
      this.previousPointerX = e.clientX;
      this.previousPointerY = e.clientY;

      const rect = dom.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, this.cameraRig.camera);
      const intersects = raycaster.intersectObjects(this.showcaseDiceGroup.children, true);

      if (intersects.length > 0) {
        // Find top DieMesh parent
        let obj: THREE.Object3D | null = intersects[0].object;
        while (obj && !(obj instanceof DieMesh)) {
          obj = obj.parent;
        }
        if (obj instanceof DieMesh) {
          this.selectedDie = obj;
          this.autoRotate = false;
        }
      } else {
        this.selectedDie = null;
      }
    };

    const onPointerMove = (e: MouseEvent): void => {
      if (!this.isPointerDown) return;
      const deltaX = e.clientX - this.previousPointerX;
      const deltaY = e.clientY - this.previousPointerY;
      this.previousPointerX = e.clientX;
      this.previousPointerY = e.clientY;

      if (this.selectedDie) {
        // Rotate the selected die
        this.selectedDie.rotation.y += deltaX * 0.02;
        this.selectedDie.rotation.x += deltaY * 0.02;
      } else {
        // Rotate all showcase dice
        for (const die of this.showcaseDice.values()) {
          die.rotation.y += deltaX * 0.015;
          die.rotation.x += deltaY * 0.015;
        }
      }
    };

    const onPointerUp = (): void => {
      this.isPointerDown = false;
      // Resume auto tumble after 1.5 seconds if released
      window.setTimeout(() => {
        if (!this.isPointerDown) {
          this.autoRotate = true;
        }
      }, 1500);
    };

    dom.addEventListener("mousedown", onPointerDown);
    window.addEventListener("mousemove", onPointerMove);
    window.addEventListener("mouseup", onPointerUp);
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
      this.physicsWorld.step(delta);

      const elapsed = this.clock.getElapsedTime();

      // Gentle showcase tumble of all 6 dice to display faces, numbers, and specular highlights
      if (this.autoRotate) {
        const rotations = [
          { speedX: 0.45, speedY: 0.65, speedZ: 0.2 }, // D4
          { speedX: 0.55, speedY: 0.35, speedZ: 0.4 }, // D6
          { speedX: 0.35, speedY: 0.75, speedZ: 0.25 }, // D8
          { speedX: 0.6, speedY: 0.4, speedZ: 0.35 }, // D10
          { speedX: 0.3, speedY: 0.55, speedZ: 0.45 }, // D12
          { speedX: 0.5, speedY: 0.7, speedZ: 0.3 }, // D20
        ];

        let idx = 0;
        for (const die of this.showcaseDice.values()) {
          const r = rotations[idx % rotations.length];
          die.rotation.x = elapsed * r.speedX;
          die.rotation.y = elapsed * r.speedY;
          die.rotation.z = elapsed * r.speedZ;
          die.position.y = 1.1 + Math.sin(elapsed * 2.2 + idx * 0.8) * 0.12;
          idx++;
        }
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

    // Dispose showcase dice
    for (const die of this.showcaseDice.values()) {
      die.dispose();
    }
    this.showcaseDice.clear();

    // Dispose tray, lighting, materials, physics
    this.trayMesh.dispose();
    this.lightingRig.dispose();
    this.materialFactory.dispose();
    this.diceMaterialManager.dispose();
    this.physicsWorld.destroy();

    // Dispose renderer
    this.renderer.dispose();
    if (this.renderer.domElement.parentElement) {
      this.renderer.domElement.parentElement.removeChild(this.renderer.domElement);
    }
  }
}
