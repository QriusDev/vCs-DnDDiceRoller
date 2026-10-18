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
      <div class="help-modal-dialog glass-panel" role="dialog" aria-modal="true" aria-labelledby="helpModalTitle">
        <div class="help-header">
          <div class="help-title-group">
            <span class="help-icon">📖</span>
            <h2 id="helpModalTitle" class="help-title">User Guide & About</h2>
          </div>
          <button class="help-close-btn" type="button" aria-label="Close help">&times;</button>
        </div>

        <div class="help-body">
          <section class="help-section">
            <h3 class="help-section-title">Controls & Keyboard Shortcuts</h3>
            <ul class="help-list">
              <li><strong>Left-Click Toolbar Die:</strong> Add one die to the active tray pool.</li>
              <li><strong>Right-Click Toolbar Die:</strong> Remove one die from the tray pool.</li>
              <li><strong>Left-Click & Drag (in Tray):</strong> Pick up and toss an individual die.</li>
              <li><strong>Right-Click & Drag:</strong> Orbit and rotate the 3D camera around the tray.</li>
              <li><strong>Middle-Click & Drag:</strong> Pan camera view.</li>
              <li><strong>Scroll Wheel:</strong> Zoom in and out of the tray.</li>
              <li><strong>Spacebar:</strong> Roll all dice currently in the tray.</li>
              <li><strong>Escape:</strong> Close open modal dialog or history drawer.</li>
              <li><strong>F11:</strong> Toggle Fullscreen viewport mode.</li>
            </ul>
          </section>

          <section class="help-section">
            <h3 class="help-section-title">Rolling Modes</h3>
            <p class="help-text">
              <strong>Fair PRNG Target Landing (Default):</strong> authoritative rolls sampled via cryptographically secure
              <code>crypto.getRandomValues</code>, then simulated through natural tumbling dynamics to settle on the chosen face.
            </p>
            <p class="help-text" style="margin-top: 6px;">
              <strong>Pure Physics Simulation:</strong> free, chaotic rigid-body dynamics where the resting face after collision determines the final score.
            </p>
          </section>

          <section class="help-section">
            <h3 class="help-section-title">About D&D 3D Dice Roller</h3>
            <p class="help-text">
              <strong>Version:</strong> 1.0.0 (Release Edition)<br/>
              <strong>Engine:</strong> Three.js (WebGL PBR) + Cannon-es (Rigid-body dynamics)<br/>
              <strong>Desktop Shell:</strong> Tauri 2.x (Rust Backend) + TypeScript Frontend<br/>
              <strong>Audio Engine:</strong> Real-time Procedural Web Audio API Synthesis
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
    if (document.getElementById("help-modal-styles")) return;
    const style = document.createElement("style");
    style.id = "help-modal-styles";
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
    document.head.appendChild(style);
  }
}
