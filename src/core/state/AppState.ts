import type {
  AppSettings,
  DicePoolState,
  DiceType,
  DieInstance,
  RollHistoryEntry,
  RollState,
  AggregateRollResult,
} from "@/types";
import { DEFAULT_SETTINGS } from "@/config/defaultSettings";
import { StorageService } from "./persistence";

export type StateListener<T> = (newValue: T, oldValue: T) => void;

export class AppState {
  private readonly storage: StorageService;
  private settings: AppSettings;
  private dicePool: DieInstance[] = [];
  private rollState: RollState = "idle";
  private lastRoll: AggregateRollResult | null = null;
  private history: RollHistoryEntry[] = [];
  private selectedDiceType: DiceType = "d20";

  private readonly listeners: {
    settings: Set<StateListener<AppSettings>>;
    dicePool: Set<StateListener<DicePoolState>>;
    rollState: Set<StateListener<RollState>>;
    lastRoll: Set<StateListener<AggregateRollResult | null>>;
    history: Set<StateListener<RollHistoryEntry[]>>;
    selectedDiceType: Set<StateListener<DiceType>>;
  } = {
    settings: new Set(),
    dicePool: new Set(),
    rollState: new Set(),
    lastRoll: new Set(),
    history: new Set(),
    selectedDiceType: new Set(),
  };

  constructor(storage: StorageService = new StorageService()) {
    this.storage = storage;
    this.settings = this.storage.get<AppSettings>("settings", DEFAULT_SETTINGS);
    this.history = this.storage.get<RollHistoryEntry[]>("history", []);
  }

  // --- Settings ---
  getSettings(): Readonly<AppSettings> {
    return this.settings;
  }

  updateSettings(updater: (prev: AppSettings) => AppSettings): void {
    const old = this.settings;
    this.settings = updater(old);
    this.storage.set("settings", this.settings);
    this.notify("settings", this.settings, old);
  }

  onSettingsChange(listener: StateListener<AppSettings>): () => void {
    return this.subscribe("settings", listener);
  }

  // --- Dice Pool ---
  getDicePoolState(): DicePoolState {
    const counts: Record<DiceType, number> = {
      d4: 0,
      d6: 0,
      d8: 0,
      d10: 0,
      d12: 0,
      d20: 0,
    };
    for (const die of this.dicePool) {
      counts[die.type]++;
    }
    return {
      dice: [...this.dicePool],
      counts,
    };
  }

  addDieToPool(type: DiceType): DieInstance {
    const prevPoolState = this.getDicePoolState();
    const newDie: DieInstance = {
      id: `${type}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      type,
      createdAt: Date.now(),
    };
    this.dicePool.push(newDie);
    this.notify("dicePool", this.getDicePoolState(), prevPoolState);
    return newDie;
  }

  removeLastDieFromPool(type: DiceType): boolean {
    const prevPoolState = this.getDicePoolState();
    const index = [...this.dicePool].reverse().findIndex((d) => d.type === type);
    if (index === -1) {
      return false;
    }
    const realIndex = this.dicePool.length - 1 - index;
    this.dicePool.splice(realIndex, 1);
    this.notify("dicePool", this.getDicePoolState(), prevPoolState);
    return true;
  }

  clearDicePool(): void {
    const prevPoolState = this.getDicePoolState();
    this.dicePool = [];
    this.notify("dicePool", this.getDicePoolState(), prevPoolState);
  }

  onDicePoolChange(listener: StateListener<DicePoolState>): () => void {
    return this.subscribe("dicePool", listener);
  }

  // --- Selected Dice Type ---
  getSelectedDiceType(): DiceType {
    return this.selectedDiceType;
  }

  setSelectedDiceType(type: DiceType): void {
    if (this.selectedDiceType === type) return;
    const old = this.selectedDiceType;
    this.selectedDiceType = type;
    this.notify("selectedDiceType", type, old);
  }

  onSelectedDiceTypeChange(listener: StateListener<DiceType>): () => void {
    return this.subscribe("selectedDiceType", listener);
  }

  // --- Roll State ---
  getRollState(): RollState {
    return this.rollState;
  }

  setRollState(state: RollState): void {
    if (this.rollState === state) return;
    const old = this.rollState;
    this.rollState = state;
    this.notify("rollState", state, old);
  }

  onRollStateChange(listener: StateListener<RollState>): () => void {
    return this.subscribe("rollState", listener);
  }

  // --- Last Roll & History ---
  getLastRoll(): AggregateRollResult | null {
    return this.lastRoll;
  }

  setLastRoll(result: AggregateRollResult): void {
    const old = this.lastRoll;
    this.lastRoll = result;
    this.notify("lastRoll", result, old);

    // Also push to history
    const oldHistory = [...this.history];
    this.history.unshift(result);
    if (this.history.length > 50) {
      this.history.pop();
    }
    this.storage.set("history", this.history);
    this.notify("history", this.history, oldHistory);
  }

  onLastRollChange(listener: StateListener<AggregateRollResult | null>): () => void {
    return this.subscribe("lastRoll", listener);
  }

  getHistory(): ReadonlyArray<RollHistoryEntry> {
    return this.history;
  }

  clearHistory(): void {
    const old = [...this.history];
    this.history = [];
    this.storage.set("history", this.history);
    this.notify("history", this.history, old);
  }

  onHistoryChange(listener: StateListener<RollHistoryEntry[]>): () => void {
    return this.subscribe("history", listener);
  }

  // --- Internal Subscription Helpers ---
  private subscribe<K extends keyof typeof this.listeners>(
    channel: K,
    listener: (typeof this.listeners)[K] extends Set<infer L> ? L : never
  ): () => void {
    const set = this.listeners[channel] as Set<unknown>;
    set.add(listener);
    return () => {
      set.delete(listener);
    };
  }

  private notify<K extends keyof typeof this.listeners, V>(channel: K, newVal: V, oldVal: V): void {
    const set = this.listeners[channel] as Set<StateListener<V>>;
    for (const listener of set) {
      try {
        listener(newVal, oldVal);
      } catch (err) {
        console.error(`Error in subscriber for ${channel}:`, err);
      }
    }
  }
}
