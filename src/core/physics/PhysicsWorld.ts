import * as CANNON from "cannon-es";
import type {
  CollisionEventData,
  CollisionTargetType,
  PhysicsConfig,
  TrayDimensions,
  TraySizePreset,
} from "@/types";
import {
  DEFAULT_TRAY_DIMENSIONS,
  TRAY_SIZE_PRESETS,
  PHYSICS_TIMESTEP,
  MAX_SUBSTEPS,
} from "@/config/physicsConfig";

export type CollisionListener = (data: CollisionEventData) => void;

export class PhysicsWorld {
  private readonly world: CANNON.World;
  private readonly diceMaterial: CANNON.Material;
  private readonly floorMaterial: CANNON.Material;
  private readonly wallMaterial: CANNON.Material;

  private currentTrayDims: TrayDimensions;
  private trayBodies: CANNON.Body[] = [];
  private readonly collisionListeners: Set<CollisionListener> = new Set();
  private isDestroyed = false;

  constructor(config: PhysicsConfig, trayDims: TrayDimensions = DEFAULT_TRAY_DIMENSIONS) {
    this.currentTrayDims = trayDims;

    this.world = new CANNON.World({
      gravity: new CANNON.Vec3(config.gravity[0], config.gravity[1], config.gravity[2]),
    });
    this.world.allowSleep = true;

    // Contact Materials
    this.diceMaterial = new CANNON.Material("diceMaterial");
    this.floorMaterial = new CANNON.Material("floorMaterial");
    this.wallMaterial = new CANNON.Material("wallMaterial");

    this.setupContactMaterials(config);
    this.buildTrayColliders(this.currentTrayDims);
  }

  private setupContactMaterials(config: PhysicsConfig): void {
    // 1. Die to Floor (Felt - high friction, tuned restitution)
    const dieFloorContact = new CANNON.ContactMaterial(this.diceMaterial, this.floorMaterial, {
      friction: Math.max(0.2, config.defaultFriction),
      restitution: Math.min(0.7, config.defaultRestitution * 0.9),
      contactEquationStiffness: 1e7,
      contactEquationRelaxation: 3,
    });
    this.world.addContactMaterial(dieFloorContact);

    // 2. Die to Wall (Wood/Trim - slightly higher bounce, medium friction)
    const dieWallContact = new CANNON.ContactMaterial(this.diceMaterial, this.wallMaterial, {
      friction: 0.25,
      restitution: Math.min(0.8, config.defaultRestitution * 1.1),
      contactEquationStiffness: 1e7,
      contactEquationRelaxation: 3,
    });
    this.world.addContactMaterial(dieWallContact);

    // 3. Die to Die (Resin on resin - sharp clack, medium restitution)
    const dieDieContact = new CANNON.ContactMaterial(this.diceMaterial, this.diceMaterial, {
      friction: 0.2,
      restitution: Math.min(0.75, config.defaultRestitution),
      contactEquationStiffness: 1e7,
      contactEquationRelaxation: 3,
    });
    this.world.addContactMaterial(dieDieContact);

    // Default fallback
    this.world.defaultContactMaterial = dieFloorContact;
  }

  /**
   * Constructs the static physical floor and 4 boundary walls.
   */
  private buildTrayColliders(dims: TrayDimensions): void {
    this.clearTrayColliders();

    // Floor
    const floorShape = new CANNON.Box(new CANNON.Vec3(dims.width / 2, 0.5, dims.length / 2));
    const floorBody = new CANNON.Body({
      type: CANNON.Body.STATIC,
      material: this.floorMaterial,
      position: new CANNON.Vec3(0, -0.5, 0),
    });
    (floorBody as unknown as { colliderTag: string }).colliderTag = "floor";
    floorBody.addShape(floorShape);
    this.world.addBody(floorBody);
    this.trayBodies.push(floorBody);

    const halfWidth = dims.width / 2;
    const halfLength = dims.length / 2;
    const wallHalfHeight = dims.wallHeight / 2;
    const wallHalfThick = dims.wallThickness / 2;

    // North / South walls
    const nsShape = new CANNON.Box(
      new CANNON.Vec3(halfWidth + dims.wallThickness, wallHalfHeight, wallHalfThick)
    );

    const northWall = new CANNON.Body({
      type: CANNON.Body.STATIC,
      material: this.wallMaterial,
      position: new CANNON.Vec3(0, wallHalfHeight, -halfLength - wallHalfThick),
    });
    (northWall as unknown as { colliderTag: string }).colliderTag = "wall_north";
    northWall.addShape(nsShape);
    this.world.addBody(northWall);
    this.trayBodies.push(northWall);

    const southWall = new CANNON.Body({
      type: CANNON.Body.STATIC,
      material: this.wallMaterial,
      position: new CANNON.Vec3(0, wallHalfHeight, halfLength + wallHalfThick),
    });
    (southWall as unknown as { colliderTag: string }).colliderTag = "wall_south";
    southWall.addShape(nsShape);
    this.world.addBody(southWall);
    this.trayBodies.push(southWall);

    // East / West walls
    const ewShape = new CANNON.Box(new CANNON.Vec3(wallHalfThick, wallHalfHeight, halfLength));

    const westWall = new CANNON.Body({
      type: CANNON.Body.STATIC,
      material: this.wallMaterial,
      position: new CANNON.Vec3(-halfWidth - wallHalfThick, wallHalfHeight, 0),
    });
    (westWall as unknown as { colliderTag: string }).colliderTag = "wall_west";
    westWall.addShape(ewShape);
    this.world.addBody(westWall);
    this.trayBodies.push(westWall);

    const eastWall = new CANNON.Body({
      type: CANNON.Body.STATIC,
      material: this.wallMaterial,
      position: new CANNON.Vec3(halfWidth + wallHalfThick, wallHalfHeight, 0),
    });
    (eastWall as unknown as { colliderTag: string }).colliderTag = "wall_east";
    eastWall.addShape(ewShape);
    this.world.addBody(eastWall);
    this.trayBodies.push(eastWall);
  }

