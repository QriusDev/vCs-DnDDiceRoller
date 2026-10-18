import * as THREE from "three";
import type { DieFaceMetadata, DieGeometryMetadata } from "@/types";

export interface FaceDetectionResult {
  faceIndex: number;
  faceValue: number;
  gameValue: number; // Mapped game value (e.g. 0 -> 10 for D10)
  normalWorld: THREE.Vector3;
  dotProduct: number;
  isAmbiguous: boolean; // True if top 2 face dot products are too close (e.g. tilted/wedged)
}

export class FaceDetector {
  /**
   * Minimum dot product with worldUp to consider a face unambiguously facing up.
   * Cosine of ~40° is ~0.76. If highest dot is below 0.35, die is likely on an edge or rolling.
   */
  private static readonly AMBIGUITY_THRESHOLD_DIFF = 0.08;

  /**
   * Calculates the upward face given the die's metadata and its world rotation.
   *
   * Convention details:
   * - D4: A regular tetrahedron resting on the floor has 1 face down and 1 vertex up!
   *   In PolyhedronData:
   *   Face 1 [1, 2, 3] is opposite vertex 0 [a, a, a]
   *   Face 2 [0, 3, 2] is opposite vertex 1 [a, -a, -a]
   *   Face 3 [0, 1, 3] is opposite vertex 2 [-a, a, -a]
   *   Face 4 [0, 2, 1] is opposite vertex 3 [-a, -a, a]
   *   Standard top-reading D4 numbers the vertex pointing up. When face i is on the floor (pointing down),
   *   the apex pointing straight up is the opposite vertex!
   *   In our geometry, each face corresponds to the number read at the top apex when that face is resting DOWN,
   *   OR in face-normal reading mode, the face facing up has normal dot worldUp > 0.
   *   Let's support both reading conventions cleanly:
   *   For standard polyhedral dice (D6, D8, D10, D12, D20): the face whose outward normal is closest to +Y (0, 1, 0) is the result.
   *   For D4: Face normal closest to +Y (0, 1, 0) or base face resting on floor.
   *   In PolyhedronData, Face 4 [0, 2, 1] has outward normal (+, +, -).
   *   When a face normal is closest to (0, 1, 0), that face is the upward-most face.
   */
  static detectUpwardFace(
    metadata: DieGeometryMetadata,
    quaternion: THREE.Quaternion,
    worldUp = new THREE.Vector3(0, 1, 0)
  ): FaceDetectionResult {
    let bestFace: DieFaceMetadata = metadata.faces[0];
    let secondBestFace: DieFaceMetadata | null = null;
    let highestDot = -Infinity;
    let secondHighestDot = -Infinity;
    const bestWorldNormal = new THREE.Vector3();

    const tempNormal = new THREE.Vector3();

    for (const face of metadata.faces) {
      tempNormal.set(face.normal.x, face.normal.y, face.normal.z);
      tempNormal.applyQuaternion(quaternion).normalize();

      const dot = tempNormal.dot(worldUp);

      if (dot > highestDot) {
        secondHighestDot = highestDot;
        secondBestFace = bestFace;
        highestDot = dot;
        bestFace = face;
        bestWorldNormal.copy(tempNormal);
      } else if (dot > secondHighestDot) {
        secondHighestDot = dot;
        secondBestFace = face;
      }
    }

    // Check for ambiguity (e.g. cocked die or edge balance)
    const isAmbiguous =
      secondBestFace !== null &&
      highestDot - secondHighestDot < this.AMBIGUITY_THRESHOLD_DIFF &&
      highestDot < 0.6;

    // Game value mapping: D10 has faces 0-9, where 0 represents 10 in standard D&D
    let gameValue = bestFace.value;
    if (metadata.dieType === "d10" && gameValue === 0) {
      gameValue = 10;
    }

    return {
      faceIndex: bestFace.faceIndex,
      faceValue: bestFace.value,
      gameValue,
      normalWorld: bestWorldNormal,
      dotProduct: highestDot,
      isAmbiguous,
    };
  }

  /**
   * Calculates the exact quaternion needed to make a specific face point directly towards targetDirection (default: +Y).
   */
  static getRotationForFaceUp(
    metadata: DieGeometryMetadata,
    targetValue: number,
    targetDirection = new THREE.Vector3(0, 1, 0),
    randomYRotation = 0
  ): THREE.Quaternion {
    const face = metadata.faces.find((f) => f.value === targetValue);
    if (!face) {
      return new THREE.Quaternion();
    }

    const localNormal = new THREE.Vector3(face.normal.x, face.normal.y, face.normal.z).normalize();
    const targetDirNorm = targetDirection.clone().normalize();

    // Step 1: Quaternion that maps localNormal to targetDirNorm
    const qBase = new THREE.Quaternion().setFromUnitVectors(localNormal, targetDirNorm);

    // Step 2: Allow arbitrary rotation around the target direction (Y axis) so it looks natural
    if (randomYRotation !== 0) {
      const qSpin = new THREE.Quaternion().setFromAxisAngle(targetDirNorm, randomYRotation);
      qSpin.multiply(qBase);
      return qSpin;
    }

    return qBase;
  }
}
