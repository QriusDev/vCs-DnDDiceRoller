import * as THREE from "three";
import type { DiceGeometryStyle, DieFaceMetadata, DieGeometryMetadata, Point3D } from "@/types";
import type { RawFace, RawPolyhedron } from "./PolyhedronData";
import { DiceTextureGenerator } from "../textures/DiceTextureGenerator";

export interface BuiltGeometryResult {
  geometry: THREE.BufferGeometry;
  metadata: DieGeometryMetadata;
}

interface FaceCalcData {
  faceIdx: number;
  value: number;
  rawFace: RawFace;
  verts: THREE.Vector3[];
  center: THREE.Vector3;
  normal: THREE.Vector3;
  tangent: THREE.Vector3;
  bitangent: THREE.Vector3;
  radius: number;
  insetVerts?: THREE.Vector3[];
}

interface InsetFaceCalcData extends FaceCalcData {
  insetVerts: THREE.Vector3[];
}

export class DiceGeometryBuilder {
  /**
   * Builds either a Sharp or Rounded BufferGeometry with complete metadata
   */
  static build(raw: RawPolyhedron, style: DiceGeometryStyle = "sharp"): BuiltGeometryResult {
    const layout = DiceTextureGenerator.getAtlasLayout(raw.type);

    // 1. Calculate face metadata (centers, normals, local frames)
    const faceData: FaceCalcData[] = raw.faces.map((f, faceIdx) => {
      const faceVerts = f.vertexIndices.map((idx) => raw.vertices[idx].clone());
      const center = new THREE.Vector3();
      for (const v of faceVerts) center.add(v);
      center.divideScalar(faceVerts.length);

      // Normal from first 3 vertices (CCW winding)
      const v0 = faceVerts[0];
      const v1 = faceVerts[1];
      const v2 = faceVerts[2];
      const edge1 = new THREE.Vector3().subVectors(v1, v0);
      const edge2 = new THREE.Vector3().subVectors(v2, v0);
      const normal = new THREE.Vector3().crossVectors(edge1, edge2).normalize();

      // Ensure normal points outward from origin
      if (normal.dot(center) < 0) {
        normal.negate();
      }

      // Local tangent frame for UV mapping
      let refUp = new THREE.Vector3(0, 1, 0);
      if (Math.abs(normal.dot(refUp)) > 0.9) {
        refUp = new THREE.Vector3(0, 0, 1);
      }
      const tangent = new THREE.Vector3()
        .subVectors(refUp, normal.clone().multiplyScalar(normal.dot(refUp)))
        .normalize();
      const bitangent = new THREE.Vector3().crossVectors(normal, tangent).normalize();

      // Face radius (max distance from center to vertex)
      let maxDist = 0.001;
      for (const v of faceVerts) {
        const d = v.distanceTo(center);
        if (d > maxDist) maxDist = d;
      }

      return {
        faceIdx,
        value: f.value,
        rawFace: f,
        verts: faceVerts,
        center,
        normal,
        tangent,
        bitangent,
        radius: maxDist,
      };
    });

    // 2. Build metadata for Phase 3 physics and face reading
    const facesMeta: DieFaceMetadata[] = faceData.map((fd) => ({
      faceIndex: fd.faceIdx,
      value: fd.value,
      normal: { x: fd.normal.x, y: fd.normal.y, z: fd.normal.z },
      center: { x: fd.center.x, y: fd.center.y, z: fd.center.z },
      vertices: fd.verts.map((v) => ({ x: v.x, y: v.y, z: v.z })),
    }));

    const bbox = new THREE.Box3();
    let maxDistFromOrigin = 0;
    for (const v of raw.vertices) {
      bbox.expandByPoint(v);
      const d = v.length();
      if (d > maxDistFromOrigin) maxDistFromOrigin = d;
    }

    const hullVertices: Point3D[] = raw.vertices.map((v) => ({ x: v.x, y: v.y, z: v.z }));
    const hullFaces: number[][] = raw.faces.map((f) => [...f.vertexIndices]);

    const metadata: DieGeometryMetadata = {
      dieType: raw.type,
      geometryStyle: style,
      faces: facesMeta,
      boundingRadius: maxDistFromOrigin,
      boundingBox: {
        min: { x: bbox.min.x, y: bbox.min.y, z: bbox.min.z },
        max: { x: bbox.max.x, y: bbox.max.y, z: bbox.max.z },
      },
      hullVertices,
      hullFaces,
    };

    // 3. Construct BufferGeometry
    const positions: number[] = [];
    const normals: number[] = [];
    const uvs: number[] = [];

    // Helper to calculate UV inside atlas
    const computeUV = (
      p: THREE.Vector3,
      fd: (typeof faceData)[0],
      marginScale = 1.0
    ): [number, number] => {
      const rel = new THREE.Vector3().subVectors(p, fd.center);
      const xLocal = rel.dot(fd.bitangent);
      const yLocal = rel.dot(fd.tangent);

      const col = fd.faceIdx % layout.cols;
      const row = Math.floor(fd.faceIdx / layout.cols);

      const uCenter = (col + 0.5) / layout.cols;
      const vCenter = 1.0 - (row + 0.5) / layout.rows;

      const scaleU = (0.42 * marginScale) / (fd.radius * layout.cols);
      const scaleV = (0.42 * marginScale) / (fd.radius * layout.rows);

      return [uCenter + xLocal * scaleU, vCenter + yLocal * scaleV];
    };

    if (style === "sharp") {
      // Build flat polygon faces
      for (const fd of faceData) {
        const n = fd.verts.length;
        // Triangulate face fan from vertex 0: (0, 1, 2), (0, 2, 3), ...
        for (let i = 1; i < n - 1; i++) {
          const tri = [fd.verts[0], fd.verts[i], fd.verts[i + 1]];
          for (const pt of tri) {
            positions.push(pt.x, pt.y, pt.z);
            normals.push(fd.normal.x, fd.normal.y, fd.normal.z);
            const [u, v] = computeUV(pt, fd);
            uvs.push(u, v);
          }
        }
      }
    } else {
      // Style B: Rounded / Soft Edge with genuine chamfered geometry
      const bevelRatio = 0.14; // Inset flat face by 14% toward center

      // Create inset vertices for each face
      const insetFaces = faceData.map((fd) => {
        const insetVerts = fd.verts.map((v) => {
          return new THREE.Vector3().lerpVectors(v, fd.center, bevelRatio);
        });
        return { ...fd, insetVerts };
      });

      // 1. Add inset flat faces
      for (const ifd of insetFaces) {
        const n = ifd.insetVerts.length;
        for (let i = 1; i < n - 1; i++) {
          const tri = [ifd.insetVerts[0], ifd.insetVerts[i], ifd.insetVerts[i + 1]];
          for (const pt of tri) {
            positions.push(pt.x, pt.y, pt.z);
            normals.push(ifd.normal.x, ifd.normal.y, ifd.normal.z);
            const [u, v] = computeUV(pt, ifd, 1.0);
            uvs.push(u, v);
          }
        }
      }

      // 2. Add beveled edge quads between adjacent faces
      this.buildEdgeBevels(raw, insetFaces, positions, normals, uvs, computeUV);

      // 3. Add beveled corner fans at original polyhedron vertices
      this.buildCornerBevels(raw, insetFaces, positions, normals, uvs, computeUV);
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute("normal", new THREE.Float32BufferAttribute(normals, 3));
    geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));

