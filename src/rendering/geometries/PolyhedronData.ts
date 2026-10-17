import * as THREE from "three";
import type { DiceType } from "@/types";

export interface RawFace {
  /** Ordered vertex indices in counter-clockwise winding when viewed from outside */
  vertexIndices: number[];
  /** Face numeric value */
  value: number;
}

export interface RawPolyhedron {
  type: DiceType;
  vertices: THREE.Vector3[];
  faces: RawFace[];
  nominalRadius: number;
}

/**
 * Mathematically constructs the 6 polyhedra for D4, D6, D8, D10, D12, and D20.
 */
export class PolyhedronData {
  /**
   * D4: Regular Tetrahedron (4 triangular faces, values 1–4)
   */
  static createD4(): RawPolyhedron {
    const r = 1.1;
    const a = r / Math.sqrt(3);

    const vertices: THREE.Vector3[] = [
      new THREE.Vector3(a, a, a), // 0
      new THREE.Vector3(a, -a, -a), // 1
      new THREE.Vector3(-a, a, -a), // 2
      new THREE.Vector3(-a, -a, a), // 3
    ];

    // Faces arranged with CCW winding when viewed from outside
    const faces: RawFace[] = [
      { vertexIndices: [1, 2, 3], value: 1 },
      { vertexIndices: [0, 3, 2], value: 2 },
      { vertexIndices: [0, 1, 3], value: 3 },
      { vertexIndices: [0, 2, 1], value: 4 },
    ];

    return { type: "d4", vertices, faces, nominalRadius: r };
  }

  /**
   * D6: Regular Hexahedron / Cube (6 square faces, values 1–6)
   * Opposing faces sum to 7: (1, 6), (2, 5), (3, 4)
   */
  static createD6(): RawPolyhedron {
    const s = 0.75;
    const vertices: THREE.Vector3[] = [
      new THREE.Vector3(-s, -s, -s), // 0: ---
      new THREE.Vector3(s, -s, -s), // 1: +--
      new THREE.Vector3(s, s, -s), // 2: ++-
      new THREE.Vector3(-s, s, -s), // 3: -+-
      new THREE.Vector3(-s, -s, s), // 4: --+
      new THREE.Vector3(s, -s, s), // 5: +-+
      new THREE.Vector3(s, s, s), // 6: +++
      new THREE.Vector3(-s, s, s), // 7: -++
    ];

    // CCW viewed from exterior:
    // Top (+Y): 1, Bottom (-Y): 6
    // Front (+Z): 2, Back (-Z): 5
    // Right (+X): 3, Left (-X): 4
    const faces: RawFace[] = [
      { vertexIndices: [3, 2, 6, 7], value: 1 }, // Top (+Y)
      { vertexIndices: [4, 5, 6, 7], value: 2 }, // Front (+Z)
      { vertexIndices: [1, 2, 6, 5], value: 3 }, // Right (+X)
      { vertexIndices: [0, 4, 7, 3], value: 4 }, // Left (-X)
      { vertexIndices: [0, 3, 2, 1], value: 5 }, // Back (-Z)
      { vertexIndices: [0, 1, 5, 4], value: 6 }, // Bottom (-Y)
    ];

    return { type: "d6", vertices, faces, nominalRadius: s * Math.SQRT2 };
  }

  /**
   * D8: Regular Octahedron (8 triangular faces, values 1–8)
   * Opposing faces sum to 9: (1, 8), (2, 7), (3, 6), (4, 5)
   */
  static createD8(): RawPolyhedron {
    const r = 1.15;
    const vertices: THREE.Vector3[] = [
      new THREE.Vector3(r, 0, 0), // 0: +X
      new THREE.Vector3(-r, 0, 0), // 1: -X
      new THREE.Vector3(0, r, 0), // 2: +Y
      new THREE.Vector3(0, -r, 0), // 3: -Y
      new THREE.Vector3(0, 0, r), // 4: +Z
      new THREE.Vector3(0, 0, -r), // 5: -Z
    ];

    // CCW when viewed from outside:
    const faces: RawFace[] = [
      { vertexIndices: [0, 2, 4], value: 1 }, // (+, +, +)
      { vertexIndices: [4, 2, 1], value: 2 }, // (-, +, +)
      { vertexIndices: [1, 2, 5], value: 3 }, // (-, +, -)
      { vertexIndices: [5, 2, 0], value: 4 }, // (+, +, -)
      { vertexIndices: [0, 4, 3], value: 5 }, // (+, -, +) -> opp of 3
      { vertexIndices: [4, 1, 3], value: 6 }, // (-, -, +) -> opp of 4
      { vertexIndices: [1, 5, 3], value: 7 }, // (-, -, -) -> opp of 1
      { vertexIndices: [5, 0, 3], value: 8 }, // (+, -, -) -> opp of 2
    ];

    return { type: "d8", vertices, faces, nominalRadius: r };
  }

