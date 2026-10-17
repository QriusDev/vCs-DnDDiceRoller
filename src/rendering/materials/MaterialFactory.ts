import * as THREE from "three";

export class MaterialFactory {
  private readonly materials: Set<THREE.Material> = new Set();
  private readonly textures: Set<THREE.Texture> = new Set();

  createFeltFloorMaterial(colorHex = 0x0f172a): THREE.MeshStandardMaterial {
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

  createPlaceholderDieMaterial(colorHex: number): THREE.MeshStandardMaterial {
    const mat = new THREE.MeshStandardMaterial({
      color: colorHex,
      roughness: 0.25,
      metalness: 0.2,
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
