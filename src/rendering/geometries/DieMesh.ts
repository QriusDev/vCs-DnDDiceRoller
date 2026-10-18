import * as THREE from "three";
import type {
  DiceGeometryStyle,
  DiceThemeId,
  DiceType,
  DiceVisualRequest,
  DieFaceMetadata,
  DieGeometryMetadata,
} from "@/types";
import { PolyhedronData, type RawPolyhedron } from "./PolyhedronData";
import { DiceGeometryBuilder, type BuiltGeometryResult } from "./DiceGeometryBuilder";
import { DiceMaterialManager } from "../materials/DiceMaterialManager";

export class DieMesh extends THREE.Group {
  readonly dieType: DiceType;
  private currentStyle: DiceGeometryStyle;
  private currentTheme: DiceThemeId;
  private customBodyColor?: string;
  private customNumberColor?: string;

  private readonly raw: RawPolyhedron;
  private readonly materialManager: DiceMaterialManager;
  private readonly mesh: THREE.Mesh;

  private metadata!: DieGeometryMetadata;

  constructor(request: DiceVisualRequest, materialManager: DiceMaterialManager) {
    super();
    this.name = `Die_${request.type}_${Date.now()}`;
    this.dieType = request.type;
    this.currentStyle = request.geometryStyle;
    this.currentTheme = request.theme;
    this.customBodyColor = request.customBodyColor;
    this.customNumberColor = request.customNumberColor;

    this.raw = PolyhedronData.get(request.type);
    this.materialManager = materialManager;

    // Build initial geometry and metadata
    const { geometry, metadata } = DiceGeometryBuilder.build(this.raw, this.currentStyle);
    this.metadata = metadata;

    const faceValues = this.raw.faces.map((f) => f.value);
    const material = this.materialManager.getMaterial(
      this.dieType,
      faceValues,
      this.currentTheme,
      this.customBodyColor,
      this.customNumberColor
    );

    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.castShadow = true;
    this.mesh.receiveShadow = true;
    this.add(this.mesh);
  }

  getMetadata(): DieGeometryMetadata {
    return this.metadata;
  }

  getFaceByValue(value: number): DieFaceMetadata | undefined {
    return this.metadata.faces.find((f) => f.value === value);
  }

  /**
   * Determines which face is currently pointing upwards in world coordinates
   */
  getUpwardFace(worldUp = new THREE.Vector3(0, 1, 0)): DieFaceMetadata {
    this.updateWorldMatrix(true, false);

    let highestDot = -Infinity;
    let topFace: DieFaceMetadata = this.metadata.faces[0];

    const normalWorld = new THREE.Vector3();
    const normalMatrix = new THREE.Matrix3().getNormalMatrix(this.mesh.matrixWorld);

    for (const face of this.metadata.faces) {
      normalWorld.set(face.normal.x, face.normal.y, face.normal.z);
      normalWorld.applyMatrix3(normalMatrix).normalize();

      const dot = normalWorld.dot(worldUp);
      if (dot > highestDot) {
        highestDot = dot;
        topFace = face;
      }
    }

    return topFace;
  }

  setGeometryStyle(style: DiceGeometryStyle): void {
    if (this.currentStyle === style) return;
    this.currentStyle = style;

    // Dispose previous geometry
    this.mesh.geometry.dispose();

    const { geometry, metadata }: BuiltGeometryResult = DiceGeometryBuilder.build(
      this.raw,
      this.currentStyle
    );
    this.metadata = metadata;
    this.mesh.geometry = geometry;
  }

  setTheme(themeId: DiceThemeId, customBodyColor?: string, customNumberColor?: string): void {
    this.currentTheme = themeId;
    this.customBodyColor = customBodyColor;
    this.customNumberColor = customNumberColor;

    const faceValues = this.raw.faces.map((f) => f.value);
    const material = this.materialManager.getMaterial(
      this.dieType,
      faceValues,
      this.currentTheme,
      this.customBodyColor,
      this.customNumberColor
    );
    this.mesh.material = material;
  }

  override dispose(): void {
    this.mesh.geometry.dispose();
  }
}
