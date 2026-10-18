import type { AppState } from "@/core/state/AppState";
import type { DicePoolState } from "@/types";

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
    const isRolling =
      rollState === "rolling" || rollState === "preparing" || rollState === "settling";

    // Detect critical conditions on d20 dice
    const d20Dice = lastRoll?.dice.filter((d) => d.type === "d20") ?? [];
    const hasCritHit = d20Dice.some((d) => d.value === 20 || d.isCriticalHit);
    const hasCritMiss = d20Dice.some((d) => d.value === 1 || d.isCriticalMiss);

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
          <span class="hud-total-caption">${isRolling ? "SIMULATING TOSS" : "TOTAL RESULT"}</span>
          
          ${
            isRolling
              ? `
                <div class="hud-rolling-view">
                  <div class="hud-tumbling-die" aria-hidden="true">
                    <div class="cube-spinner"></div>
                  </div>
                  <span class="hud-rolling-text">Rolling...</span>
                </div>
              `
              : `
                <div class="hud-total-number ${hasCritHit ? "crit-hit" : ""} ${hasCritMiss ? "crit-miss" : ""}">
                  ${lastRoll !== null ? lastRoll.total : "—"}
                </div>
              `
          }

          ${
            !isRolling && hasCritHit
              ? `<div class="crit-banner crit-hit-banner" role="status">
                  <span class="crit-sparkle">✨</span>
                  <span>NATURAL 20! CRITICAL HIT!</span>
                  <span class="crit-sparkle">✨</span>
                </div>`
              : ""
          }
          ${
            !isRolling && hasCritMiss
              ? `<div class="crit-banner crit-miss-banner" role="status">
                  <span class="crit-skull">💀</span>
                  <span>NATURAL 1! CRITICAL MISS!</span>
                </div>`
              : ""
          }
        </div>

        ${
          !isRolling && lastRoll && lastRoll.dice.length > 0
            ? `
              <div class="hud-formula-row">
                <span class="hud-formula-text">${lastRoll.formula || ""}</span>
              </div>
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
            : isRolling
              ? `
                <div class="hud-placeholder-hint rolling-hint">
                  Dice are tumbling in the tray...
                </div>
              `
              : `
                <div class="hud-placeholder-hint">
                  Select dice from toolbar and press Roll (Space)
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
      this.appState.onRollStateChange(() => {
        this.render();
      }),
      this.appState.onLastRollChange(() => this.render())
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
        max-width: 360px;
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
      .hud-status-indicator.status-preparing {
        background-color: var(--color-accent-gold);
      }
      .hud-status-indicator.status-rolling {
        background-color: var(--color-accent-gold);
        box-shadow: 0 0 8px var(--color-accent-gold);
        animation: pulse 0.8s infinite alternate;
      }
      .hud-status-indicator.status-settling {
        background-color: #38bdf8;
        box-shadow: 0 0 6px #38bdf8;
      }
      .hud-status-indicator.status-completed {
        background-color: var(--color-accent-emerald);
      }
      .hud-status-indicator.status-recovered {
        background-color: #f59e0b;
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
      .hud-rolling-view {
        display: flex;
        align-items: center;
        gap: 12px;
        margin: 8px 0;
      }
      .hud-tumbling-die {
        width: 24px;
        height: 24px;
        perspective: 100px;
      }
      .cube-spinner {
        width: 100%;
        height: 100%;
        background: linear-gradient(135deg, #f59e0b, #d97706);
        border-radius: 4px;
        animation: tumble 1.2s cubic-bezier(0.4, 0, 0.2, 1) infinite;
        box-shadow: 0 0 10px rgba(217, 119, 6, 0.5);
      }
      @keyframes tumble {
        0% { transform: rotate(0deg) rotateY(0deg); }
        50% { transform: rotate(180deg) rotateY(180deg); }
        100% { transform: rotate(360deg) rotateY(360deg); }
      }
      .hud-rolling-text {
        font-size: var(--font-size-lg);
        font-weight: 700;
        color: var(--color-accent-gold);
        letter-spacing: 0.05em;
        animation: pulse 0.8s infinite alternate;
      }
      .crit-banner {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: var(--font-size-xs);
        font-weight: 800;
        padding: 4px 12px;
        border-radius: var(--radius-full);
        margin-top: 6px;
        letter-spacing: 0.05em;
      }
      .crit-hit-banner {
        background: linear-gradient(90deg, rgba(245, 158, 11, 0.2) 0%, rgba(251, 191, 36, 0.35) 50%, rgba(245, 158, 11, 0.2) 100%);
        color: #fbbf24;
        border: 1px solid #f59e0b;
        box-shadow: 0 0 14px rgba(251, 191, 36, 0.4);
        position: relative;
        overflow: hidden;
      }
      .crit-hit-banner::after {
        content: "";
        position: absolute;
        top: -50%;
        left: -50%;
        width: 200%;
        height: 200%;
        background: linear-gradient(60deg, transparent 40%, rgba(255, 255, 255, 0.25) 50%, transparent 60%);
        animation: shimmer 2s infinite;
      }
      @keyframes shimmer {
        0% { transform: translateX(-100%); }
        100% { transform: translateX(100%); }
      }
      .crit-miss-banner {
        background: rgba(225, 29, 72, 0.25);
        color: #fb7185;
        border: 1px solid #e11d48;
        box-shadow: 0 0 12px rgba(225, 29, 72, 0.3);
      }
      .hud-formula-row {
        background: rgba(0, 0, 0, 0.25);
        border-radius: var(--radius-sm);
        padding: 4px 8px;
        margin-bottom: 8px;
        font-family: var(--font-family-mono);
        font-size: 0.72rem;
        color: var(--color-text-secondary);
        text-align: center;
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
