import type { AppState } from "@/core/state/AppState";
import { DICE_CONFIGS } from "@/config/diceConfig";
import { DICE_THEMES } from "@/config/themeConfig";
import type { DiceGeometryStyle, DiceThemeId, DiceType } from "@/types";

export class DiceToolbar {
  readonly element: HTMLElement;
  private readonly appState: AppState;
  private unsubs: (() => void)[] = [];

  constructor(appState: AppState) {
    this.appState = appState;
    this.element = document.createElement("div");
    this.element.className = "dice-toolbar";

    this.render();
    this.attachStyles();
    this.setupListeners();

    this.unsubs.push(
      this.appState.onDicePoolChange(() => {
        this.updateCounts();
      }),
      this.appState.onSettingsChange((settings) => {
        this.updateActiveToggles(settings.diceGeometryStyle, settings.diceTheme);
      })
    );
  }

  private render(): void {
    const diceTypes: DiceType[] = ["d4", "d6", "d8", "d10", "d12", "d20"];
    const pool = this.appState.getDicePoolState();
    const currentStyle = this.appState.getDiceGeometryStyle();
    const currentTheme = this.appState.getDiceTheme();

    this.element.innerHTML = `
      <div class="toolbar-label">
        <span class="label-title">DICE TRAY SELECTOR</span>
        <span class="label-hint">Left-click: +1 • Right-click: -1 • Drag dice to rotate</span>
      </div>
      <div class="dice-buttons-group">
        ${diceTypes
          .map((type) => {
            const config = DICE_CONFIGS[type];
            const count = pool.counts[type] || 0;
            return `
              <button 
                class="dice-btn dice-btn-${type}" 
                data-type="${type}" 
                title="Add ${config.label} (${config.faceCount} sides) to Tray (Right click to remove)"
                type="button"
              >
                <div class="dice-icon-wrapper">
                  <span class="dice-icon-symbol">${this.getIconSymbol(type)}</span>
                  <span class="dice-type-name">${config.label}</span>
                </div>
                <span class="dice-count-badge ${count > 0 ? "has-dice" : ""}" data-count-for="${type}">
                  ${count}
                </span>
              </button>
            `;
          })
          .join("")}
      </div>
      <div class="toolbar-controls-right">
        <!-- Style Toggle -->
        <div class="style-toggle-group" title="Switch 3D geometric style between Sharp and Rounded edges">
          <button class="style-btn ${currentStyle === "sharp" ? "active" : ""}" data-style="sharp" type="button">Sharp</button>
          <button class="style-btn ${currentStyle === "rounded" ? "active" : ""}" data-style="rounded" type="button">Rounded</button>
        </div>

        <!-- Theme Selector -->
        <select class="theme-select-input" id="quickThemeSelect" title="Select dice material and texture theme">
          ${Object.values(DICE_THEMES)
            .map(
              (t) => `
            <option value="${t.id}" ${t.id === currentTheme ? "selected" : ""}>${t.label}</option>
          `
            )
            .join("")}
        </select>

        <button class="quick-clear-btn" type="button" title="Clear all dice from the tray">
          Clear
        </button>
      </div>
    `;
  }

  private getIconSymbol(type: DiceType): string {
    switch (type) {
      case "d4":
        return "▲";
      case "d6":
        return "◼";
      case "d8":
        return "◆";
      case "d10":
        return "⬟";
      case "d12":
        return "⬢";
      case "d20":
        return "⬡";
    }
  }

  private setupListeners(): void {
    // Left click handlers
    this.element.addEventListener("click", (e) => {
      const target = e.target as HTMLElement;

      if (target.closest(".quick-clear-btn")) {
        this.appState.clearDicePool();
        return;
      }

      const styleBtn = target.closest<HTMLButtonElement>(".style-btn");
      if (styleBtn && styleBtn.dataset.style) {
        const style = styleBtn.dataset.style as DiceGeometryStyle;
        this.appState.setDiceGeometryStyle(style);
        return;
      }

      const btn = target.closest<HTMLButtonElement>(".dice-btn");
      if (!btn) return;
      const type = btn.dataset.type as DiceType;
      if (type) {
        this.appState.addDieToPool(type);
      }
    });

    // Theme selector change
    this.element.addEventListener("change", (e) => {
      const target = e.target as HTMLSelectElement;
      if (target.id === "quickThemeSelect") {
        const theme = target.value as DiceThemeId;
        this.appState.setDiceTheme(theme);
      }
    });

    // Right click to remove die
    this.element.addEventListener("contextmenu", (e) => {
      const target = e.target as HTMLElement;
      const btn = target.closest<HTMLButtonElement>(".dice-btn");
      if (!btn) return;
      e.preventDefault();
      const type = btn.dataset.type as DiceType;
      if (type) {
        this.appState.removeLastDieFromPool(type);
      }
    });
  }

  private updateCounts(): void {
    const pool = this.appState.getDicePoolState();
    const badges = this.element.querySelectorAll<HTMLElement>("[data-count-for]");
    badges.forEach((badge) => {
      const type = badge.dataset.countFor as DiceType;
      const count = pool.counts[type] || 0;
      badge.textContent = String(count);
      if (count > 0) {
        badge.classList.add("has-dice");
      } else {
        badge.classList.remove("has-dice");
      }
    });
  }

