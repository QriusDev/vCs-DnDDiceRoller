import { describe, it, expect } from "vitest";
import * as THREE from "three";
import { PolyhedronData } from "@/rendering/geometries/PolyhedronData";
import { DiceGeometryBuilder } from "@/rendering/geometries/DiceGeometryBuilder";
import { DICE_TYPES, DICE_FACE_COUNTS } from "@/types";

describe("PolyhedronData & Mathematical Geometry", () => {
  it("should have correct logical face counts for all six dice", () => {
    for (const type of DICE_TYPES) {
      const raw = PolyhedronData.get(type);
      expect(raw.faces.length).toBe(DICE_FACE_COUNTS[type]);
    }
  });

  it("should have unique, valid face values within expected ranges", () => {
    // D4: 1-4
    const d4 = PolyhedronData.get("d4");
    const d4Vals = d4.faces.map((f) => f.value);
    expect(new Set(d4Vals).size).toBe(4);
    expect(d4Vals.sort((a, b) => a - b)).toEqual([1, 2, 3, 4]);

    // D6: 1-6
    const d6 = PolyhedronData.get("d6");
    const d6Vals = d6.faces.map((f) => f.value);
    expect(new Set(d6Vals).size).toBe(6);
    expect(d6Vals.sort((a, b) => a - b)).toEqual([1, 2, 3, 4, 5, 6]);

    // D8: 1-8
    const d8 = PolyhedronData.get("d8");
    const d8Vals = d8.faces.map((f) => f.value);
    expect(new Set(d8Vals).size).toBe(8);
    expect(d8Vals.sort((a, b) => a - b)).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);

    // D10: 0-9
    const d10 = PolyhedronData.get("d10");
    const d10Vals = d10.faces.map((f) => f.value);
    expect(new Set(d10Vals).size).toBe(10);
    expect(d10Vals.sort((a, b) => a - b)).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);

    // D12: 1-12
    const d12 = PolyhedronData.get("d12");
    const d12Vals = d12.faces.map((f) => f.value);
    expect(new Set(d12Vals).size).toBe(12);
    expect(d12Vals.sort((a, b) => a - b)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);

    // D20: 1-20
    const d20 = PolyhedronData.get("d20");
    const d20Vals = d20.faces.map((f) => f.value);
    expect(new Set(d20Vals).size).toBe(20);
    expect(d20Vals.sort((a, b) => a - b)).toEqual([
      1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20,
    ]);
  });

  it("should have outward-facing unit normals and consistent CCW winding", () => {
    for (const type of DICE_TYPES) {
      const raw = PolyhedronData.get(type);
      for (const face of raw.faces) {
        const v0 = raw.vertices[face.vertexIndices[0]];
        const v1 = raw.vertices[face.vertexIndices[1]];
        const v2 = raw.vertices[face.vertexIndices[2]];

        const edge1 = new THREE.Vector3().subVectors(v1, v0);
        const edge2 = new THREE.Vector3().subVectors(v2, v0);
        const normal = new THREE.Vector3().crossVectors(edge1, edge2).normalize();

        // Normal magnitude should be 1
        expect(normal.length()).toBeCloseTo(1.0, 4);

        // Center of the face
        const center = new THREE.Vector3();
        for (const idx of face.vertexIndices) {
          center.add(raw.vertices[idx]);
        }
        center.divideScalar(face.vertexIndices.length);

        // Outward check: normal dot center > 0
        expect(normal.dot(center)).toBeGreaterThan(0);
      }
    }
  });

  it("should construct a mathematically planar pentagonal trapezohedron for D10", () => {
    const d10 = PolyhedronData.get("d10");
    expect(d10.vertices.length).toBe(12);
    expect(d10.faces.length).toBe(10);

    // Each face must be a 4-vertex planar deltoid (kite)
    for (const face of d10.faces) {
      expect(face.vertexIndices.length).toBe(4);
      const [i0, i1, i2, i3] = face.vertexIndices;
      const p0 = d10.vertices[i0];
      const p1 = d10.vertices[i1];
      const p2 = d10.vertices[i2];
      const p3 = d10.vertices[i3];

      // Volume of tetrahedron formed by 4 vertices: (p1-p0) . ((p2-p0) x (p3-p0)) / 6
      const v1 = new THREE.Vector3().subVectors(p1, p0);
      const v2 = new THREE.Vector3().subVectors(p2, p0);
      const v3 = new THREE.Vector3().subVectors(p3, p0);
      const cross = new THREE.Vector3().crossVectors(v2, v3);
      const volume = Math.abs(v1.dot(cross)) / 6;

      // Planar points yield near-zero volume
      expect(volume).toBeLessThan(1e-4);
    }
  });

  it("should maintain consistent visual scale across all six dice types", () => {
    const radii: number[] = [];
    for (const type of DICE_TYPES) {
      const raw = PolyhedronData.get(type);
      radii.push(raw.nominalRadius);
      // Nominal radius should be reasonably normalized for desktop tabletop tray (between 0.9 and 1.5)
      expect(raw.nominalRadius).toBeGreaterThanOrEqual(0.9);
      expect(raw.nominalRadius).toBeLessThanOrEqual(1.5);
    }

    // Ratio between largest and smallest die radius should be <= 1.4 for visual balance
    const maxRadius = Math.max(...radii);
    const minRadius = Math.min(...radii);
    expect(maxRadius / minRadius).toBeLessThan(1.4);
  });
});

describe("DiceGeometryBuilder & Metadata Generation", () => {
  it("should build valid Sharp geometry and comprehensive metadata for all dice", () => {
    for (const type of DICE_TYPES) {
      const raw = PolyhedronData.get(type);
      const { geometry, metadata } = DiceGeometryBuilder.build(raw, "sharp");

      expect(metadata.dieType).toBe(type);
      expect(metadata.geometryStyle).toBe("sharp");
      expect(metadata.faces.length).toBe(DICE_FACE_COUNTS[type]);
      expect(metadata.hullVertices.length).toBe(raw.vertices.length);
      expect(metadata.hullFaces.length).toBe(raw.faces.length);
      expect(metadata.boundingRadius).toBeGreaterThan(0.5);

      // Check BufferGeometry attributes
      const posAttr = geometry.getAttribute("position");
      const normAttr = geometry.getAttribute("normal");
      const uvAttr = geometry.getAttribute("uv");

      expect(posAttr).toBeDefined();
      expect(normAttr).toBeDefined();
      expect(uvAttr).toBeDefined();
      expect(posAttr.count).toBeGreaterThan(0);
      expect(posAttr.count).toBe(normAttr.count);
      expect(posAttr.count).toBe(uvAttr.count);

      geometry.dispose();
    }
  });

  it("should build valid Rounded geometry with beveled features", () => {
    for (const type of DICE_TYPES) {
      const raw = PolyhedronData.get(type);
      const sharp = DiceGeometryBuilder.build(raw, "sharp");
      const rounded = DiceGeometryBuilder.build(raw, "rounded");

      expect(rounded.metadata.geometryStyle).toBe("rounded");
      // Rounded geometry should contain more vertices than sharp due to edge & corner chamfers
      const sharpVertexCount = sharp.geometry.getAttribute("position").count;
      const roundedVertexCount = rounded.geometry.getAttribute("position").count;
      expect(roundedVertexCount).toBeGreaterThan(sharpVertexCount);

      sharp.geometry.dispose();
      rounded.geometry.dispose();
    }
  });
});
