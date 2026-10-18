import { describe, it, expect, beforeEach, afterEach } from "vitest";
import * as THREE from "three";
import { DiceTextureGenerator } from "@/rendering/textures/DiceTextureGenerator";
import { DiceMaterialManager } from "@/rendering/materials/DiceMaterialManager";
import { DieMesh } from "@/rendering/geometries/DieMesh";
import { DICE_THEME_IDS, DICE_TYPES } from "@/types";

describe("DiceTextureGenerator & Themes", () => {
  afterEach(() => {
    DiceTextureGenerator.dispose();
  });

  it("should calculate correct atlas layouts for all dice types", () => {
    for (const type of DICE_TYPES) {
      const layout = DiceTextureGenerator.getAtlasLayout(type);
      expect(layout.cols).toBeGreaterThanOrEqual(2);
      expect(layout.rows).toBeGreaterThanOrEqual(2);
      expect(layout.atlasWidth).toBeGreaterThan(0);
      expect(layout.atlasHeight).toBeGreaterThan(0);
    }
  });

  it("should generate and cache textures for all themes", () => {
    for (const themeId of DICE_THEME_IDS) {
      const tex = DiceTextureGenerator.generateAtlas("d20", [1, 2, 3], themeId);
      expect(tex).toBeDefined();
      expect(tex).toBeInstanceOf(THREE.CanvasTexture);

      // Cached lookup returns same instance
      const cached = DiceTextureGenerator.generateAtlas("d20", [1, 2, 3], themeId);
      expect(cached).toBe(tex);
    }
  });
});

describe("DiceMaterialManager", () => {
  let matManager: DiceMaterialManager;

  beforeEach(() => {
    matManager = new DiceMaterialManager();
  });

  afterEach(() => {
    matManager.dispose();
  });

  it("should create materials for all 6 themes", () => {
    for (const themeId of DICE_THEME_IDS) {
      const mat = matManager.getMaterial("d6", [1, 2, 3, 4, 5, 6], themeId);
      expect(mat).toBeDefined();
      expect(mat).toBeInstanceOf(THREE.Material);
    }
  });

  it("should support custom body and number color overrides", () => {
    const customMat = matManager.getMaterial(
      "d20",
      [1, 2, 3],
      "classic-ivory",
      "#123456",
      "#abcdef"
    );
    expect(customMat).toBeDefined();
  });
});

describe("DieMesh Component", () => {
  let matManager: DiceMaterialManager;

  beforeEach(() => {
    matManager = new DiceMaterialManager();
  });

  afterEach(() => {
    matManager.dispose();
  });

  it("should instantiate a DieMesh and expose complete metadata", () => {
    const die = new DieMesh(
      {
        type: "d20",
        geometryStyle: "sharp",
        theme: "obsidian-gold",
      },
      matManager
    );

    const meta = die.getMetadata();
    expect(meta.dieType).toBe("d20");
    expect(meta.faces.length).toBe(20);

    const face20 = die.getFaceByValue(20);
    expect(face20).toBeDefined();
    expect(face20?.value).toBe(20);

    die.dispose();
  });

  it("should detect the upward face according to rotation", () => {
    const die = new DieMesh(
      {
        type: "d6",
        geometryStyle: "sharp",
        theme: "classic-ivory",
      },
      matManager
    );

    // Initial unrotated D6: top face is value 1 pointing in +Y
    const topFace = die.getUpwardFace(new THREE.Vector3(0, 1, 0));
    expect(topFace.value).toBe(1);

    // Rotate 180 degrees around X axis so bottom face (value 6) is on top
    die.rotation.x = Math.PI;
    die.updateMatrixWorld(true);

    const rotatedTopFace = die.getUpwardFace(new THREE.Vector3(0, 1, 0));
    expect(rotatedTopFace.value).toBe(6);

    die.dispose();
  });

  it("should switch geometry style cleanly without throwing", () => {
    const die = new DieMesh(
      {
        type: "d8",
        geometryStyle: "sharp",
        theme: "walnut-wood",
      },
      matManager
    );

    expect(die.getMetadata().geometryStyle).toBe("sharp");
    die.setGeometryStyle("rounded");
    expect(die.getMetadata().geometryStyle).toBe("rounded");

    die.dispose();
  });
});