  /**
   * D10: Genuine Pentagonal Trapezohedron (10 deltoid / kite faces, values 0–9)
   * Opposing faces sum to 9: (0, 9), (1, 8), (2, 7), (3, 6), (4, 5)
   *
   * Mathematical construction:
   * 12 vertices:
   * - Top apex A1 = (0, H, 0)
   * - Bottom apex A2 = (0, -H, 0)
   * - Upper ring of 5 vertices U_k at angle k * 72°
   * - Lower ring of 5 vertices L_k at angle (k + 0.5) * 72°
   *
   * Planarity condition for each deltoid:
   * H / h = 5 + 2 * sqrt(5) ≈ 9.472136
   */
  static createD10(): RawPolyhedron {
    const H = 1.35;
    const ratio = 5 + 2 * Math.sqrt(5); // ≈ 9.472135955
    const h = H / ratio; // ≈ 0.142523
    const R = 1.1; // Equatorial ring radius

    const vertices: THREE.Vector3[] = [];

    // Vertex 0: Top apex
    vertices.push(new THREE.Vector3(0, H, 0));
    // Vertex 1: Bottom apex
    vertices.push(new THREE.Vector3(0, -H, 0));

    // Vertices 2..6: Upper ring (k = 0..4)
    const step = (Math.PI * 2) / 5;
    for (let k = 0; k < 5; k++) {
      const angle = k * step;
      vertices.push(new THREE.Vector3(R * Math.cos(angle), h, R * Math.sin(angle)));
    }

    // Vertices 7..11: Lower ring (k = 0..4)
    for (let k = 0; k < 5; k++) {
      const angle = (k + 0.5) * step;
      vertices.push(new THREE.Vector3(R * Math.cos(angle), -h, R * Math.sin(angle)));
    }

    // Indices:
    // A1 = 0
    // A2 = 1
    // U_k = 2 + k
    // L_k = 7 + k
    // Upper 5 kites:
    // Kite k connects A1, U_k, L_k, U_{(k+1)%5}
    // Viewed from outside, CCW winding is: A1 -> U_{(k+1)%5} -> L_k -> U_k
    // Lower 5 kites:
    // Kite k connects A2, L_k, U_{(k+1)%5}, L_{(k+1)%5}
    // Viewed from outside, CCW winding is: A2 -> L_{(k+1)%5} -> U_{(k+1)%5} -> L_k
    const upperValues = [0, 2, 4, 6, 8];
    const lowerValues = [9, 7, 5, 3, 1]; // Positioned so opposite face pairs sum to 9

    const faces: RawFace[] = [];

    // Upper 5 faces
    for (let k = 0; k < 5; k++) {
      const uCur = 2 + k;
      const uNext = 2 + ((k + 1) % 5);
      const lCur = 7 + k;
      faces.push({
        vertexIndices: [0, uNext, lCur, uCur],
        value: upperValues[k],
      });
    }

    // Lower 5 faces
    // Face opposite to upper kite k:
    // Upper kite k center is in direction of angle (k + 0.5) * 72°
    // The opposite direction is angle (k + 0.5 + 2.5) * 72° = (k + 3) * 72°
    // Lower kite index that is opposite is (k + 2) % 5
    for (let k = 0; k < 5; k++) {
      const oppIdx = (k + 2) % 5;
      const lCur = 7 + oppIdx;
      const lNext = 7 + ((oppIdx + 1) % 5);
      const uNext = 2 + ((oppIdx + 1) % 5);
      faces.push({
        vertexIndices: [1, lCur, uNext, lNext],
        value: lowerValues[k], // Pairs with upperValues[k] to sum to 9
      });
    }

    return { type: "d10", vertices, faces, nominalRadius: H };
  }

