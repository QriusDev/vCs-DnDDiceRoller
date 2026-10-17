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

  it("should persist settings and history to storage", () => {
    appState.updateSettings((s) => ({
      ...s,
      theme: "classic-felt",
    }));

    // Create a new AppState using the same storage provider to verify persistence
    const loadedState = new AppState(storage);
    expect(loadedState.getSettings().theme).toBe("classic-felt");
  });
});
