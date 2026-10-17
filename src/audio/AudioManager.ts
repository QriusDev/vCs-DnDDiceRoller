import type { AudioPreferences } from "@/types";

export interface IAudioManager {
  setPreferences(prefs: AudioPreferences): void;
  playCollisionSound(impactVelocity: number): void;
  playRollStartSound(): void;
  dispose(): void;
}

export class AudioManager implements IAudioManager {
  private preferences: AudioPreferences;
  private audioCtx: AudioContext | null = null;

  constructor(preferences: AudioPreferences) {
    this.preferences = preferences;
  }

  setPreferences(prefs: AudioPreferences): void {
    this.preferences = prefs;
  }

  playCollisionSound(_impactVelocity: number): void {
    if (!this.preferences.collisionSoundsEnabled) return;
    // Procedural sound synthesis will be implemented in Phase 4
  }

  playRollStartSound(): void {
    if (!this.preferences.collisionSoundsEnabled) return;
    // Sound synthesis placeholder for Phase 4
  }

  dispose(): void {
    if (this.audioCtx && this.audioCtx.state !== "closed") {
      this.audioCtx.close().catch(() => {});
      this.audioCtx = null;
    }
  }
}
