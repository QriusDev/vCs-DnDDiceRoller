import { describe, it, expect } from "vitest";
import { PhysicsWorld } from "@/core/physics/PhysicsWorld";
import { DEFAULT_SETTINGS } from "@/config/defaultSettings";

describe("PhysicsWorld", () => {
  it("should initialize world with tray colliders and step physics", () => {
    const physicsWorld = new PhysicsWorld(DEFAULT_SETTINGS.physics);
    const world = physicsWorld.getWorld();

    // Tray has 1 floor + 4 walls = 5 static bodies
    expect(world.bodies.length).toBe(5);

    // Should step without error
    expect(() => {
      physicsWorld.step(1 / 60);
    }).not.toThrow();

    physicsWorld.destroy();
    expect(world.bodies.length).toBe(0);
  });
});
