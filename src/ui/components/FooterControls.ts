import type { AppState } from "@/core/state/AppState";
import { CryptoRandomProvider } from "@/core/random/RandomProvider";
import { ResultCalculator } from "@/core/results/ResultCalculator";
import { DICE_FACE_COUNTS } from "@/types";
import type { DieRollResult } from "@/types";

export interface FooterControlsCallbacks {
  onOpenHistory: () => void;
}

export class FooterControls {
  readonly element: HTMLElement;
  private readonly appState: AppState;
  private readonly rng = new CryptoRandomProvider();
  private unsubs: (() => void)[] = [];

  constructor(appState: AppState, callbacks: FooterControlsCallbacks) {
    this.appState = appState;
    this.element = document.createElement("footer");
    this.element.className = "app-footer-controls";

    this.render();
    this.attachStyles();
    this.setupListeners(callbacks);
    this.setupKeyboardShortcuts();
  }

  private render(): void {
    const historyCount = this.appState.getHistory().length;

    this.element.innerHTML = `
      <div class="footer-left">
        <button class="footer-btn footer-btn-secondary" id="clearTrayBtn" type="button" title="Clear all dice from the tray">
          <span class="btn-icon">🗑️</span>
          <span>Clear Tray</span>
        </button>
        <button class="footer-btn footer-btn-secondary" id="openHistoryBtn" type="button" title="View past roll history">
          <span class="btn-icon">📜</span>
          <span>History</span>
          <span class="badge history-count-badge">${historyCount}</span>
        </button>
      </div>

      <div class="footer-center">
        <button class="roll-action-btn" id="rollActionBtn" type="button">
          <span class="roll-btn-sparkle">✨</span>
          <span class="roll-btn-text">ROLL DICE</span>
          <span class="roll-btn-hotkey">SPACE</span>
        </button>
      </div>

      <div class="footer-right">
        <div class="simulation-mode-pill">
          <span class="mode-indicator-dot"></span>
          <span class="mode-title">Mode: <strong>Fair RNG + 3D Simulation</strong></span>
        </div>
      </div>
    `;
  }

  private setupListeners(callbacks: FooterControlsCallbacks): void {
    this.element.addEventListener("click", (e) => {
      const target = e.target as HTMLElement;

      if (target.closest("#rollActionBtn")) {
        this.performRoll();
        return;
      }

      if (target.closest("#clearTrayBtn")) {
        this.appState.clearDicePool();
        return;
      }

      if (target.closest("#openHistoryBtn")) {
        callbacks.onOpenHistory();
        return;
      }
    });

    this.unsubs.push(
      this.appState.onHistoryChange((history) => {
        const badge = this.element.querySelector(".history-count-badge");
        if (badge) {
          badge.textContent = String(history.length);
        }
      })
    );
  }

  private setupKeyboardShortcuts(): void {
    const onKeyDown = (e: KeyboardEvent): void => {
      // Trigger roll on Space bar if not inside an input/dialog
      if (
        e.code === "Space" &&
        !(e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement)
      ) {
        e.preventDefault();
        this.performRoll();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    this.unsubs.push(() => window.removeEventListener("keydown", onKeyDown));
  }

  performRoll(): void {
    if (this.appState.getRollState() === "rolling") {
      return;
    }

    let pool = this.appState.getDicePoolState();
    // If pool is empty, add 1x d20 by default for an immediate satisfying roll
    if (pool.dice.length === 0) {
      this.appState.addDieToPool("d20");
      pool = this.appState.getDicePoolState();
    }

    this.appState.setRollState("rolling");

    // Brief simulation time representing the physics throw
    window.setTimeout(() => {
      const results: DieRollResult[] = pool.dice.map((die) => {
        const sides = DICE_FACE_COUNTS[die.type];
        const value = this.rng.rollDie(sides);
        const { isCriticalHit, isCriticalMiss } = ResultCalculator.evaluateDie(die.type, value);
        return {
          dieId: die.id,
          type: die.type,
          value,
          isCriticalHit,
          isCriticalMiss,
        };
      });

      const aggregate = ResultCalculator.createAggregateResult(results, "fair-rng");
      this.appState.setLastRoll(aggregate);
      this.appState.setRollState("settled");
    }, 450);
  }

  private attachStyles(): void {
    const style = document.createElement("style");
    style.textContent = `
      .app-footer-controls {
        position: absolute;
        bottom: 0;
        left: 0;
        right: 0;
        height: 68px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0 var(--space-5);
        background: var(--color-bg-surface-overlay);
        backdrop-filter: blur(12px);
        border-top: 1px solid var(--color-border-subtle);
        z-index: 40;
        user-select: none;
      }
      .footer-left {
        display: flex;
        align-items: center;
        gap: var(--space-3);
      }
      .footer-btn {
        display: flex;
        align-items: center;
        gap: var(--space-2);
        padding: 8px 16px;
        font-size: var(--font-size-sm);
        font-weight: 600;
        border-radius: var(--radius-md);
        background: var(--color-bg-surface);
        border: 1px solid var(--color-border-default);
        color: var(--color-text-primary);
        transition: all var(--transition-fast);
      }
      .footer-btn:hover {
        background: var(--color-bg-surface-elevated);
        border-color: var(--color-border-hover);
        transform: translateY(-1px);
      }
      .footer-btn:active {
        transform: translateY(0);
      }
      .history-count-badge {
        font-family: var(--font-family-mono);
        margin-left: 2px;
      }
      .footer-center {
        display: flex;
        justify-content: center;
      }
      .roll-action-btn {
        display: flex;
        align-items: center;
        gap: var(--space-3);
        padding: 10px 32px;
        font-size: var(--font-size-base);
        font-weight: 800;
        letter-spacing: 0.05em;
        border-radius: var(--radius-full);
        background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
        color: #1a0f00;
        box-shadow: 0 4px 14px rgba(217, 119, 6, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.4);
        transition: all var(--transition-fast);
      }
      .roll-action-btn:hover {
        transform: translateY(-2px) scale(1.02);
        box-shadow: 0 6px 20px rgba(217, 119, 6, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.4);
        background: linear-gradient(135deg, #fbbf24 0%, #d97706 100%);
      }
      .roll-action-btn:active {
        transform: translateY(0) scale(0.98);
      }
      .roll-btn-sparkle {
        font-size: 1.1rem;
      }
      .roll-btn-hotkey {
        font-size: var(--font-size-xs);
        padding: 2px 6px;
        background: rgba(0, 0, 0, 0.2);
        border-radius: var(--radius-sm);
        font-family: var(--font-family-mono);
        color: rgba(0, 0, 0, 0.8);
      }
      .footer-right {
        display: flex;
        align-items: center;
      }
      .simulation-mode-pill {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 6px 14px;
        background: var(--color-bg-surface);
        border: 1px solid var(--color-border-subtle);
        border-radius: var(--radius-full);
        font-size: var(--font-size-xs);
        color: var(--color-text-secondary);
      }
      .mode-indicator-dot {
        width: 8px;
        height: 8px;
        border-radius: var(--radius-full);
        background: var(--color-accent-emerald);
        box-shadow: 0 0 6px var(--color-accent-emerald);
      }
    `;
    this.element.appendChild(style);
  }

  dispose(): void {
    for (const unsub of this.unsubs) {
      unsub();
    }
    this.unsubs = [];
  }
}
