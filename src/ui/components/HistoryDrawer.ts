import type { AppState } from "@/core/state/AppState";

export class HistoryDrawer {
  readonly element: HTMLElement;
  private readonly appState: AppState;
  private isOpen = false;

  constructor(appState: AppState) {
    this.appState = appState;
    this.element = document.createElement("div");
    this.element.className = "history-drawer-backdrop";
    this.element.hidden = true;

    this.render();
    this.attachStyles();
    this.setupListeners();
  }

  private render(): void {
    const history = this.appState.getHistory();

    this.element.innerHTML = `
      <div class="history-drawer-panel glass-panel">
        <div class="history-header">
          <div class="history-title-group">
            <span class="history-icon">📜</span>
            <h2 class="history-title">Roll History</h2>
            <span class="badge">${history.length} Rolls</span>
          </div>
          <div class="history-header-actions">
            ${
              history.length > 0
                ? `<button class="clear-history-btn" id="clearHistoryBtn" type="button">Clear</button>`
                : ""
            }
            <button class="history-close-btn" type="button" aria-label="Close history">&times;</button>
          </div>
        </div>

        <div class="history-body">
          ${
            history.length === 0
              ? `
                <div class="history-empty">
                  <span>🎲</span>
                  <p>No rolls recorded yet. Roll some dice in the tray!</p>
                </div>
              `
              : `
                <div class="history-list">
                  ${history
                    .map((entry) => {
                      const timeStr = new Date(entry.timestamp).toLocaleTimeString();
                      const hasCrit = entry.dice.some((d) => d.isCriticalHit);
                      const hasMiss = entry.dice.some((d) => d.isCriticalMiss);

                      return `
                        <div class="history-item">
                          <div class="history-item-top">
                            <span class="history-timestamp">${timeStr}</span>
                            <div class="history-item-total ${hasCrit ? "crit-hit" : ""} ${hasMiss ? "crit-miss" : ""}">
                              Total: <strong>${entry.total}</strong>
                            </div>
                          </div>
                          <div class="history-item-dice">
                            ${entry.dice
                              .map(
                                (d) => `
                              <span class="history-die-tag ${d.isCriticalHit ? "tag-crit" : ""} ${d.isCriticalMiss ? "tag-miss" : ""}">
                                ${d.type.toUpperCase()}: <strong>${d.value}</strong>
                              </span>
                            `
                              )
                              .join("")}
                          </div>
                        </div>
                      `;
                    })
                    .join("")}
                </div>
              `
          }
        </div>
      </div>
    `;
  }

  private setupListeners(): void {
    this.element.addEventListener("click", (e) => {
      const target = e.target as HTMLElement;
      if (target === this.element || target.closest(".history-close-btn")) {
        this.close();
      }
      if (target.closest("#clearHistoryBtn")) {
        this.appState.clearHistory();
        this.render();
      }
    });

    window.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && this.isOpen) {
        this.close();
      }
    });
  }

  open(): void {
    this.isOpen = true;
    this.element.hidden = false;
    this.render();
  }

  close(): void {
    this.isOpen = false;
    this.element.hidden = true;
  }

  private attachStyles(): void {
    const style = document.createElement("style");
    style.textContent = `
      .history-drawer-backdrop {
        position: fixed;
        inset: 0;
        background-color: rgba(0, 0, 0, 0.7);
        backdrop-filter: blur(6px);
        display: flex;
        align-items: center;
        justify-content: flex-end;
        z-index: 1000;
      }
      .history-drawer-panel {
        width: 100%;
        max-width: 420px;
        height: 100%;
        display: flex;
        flex-direction: column;
        border-radius: 0;
        border-left: 1px solid var(--color-border-default);
      }
      .history-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: var(--space-4) var(--space-5);
        border-bottom: 1px solid var(--color-border-subtle);
      }
      .history-title-group {
        display: flex;
        align-items: center;
        gap: var(--space-2);
      }
      .history-icon {
        font-size: 1.25rem;
      }
      .history-title {
        font-size: var(--font-size-base);
        font-weight: 700;
        color: var(--color-text-primary);
      }
      .history-header-actions {
        display: flex;
        align-items: center;
        gap: var(--space-3);
      }
      .clear-history-btn {
        font-size: var(--font-size-xs);
        color: var(--color-text-muted);
        padding: 2px 8px;
        border: 1px solid var(--color-border-subtle);
        border-radius: var(--radius-sm);
        transition: all var(--transition-fast);
      }
      .clear-history-btn:hover {
        color: var(--color-accent-crimson);
        border-color: var(--color-accent-crimson);
      }
      .history-close-btn {
        font-size: 1.5rem;
        color: var(--color-text-muted);
      }
      .history-close-btn:hover {
        color: var(--color-text-primary);
      }
      .history-body {
        flex: 1;
        overflow-y: auto;
        padding: var(--space-4);
      }
      .history-empty {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        height: 60%;
        color: var(--color-text-muted);
        text-align: center;
        gap: var(--space-3);
      }
      .history-empty span {
        font-size: 2.5rem;
        opacity: 0.5;
      }
      .history-list {
        display: flex;
        flex-direction: column;
        gap: var(--space-3);
      }
      .history-item {
        background: var(--color-bg-surface-elevated);
        border: 1px solid var(--color-border-subtle);
        border-radius: var(--radius-md);
        padding: var(--space-3);
        display: flex;
        flex-direction: column;
        gap: 6px;
      }
      .history-item-top {
        display: flex;
        align-items: center;
        justify-content: space-between;
      }
      .history-timestamp {
        font-size: var(--font-size-xs);
        color: var(--color-text-muted);
      }
      .history-item-total {
        font-size: var(--font-size-sm);
        color: var(--color-text-primary);
      }
      .history-item-total.crit-hit {
        color: #fbbf24;
      }
      .history-item-total.crit-miss {
        color: #f43f5e;
      }
      .history-item-dice {
        display: flex;
        flex-wrap: wrap;
        gap: 4px;
      }
      .history-die-tag {
        font-size: 0.7rem;
        padding: 2px 6px;
        background: var(--color-bg-surface);
        border: 1px solid var(--color-border-default);
        border-radius: var(--radius-sm);
      }
      .history-die-tag.tag-crit {
        border-color: #f59e0b;
        color: #fbbf24;
      }
      .history-die-tag.tag-miss {
        border-color: #e11d48;
        color: #fb7185;
      }
    `;
    this.element.appendChild(style);
  }
}
