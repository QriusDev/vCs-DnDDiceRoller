import { describe, it, expect } from "vitest";
import * as THREE from "three";
import { PhysicsWorld } from "@/core/physics/PhysicsWorld";
import { DiceShapeFactory } from "@/core/physics/DiceShapeFactory";
import { FaceDetector } from "@/core/physics/FaceDetector";
import { DiceSimulationManager } from "@/core/physics/DiceSimulationManager";
import { DEFAULT_SETTINGS } from "@/config/defaultSettings";
import { TRAY_SIZE_PRESETS } from "@/config/physicsConfig";
import { DICE_TYPES } from "@/types";
import { PolyhedronData } from "@/rendering/geometries/PolyhedronData";
import { DiceGeometryBuilder } from "@/rendering/geometries/DiceGeometryBuilder";
import { DieMesh } from "@/rendering/geometries/DieMesh";
import { DiceMaterialManager } from "@/rendering/materials/DiceMaterialManager";

describe("PhysicsWorld & Tray Colliders", () => {
  it("should initialize world with tray colliders and step physics", () => {
    const physicsWorld = new PhysicsWorld(DEFAULT_SETTINGS.physics);
    const world = physicsWorld.getWorld();

    // Tray has 1 floor + 4 walls = 5 static bodies
    expect(world.bodies.length).toBe(5);

    expect(() => {
      physicsWorld.step(1 / 60);
    }).not.toThrow();

    physicsWorld.destroy();
    expect(world.bodies.length).toBe(0);
  });

  it("should support dynamic tray resizing across small, standard, and large presets", () => {
    const physicsWorld = new PhysicsWorld(DEFAULT_SETTINGS.physics);

    for (const preset of ["small", "standard", "large"] as const) {
      physicsWorld.setTrayPreset(preset);
      const dims = physicsWorld.getTrayDimensions();
      expect(dims.preset).toBe(preset);
      expect(dims.width).toBe(TRAY_SIZE_PRESETS[preset].width);
      expect(dims.length).toBe(TRAY_SIZE_PRESETS[preset].length);
      // Colliders count remains 1 floor + 4 walls = 5
      expect(physicsWorld.getWorld().bodies.length).toBe(5);
    }

    physicsWorld.destroy();
  });

  it("should route collision events with impact velocity and target classification", () => {
    const physicsWorld = new PhysicsWorld(DEFAULT_SETTINGS.physics);
    const events: unknown[] = [];
    physicsWorld.onCollision((data) => {
      events.push(data);
    });

    const body = DiceShapeFactory.createBody("d20");
    physicsWorld.registerDieBody("test-die-1", body);

    // Position die above floor and let it fall
    body.position.set(0, 1.5, 0);
    body.velocity.set(0, -5, 0);

    for (let i = 0; i < 30; i++) {
      physicsWorld.step(1 / 60);
    }

    expect(events.length).toBeGreaterThan(0);
    const firstEvent = events[0] as { dieId: string; targetType: string; impactVelocity: number };
    expect(firstEvent.dieId).toBe("test-die-1");
    expect(firstEvent.targetType).toBe("floor");
    expect(firstEvent.impactVelocity).toBeGreaterThan(0.3);

    physicsWorld.destroy();
  });
});

describe("DiceShapeFactory Rigid Body Creation", () => {
  it("should create valid Cannon shapes and bodies for all dice types", () => {
    for (const type of DICE_TYPES) {
      const shape = DiceShapeFactory.createShape(type);
      expect(shape).toBeDefined();

      const body = DiceShapeFactory.createBody(type);
      expect(body.mass).toBeGreaterThan(0.5);
      expect(body.shapes.length).toBe(1);
      expect(body.allowSleep).toBe(true);
    }
  });
});

describe("FaceDetector Face-Up Reading & Quaternion Solver", () => {
  it("should identify correct face-up for all faces of all dice", () => {
    for (const type of DICE_TYPES) {
      const raw = PolyhedronData.get(type);
      const { metadata } = DiceGeometryBuilder.build(raw, "sharp");

      for (const face of metadata.faces) {
        // Calculate the exact quaternion that rotates this face to point +Y
        const targetQuat = FaceDetector.getRotationForFaceUp(metadata, face.value);
        const result = FaceDetector.detectUpwardFace(metadata, targetQuat);

        expect(result.faceValue).toBe(face.value);
        expect(result.dotProduct).toBeCloseTo(1.0, 3);
        expect(result.isAmbiguous).toBe(false);

        // Check D10 special value mapping (0 -> 10)
        if (type === "d10" && face.value === 0) {
          expect(result.gameValue).toBe(10);
        } else {
          expect(result.gameValue).toBe(face.value);
        }
      }
    }
  });

  it("should detect ambiguous or edge-balanced orientation", () => {
    const raw = PolyhedronData.get("d6");
    const { metadata } = DiceGeometryBuilder.build(raw, "sharp");

    // Rotate 45 degrees around Z axis so top edge is balanced between two faces
    const edgeQuat = new THREE.Quaternion().setFromAxisAngle(
      new THREE.Vector3(0, 0, 1),
      Math.PI / 4
    );
    const result = FaceDetector.detectUpwardFace(metadata, edgeQuat);
    // At 45 degree tilt, dot product is ~0.707 and adjacent faces are equal, marking ambiguous or low dot difference
    expect(result.dotProduct).toBeLessThan(0.8);
  });
});

