import type { AppState } from "@/core/state/AppState";
import type { RollMode } from "@/types";
import { UI_ICONS } from "@/ui/icons";

export interface FooterControlsCallbacks {
  onOpenHistory: () => void;
  onRollRequest?: () => void;
}

export class FooterControls {
  readonly element: HTMLElement;
  private readonly appState: AppState;
  private unsubs: (() => void)[] = [];

  constructor(appState: AppState, callbacks: FooterControlsCallbacks) {
    this.appState = appState;
    this.element = document.createElement("footer");
    this.element.className = "app-footer-controls";

    this.render();
    this.attachStyles();
    this.setupListeners(callbacks);
    this.setupKeyboardShortcuts(callbacks);
  }

  private render(): void {
    const historyCount = this.appState.getHistory().length;
    const currentMode = this.appState.getRollMode();
    const pool = this.appState.getDicePoolState();
    const rollState = this.appState.getRollState();
    const isPoolEmpty = pool.dice.length === 0;
    const isRolling =
      rollState === "rolling" || rollState === "preparing" || rollState === "settling";

    this.element.innerHTML = `
      <div class="footer-left">
        <button class="footer-btn footer-btn-secondary" id="clearTrayBtn" type="button" title="Clear all dice from the tray" aria-label="Clear Tray">
          <span class="btn-icon" aria-hidden="true">${UI_ICONS.trash}</span>
          <span>Clear Tray</span>
        </button>
        <button class="footer-btn footer-btn-secondary" id="openHistoryBtn" type="button" title="View past roll history" aria-label="Open Roll History" aria-expanded="false">
          <span class="btn-icon" aria-hidden="true">${UI_ICONS.history}</span>
          <span>History</span>
          <span class="badge history-count-badge">${historyCount}</span>
        </button>
      </div>

      <div class="footer-center">
        <button 
          class="roll-action-btn ${isRolling ? "is-rolling" : ""}" 
          id="rollActionBtn" 
          type="button"
          ${isPoolEmpty || isRolling ? "disabled" : ""}
          title="${isPoolEmpty ? "Add dice to the tray before rolling" : isRolling ? "Dice are currently rolling" : "Roll all dice (Space)"}"
        >
          <span class="roll-btn-sparkle" aria-hidden="true">${UI_ICONS.sparkle}</span>
          <span class="roll-btn-text">${isRolling ? "ROLLING..." : "ROLL DICE"}</span>
          <span class="roll-btn-hotkey" aria-hidden="true">SPACE</span>
        </button>
      </div>

      <div class="footer-right">
        <div class="mode-toggle-group" title="Switch rolling mode: Fair PRNG target landing vs Pure chaotic physics" role="radiogroup" aria-label="Rolling Mode">
          <button class="mode-btn ${currentMode === "fair-rng" ? "active" : ""}" data-mode="fair-rng" type="button" role="radio" aria-checked="${currentMode === "fair-rng"}">Fair PRNG</button>
          <button class="mode-btn ${currentMode === "physics" ? "active" : ""}" data-mode="physics" type="button" role="radio" aria-checked="${currentMode === "physics"}">Pure Physics</button>
        </div>
      </div>
    `;
  }

