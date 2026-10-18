import * as THREE from "three";
import { CameraRig } from "../camera/CameraRig";
import { LightingRig } from "../lighting/LightingRig";
import { MaterialFactory } from "../materials/MaterialFactory";
import { TrayMesh } from "../geometries/TrayMesh";
import { PhysicsWorld } from "@/core/physics/PhysicsWorld";
import { DiceMaterialManager } from "../materials/DiceMaterialManager";
import { DieMesh } from "../geometries/DieMesh";
import { DiceFactory } from "@/core/dice/DiceFactory";
import { DiceSimulationManager } from "@/core/physics/DiceSimulationManager";
import { DiceInteractionController } from "../interaction/DiceInteractionController";
import type {
  AppSettings,
  DiceGeometryStyle,
  DicePoolState,
  DiceThemeId,
  RollMode,
  TrayMaterialId,
  TraySizePreset,
} from "@/types";

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
  private readonly simManager: DiceSimulationManager;
  private readonly interactionController: DiceInteractionController;

  // Active pool dice meshes in the tray
  private readonly activeDiceGroup: THREE.Group;
  private readonly activeDiceMeshes: Map<string, DieMesh> = new Map();

  private animationFrameId: number | null = null;
  private resizeObserver: ResizeObserver | null = null;
  private readonly clock: THREE.Clock;
  private isDisposed = false;

  private currentGeometryStyle: DiceGeometryStyle;
  private currentTheme: DiceThemeId;
  private customBodyColor?: string;
  private customNumberColor?: string;

  constructor(container: HTMLElement, settings: AppSettings) {
    this.container = container;
    this.clock = new THREE.Clock();
    this.currentGeometryStyle = settings.diceGeometryStyle || "sharp";
    this.currentTheme = settings.diceTheme || "obsidian-gold";
    this.customBodyColor = settings.customBodyColor;
    this.customNumberColor = settings.customNumberColor;

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

    // 4. Materials & Lighting
    this.materialFactory = new MaterialFactory();
    this.diceMaterialManager = new DiceMaterialManager();
    this.lightingRig = new LightingRig();
    this.scene.add(this.lightingRig.group);

    // 5. Physics World
    this.physicsWorld = new PhysicsWorld(settings.physics);

    // 6. Tray Mesh
    this.trayMesh = new TrayMesh(
      this.materialFactory,
      this.physicsWorld.getTrayDimensions(),
      settings.trayMaterial || "green-velvet"
    );
    this.scene.add(this.trayMesh.group);

    // 7. Simulation Manager
    this.simManager = new DiceSimulationManager(this.physicsWorld);

    // 8. Active dice container group
    this.activeDiceGroup = new THREE.Group();
    this.activeDiceGroup.name = "ActiveDiceGroup";
    this.scene.add(this.activeDiceGroup);

    // 9. Pointer Interaction Controller (Drag, Toss & Orbit)
    this.interactionController = new DiceInteractionController(
      this.renderer.domElement,
      this.cameraRig,
      this.simManager,
      this.activeDiceGroup
    );

    // 10. Resize handling & render loop
    this.setupResizeObserver();
    this.startLoop();
  }

  getSimulationManager(): DiceSimulationManager {
    return this.simManager;
  }

  getPhysicsWorld(): PhysicsWorld {
    return this.physicsWorld;
  }

  resetCamera(): void {
    this.cameraRig.resetPosition();
  }

  /**
   * Synchronizes active dice meshes with AppState dice pool.
   */
  syncDicePool(pool: DicePoolState): void {
    const currentIds = new Set(pool.dice.map((d) => d.id));

    // 1. Remove dice no longer in pool
    for (const [id, mesh] of this.activeDiceMeshes.entries()) {
      if (!currentIds.has(id)) {
        this.simManager.removeDie(id);
        this.activeDiceGroup.remove(mesh);
        mesh.dispose();
        this.activeDiceMeshes.delete(id);
      }
    }

    // 2. Add new dice into the tray
    pool.dice.forEach((dieInstance, idx) => {
      if (!this.activeDiceMeshes.has(dieInstance.id)) {
        const mesh = DiceFactory.createVisualDie(
          {
            type: dieInstance.type,
            geometryStyle: this.currentGeometryStyle,
            theme: this.currentTheme,
            customBodyColor: this.customBodyColor,
            customNumberColor: this.customNumberColor,
          },
          this.diceMaterialManager
        );

        // Calculate a neat initial placement grid in the tray
        const row = Math.floor(idx / 4);
        const col = idx % 4;
        const x = (col - 1.5) * 2.5;
        const z = (row - 1) * 2.5;
        mesh.position.set(x, 1.2, z);

        this.activeDiceGroup.add(mesh);
        this.activeDiceMeshes.set(dieInstance.id, mesh);

        // Add to physics simulation
        this.simManager.addDie(dieInstance.id, dieInstance.type, mesh);
      }
    });
  }

  rollAllDice(mode: RollMode): void {
    this.simManager.rollAll(mode);
  }

  updateTraySize(preset: TraySizePreset): void {
    this.physicsWorld.setTrayPreset(preset);
    const newDims = this.physicsWorld.getTrayDimensions();
    this.trayMesh.rebuild(newDims);
  }

  updateTrayMaterial(materialId: TrayMaterialId): void {
    this.trayMesh.setMaterial(materialId);
  }

  updateGeometryStyle(style: DiceGeometryStyle): void {
    this.currentGeometryStyle = style;
    for (const die of this.activeDiceMeshes.values()) {
      die.setGeometryStyle(style);
    }
  }

  updateTheme(themeId: DiceThemeId, customBodyColor?: string, customNumberColor?: string): void {
    this.currentTheme = themeId;
    this.customBodyColor = customBodyColor;
    this.customNumberColor = customNumberColor;
    for (const die of this.activeDiceMeshes.values()) {
      die.setTheme(themeId, customBodyColor, customNumberColor);
    }
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

      // Step physics world with fixed timestep & substepping
      this.physicsWorld.step(delta);

      // Update simulation transforms & settlement checks
      this.simManager.update(delta);

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

    this.interactionController.dispose();
    this.simManager.clear();

    for (const die of this.activeDiceMeshes.values()) {
      die.dispose();
    }
    this.activeDiceMeshes.clear();

    this.trayMesh.dispose();
    this.lightingRig.dispose();
    this.materialFactory.dispose();
    this.diceMaterialManager.dispose();
    this.physicsWorld.destroy();

    this.renderer.dispose();
    if (this.renderer.domElement.parentElement) {
      this.renderer.domElement.parentElement.removeChild(this.renderer.domElement);
    }
  }
}
