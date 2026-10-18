import * as THREE from "three";
import type { TrayMaterialId } from "@/types";

export interface TrayMaterialConfig {
  id: TrayMaterialId;
  label: string;
  floorColor: number;
  woodColor: number;
  trimColor: number;
  roughness: number;
  metalness: number;
  clearcoat?: number;
}

export const TRAY_MATERIAL_CONFIGS: Record<TrayMaterialId, TrayMaterialConfig> = {
  "green-velvet": {
    id: "green-velvet",
    label: "Green Velvet Felt",
    floorColor: 0x064e3b, // Deep emerald velvet
    woodColor: 0x271911, // Rich dark walnut
    trimColor: 0xd97706, // Warm antique gold rim
    roughness: 0.9,
    metalness: 0.05,
  },
  "navy-velvet": {
    id: "navy-velvet",
    label: "Navy Velvet Felt",
    floorColor: 0x0f2b48, // Regal midnight navy
    woodColor: 0x1e1e24, // Ebony wood
    trimColor: 0x93c5fd, // Silver-blue polished trim
    roughness: 0.88,
    metalness: 0.08,
  },
  "burgundy-velvet": {
    id: "burgundy-velvet",
    label: "Burgundy Velvet Felt",
    floorColor: 0x4c0519, // Crimson royal wine
    woodColor: 0x2b1115, // Rosewood
    trimColor: 0xf59e0b, // Radiant brass trim
    roughness: 0.9,
    metalness: 0.05,
  },
  "dark-oak": {
    id: "dark-oak",
    label: "Dark Oak",
    floorColor: 0x3b2413, // Varnished oak planking
    woodColor: 0x1c1008, // Charred oak walls
    trimColor: 0x78350f, // Matte copper trim
    roughness: 0.55,
    metalness: 0.12,
  },
  "stitched-leather": {
    id: "stitched-leather",
    label: "Stitched Leather",
    floorColor: 0x291d18, // Weathered saddle leather
    woodColor: 0x18120f, // Deep mahogany
    trimColor: 0xb45309, // Antique bronze rivets & trim
    roughness: 0.72,
    metalness: 0.15,
  },
};

export class MaterialFactory {
  private readonly materials: Set<THREE.Material> = new Set();
  private readonly textures: Set<THREE.Texture> = new Set();

  createTrayMaterials(materialId: TrayMaterialId = "green-velvet"): {
    floor: THREE.MeshStandardMaterial;
    wood: THREE.MeshStandardMaterial;
    trim: THREE.MeshStandardMaterial;
  } {
    const config = TRAY_MATERIAL_CONFIGS[materialId] || TRAY_MATERIAL_CONFIGS["green-velvet"];

    const floor = new THREE.MeshStandardMaterial({
      color: config.floorColor,
      roughness: config.roughness,
      metalness: config.metalness,
    });
    this.materials.add(floor);

    const wood = new THREE.MeshStandardMaterial({
      color: config.woodColor,
      roughness: 0.45,
      metalness: 0.15,
    });
    this.materials.add(wood);

    const trim = new THREE.MeshStandardMaterial({
      color: config.trimColor,
      roughness: 0.25,
      metalness: 0.85,
    });
    this.materials.add(trim);

    return { floor, wood, trim };
  }

  createFeltFloorMaterial(colorHex = 0x064e3b): THREE.MeshStandardMaterial {
    const mat = new THREE.MeshStandardMaterial({
      color: colorHex,
      roughness: 0.9,
      metalness: 0.05,
    });
    this.materials.add(mat);
    return mat;
  }

  createTrayWoodMaterial(colorHex = 0x271911): THREE.MeshStandardMaterial {
    const mat = new THREE.MeshStandardMaterial({
      color: colorHex,
      roughness: 0.45,
      metalness: 0.15,
    });
    this.materials.add(mat);
    return mat;
  }

  createTrayTrimMaterial(colorHex = 0xd97706): THREE.MeshStandardMaterial {
    const mat = new THREE.MeshStandardMaterial({
      color: colorHex,
      roughness: 0.3,
      metalness: 0.8,
    });
    this.materials.add(mat);
    return mat;
  }

  dispose(): void {
    for (const mat of this.materials) {
      mat.dispose();
    }
    this.materials.clear();

    for (const tex of this.textures) {
      tex.dispose();
    }
    this.textures.clear();
  }
}
