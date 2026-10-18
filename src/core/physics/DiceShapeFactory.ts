import * as CANNON from "cannon-es";
import type { DiceType } from "@/types";
import { PolyhedronData } from "@/rendering/geometries/PolyhedronData";

export interface DicePhysicsBodyOptions {
  mass?: number;
  material?: CANNON.Material;
  linearDamping?: number;
  angularDamping?: number;
}

export class DiceShapeFactory {
  // Cache shapes per dice type so we don't recalculate ConvexPolyhedrons repeatedly
  private static readonly shapeCache = new Map<DiceType, CANNON.Shape>();

  /**
   * Creates a Cannon-es collision shape for the specified dice type.
   * D6 uses CANNON.Box for maximum stability and performance.
   * D4, D8, D10, D12, and D20 use CANNON.ConvexPolyhedron with correct outward face normals.
   */
  static createShape(type: DiceType): CANNON.Shape {
    const cached = this.shapeCache.get(type);
    if (cached) {
      return cached;
    }

    let shape: CANNON.Shape;

    if (type === "d6") {
      // D6 cube: half-extents = 0.75 along all axes
      shape = new CANNON.Box(new CANNON.Vec3(0.75, 0.75, 0.75));
    } else {
      const raw = PolyhedronData.get(type);
      const vertices = raw.vertices.map((v) => new CANNON.Vec3(v.x, v.y, v.z));
      const faces = raw.faces.map((f) => [...f.vertexIndices]);

      shape = new CANNON.ConvexPolyhedron({
        vertices,
        faces,
      });
    }

    this.shapeCache.set(type, shape);
    return shape;
  }

  /**
   * Default masses tuned for physical stability:
   * Heavier dice tumble solidly; smaller dice (D4) don't jitter.
   */
  static getDefaultMass(type: DiceType): number {
    switch (type) {
      case "d4":
        return 0.8;
      case "d6":
        return 1.0;
      case "d8":
        return 1.0;
      case "d10":
        return 1.1;
      case "d12":
        return 1.2;
      case "d20":
        return 1.25;
    }
  }

  /**
   * Creates a full CANNON.Body for a die instance.
   */
  static createBody(type: DiceType, options: DicePhysicsBodyOptions = {}): CANNON.Body {
    const shape = this.createShape(type);
    const mass = options.mass ?? this.getDefaultMass(type);

    const body = new CANNON.Body({
      mass,
      material: options.material,
      linearDamping: options.linearDamping ?? 0.12,
      angularDamping: options.angularDamping ?? 0.12,
      shape,
      allowSleep: true,
      sleepSpeedLimit: 0.15,
      sleepTimeLimit: 0.35,
    });

    // Tag body user data
    (body as unknown as { diceType: DiceType }).diceType = type;

    return body;
  }
}
