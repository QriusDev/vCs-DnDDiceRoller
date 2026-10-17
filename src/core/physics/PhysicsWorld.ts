import * as CANNON from "cannon-es";
import type { PhysicsConfig, TrayDimensions } from "@/types";
import { DEFAULT_TRAY_DIMENSIONS, PHYSICS_TIMESTEP, MAX_SUBSTEPS } from "@/config/physicsConfig";

export class PhysicsWorld {
  private readonly world: CANNON.World;
  private readonly defaultMaterial: CANNON.Material;
  private isDestroyed = false;

  constructor(config: PhysicsConfig, trayDims: TrayDimensions = DEFAULT_TRAY_DIMENSIONS) {
    this.world = new CANNON.World({
      gravity: new CANNON.Vec3(config.gravity[0], config.gravity[1], config.gravity[2]),
    });

    this.world.allowSleep = true;

    this.defaultMaterial = new CANNON.Material("defaultMaterial");
    const contactMaterial = new CANNON.ContactMaterial(this.defaultMaterial, this.defaultMaterial, {
      friction: config.defaultFriction,
      restitution: config.defaultRestitution,
    });
    this.world.addContactMaterial(contactMaterial);
    this.world.defaultContactMaterial = contactMaterial;

    this.buildTrayColliders(trayDims);
  }

  private buildTrayColliders(dims: TrayDimensions): void {
    // Floor
    const floorShape = new CANNON.Box(new CANNON.Vec3(dims.width / 2, 0.5, dims.length / 2));
    const floorBody = new CANNON.Body({
      type: CANNON.Body.STATIC,
      material: this.defaultMaterial,
      position: new CANNON.Vec3(0, -0.5, 0),
    });
    floorBody.addShape(floorShape);
    this.world.addBody(floorBody);

    // Wall dimensions: 4 walls (North, South, East, West)
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
      material: this.defaultMaterial,
      position: new CANNON.Vec3(0, wallHalfHeight, -halfLength - wallHalfThick),
    });
    northWall.addShape(nsShape);
    this.world.addBody(northWall);

    const southWall = new CANNON.Body({
      type: CANNON.Body.STATIC,
      material: this.defaultMaterial,
      position: new CANNON.Vec3(0, wallHalfHeight, halfLength + wallHalfThick),
    });
    southWall.addShape(nsShape);
    this.world.addBody(southWall);

    // East / West walls
    const ewShape = new CANNON.Box(new CANNON.Vec3(wallHalfThick, wallHalfHeight, halfLength));
    const westWall = new CANNON.Body({
      type: CANNON.Body.STATIC,
      material: this.defaultMaterial,
      position: new CANNON.Vec3(-halfWidth - wallHalfThick, wallHalfHeight, 0),
    });
    westWall.addShape(ewShape);
    this.world.addBody(westWall);

    const eastWall = new CANNON.Body({
      type: CANNON.Body.STATIC,
      material: this.defaultMaterial,
      position: new CANNON.Vec3(halfWidth + wallHalfThick, wallHalfHeight, 0),
    });
    eastWall.addShape(ewShape);
    this.world.addBody(eastWall);
  }

  step(deltaSeconds: number): void {
    if (this.isDestroyed) return;
    this.world.step(PHYSICS_TIMESTEP, deltaSeconds, MAX_SUBSTEPS);
  }

  getWorld(): CANNON.World {
    return this.world;
  }

  getDefaultMaterial(): CANNON.Material {
    return this.defaultMaterial;
  }

  destroy(): void {
    this.isDestroyed = true;
    while (this.world.bodies.length > 0) {
      this.world.removeBody(this.world.bodies[0]);
    }
  }
}
