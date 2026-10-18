import { describe, it, expect, beforeEach } from "vitest";
import { AppState } from "@/core/state/AppState";
import { InMemoryStorageProvider, StorageService } from "@/core/state/persistence";

describe("AppState and Persistence", () => {
  let inMemoryProvider: InMemoryStorageProvider;
  let storage: StorageService;
  let appState: AppState;

  beforeEach(() => {
    inMemoryProvider = new InMemoryStorageProvider();
    storage = new StorageService(inMemoryProvider);
    appState = new AppState(storage);
  });

  it("should initialize with empty dice pool", () => {
    const pool = appState.getDicePoolState();
    expect(pool.dice).toHaveLength(0);
    expect(pool.counts.d20).toBe(0);
  });

  it("should correctly add dice and calculate counts", () => {
    appState.addDieToPool("d20");
    appState.addDieToPool("d20");
    appState.addDieToPool("d6");

    const pool = appState.getDicePoolState();
    expect(pool.dice).toHaveLength(3);
    expect(pool.counts.d20).toBe(2);
    expect(pool.counts.d6).toBe(1);
    expect(pool.counts.d4).toBe(0);
  });

  it("should remove the last added die of specified type", () => {
    appState.addDieToPool("d8");
    appState.addDieToPool("d6");
    appState.addDieToPool("d8");

    const removed = appState.removeLastDieFromPool("d8");
    expect(removed).toBe(true);

    const pool = appState.getDicePoolState();
    expect(pool.counts.d8).toBe(1);
    expect(pool.counts.d6).toBe(1);

    const nonExistent = appState.removeLastDieFromPool("d12");
    expect(nonExistent).toBe(false);
  });

  it("should remove die by unique ID without affecting other dice of same type", () => {
    const d1 = appState.addDieToPool("d10");
    const d2 = appState.addDieToPool("d10");

    expect(appState.getDicePoolState().dice).toHaveLength(2);
    const removed = appState.removeDieById(d1.id);
    expect(removed).toBe(true);

    const pool = appState.getDicePoolState();
    expect(pool.dice).toHaveLength(1);
    expect(pool.dice[0].id).toBe(d2.id);
    expect(pool.counts.d10).toBe(1);
  });

  it("should clear the dice pool completely", () => {
    appState.addDieToPool("d4");
    appState.addDieToPool("d10");
    appState.clearDicePool();

    const pool = appState.getDicePoolState();
    expect(pool.dice).toHaveLength(0);
    expect(pool.counts.d4).toBe(0);
  });

  it("should trigger subscriber callbacks when dice pool changes", () => {
    let callCount = 0;
    const unsub = appState.onDicePoolChange(() => {
      callCount++;
    });

    appState.addDieToPool("d20");
    appState.addDieToPool("d6");
    appState.clearDicePool();

    expect(callCount).toBe(3);

    unsub();
    appState.addDieToPool("d4");
    expect(callCount).toBe(3);
  });

  it("should support updating and persisting RollMode and TraySize presets", () => {
    expect(appState.getRollMode()).toBe("fair-rng");
    appState.setRollMode("physics");
    expect(appState.getRollMode()).toBe("physics");

    expect(appState.getTraySize()).toBe("standard");
    appState.setTraySize("large");
    expect(appState.getTraySize()).toBe("large");

    // Verify persistence across new state instance
    const reloaded = new AppState(storage);
    expect(reloaded.getRollMode()).toBe("physics");
    expect(reloaded.getTraySize()).toBe("large");
  });

  it("should persist settings and history to storage", () => {
    appState.updateSettings((s) => ({
      ...s,
      theme: "classic-felt",
    }));

    // Create a new AppState using the same storage provider to verify persistence
    const loadedState = new AppState(storage);
    expect(loadedState.getSettings().theme).toBe("classic-felt");
  });

  it("should manage tray material and custom colors", () => {
    expect(appState.getSettings().trayMaterial).toBe("green-velvet");
    appState.setTrayMaterial("burgundy-velvet");
    expect(appState.getSettings().trayMaterial).toBe("burgundy-velvet");

    appState.setCustomColors("#123456", "#abcdef");
    expect(appState.getSettings().customBodyColor).toBe("#123456");
    expect(appState.getSettings().customNumberColor).toBe("#abcdef");

    const reloaded = new AppState(storage);
    expect(reloaded.getSettings().trayMaterial).toBe("burgundy-velvet");
    expect(reloaded.getSettings().customBodyColor).toBe("#123456");
    expect(reloaded.getSettings().customNumberColor).toBe("#abcdef");
  });

  it("should manage audio preferences and mute toggle", () => {
    expect(appState.getSettings().audio.muted).toBe(false);
    appState.setMuted(true);
    expect(appState.getSettings().audio.muted).toBe(true);

    appState.setMasterVolume(0.4);
    expect(appState.getSettings().audio.masterVolume).toBe(0.4);
  });

  it("should cap history strictly at 20 entries", () => {
    for (let i = 1; i <= 25; i++) {
      appState.setLastRoll({
        id: `roll-${i}`,
        total: i,
        formula: `1d20 [${i % 20 || 20}]`,
        timestamp: Date.now() + i,
        rollMode: "fair-rng",
        status: "completed",
        dice: [
          {
            dieId: `die-${i}`,
            type: "d20",
            value: i % 20 || 20,
            rawFaceValue: i % 20 || 20,
            isCriticalHit: (i % 20 || 20) === 20,
            isCriticalMiss: (i % 20 || 20) === 1,
          },
        ],
      });
    }

    const history = appState.getHistory();
    expect(history).toHaveLength(20);
    // Most recent roll (i = 25) should be first
    expect(history[0].total).toBe(25);
  });

  it("should reset settings to defaults while retaining current roll history", () => {
    appState.setTrayMaterial("stitched-leather");
    appState.setCustomColors("#990000", "#ffffff");
    appState.setLastRoll({
      id: "roll-single",
      total: 20,
      formula: "1d20 [20]",
      timestamp: Date.now(),
      rollMode: "fair-rng",
      status: "completed",
      dice: [],
    });

    expect(appState.getSettings().trayMaterial).toBe("stitched-leather");
    expect(appState.getHistory()).toHaveLength(1);

    appState.resetSettingsToDefaults();

    expect(appState.getSettings().trayMaterial).toBe("green-velvet");
    expect(appState.getSettings().customBodyColor).toBeUndefined();
    expect(appState.getHistory()).toHaveLength(1);
  });
});
