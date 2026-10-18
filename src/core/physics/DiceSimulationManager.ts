import * as CANNON from "cannon-es";
import * as THREE from "three";
import type { DiceType, DieRollResult, RollMode, TrayDimensions } from "@/types";
import { DieMesh } from "@/rendering/geometries/DieMesh";
import { DiceShapeFactory } from "./DiceShapeFactory";
import { FaceDetector } from "./FaceDetector";
import { ResultCalculator } from "../results/ResultCalculator";
import { CryptoRandomProvider } from "../random/RandomProvider";
import type { PhysicsWorld } from "./PhysicsWorld";

export type DieSimulationStatus = "idle" | "throwing" | "tumbling" | "settling" | "settled";

export interface SimulatedDie {
  id: string;
  type: DiceType;
  mesh: DieMesh;
  body: CANNON.Body;
  unregisterBody: () => void;
  status: DieSimulationStatus;
  targetFaceValue?: number; // Pre-selected outcome for Fair RNG mode
  restingFramesCount: number;
  lastPosition: THREE.Vector3;
  lastQuaternion: THREE.Quaternion;
  settledResult?: DieRollResult;
  isRecovered: boolean;
  correctionApplied: boolean;
}

export type RollEventCallback = (
  eventName: "rollStarted" | "dieSettled" | "rollCompleted" | "rollRecovered",
  data?: unknown
) => void;

export class DiceSimulationManager {
  private readonly physicsWorld: PhysicsWorld;
  private readonly diceMap: Map<string, SimulatedDie> = new Map();
  private readonly rng = new CryptoRandomProvider();
  private readonly eventCallbacks: Set<RollEventCallback> = new Set();

  // Settlement detection constants
  private static readonly LINEAR_SPEED_THRESHOLD = 0.25; // m/s
  private static readonly ANGULAR_SPEED_THRESHOLD = 0.45; // rad/s
  private static readonly REQUIRED_SETTLED_FRAMES = 25; // ~0.42 seconds of stability at 60Hz
  private static readonly GLOBAL_ROLL_TIMEOUT_MS = 6000; // Force recovery after 6 seconds
  private static readonly CORRECTION_LERP_SPEED = 0.15; // Smooth rotation adjustment factor

  private rollStartTime = 0;
  private isRolling = false;
  private rollMode: RollMode = "fair-rng";

  private readonly tempThreeQuat = new THREE.Quaternion();

  constructor(physicsWorld: PhysicsWorld) {
    this.physicsWorld = physicsWorld;
  }

  onRollEvent(cb: RollEventCallback): () => void {
    this.eventCallbacks.add(cb);
    return () => {
      this.eventCallbacks.delete(cb);
    };
  }

  private emitRollEvent(
    eventName: "rollStarted" | "dieSettled" | "rollCompleted" | "rollRecovered",
    data?: unknown
  ): void {
    for (const cb of this.eventCallbacks) {
      try {
        cb(eventName, data);
      } catch (err) {
        console.error("Error in roll event callback:", err);
      }
    }
  }

  /**
   * Adds a die to the physics simulation and synchronizes with its visual mesh.
   */
  addDie(id: string, type: DiceType, mesh: DieMesh): SimulatedDie {
    if (this.diceMap.has(id)) {
      this.removeDie(id);
    }

    const body = DiceShapeFactory.createBody(type, {
      material: this.physicsWorld.getDiceMaterial(),
    });

    const unregister = this.physicsWorld.registerDieBody(id, body);

    const simDie: SimulatedDie = {
      id,
      type,
      mesh,
      body,
      unregisterBody: unregister,
      status: "idle",
      restingFramesCount: 0,
      lastPosition: mesh.position.clone(),
      lastQuaternion: mesh.quaternion.clone(),
      isRecovered: false,
      correctionApplied: false,
    };

    // Spawn at rest in a clean showcase pose
    this.placeDieAtRest(simDie, mesh.position.x, mesh.position.z);
    this.diceMap.set(id, simDie);

    return simDie;
  }

  removeDie(id: string): void {
    const simDie = this.diceMap.get(id);
    if (simDie) {
      simDie.unregisterBody();
      this.diceMap.delete(id);
    }
  }

  clear(): void {
    for (const simDie of this.diceMap.values()) {
      simDie.unregisterBody();
    }
    this.diceMap.clear();
    this.isRolling = false;
  }

  getSimulatedDie(id: string): SimulatedDie | undefined {
    return this.diceMap.get(id);
  }

  getAllDice(): SimulatedDie[] {
    return Array.from(this.diceMap.values());
  }