  /**
   * D12: Regular Dodecahedron (12 regular pentagon faces, values 1–12)
   * Opposing faces sum to 13: (1, 12), (2, 11), (3, 10), etc.
   */
  static createD12(): RawPolyhedron {
    const phi = (1 + Math.sqrt(5)) / 2; // Golden ratio ≈ 1.618034
    const invPhi = 1 / phi; // ≈ 0.618034
    const scale = 0.65;

    // 20 vertices of a regular dodecahedron:
    const rawVerts: THREE.Vector3[] = [
      // 8 vertices of cube (±1, ±1, ±1)
      new THREE.Vector3(-1, -1, -1), // 0
      new THREE.Vector3(1, -1, -1), // 1
      new THREE.Vector3(1, 1, -1), // 2
      new THREE.Vector3(-1, 1, -1), // 3
      new THREE.Vector3(-1, -1, 1), // 4
      new THREE.Vector3(1, -1, 1), // 5
      new THREE.Vector3(1, 1, 1), // 6
      new THREE.Vector3(-1, 1, 1), // 7

      // 4 vertices (0, ±phi, ±1/phi)
      new THREE.Vector3(0, -phi, -invPhi), // 8
      new THREE.Vector3(0, -phi, invPhi), // 9
      new THREE.Vector3(0, phi, -invPhi), // 10
      new THREE.Vector3(0, phi, invPhi), // 11

      // 4 vertices (±1/phi, 0, ±phi)
      new THREE.Vector3(-invPhi, 0, -phi), // 12
      new THREE.Vector3(invPhi, 0, -phi), // 13
      new THREE.Vector3(-invPhi, 0, phi), // 14
      new THREE.Vector3(invPhi, 0, phi), // 15

      // 4 vertices (±phi, ±1/phi, 0)
      new THREE.Vector3(-phi, -invPhi, 0), // 16
      new THREE.Vector3(-phi, invPhi, 0), // 17
      new THREE.Vector3(phi, -invPhi, 0), // 18
      new THREE.Vector3(phi, invPhi, 0), // 19
    ];

    const vertices = rawVerts.map((v) => v.multiplyScalar(scale));

    // 12 regular pentagon faces with CCW outward winding:
    // Pairs: (0, 11), (1, 10), (2, 9), (3, 8), (4, 7), (5, 6)
    const rawFaces = [
      { vertexIndices: [11, 6, 15, 14, 7], value: 1 }, // Top-ish front (+Z)
      { vertexIndices: [11, 7, 17, 3, 10], value: 2 },
      { vertexIndices: [11, 10, 2, 19, 6], value: 3 },
      { vertexIndices: [6, 19, 18, 5, 15], value: 4 },
      { vertexIndices: [15, 5, 9, 4, 14], value: 5 },
      { vertexIndices: [14, 4, 16, 17, 7], value: 6 },

      // Opposing faces (sum to 13)
      { vertexIndices: [8, 0, 16, 4, 9], value: 7 }, // Opp of 6
      { vertexIndices: [8, 9, 5, 18, 1], value: 8 }, // Opp of 5
      { vertexIndices: [13, 1, 18, 19, 2], value: 9 }, // Opp of 4
      { vertexIndices: [12, 13, 2, 10, 3], value: 10 }, // Opp of 3
      { vertexIndices: [12, 3, 17, 16, 0], value: 11 }, // Opp of 2
      { vertexIndices: [8, 1, 13, 12, 0], value: 12 }, // Opp of 1
    ];

    return { type: "d12", vertices, faces: rawFaces, nominalRadius: scale * Math.sqrt(3) };
  }

