import type { AppState } from "@/core/state/AppState";
import type { AggregateRollResult, DicePoolState, RollState } from "@/types";

export class ResultHud {
  readonly element: HTMLElement;
  private readonly appState: AppState;
  private unsubs: (() => void)[] = [];

  constructor(appState: AppState) {
    this.appState = appState;
    this.element = document.createElement("div");
    this.element.className = "result-hud glass-panel";

    this.render();
    this.attachStyles();
    this.setupSubscriptions();
  }

  private render(): void {
    const pool = this.appState.getDicePoolState();
    const rollState = this.appState.getRollState();
    const lastRoll = this.appState.getLastRoll();

    const poolSummary = this.formatPoolSummary(pool);
    const hasCritHit = lastRoll?.dice.some((d) => d.isCriticalHit) ?? false;
    const hasCritMiss = lastRoll?.dice.some((d) => d.isCriticalMiss) ?? false;

    this.element.innerHTML = `
      <div class="hud-header">
        <div class="hud-status">
          <span class="hud-status-indicator status-${rollState}"></span>
          <span class="hud-status-label">${rollState.toUpperCase()}</span>
        </div>
        <div class="hud-pool-badge">
          ${poolSummary}
        </div>
      </div>

      <div class="hud-body">
        <div class="hud-total-container">
          <span class="hud-total-caption">TOTAL RESULT</span>
          <div class="hud-total-number ${hasCritHit ? "crit-hit" : ""} ${hasCritMiss ? "crit-miss" : ""}">
            ${lastRoll !== null ? lastRoll.total : "—"}
          </div>
          ${
            hasCritHit
              ? `<div class="crit-banner crit-hit-banner">✨ NATURAL 20! CRITICAL HIT!</div>`
              : hasCritMiss
                ? `<div class="crit-banner crit-miss-banner">💀 NATURAL 1! CRITICAL MISS!</div>`
                : ""
          }
        </div>

        ${
          lastRoll && lastRoll.dice.length > 0
            ? `
              <div class="hud-breakdown">
                <span class="hud-breakdown-caption">DICE BREAKDOWN:</span>
                <div class="hud-dice-pills">
                  ${lastRoll.dice
                    .map(
                      (d) => `
                    <span class="die-result-pill ${d.isCriticalHit ? "pill-crit" : ""} ${d.isCriticalMiss ? "pill-miss" : ""}">
                      <span class="pill-type">${d.type.toUpperCase()}:</span>
                      <strong class="pill-value">${d.value}</strong>
                    </span>
                  `
                    )
                    .join("")}
                </div>
              </div>
            `
            : `
              <div class="hud-placeholder-hint">
                Add dice from the toolbar and press Roll (Space)
              </div>
            `
        }
      </div>
    `;
  }

  private formatPoolSummary(pool: DicePoolState): string {
    const parts: string[] = [];
    for (const [type, count] of Object.entries(pool.counts)) {
      if (count > 0) {
        parts.push(`${count}${type}`);
      }
    }
    return parts.length > 0 ? parts.join(" + ") : "Tray Empty";
  }

  private setupSubscriptions(): void {
    this.unsubs.push(
      this.appState.onDicePoolChange(() => this.render()),
      this.appState.onRollStateChange((newState: RollState) => {
        const indicator = this.element.querySelector(".hud-status-indicator");
        const label = this.element.querySelector(".hud-status-label");
        if (indicator && label) {
          indicator.className = `hud-status-indicator status-${newState}`;
          label.textContent = newState.toUpperCase();
        }
      }),
      this.appState.onLastRollChange((_roll: AggregateRollResult | null) => this.render())
    );
  }

