import * as THREE from "three";
import type { TrayDimensions } from "@/types";
import { DEFAULT_TRAY_DIMENSIONS } from "@/config/physicsConfig";
import type { MaterialFactory } from "../materials/MaterialFactory";

export class TrayMesh {
  readonly group: THREE.Group;
  private readonly geometries: THREE.BufferGeometry[] = [];

  constructor(materialFactory: MaterialFactory, dims: TrayDimensions = DEFAULT_TRAY_DIMENSIONS) {
    this.group = new THREE.Group();
    this.group.name = "DiceTray";

    const floorMat = materialFactory.createFeltFloorMaterial();
    const woodMat = materialFactory.createTrayWoodMaterial();
    const trimMat = materialFactory.createTrayTrimMaterial();

    // 1. Floor (Felt surface)
    const floorGeo = new THREE.BoxGeometry(dims.width, 0.4, dims.length);
    this.geometries.push(floorGeo);
    const floorMesh = new THREE.Mesh(floorGeo, floorMat);
    floorMesh.position.set(0, -0.2, 0);
    floorMesh.receiveShadow = true;
    this.group.add(floorMesh);

    // 2. Tray Walls
    const halfWidth = dims.width / 2;
    const halfLength = dims.length / 2;
    const wallHalfHeight = dims.wallHeight / 2;
    const wallHalfThick = dims.wallThickness / 2;

    // North & South walls
    const nsGeo = new THREE.BoxGeometry(
      dims.width + dims.wallThickness * 2,
      dims.wallHeight,
      dims.wallThickness
    );
    this.geometries.push(nsGeo);

    const northWall = new THREE.Mesh(nsGeo, woodMat);
    northWall.position.set(0, wallHalfHeight, -halfLength - wallHalfThick);
    northWall.castShadow = true;
    northWall.receiveShadow = true;
    this.group.add(northWall);

    const southWall = new THREE.Mesh(nsGeo, woodMat);
    southWall.position.set(0, wallHalfHeight, halfLength + wallHalfThick);
    southWall.castShadow = true;
    southWall.receiveShadow = true;
    this.group.add(southWall);

    // East & West walls
    const ewGeo = new THREE.BoxGeometry(dims.wallThickness, dims.wallHeight, dims.length);
    this.geometries.push(ewGeo);

    const westWall = new THREE.Mesh(ewGeo, woodMat);
    westWall.position.set(-halfWidth - wallHalfThick, wallHalfHeight, 0);
    westWall.castShadow = true;
    westWall.receiveShadow = true;
    this.group.add(westWall);

    const eastWall = new THREE.Mesh(ewGeo, woodMat);
    eastWall.position.set(halfWidth + wallHalfThick, wallHalfHeight, 0);
    eastWall.castShadow = true;
    eastWall.receiveShadow = true;
    this.group.add(eastWall);

    // 3. Golden metallic decorative rim along the top edges
    const rimThickness = 0.08;
    const rimNSGeo = new THREE.BoxGeometry(
      dims.width + dims.wallThickness * 2,
      rimThickness,
      dims.wallThickness
    );
    this.geometries.push(rimNSGeo);

    const northRim = new THREE.Mesh(rimNSGeo, trimMat);
    northRim.position.set(0, dims.wallHeight + rimThickness / 2, -halfLength - wallHalfThick);
    this.group.add(northRim);

    const southRim = new THREE.Mesh(rimNSGeo, trimMat);
    southRim.position.set(0, dims.wallHeight + rimThickness / 2, halfLength + wallHalfThick);
    this.group.add(southRim);

    const rimEWGeo = new THREE.BoxGeometry(dims.wallThickness, rimThickness, dims.length);
    this.geometries.push(rimEWGeo);

    const westRim = new THREE.Mesh(rimEWGeo, trimMat);
    westRim.position.set(-halfWidth - wallHalfThick, dims.wallHeight + rimThickness / 2, 0);
    this.group.add(westRim);

    const eastRim = new THREE.Mesh(rimEWGeo, trimMat);
    eastRim.position.set(halfWidth + wallHalfThick, dims.wallHeight + rimThickness / 2, 0);
    this.group.add(eastRim);
  }

  dispose(): void {
    for (const geo of this.geometries) {
      geo.dispose();
    }
    this.geometries.length = 0;
  }
}