  /**
   * D20: Regular Icosahedron (20 equilateral triangle faces, values 1–20)
   * Opposing faces sum to 21: (1, 20), (2, 19), (3, 18), etc.
   */
  static createD20(): RawPolyhedron {
    const phi = (1 + Math.sqrt(5)) / 2;
    const scale = 0.58;

    // 12 vertices of an icosahedron:
    const rawVerts: THREE.Vector3[] = [
      new THREE.Vector3(-1, phi, 0), // 0
      new THREE.Vector3(1, phi, 0), // 1
      new THREE.Vector3(-1, -phi, 0), // 2
      new THREE.Vector3(1, -phi, 0), // 3

      new THREE.Vector3(0, -1, phi), // 4
      new THREE.Vector3(0, 1, phi), // 5
      new THREE.Vector3(0, -1, -phi), // 6
      new THREE.Vector3(0, 1, -phi), // 7

      new THREE.Vector3(phi, 0, -1), // 8
      new THREE.Vector3(phi, 0, 1), // 9
      new THREE.Vector3(-phi, 0, -1), // 10
      new THREE.Vector3(-phi, 0, 1), // 11
    ];

    const vertices = rawVerts.map((v) => v.multiplyScalar(scale));

    // 20 triangular faces (CCW outward winding):
    // Standard D20 arrangement where opposing faces sum to 21
    const rawFaces = [
      { vertexIndices: [0, 11, 5], value: 20 },
      { vertexIndices: [0, 5, 1], value: 2 },
      { vertexIndices: [0, 1, 7], value: 8 },
      { vertexIndices: [0, 7, 10], value: 14 },
      { vertexIndices: [0, 10, 11], value: 12 },

      { vertexIndices: [1, 5, 9], value: 10 },
      { vertexIndices: [5, 11, 4], value: 6 },
      { vertexIndices: [11, 10, 2], value: 16 },
      { vertexIndices: [10, 7, 6], value: 4 },
      { vertexIndices: [7, 1, 8], value: 18 },

      { vertexIndices: [3, 9, 4], value: 15 },
      { vertexIndices: [3, 4, 2], value: 5 },
      { vertexIndices: [3, 2, 6], value: 17 },
      { vertexIndices: [3, 6, 8], value: 3 },
      { vertexIndices: [3, 8, 9], value: 11 },

      { vertexIndices: [4, 9, 5], value: 19 }, // Opp of 2
      { vertexIndices: [2, 4, 11], value: 13 }, // Opp of 8
      { vertexIndices: [6, 2, 10], value: 7 }, // Opp of 14
      { vertexIndices: [8, 6, 7], value: 9 }, // Opp of 12
      { vertexIndices: [9, 8, 1], value: 1 }, // Opp of 20
    ];

    return {
      type: "d20",
      vertices,
      faces: rawFaces,
      nominalRadius: scale * Math.sqrt(1 + phi * phi),
    };
  }

  private static ensureCCWWinding(poly: RawPolyhedron): RawPolyhedron {
    for (const face of poly.faces) {
      const v0 = poly.vertices[face.vertexIndices[0]];
      const v1 = poly.vertices[face.vertexIndices[1]];
      const v2 = poly.vertices[face.vertexIndices[2]];

      const edge1 = new THREE.Vector3().subVectors(v1, v0);
      const edge2 = new THREE.Vector3().subVectors(v2, v0);
      const normal = new THREE.Vector3().crossVectors(edge1, edge2);

      const center = new THREE.Vector3();
      for (const idx of face.vertexIndices) {
        center.add(poly.vertices[idx]);
      }
      center.divideScalar(face.vertexIndices.length);

      if (normal.dot(center) < 0) {
        face.vertexIndices.reverse();
      }
    }
    return poly;
  }

  /**
   * Helper to retrieve raw polyhedron by type
   */
  static get(type: DiceType): RawPolyhedron {
    let poly: RawPolyhedron;
    switch (type) {
      case "d4":
        poly = this.createD4();
        break;
      case "d6":
        poly = this.createD6();
        break;
      case "d8":
        poly = this.createD8();
        break;
      case "d10":
        poly = this.createD10();
        break;
      case "d12":
        poly = this.createD12();
        break;
      case "d20":
        poly = this.createD20();
        break;
    }
    return this.ensureCCWWinding(poly);
  }
}