  private attachStyles(): void {
    if (document.getElementById("result-hud-styles")) return;
    const style = document.createElement("style");
    style.id = "result-hud-styles";
    style.textContent = `
      .result-hud {
        position: absolute;
        top: 96px;
        left: 20px;
        min-width: 260px;
        max-width: 340px;
        padding: var(--space-4);
        z-index: 30;
        pointer-events: auto;
        user-select: none;
      }
      .hud-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: var(--space-3);
        padding-bottom: var(--space-2);
        border-bottom: 1px solid var(--color-border-subtle);
      }
      .hud-status {
        display: flex;
        align-items: center;
        gap: 6px;
      }
      .hud-status-indicator {
        width: 8px;
        height: 8px;
        border-radius: var(--radius-full);
      }
      .hud-status-indicator.status-idle {
        background-color: var(--color-accent-emerald);
        box-shadow: 0 0 6px var(--color-accent-emerald);
      }
      .hud-status-indicator.status-rolling {
        background-color: var(--color-accent-gold);
        box-shadow: 0 0 8px var(--color-accent-gold);
        animation: pulse 1s infinite alternate;
      }
      .hud-status-indicator.status-settled {
        background-color: var(--color-accent-blue);
      }
      @keyframes pulse {
        0% { opacity: 0.4; }
        100% { opacity: 1; }
      }
      .hud-status-label {
        font-size: var(--font-size-xs);
        font-weight: 700;
        letter-spacing: 0.05em;
        color: var(--color-text-secondary);
      }
      .hud-pool-badge {
        font-size: var(--font-size-xs);
        font-family: var(--font-family-mono);
        color: var(--color-accent-gold);
        background: rgba(217, 119, 6, 0.12);
        padding: 2px 8px;
        border-radius: var(--radius-sm);
        border: 1px solid rgba(217, 119, 6, 0.25);
      }
      .hud-total-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        margin-bottom: var(--space-3);
      }
      .hud-total-caption {
        font-size: 0.65rem;
        font-weight: 700;
        letter-spacing: 0.1em;
        color: var(--color-text-muted);
      }
      .hud-total-number {
        font-size: var(--font-size-3xl);
        font-weight: 900;
        font-family: var(--font-family-mono);
        color: var(--color-text-primary);
        line-height: 1.1;
        text-shadow: 0 2px 10px rgba(0, 0, 0, 0.5);
      }
      .hud-total-number.crit-hit {
        color: #fbbf24;
        text-shadow: 0 0 16px rgba(251, 191, 36, 0.8);
      }
      .hud-total-number.crit-miss {
        color: #f43f5e;
        text-shadow: 0 0 16px rgba(244, 63, 94, 0.8);
      }
      .crit-banner {
        font-size: var(--font-size-xs);
        font-weight: 800;
        padding: 3px 10px;
        border-radius: var(--radius-full);
        margin-top: 4px;
        letter-spacing: 0.05em;
      }
      .crit-hit-banner {
        background: rgba(245, 158, 11, 0.2);
        color: #fbbf24;
        border: 1px solid #f59e0b;
      }
      .crit-miss-banner {
        background: rgba(225, 29, 72, 0.2);
        color: #fb7185;
        border: 1px solid #e11d48;
      }
      .hud-breakdown {
        display: flex;
        flex-direction: column;
        gap: 4px;
      }
      .hud-breakdown-caption {
        font-size: 0.65rem;
        font-weight: 600;
        color: var(--color-text-muted);
      }
      .hud-dice-pills {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
      }
      .die-result-pill {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        font-size: var(--font-size-xs);
        padding: 2px 7px;
        background: var(--color-bg-surface-elevated);
        border: 1px solid var(--color-border-default);
        border-radius: var(--radius-sm);
      }
      .die-result-pill.pill-crit {
        border-color: #f59e0b;
        background: rgba(245, 158, 11, 0.15);
      }
      .die-result-pill.pill-miss {
        border-color: #e11d48;
        background: rgba(225, 29, 72, 0.15);
      }
      .pill-type {
        color: var(--color-text-muted);
        font-size: 0.65rem;
      }
      .pill-value {
        font-family: var(--font-family-mono);
      }
      .hud-placeholder-hint {
        font-size: var(--font-size-xs);
        color: var(--color-text-muted);
        text-align: center;
        padding: var(--space-2) 0;
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