  /**
   * Positions a die at resting height on the tray floor without dynamic motion.
   */
  private placeDieAtRest(simDie: SimulatedDie, x: number, z: number): void {
    const meta = simDie.mesh.getMetadata();
    const restingY = meta.boundingRadius * 0.9;

    simDie.body.position.set(x, restingY, z);
    simDie.body.velocity.set(0, 0, 0);
    simDie.body.angularVelocity.set(0, 0, 0);
    simDie.body.quaternion.set(0, 0, 0, 1);
    simDie.body.sleep();

    simDie.mesh.position.set(x, restingY, z);
    simDie.mesh.quaternion.identity();
    simDie.status = "idle";
    simDie.restingFramesCount = 0;
  }

  /**
   * Spawns non-overlapping launch positions inside the tray bounds.
   */
  private calculateSpawnPositions(count: number, dims: TrayDimensions): THREE.Vector3[] {
    const positions: THREE.Vector3[] = [];
    const margin = 2.2;
    const spawnWidth = Math.max(3, dims.width - margin * 2);
    const spawnLength = Math.max(3, dims.length - margin * 2);

    // Drop heights between 5.5 and 8.5 units above the floor
    const baseHeight = 6.0;

    for (let i = 0; i < count; i++) {
      // Stratified jittered placement to prevent spawning inside each other
      const row = Math.floor(i / 3);
      const col = i % 3;
      const x = (col - 1) * (spawnWidth / 3) + (Math.random() - 0.5) * 1.2;
      const z = (row - 1) * (spawnLength / 4) + (Math.random() - 0.5) * 1.2;
      const y = baseHeight + (i % 3) * 0.8 + Math.random() * 0.5;

      positions.push(new THREE.Vector3(x, y, z));
    }

    return positions;
  }

  /**
   * Initiates a dynamic roll across all active dice in the tray.
   */
  rollAll(mode: RollMode = "fair-rng", impulseMult = 1.0): void {
    if (this.diceMap.size === 0) return;

    this.isRolling = true;
    this.rollMode = mode;
    this.rollStartTime = performance.now();
    this.emitRollEvent("rollStarted", { mode, count: this.diceMap.size });

    const diceList = Array.from(this.diceMap.values());
    const trayDims = this.physicsWorld.getTrayDimensions();
    const spawnPoints = this.calculateSpawnPositions(diceList.length, trayDims);

    diceList.forEach((simDie, idx) => {
      const spawn = spawnPoints[idx];
      simDie.isRecovered = false;
      simDie.correctionApplied = false;
      simDie.restingFramesCount = 0;
      simDie.settledResult = undefined;
      simDie.status = "throwing";

      simDie.body.wakeUp();

      // 1. Initial Position
      simDie.body.position.set(spawn.x, spawn.y, spawn.z);

      // 2. Pre-select fair RNG target if in Fair RNG mode
      if (mode === "fair-rng") {
        const metadata = simDie.mesh.getMetadata();
        // Pick an unbiased random face value from metadata.faces
        const faceCount = metadata.faces.length;
        const randomFaceIndex = this.rng.rollDie(faceCount) - 1;
        const targetFace = metadata.faces[randomFaceIndex];
        simDie.targetFaceValue = targetFace.value;

        // Target Landing Solver:
        // Set initial orientation such that the target face is biased upward,
        // while introducing high angular velocity and physical tumble so the die rolls naturally
        const randomSpinAngle = Math.random() * Math.PI * 2;
        const initialQuat = FaceDetector.getRotationForFaceUp(
          metadata,
          targetFace.value,
          new THREE.Vector3(0, 1, 0),
          randomSpinAngle
        );

        // Perturb orientation with a tumble tilt
        const perturbAxis = new THREE.Vector3(
          Math.random() - 0.5,
          Math.random() - 0.5,
          Math.random() - 0.5
        ).normalize();
        const perturbQuat = new THREE.Quaternion().setFromAxisAngle(perturbAxis, 0.45);
        initialQuat.premultiply(perturbQuat);

        simDie.body.quaternion.set(initialQuat.x, initialQuat.y, initialQuat.z, initialQuat.w);
      } else {
        // Pure Physics mode: completely random uniform quaternion
        simDie.targetFaceValue = undefined;
        const u1 = this.rng.next();
        const u2 = this.rng.next();
        const u3 = this.rng.next();
        const qx = Math.sqrt(1 - u1) * Math.sin(2 * Math.PI * u2);
        const qy = Math.sqrt(1 - u1) * Math.cos(2 * Math.PI * u2);
        const qz = Math.sqrt(u1) * Math.sin(2 * Math.PI * u3);
        const qw = Math.sqrt(u1) * Math.cos(2 * Math.PI * u3);
        simDie.body.quaternion.set(qx, qy, qz, qw);
      }

      // 3. Throw Impulses: directed toward center of tray with randomized arc
      const toCenter = new THREE.Vector3(-spawn.x * 0.8, -1.0, -spawn.z * 0.8).normalize();
      const throwSpeed = (12.0 + Math.random() * 8.0) * impulseMult;

      simDie.body.velocity.set(
        toCenter.x * throwSpeed + (Math.random() - 0.5) * 4.0,
        -1.5 - Math.random() * 3.0,
        toCenter.z * throwSpeed + (Math.random() - 0.5) * 4.0
      );

      // High angular spin for natural tumbling
      const spinIntensity = 18.0 + Math.random() * 16.0;
      simDie.body.angularVelocity.set(
        (Math.random() - 0.5) * spinIntensity,
        (Math.random() - 0.5) * spinIntensity * 0.8,
        (Math.random() - 0.5) * spinIntensity
      );
    });
  }

