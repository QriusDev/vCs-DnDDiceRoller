export class HelpModal {
  readonly element: HTMLElement;
  private isOpen = false;

  constructor() {
    this.element = document.createElement("div");
    this.element.className = "help-modal-backdrop";
    this.element.hidden = true;

    this.render();
    this.attachStyles();
    this.setupListeners();
  }

  private render(): void {
    this.element.innerHTML = `
      <div class="help-modal-dialog glass-panel" role="dialog" aria-modal="true">
        <div class="help-header">
          <div class="help-title-group">
            <span class="help-icon">📖</span>
            <h2 class="help-title">D&D 3D Dice Roller Guide</h2>
          </div>
          <button class="help-close-btn" type="button" aria-label="Close help">&times;</button>
        </div>

        <div class="help-body">
          <section class="help-section">
            <h3 class="help-section-title">Controls & Keyboard Shortcuts</h3>
            <ul class="help-list">
              <li><strong>Left-Click Toolbar Die:</strong> Add one die to the active tray pool.</li>
              <li><strong>Right-Click Toolbar Die:</strong> Remove one die from the tray pool.</li>
              <li><strong>Spacebar:</strong> Roll all dice currently in the tray.</li>
              <li><strong>Escape:</strong> Close any open modal dialog or drawer.</li>
              <li><strong>F11:</strong> Toggle Fullscreen viewport mode.</li>
            </ul>
          </section>

          <section class="help-section">
            <h3 class="help-section-title">Technical Architecture</h3>
            <p class="help-text">
              Built on <strong>Tauri 2.x (Rust Shell)</strong>, <strong>Three.js (WebGL 3D Engine)</strong>,
              <strong>Cannon-es (Physics Simulation)</strong>, and <strong>TypeScript</strong>.
            </p>
          </section>
        </div>

        <div class="help-footer">
          <button class="footer-btn footer-btn-primary" id="helpDoneBtn" type="button">Close</button>
        </div>
      </div>
    `;
  }

  private setupListeners(): void {
    this.element.addEventListener("click", (e) => {
      const target = e.target as HTMLElement;
      if (
        target === this.element ||
        target.closest(".help-close-btn") ||
        target.closest("#helpDoneBtn")
      ) {
        this.close();
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
  }

  close(): void {
    this.isOpen = false;
    this.element.hidden = true;
  }

  private attachStyles(): void {
    const style = document.createElement("style");
    style.textContent = `
      .help-modal-backdrop {
        position: fixed;
        inset: 0;
        background-color: rgba(0, 0, 0, 0.7);
        backdrop-filter: blur(6px);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
        padding: var(--space-4);
        overflow-y: auto;
      }
      .help-modal-backdrop[hidden] {
        display: none !important;
      }
      .help-modal-dialog {
        width: 100%;
        max-width: 520px;
        max-height: min(88vh, calc(100vh - 32px));
        margin: auto;
        display: flex;
        flex-direction: column;
        background: var(--color-bg-surface);
        border: 1px solid var(--color-border-default);
        border-radius: var(--radius-lg);
        box-shadow: var(--shadow-lg);
        overflow: hidden;
      }
      .help-header {
        flex-shrink: 0;
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: var(--space-4) var(--space-5);
        border-bottom: 1px solid var(--color-border-subtle);
      }
      .help-title-group {
        display: flex;
        align-items: center;
        gap: var(--space-2);
      }
      .help-icon {
        font-size: 1.25rem;
      }
      .help-title {
        font-size: var(--font-size-base);
        font-weight: 700;
      }
      .help-close-btn {
        font-size: 1.5rem;
        color: var(--color-text-muted);
      }
      .help-close-btn:hover {
        color: var(--color-text-primary);
      }
      .help-body {
        padding: var(--space-5);
        overflow-y: auto;
        overflow-x: hidden;
        flex: 1 1 auto;
        min-height: 0;
        display: flex;
        flex-direction: column;
        gap: var(--space-4);
        scrollbar-width: thin;
        scrollbar-color: var(--color-border-hover) var(--color-bg-surface-elevated);
      }
      .help-body::-webkit-scrollbar {
        width: 8px;
      }
      .help-body::-webkit-scrollbar-track {
        background: var(--color-bg-surface-elevated);
        border-radius: var(--radius-full);
      }
      .help-body::-webkit-scrollbar-thumb {
        background: var(--color-border-hover);
        border-radius: var(--radius-full);
      }
      .help-body::-webkit-scrollbar-thumb:hover {
        background: var(--color-accent-gold);
      }
      .help-section-title {
        font-size: var(--font-size-sm);
        font-weight: 700;
        color: var(--color-accent-gold);
        margin-bottom: var(--space-2);
      }
      .help-list {
        list-style: none;
        display: flex;
        flex-direction: column;
        gap: 6px;
        font-size: var(--font-size-sm);
        color: var(--color-text-secondary);
      }
      .help-text {
        font-size: var(--font-size-sm);
        color: var(--color-text-secondary);
        line-height: 1.6;
      }
      .help-footer {
        flex-shrink: 0;
        padding: var(--space-4) var(--space-5);
        border-top: 1px solid var(--color-border-subtle);
        display: flex;
        justify-content: flex-end;
      }
    `;
    this.element.appendChild(style);
  }
}