  private setupListeners(callbacks: FooterControlsCallbacks): void {
    this.element.addEventListener("click", (e) => {
      const target = e.target as HTMLElement;

      if (target.closest("#rollActionBtn")) {
        const rollBtn = this.element.querySelector<HTMLButtonElement>("#rollActionBtn");
        if (rollBtn && !rollBtn.disabled) {
          callbacks.onRollRequest?.();
        }
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

      const modeBtn = target.closest<HTMLButtonElement>(".mode-btn");
      if (modeBtn && modeBtn.dataset.mode) {
        const mode = modeBtn.dataset.mode as RollMode;
        this.appState.setRollMode(mode);
        this.updateActiveMode(mode);
      }
    });

    this.unsubs.push(
      this.appState.onHistoryChange((history) => {
        const badge = this.element.querySelector(".history-count-badge");
        if (badge) {
          badge.textContent = String(history.length);
        }
      }),
      this.appState.onDicePoolChange(() => {
        this.updateRollButtonState();
      }),
      this.appState.onRollStateChange(() => {
        this.updateRollButtonState();
      }),
      this.appState.onSettingsChange((settings) => {
        this.updateActiveMode(settings.rollMode);
      })
    );
  }

  private updateRollButtonState(): void {
    const rollBtn = this.element.querySelector<HTMLButtonElement>("#rollActionBtn");
    if (!rollBtn) return;
    const pool = this.appState.getDicePoolState();
    const rollState = this.appState.getRollState();
    const isPoolEmpty = pool.dice.length === 0;
    const isRolling =
      rollState === "rolling" || rollState === "preparing" || rollState === "settling";

    rollBtn.disabled = isPoolEmpty || isRolling;
    if (isRolling) {
      rollBtn.classList.add("is-rolling");
      const textEl = rollBtn.querySelector(".roll-btn-text");
      if (textEl) textEl.textContent = "ROLLING...";
    } else {
      rollBtn.classList.remove("is-rolling");
      const textEl = rollBtn.querySelector(".roll-btn-text");
      if (textEl) textEl.textContent = "ROLL DICE";
    }

    rollBtn.title = isPoolEmpty
      ? "Add dice to the tray before rolling"
      : isRolling
        ? "Dice are currently rolling"
        : "Roll all dice (Space)";
  }

  private updateActiveMode(mode: RollMode): void {
    const buttons = this.element.querySelectorAll<HTMLButtonElement>(".mode-btn");
    buttons.forEach((btn) => {
      if (btn.dataset.mode === mode) {
        btn.classList.add("active");
      } else {
        btn.classList.remove("active");
      }
    });
  }

  private setupKeyboardShortcuts(callbacks: FooterControlsCallbacks): void {
    const onKeyDown = (e: KeyboardEvent): void => {
      // Trigger roll on Space bar if not inside an input/dialog
      if (
        e.code === "Space" &&
        !(e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement)
      ) {
        e.preventDefault();
        callbacks.onRollRequest?.();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    this.unsubs.push(() => window.removeEventListener("keydown", onKeyDown));
  }

  private attachStyles(): void {
    if (document.getElementById("footer-controls-styles")) return;
    const style = document.createElement("style");
    style.id = "footer-controls-styles";
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
      .roll-action-btn:active:not(:disabled) {
        transform: translateY(0) scale(0.98);
      }
      .roll-action-btn:disabled {
        opacity: 0.45;
        cursor: not-allowed;
        filter: grayscale(0.6);
        box-shadow: none;
        transform: none;
      }
      .roll-action-btn.is-rolling {
        background: linear-gradient(135deg, #eab308 0%, #ca8a04 100%);
        animation: pulse 1s infinite alternate;
      }
      .roll-btn-sparkle {
        display: flex;
        align-items: center;
        font-size: 1.1rem;
      }
      .btn-icon {
        display: flex;
        align-items: center;
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
      .mode-toggle-group {
        display: flex;
        border: 1px solid var(--color-border-default);
        border-radius: var(--radius-md);
        overflow: hidden;
        background: var(--color-bg-surface);
      }
      .mode-btn {
        padding: 6px 12px;
        font-size: var(--font-size-xs);
        font-weight: 600;
        color: var(--color-text-secondary);
        transition: all var(--transition-fast);
      }
      .mode-btn:hover {
        background: var(--color-bg-surface-elevated);
        color: var(--color-text-primary);
      }
      .mode-btn.active {
        background: var(--color-accent-gold);
        color: #000;
        font-weight: 700;
      }
    `;
    document.head.appendChild(style);
  }

  dispose(): void {
    for (const unsub of this.unsubs) {
      unsub();
    }
    this.unsubs = [];
  }
}