  private clearTrayColliders(): void {
    for (const body of this.trayBodies) {
      this.world.removeBody(body);
    }
    this.trayBodies = [];
  }

  /**
   * Dynamically update tray dimensions (preset or custom dimensions)
   */
  updateTrayDimensions(dims: TrayDimensions): void {
    this.currentTrayDims = dims;
    this.buildTrayColliders(dims);
  }

  setTrayPreset(preset: TraySizePreset): void {
    const dims = TRAY_SIZE_PRESETS[preset] || TRAY_SIZE_PRESETS.standard;
    this.updateTrayDimensions(dims);
  }

  getTrayDimensions(): TrayDimensions {
    return this.currentTrayDims;
  }

  /**
   * Updates physics gravity and contact materials dynamically.
   */
  updatePhysicsConfig(config: PhysicsConfig): void {
    this.world.gravity.set(config.gravity[0], config.gravity[1], config.gravity[2]);
    this.setupContactMaterials(config);
  }

  step(deltaSeconds: number): void {
    if (this.isDestroyed) return;
    this.world.step(PHYSICS_TIMESTEP, deltaSeconds, MAX_SUBSTEPS);
  }

  /**
   * Registers a die body with collision event routing.
   */
  registerDieBody(dieId: string, body: CANNON.Body): () => void {
    (body as unknown as { dieId: string }).dieId = dieId;
    body.material = this.diceMaterial;

    const onCollide = (event: { body: CANNON.Body; contact?: CANNON.ContactEquation }) => {
      const otherBody = event.body;
      const otherTag = otherBody as unknown as { colliderTag?: string; dieId?: string };

      let targetType: CollisionTargetType = "floor";
      let targetId: string | undefined = undefined;

      if (otherTag.dieId) {
        targetType = "die";
        targetId = otherTag.dieId;
      } else if (otherTag.colliderTag && otherTag.colliderTag.startsWith("wall")) {
        targetType = "wall";
      } else {
        targetType = "floor";
      }

      // Compute relative impact velocity
      const relVel = new CANNON.Vec3();
      body.velocity.vsub(otherBody.velocity, relVel);
      const impactVelocity = relVel.length();

      // Filter micro-jitter contacts
      if (impactVelocity > 0.35) {
        const eventData: CollisionEventData = {
          dieId,
          targetType,
          targetId,
          impactVelocity,
          contactPoint: {
            x: body.position.x,
            y: body.position.y,
            z: body.position.z,
          },
          timestamp: Date.now(),
        };

        this.notifyCollision(eventData);
      }
    };

    body.addEventListener("collide", onCollide);
    this.world.addBody(body);

    return () => {
      body.removeEventListener("collide", onCollide);
      this.world.removeBody(body);
    };
  }

  onCollision(listener: CollisionListener): () => void {
    this.collisionListeners.add(listener);
    return () => {
      this.collisionListeners.delete(listener);
    };
  }

  private notifyCollision(data: CollisionEventData): void {
    for (const listener of this.collisionListeners) {
      try {
        listener(data);
      } catch (err) {
        console.error("Error in physics collision listener:", err);
      }
    }
  }

  getWorld(): CANNON.World {
    return this.world;
  }

  getDiceMaterial(): CANNON.Material {
    return this.diceMaterial;
  }

  destroy(): void {
    this.isDestroyed = true;
    this.collisionListeners.clear();
    this.clearTrayColliders();
    while (this.world.bodies.length > 0) {
      this.world.removeBody(this.world.bodies[0]);
    }
  }
}