  private updateActiveToggles(style: DiceGeometryStyle, theme: DiceThemeId): void {
    const styleBtns = this.element.querySelectorAll<HTMLButtonElement>(".style-btn");
    styleBtns.forEach((btn) => {
      if (btn.dataset.style === style) {
        btn.classList.add("active");
      } else {
        btn.classList.remove("active");
      }
    });

    const select = this.element.querySelector<HTMLSelectElement>("#quickThemeSelect");
    if (select) {
      select.value = theme;
    }
  }

  private attachStyles(): void {
    const style = document.createElement("style");
    style.textContent = `
      .dice-toolbar {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: var(--space-2) var(--space-4);
        background: var(--color-bg-surface-overlay);
        backdrop-filter: blur(8px);
        border-bottom: 1px solid var(--color-border-subtle);
        z-index: 40;
      }
      .toolbar-label {
        display: flex;
        flex-direction: column;
      }
      .label-title {
        font-size: var(--font-size-xs);
        font-weight: 700;
        letter-spacing: 0.05em;
        color: var(--color-text-secondary);
      }
      .label-hint {
        font-size: 0.65rem;
        color: var(--color-text-muted);
      }
      .dice-buttons-group {
        display: flex;
        align-items: center;
        gap: var(--space-2);
      }
      .dice-btn {
        display: flex;
        align-items: center;
        gap: var(--space-2);
        background: var(--color-bg-surface);
        border: 1px solid var(--color-border-default);
        border-radius: var(--radius-md);
        padding: 5px 12px;
        transition: transform var(--transition-fast), border-color var(--transition-fast), box-shadow var(--transition-fast);
      }
      .dice-btn:hover {
        transform: translateY(-2px);
        border-color: var(--color-accent-gold);
        box-shadow: var(--shadow-sm);
      }
      .dice-btn:active {
        transform: translateY(0);
      }
      .dice-icon-wrapper {
        display: flex;
        align-items: center;
        gap: 6px;
      }
      .dice-icon-symbol {
        font-size: var(--font-size-sm);
      }
      .dice-btn-d4 .dice-icon-symbol { color: var(--dice-color-d4); }
      .dice-btn-d6 .dice-icon-symbol { color: var(--dice-color-d6); }
      .dice-btn-d8 .dice-icon-symbol { color: var(--dice-color-d8); }
      .dice-btn-d10 .dice-icon-symbol { color: var(--dice-color-d10); }
      .dice-btn-d12 .dice-icon-symbol { color: var(--dice-color-d12); }
      .dice-btn-d20 .dice-icon-symbol { color: var(--dice-color-d20); font-size: 1.1rem; }

      .dice-type-name {
        font-weight: 700;
        font-size: var(--font-size-sm);
      }
      .dice-count-badge {
        font-size: var(--font-size-xs);
        font-family: var(--font-family-mono);
        font-weight: 700;
        padding: 1px 7px;
        border-radius: var(--radius-full);
        background: var(--color-bg-surface-elevated);
        color: var(--color-text-muted);
        min-width: 20px;
        text-align: center;
      }
      .dice-count-badge.has-dice {
        background: var(--color-accent-gold);
        color: #000;
        box-shadow: 0 0 6px rgba(217, 119, 6, 0.4);
      }
      .toolbar-controls-right {
        display: flex;
        align-items: center;
        gap: var(--space-3);
      }
      .style-toggle-group {
        display: flex;
        border: 1px solid var(--color-border-default);
        border-radius: var(--radius-md);
        overflow: hidden;
        background: var(--color-bg-surface);
      }
      .style-btn {
        padding: 5px 10px;
        font-size: var(--font-size-xs);
        font-weight: 600;
        color: var(--color-text-secondary);
        transition: all var(--transition-fast);
      }
      .style-btn:hover {
        background: var(--color-bg-surface-elevated);
        color: var(--color-text-primary);
      }
      .style-btn.active {
        background: var(--color-accent-gold);
        color: #000;
        font-weight: 700;
      }
      .theme-select-input {
        background: var(--color-bg-surface);
        color: var(--color-text-primary);
        border: 1px solid var(--color-border-default);
        border-radius: var(--radius-md);
        padding: 5px 10px;
        font-size: var(--font-size-xs);
        font-family: inherit;
        outline: none;
        cursor: pointer;
        transition: border-color var(--transition-fast);
      }
      .theme-select-input:hover, .theme-select-input:focus {
        border-color: var(--color-accent-gold);
      }
      .quick-clear-btn {
        padding: 5px 12px;
        font-size: var(--font-size-xs);
        font-weight: 600;
        color: var(--color-text-secondary);
        border: 1px solid var(--color-border-subtle);
        border-radius: var(--radius-sm);
        transition: all var(--transition-fast);
      }
      .quick-clear-btn:hover {
        background: rgba(225, 29, 72, 0.15);
        color: var(--color-accent-crimson);
        border-color: var(--color-accent-crimson);
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