  /**
   * Applies a manual throw impulse to a specific die (e.g. from mouse drag release).
   */
  throwDie(id: string, velocity: THREE.Vector3, angularVelocity: THREE.Vector3): void {
    const simDie = this.diceMap.get(id);
    if (!simDie) return;

    simDie.body.wakeUp();
    simDie.status = "throwing";
    simDie.restingFramesCount = 0;
    simDie.isRecovered = false;
    simDie.correctionApplied = false;

    simDie.body.velocity.set(velocity.x, velocity.y, velocity.z);
    simDie.body.angularVelocity.set(angularVelocity.x, angularVelocity.y, angularVelocity.z);

    this.isRolling = true;
    this.rollStartTime = performance.now();
  }

  /**
   * Steps the physics simulation and handles settlement and target landing alignment.
   */
  update(_deltaSeconds: number): void {
    const now = performance.now();
    const elapsedTime = now - this.rollStartTime;
    const isTimedOut = this.isRolling && elapsedTime > DiceSimulationManager.GLOBAL_ROLL_TIMEOUT_MS;

    let allDiceSettled = true;

    for (const simDie of this.diceMap.values()) {
      // 1. Sync mesh position from rigid body
      simDie.mesh.position.set(
        simDie.body.position.x,
        simDie.body.position.y,
        simDie.body.position.z
      );

      // 2. Settlement detection
      const linSpeed = simDie.body.velocity.length();
      const angSpeed = simDie.body.angularVelocity.length();
      const isSleeping = simDie.body.sleepState === CANNON.Body.SLEEPING;

      const isStationary =
        (linSpeed < DiceSimulationManager.LINEAR_SPEED_THRESHOLD &&
          angSpeed < DiceSimulationManager.ANGULAR_SPEED_THRESHOLD) ||
        isSleeping;

      if (this.isRolling) {
        if (isStationary) {
          simDie.restingFramesCount++;
        } else {
          simDie.restingFramesCount = Math.max(0, simDie.restingFramesCount - 2);
          if (simDie.status === "throwing" && simDie.body.position.y < 3.5) {
            simDie.status = "tumbling";
          }
        }

        const isDieSettled =
          simDie.restingFramesCount >= DiceSimulationManager.REQUIRED_SETTLED_FRAMES || isTimedOut;

        if (isDieSettled && simDie.status !== "settled") {
          simDie.status = "settled";
          simDie.body.sleep();

          // Read result
          this.finalizeDieResult(simDie, isTimedOut);
          this.emitRollEvent("dieSettled", simDie.settledResult);
        }

        if (simDie.status !== "settled") {
          allDiceSettled = false;
        }
      }

      // 3. Orientation synchronization & Target Landing Correction
      if (simDie.correctionApplied && simDie.targetFaceValue !== undefined) {
        // Smoothly interpolate mesh quaternion toward exact target face quaternion
        const targetQuat = FaceDetector.getRotationForFaceUp(
          simDie.mesh.getMetadata(),
          simDie.targetFaceValue
        );
        simDie.mesh.quaternion.slerp(targetQuat, DiceSimulationManager.CORRECTION_LERP_SPEED);
      } else {
        // Standard rigid body orientation sync
        simDie.mesh.quaternion.set(
          simDie.body.quaternion.x,
          simDie.body.quaternion.y,
          simDie.body.quaternion.z,
          simDie.body.quaternion.w
        );
      }

      // Tray Boundary Containment Safety Check (prevent dice glitching out of tray)
      this.enforceTrayBoundaries(simDie);
    }

    if (this.isRolling && allDiceSettled && this.diceMap.size > 0) {
      this.isRolling = false;
      this.completeRoll(isTimedOut);
    }
  }

