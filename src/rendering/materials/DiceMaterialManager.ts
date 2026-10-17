import * as THREE from "three";
import type { DiceThemeId, DiceType } from "@/types";
import { DICE_THEMES } from "@/config/themeConfig";
import { DiceTextureGenerator } from "../textures/DiceTextureGenerator";

export class DiceMaterialManager {
  private readonly materials = new Map<string, THREE.Material>();

  /**
   * Creates or gets a cached PBR material for the die type and theme
   */
  getMaterial(
    type: DiceType,
    faceValues: number[],
    themeId: DiceThemeId = "obsidian-gold",
    customBodyColor?: string,
    customNumberColor?: string
  ): THREE.Material {
    const key = `${type}_${themeId}_${customBodyColor ?? ""}_${customNumberColor ?? ""}`;
    const cached = this.materials.get(key);
    if (cached) {
      return cached;
    }

    const theme = DICE_THEMES[themeId] || DICE_THEMES["obsidian-gold"];
    const texture = DiceTextureGenerator.generateAtlas(
      type,
      faceValues,
      themeId,
      customBodyColor,
      customNumberColor
    );

    let mat: THREE.Material;

    if (theme.transparent || (theme.transmission && theme.transmission > 0)) {
      // Translucent Gemstone material
      mat = new THREE.MeshPhysicalMaterial({
        map: texture,
        color: customBodyColor
          ? new THREE.Color(customBodyColor)
          : new THREE.Color(theme.bodyColor),
        roughness: theme.roughness,
        metalness: theme.metalness,
        transmission: theme.transmission ?? 0.6,
        opacity: theme.opacity ?? 0.9,
        transparent: true,
        clearcoat: theme.clearcoat ?? 0.8,
        clearcoatRoughness: theme.clearcoatRoughness ?? 0.1,
        ior: 1.52,
      });
    } else {
      // Standard / Physical Resin, Obsidian, Metal, Wood or Neon
      mat = new THREE.MeshPhysicalMaterial({
        map: texture,
        roughness: theme.roughness,
        metalness: theme.metalness,
        clearcoat: theme.clearcoat ?? 0.6,
        clearcoatRoughness: theme.clearcoatRoughness ?? 0.1,
        emissive: theme.emissive ? new THREE.Color(theme.emissive) : new THREE.Color(0x000000),
        emissiveIntensity: theme.emissiveIntensity ?? 0,
        emissiveMap: theme.emissive ? texture : null,
      });
    }

    mat.name = `DiceMaterial_${key}`;
    this.materials.set(key, mat);
    return mat;
  }

  dispose(): void {
    for (const mat of this.materials.values()) {
      mat.dispose();
    }
    this.materials.clear();
    DiceTextureGenerator.dispose();
  }
}
