import type { AppState } from "@/core/state/AppState";
import { DICE_CONFIGS } from "@/config/diceConfig";
import { DICE_THEMES } from "@/config/themeConfig";
import type { DiceGeometryStyle, DiceThemeId, DiceType } from "@/types";
import { DICE_SVGS, UI_ICONS } from "@/ui/icons";

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
      <div class="dice-buttons-group" role="toolbar" aria-label="Dice Selection Toolbar">
        ${diceTypes
          .map((type) => {
            const config = DICE_CONFIGS[type];
            const count = pool.counts[type] || 0;
            const badgeText = count > 0 ? `${config.label} ×${count}` : "0";
            return `
              <button 
                class="dice-btn dice-btn-${type} ${count > 0 ? "is-active" : ""}" 
                data-type="${type}" 
                title="${config.label} (${config.faceCount} sides): Left-click to add, Right-click to remove"
                aria-label="${config.label}, ${count} currently in tray. Left click to add, right click to remove."
                type="button"
              >
                <div class="dice-icon-wrapper">
                  <span class="dice-svg-container" aria-hidden="true">${DICE_SVGS[type]}</span>
                  <span class="dice-type-name">${config.label}</span>
                </div>
                <span class="dice-count-badge ${count > 0 ? "has-dice" : ""}" data-count-for="${type}" aria-hidden="true">
                  ${badgeText}
                </span>
              </button>
            `;
          })
          .join("")}
      </div>
      <div class="toolbar-controls-right">
        <!-- Style Toggle -->
        <div class="style-toggle-group" title="Switch 3D geometric style between Sharp and Rounded edges" role="radiogroup" aria-label="Dice Edge Profile">
          <button class="style-btn ${currentStyle === "sharp" ? "active" : ""}" data-style="sharp" type="button" role="radio" aria-checked="${currentStyle === "sharp"}">Sharp</button>
          <button class="style-btn ${currentStyle === "rounded" ? "active" : ""}" data-style="rounded" type="button" role="radio" aria-checked="${currentStyle === "rounded"}">Rounded</button>
        </div>

        <!-- Theme Selector -->
        <select class="theme-select-input" id="quickThemeSelect" title="Select dice material and texture theme" aria-label="Quick Theme Selector">
          ${Object.values(DICE_THEMES)
            .map(
              (t) => `
            <option value="${t.id}" ${t.id === currentTheme ? "selected" : ""}>${t.label}</option>
          `
            )
            .join("")}
        </select>

        <button class="quick-clear-btn" type="button" title="Clear all dice from the tray" aria-label="Clear all dice">
          <span class="btn-clear-icon" aria-hidden="true">${UI_ICONS.trash}</span>
          <span>Clear All</span>
        </button>
      </div>
    `;
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
    const diceButtons = this.element.querySelectorAll<HTMLButtonElement>(".dice-btn");
    diceButtons.forEach((btn) => {
      const type = btn.dataset.type as DiceType;
      const count = pool.counts[type] || 0;
      const config = DICE_CONFIGS[type];
      const badge = btn.querySelector<HTMLElement>("[data-count-for]");
      if (badge) {
        badge.textContent = count > 0 ? `${config.label} ×${count}` : "0";
        if (count > 0) {
          badge.classList.add("has-dice");
          btn.classList.add("is-active");
        } else {
          badge.classList.remove("has-dice");
          btn.classList.remove("is-active");
        }
      }
      btn.setAttribute(
        "aria-label",
        `${config.label}, ${count} currently in tray. Left click to add, right click to remove.`
      );
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
    if (document.getElementById("dice-toolbar-styles")) return;
    const style = document.createElement("style");
    style.id = "dice-toolbar-styles";
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
      .dice-btn.is-active {
        border-color: rgba(217, 119, 6, 0.4);
      }
      .dice-icon-wrapper {
        display: flex;
        align-items: center;
        gap: 6px;
      }
      .dice-svg-container {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 22px;
        height: 22px;
      }
      .dice-svg-container svg {
        width: 100%;
        height: 100%;
      }
      .dice-btn-d4 .dice-svg-container { color: var(--dice-color-d4, #f87171); }
      .dice-btn-d6 .dice-svg-container { color: var(--dice-color-d6, #60a5fa); }
      .dice-btn-d8 .dice-svg-container { color: var(--dice-color-d8, #34d399); }
      .dice-btn-d10 .dice-svg-container { color: var(--dice-color-d10, #fbbf24); }
      .dice-btn-d12 .dice-svg-container { color: var(--dice-color-d12, #c084fc); }
      .dice-btn-d20 .dice-svg-container { color: var(--dice-color-d20, #f43f5e); }

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
        white-space: nowrap;
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
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 5px 12px;
        font-size: var(--font-size-xs);
        font-weight: 600;
        color: var(--color-text-secondary);
        border: 1px solid var(--color-border-subtle);
        border-radius: var(--radius-sm);
        transition: all var(--transition-fast);
      }
      .btn-clear-icon {
        display: flex;
        align-items: center;
      }
      .quick-clear-btn:hover {
        background: rgba(225, 29, 72, 0.15);
        color: var(--color-accent-crimson);
        border-color: var(--color-accent-crimson);
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