  /**
   * Finalizes the resting result of a settled die according to RollMode.
   */
  private finalizeDieResult(simDie: SimulatedDie, isRecovery: boolean): void {
    const meta = simDie.mesh.getMetadata();
    this.tempThreeQuat.set(
      simDie.body.quaternion.x,
      simDie.body.quaternion.y,
      simDie.body.quaternion.z,
      simDie.body.quaternion.w
    );

    const detected = FaceDetector.detectUpwardFace(meta, this.tempThreeQuat);

    if (this.rollMode === "fair-rng" && simDie.targetFaceValue !== undefined) {
      // In Fair RNG mode:
      // If the physics simulation settled on a different face due to chaotic collisions,
      // apply bounded target-landing correction to smoothly align the visible resting orientation
      // with the authoritative PRNG result.
      const rawFaceValue = simDie.targetFaceValue;
      let gameValue = rawFaceValue;
      if (simDie.type === "d10" && gameValue === 0) {
        gameValue = 10;
      }

      if (detected.faceValue !== rawFaceValue || detected.isAmbiguous) {
        simDie.correctionApplied = true;
      }

      const { isCriticalHit, isCriticalMiss } = ResultCalculator.evaluateDie(
        simDie.type,
        gameValue
      );

      simDie.settledResult = {
        dieId: simDie.id,
        type: simDie.type,
        value: gameValue,
        rawFaceValue,
        isCriticalHit,
        isCriticalMiss,
      };
    } else {
      // Pure Physics mode: authoritative physical reading!
      // Do not overwrite with any target.
      const finalGameVal = detected.gameValue;

      // Handle rare edge-wedged state in recovery
      if (isRecovery && detected.isAmbiguous) {
        simDie.isRecovered = true;
      }

      const { isCriticalHit, isCriticalMiss } = ResultCalculator.evaluateDie(
        simDie.type,
        finalGameVal
      );

      simDie.settledResult = {
        dieId: simDie.id,
        type: simDie.type,
        value: finalGameVal,
        rawFaceValue: detected.faceValue,
        isCriticalHit,
        isCriticalMiss,
      };
    }
  }

  private completeRoll(wasRecovered: boolean): void {
    const results: DieRollResult[] = [];
    for (const simDie of this.diceMap.values()) {
      if (simDie.settledResult) {
        results.push(simDie.settledResult);
      }
    }

    const aggregate = ResultCalculator.createAggregateResult(
      results,
      this.rollMode,
      wasRecovered ? "recovered" : "completed"
    );

    if (wasRecovered) {
      this.emitRollEvent("rollRecovered", aggregate);
    } else {
      this.emitRollEvent("rollCompleted", aggregate);
    }
  }

  /**
   * Safety fence: Prevents any extreme physics explosion from popping dice outside tray walls.
   */
  private enforceTrayBoundaries(simDie: SimulatedDie): void {
    const dims = this.physicsWorld.getTrayDimensions();
    const halfW = dims.width / 2 - 0.8;
    const halfL = dims.length / 2 - 0.8;

    let clamped = false;
    let x = simDie.body.position.x;
    let y = simDie.body.position.y;
    let z = simDie.body.position.z;

    if (x < -halfW) {
      x = -halfW;
      simDie.body.velocity.x = Math.abs(simDie.body.velocity.x) * 0.4;
      clamped = true;
    } else if (x > halfW) {
      x = halfW;
      simDie.body.velocity.x = -Math.abs(simDie.body.velocity.x) * 0.4;
      clamped = true;
    }

    if (z < -halfL) {
      z = -halfL;
      simDie.body.velocity.z = Math.abs(simDie.body.velocity.z) * 0.4;
      clamped = true;
    } else if (z > halfL) {
      z = halfL;
      simDie.body.velocity.z = -Math.abs(simDie.body.velocity.z) * 0.4;
      clamped = true;
    }

    // Floor fence: cannot fall below 0.2
    if (y < 0.2) {
      y = 0.2 + simDie.mesh.getMetadata().boundingRadius * 0.5;
      simDie.body.velocity.y = Math.abs(simDie.body.velocity.y) * 0.2;
      clamped = true;
    }

    if (clamped) {
      simDie.body.position.set(x, y, z);
    }
  }

  isSimulating(): boolean {
    return this.isRolling;
  }
}
