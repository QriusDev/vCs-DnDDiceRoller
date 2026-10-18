import * as THREE from "three";
import type { CameraRig } from "../camera/CameraRig";
import type { DiceSimulationManager, SimulatedDie } from "@/core/physics/DiceSimulationManager";
import { DieMesh } from "../geometries/DieMesh";

export class DiceInteractionController {
  private readonly domElement: HTMLElement;
  private readonly cameraRig: CameraRig;
  private readonly simManager: DiceSimulationManager;
  private readonly diceGroup: THREE.Group;

  private isDragging = false;
  private draggedDie: SimulatedDie | null = null;
  private readonly dragPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -1.8);
  private readonly raycaster = new THREE.Raycaster();
  private readonly mouse = new THREE.Vector2();

  // Pointer drag velocity tracker for realistic tossing
  private lastDragPos = new THREE.Vector3();
  private dragVelocity = new THREE.Vector3();
  private lastDragTime = 0;

  private readonly boundOnPointerDown: (e: MouseEvent) => void;
  private readonly boundOnPointerMove: (e: MouseEvent) => void;
  private readonly boundOnPointerUp: (e: MouseEvent) => void;
  private readonly boundOnWheel: (e: WheelEvent) => void;
  private readonly boundOnContextMenu: (e: MouseEvent) => void;

  constructor(
    domElement: HTMLElement,
    cameraRig: CameraRig,
    simManager: DiceSimulationManager,
    diceGroup: THREE.Group
  ) {
    this.domElement = domElement;
    this.cameraRig = cameraRig;
    this.simManager = simManager;
    this.diceGroup = diceGroup;

    this.boundOnPointerDown = this.onPointerDown.bind(this);
    this.boundOnPointerMove = this.onPointerMove.bind(this);
    this.boundOnPointerUp = this.onPointerUp.bind(this);
    this.boundOnWheel = this.onWheel.bind(this);
    this.boundOnContextMenu = this.onContextMenu.bind(this);

    this.setupListeners();
  }

  private setupListeners(): void {
    this.domElement.addEventListener("mousedown", this.boundOnPointerDown);
    this.domElement.addEventListener("wheel", this.boundOnWheel, { passive: false });
    this.domElement.addEventListener("contextmenu", this.boundOnContextMenu);
    window.addEventListener("mousemove", this.boundOnPointerMove);
    window.addEventListener("mouseup", this.boundOnPointerUp);
  }

  private updateMouseCoords(e: MouseEvent): void {
    const rect = this.domElement.getBoundingClientRect();
    this.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
  }

  private onContextMenu(e: MouseEvent): void {
    // Prevent default context menu on the 3D canvas so right-click can orbit smoothly
    e.preventDefault();
  }

  private onPointerDown(e: MouseEvent): void {
    // Right click (button 2) or Middle click (button 1): Camera Orbit
    if (e.button === 2 || e.button === 1) {
      this.cameraRig.startOrbit(e.clientX, e.clientY);
      return;
    }

    // Left click (button 0): Check for die drag
    if (e.button !== 0) return;

    this.updateMouseCoords(e);
    this.raycaster.setFromCamera(this.mouse, this.cameraRig.camera);

    const intersects = this.raycaster.intersectObjects(this.diceGroup.children, true);
    if (intersects.length > 0) {
      let targetMesh: THREE.Object3D | null = intersects[0].object;
      while (targetMesh && !(targetMesh instanceof DieMesh)) {
        targetMesh = targetMesh.parent;
      }

      if (targetMesh instanceof DieMesh) {
        const allDice = this.simManager.getAllDice();
        const match = allDice.find((d) => d.mesh === targetMesh);

        if (match) {
          this.isDragging = true;
          this.draggedDie = match;
          this.draggedDie.body.wakeUp();
          this.draggedDie.body.velocity.set(0, 0, 0);
          this.draggedDie.body.angularVelocity.set(0, 0, 0);

          this.lastDragPos.copy(match.mesh.position);
          this.lastDragTime = performance.now();
          this.dragVelocity.set(0, 0, 0);
          return;
        }
      }
    }

    // Left click on empty tray surface starts subtle camera orbit as well
    this.cameraRig.startOrbit(e.clientX, e.clientY);
  }

  private onPointerMove(e: MouseEvent): void {
    // 1. If orbiting camera
    if (this.cameraRig.isCurrentlyOrbiting()) {
      this.cameraRig.updateOrbit(e.clientX, e.clientY);
      return;
    }

    // 2. If dragging die
    if (this.isDragging && this.draggedDie) {
      this.updateMouseCoords(e);
      this.raycaster.setFromCamera(this.mouse, this.cameraRig.camera);

      const hitPoint = new THREE.Vector3();
      if (this.raycaster.ray.intersectPlane(this.dragPlane, hitPoint)) {
        const now = performance.now();
        const dt = Math.max(0.001, (now - this.lastDragTime) / 1000);

        this.dragVelocity.subVectors(hitPoint, this.lastDragPos).divideScalar(dt);

        this.draggedDie.body.position.set(hitPoint.x, 2.0, hitPoint.z);
        this.draggedDie.body.velocity.set(0, 0, 0);
        this.draggedDie.body.angularVelocity.set(0, 0, 0);

        this.lastDragPos.copy(hitPoint);
        this.lastDragTime = now;
      }
    }
  }

  private onPointerUp(_e: MouseEvent): void {
    if (this.cameraRig.isCurrentlyOrbiting()) {
      this.cameraRig.endOrbit();
    }

    if (this.isDragging && this.draggedDie) {
      const releaseVel = this.dragVelocity.clone().clampLength(0, 35);
      const angularVel = new THREE.Vector3(
        (Math.random() - 0.5) * 20,
        (Math.random() - 0.5) * 20,
        (Math.random() - 0.5) * 20
      );

      releaseVel.y = Math.max(2.0, Math.abs(releaseVel.y) + 3.0);
      this.simManager.throwDie(this.draggedDie.id, releaseVel, angularVel);

      this.isDragging = false;
      this.draggedDie = null;
    }
  }

  private onWheel(e: WheelEvent): void {
    e.preventDefault();
    this.cameraRig.handleZoom(e.deltaY);
  }

  isInteracting(): boolean {
    return this.isDragging || this.cameraRig.isCurrentlyOrbiting();
  }

  dispose(): void {
    this.domElement.removeEventListener("mousedown", this.boundOnPointerDown);
    this.domElement.removeEventListener("wheel", this.boundOnWheel);
    this.domElement.removeEventListener("contextmenu", this.boundOnContextMenu);
    window.removeEventListener("mousemove", this.boundOnPointerMove);
    window.removeEventListener("mouseup", this.boundOnPointerUp);
    this.draggedDie = null;
  }
}