    return { geometry, metadata };
  }

  private static buildEdgeBevels(
    raw: RawPolyhedron,
    insetFaces: InsetFaceCalcData[],
    positions: number[],
    normals: number[],
    uvs: number[],
    computeUV: (p: THREE.Vector3, fd: FaceCalcData, marginScale?: number) => [number, number]
  ): void {
    // Map of unique undirected edge -> faces sharing that edge
    const edgeMap = new Map<
      string,
      Array<{ faceIdx: number; vStartIdx: number; vEndIdx: number }>
    >();

    raw.faces.forEach((f, fIdx) => {
      const len = f.vertexIndices.length;
      for (let i = 0; i < len; i++) {
        const vA = f.vertexIndices[i];
        const vB = f.vertexIndices[(i + 1) % len];
        const edgeKey = vA < vB ? `${vA}_${vB}` : `${vB}_${vA}`;

        if (!edgeMap.has(edgeKey)) {
          edgeMap.set(edgeKey, []);
        }
        edgeMap.get(edgeKey)!.push({ faceIdx: fIdx, vStartIdx: i, vEndIdx: (i + 1) % len });
      }
    });

    for (const edgeEntries of edgeMap.values()) {
      if (edgeEntries.length === 2) {
        const [e1, e2] = edgeEntries;
        const f1 = insetFaces[e1.faceIdx];
        const f2 = insetFaces[e2.faceIdx];

        const p1A = f1.insetVerts[e1.vStartIdx];
        const p1B = f1.insetVerts[e1.vEndIdx];

        const p2A = f2.insetVerts[e2.vStartIdx];
        const p2B = f2.insetVerts[e2.vEndIdx];

        // Ensure alignment between edge directions
        const p2Start = p1A.distanceTo(p2A) < p1A.distanceTo(p2B) ? p2A : p2B;
        const p2End = p2Start === p2A ? p2B : p2A;

        // Quad consisting of 2 triangles: (p1A, p1B, p2End) and (p1A, p2End, p2Start)
        const quad = [
          { pos: p1A, norm: f1.normal, fd: f1 },
          { pos: p1B, norm: f1.normal, fd: f1 },
          { pos: p2End, norm: f2.normal, fd: f2 },

          { pos: p1A, norm: f1.normal, fd: f1 },
          { pos: p2End, norm: f2.normal, fd: f2 },
          { pos: p2Start, norm: f2.normal, fd: f2 },
        ];

        for (const vert of quad) {
          positions.push(vert.pos.x, vert.pos.y, vert.pos.z);
          normals.push(vert.norm.x, vert.norm.y, vert.norm.z);
          // Place edge UVs slightly outside the active face cell to sample body texture
          const [u, v] = computeUV(vert.pos, vert.fd, 0.9);
          uvs.push(u, v);
        }
      }
    }
  }

  private static buildCornerBevels(
    raw: RawPolyhedron,
    insetFaces: InsetFaceCalcData[],
    positions: number[],
    normals: number[],
    uvs: number[],
    computeUV: (p: THREE.Vector3, fd: FaceCalcData, marginScale?: number) => [number, number]
  ): void {
    // For each original vertex in the polyhedron, find all faces that meet here
    raw.vertices.forEach((origVert, vertIdx) => {
      const meetingCorners: Array<{
        pos: THREE.Vector3;
        normal: THREE.Vector3;
        fd: InsetFaceCalcData;
      }> = [];

      insetFaces.forEach((ifd) => {
        const cornerIdx = ifd.rawFace.vertexIndices.indexOf(vertIdx);
        if (cornerIdx !== -1) {
          meetingCorners.push({
            pos: ifd.insetVerts[cornerIdx],
            normal: ifd.normal,
            fd: ifd,
          });
        }
      });

      if (meetingCorners.length >= 3) {
        // Average normal for corner vertex
        const cornerNormal = new THREE.Vector3();
        for (const mc of meetingCorners) cornerNormal.add(mc.normal);
        cornerNormal.normalize();

        // Sort meeting corners in angular order around cornerNormal
        const refVec = new THREE.Vector3().subVectors(meetingCorners[0].pos, origVert).normalize();
        const binorm = new THREE.Vector3().crossVectors(cornerNormal, refVec).normalize();

        meetingCorners.sort((a, b) => {
          const va = new THREE.Vector3().subVectors(a.pos, origVert);
          const vb = new THREE.Vector3().subVectors(b.pos, origVert);
          const angleA = Math.atan2(va.dot(binorm), va.dot(refVec));
          const angleB = Math.atan2(vb.dot(binorm), vb.dot(refVec));
          return angleA - angleB;
        });

        // Fan triangles from meetingCorners[0]
        for (let i = 1; i < meetingCorners.length - 1; i++) {
          const tri = [meetingCorners[0], meetingCorners[i], meetingCorners[i + 1]];
          for (const item of tri) {
            positions.push(item.pos.x, item.pos.y, item.pos.z);
            normals.push(cornerNormal.x, cornerNormal.y, cornerNormal.z);
            const [u, v] = computeUV(item.pos, item.fd, 0.85);
            uvs.push(u, v);
          }
        }
      }
    });
  }
}
