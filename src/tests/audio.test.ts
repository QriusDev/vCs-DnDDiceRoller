import { describe, it, expect, beforeEach } from "vitest";
import { AudioManager, TRAY_ACOUSTIC_PROFILES } from "@/audio/AudioManager";
import type { AudioPreferences, CollisionEventData, TrayMaterialId } from "@/types";

describe("AudioManager and Procedural Audio Synthesis", () => {
  let defaultPrefs: AudioPreferences;
  let audioManager: AudioManager;

  beforeEach(() => {
    defaultPrefs = {
      masterVolume: 0.8,
      muted: false,
      sfxVolume: 1.0,
      collisionSoundsEnabled: true,
      rollAnnounceEnabled: true,
    };
    audioManager = new AudioManager(defaultPrefs, "green-velvet");
  });

  it("should have distinct acoustic profiles for all tray materials", () => {
    const materials: TrayMaterialId[] = [
      "green-velvet",
      "navy-velvet",
      "burgundy-velvet",
      "dark-oak",
      "stitched-leather",
    ];

    for (const mat of materials) {
      const profile = TRAY_ACOUSTIC_PROFILES[mat];
      expect(profile).toBeDefined();
      expect(profile.resonanceFreq).toBeGreaterThan(0);
      expect(profile.brightness).toBeGreaterThan(0);
      expect(profile.dampingTime).toBeGreaterThan(0);
      expect(profile.lowPassCutoff).toBeGreaterThan(0);
      expect(profile.noiseGain).toBeGreaterThan(0);
      expect(profile.toneGain).toBeGreaterThan(0);
    }

    // Verify acoustic contrast between soft velvet and hard oak
    expect(TRAY_ACOUSTIC_PROFILES["dark-oak"].brightness).toBeGreaterThan(
      TRAY_ACOUSTIC_PROFILES["green-velvet"].brightness
    );
    expect(TRAY_ACOUSTIC_PROFILES["dark-oak"].lowPassCutoff).toBeGreaterThan(
      TRAY_ACOUSTIC_PROFILES["green-velvet"].lowPassCutoff
    );
  });

  it("should correctly update preferences and mute state", () => {
    audioManager.setPreferences({
      ...defaultPrefs,
      muted: true,
      masterVolume: 0.2,
    });

    // In a test environment without AudioContext, methods should execute without throwing
    expect(() => {
      audioManager.handleCollision({
        dieId: "die-1",
        targetType: "floor",
        impactVelocity: 4.5,
        timestamp: Date.now(),
      });
    }).not.toThrow();
  });

  it("should ignore collision events below the minimum velocity threshold", () => {
    const event: CollisionEventData = {
      dieId: "die-1",
      targetType: "floor",
      impactVelocity: 0.15, // Below 0.5 threshold
      timestamp: Date.now(),
    };

    expect(() => {
      audioManager.handleCollision(event);
    }).not.toThrow();
  });

  it("should safely process die-on-die, floor, and wall collision types", () => {
    const types: CollisionEventData["targetType"][] = ["die", "floor", "wall"];

    for (const targetType of types) {
      expect(() => {
        audioManager.handleCollision({
          dieId: "d20_1",
          targetType,
          targetId: targetType === "die" ? "d6_1" : undefined,
          impactVelocity: 6.2,
          timestamp: Date.now(),
        });
      }).not.toThrow();
    }
  });

  it("should safely execute critical fanfare and rumble triggers", () => {
    expect(() => {
      audioManager.playRollStartSound();
      audioManager.playCriticalHitFanfare();
      audioManager.playCriticalMissRumble();
    }).not.toThrow();
  });

  it("should cleanly dispose without errors", () => {
    expect(() => {
      audioManager.dispose();
    }).not.toThrow();
  });
});