describe("DiceSimulationManager Integration & Settlement Lifecycle", () => {
  const matManager = new DiceMaterialManager();

  it("should manage roll lifecycle transitions: idle -> rolling -> completed", async () => {
    const physicsWorld = new PhysicsWorld(DEFAULT_SETTINGS.physics);
    const simManager = new DiceSimulationManager(physicsWorld);

    const lifecycleEvents: string[] = [];
    simManager.onRollEvent((name) => {
      lifecycleEvents.push(name);
    });

    const mesh = new DieMesh(
      { type: "d20", geometryStyle: "sharp", theme: "obsidian-gold" },
      matManager
    );
    simManager.addDie("d20-sim-1", "d20", mesh);

    expect(simManager.isSimulating()).toBe(false);

    // Roll die in Fair RNG mode
    simManager.rollAll("fair-rng");
    expect(simManager.isSimulating()).toBe(true);
    expect(lifecycleEvents).toContain("rollStarted");

    // Advance simulation until settled
    let frames = 0;
    while (simManager.isSimulating() && frames < 500) {
      physicsWorld.step(1 / 60);
      simManager.update(1 / 60);
      frames++;
    }

    expect(simManager.isSimulating()).toBe(false);
    expect(lifecycleEvents).toContain("dieSettled");
    expect(lifecycleEvents).toContain("rollCompleted");

    const die = simManager.getSimulatedDie("d20-sim-1");
    expect(die?.status).toBe("settled");
    expect(die?.settledResult).toBeDefined();
    expect(die?.settledResult?.value).toBeGreaterThanOrEqual(1);
    expect(die?.settledResult?.value).toBeLessThanOrEqual(20);

    mesh.dispose();
    simManager.clear();
    physicsWorld.destroy();
  });

  it("should support mixed dice pools rolling together", () => {
    const physicsWorld = new PhysicsWorld(DEFAULT_SETTINGS.physics);
    const simManager = new DiceSimulationManager(physicsWorld);

    const types: ("d4" | "d6" | "d8" | "d10" | "d12" | "d20")[] = [
      "d4",
      "d6",
      "d8",
      "d10",
      "d12",
      "d20",
    ];
    const meshes: DieMesh[] = [];

    types.forEach((type, idx) => {
      const mesh = new DieMesh(
        { type, geometryStyle: "sharp", theme: "obsidian-gold" },
        matManager
      );
      meshes.push(mesh);
      simManager.addDie(`${type}-${idx}`, type, mesh);
    });

    expect(simManager.getAllDice().length).toBe(6);

    simManager.rollAll("fair-rng");
    expect(simManager.isSimulating()).toBe(true);

    let frames = 0;
    while (simManager.isSimulating() && frames < 500) {
      physicsWorld.step(1 / 60);
      simManager.update(1 / 60);
      frames++;
    }

    expect(simManager.isSimulating()).toBe(false);
    for (const die of simManager.getAllDice()) {
      expect(die.status).toBe("settled");
      expect(die.settledResult).toBeDefined();
    }

    meshes.forEach((m) => m.dispose());
    simManager.clear();
    physicsWorld.destroy();
  });

  it("should support Pure Physics mode without pre-selected targets", () => {
    const physicsWorld = new PhysicsWorld(DEFAULT_SETTINGS.physics);
    const simManager = new DiceSimulationManager(physicsWorld);

    const mesh = new DieMesh(
      { type: "d6", geometryStyle: "sharp", theme: "obsidian-gold" },
      matManager
    );
    simManager.addDie("d6-phys", "d6", mesh);

    simManager.rollAll("physics");
    const die = simManager.getSimulatedDie("d6-phys");
    expect(die?.targetFaceValue).toBeUndefined();

    let frames = 0;
    while (simManager.isSimulating() && frames < 500) {
      physicsWorld.step(1 / 60);
      simManager.update(1 / 60);
      frames++;
    }

    expect(simManager.isSimulating()).toBe(false);
    expect(die?.settledResult?.value).toBeGreaterThanOrEqual(1);
    expect(die?.settledResult?.value).toBeLessThanOrEqual(6);

    mesh.dispose();
    simManager.clear();
    physicsWorld.destroy();
  });
});
