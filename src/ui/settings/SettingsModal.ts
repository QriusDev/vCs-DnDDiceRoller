import type { AppState } from "@/core/state/AppState";
import type { VisualThemeId } from "@/types";

export class SettingsModal {
  readonly element: HTMLElement;
  private readonly appState: AppState;
  private isOpen = false;

  constructor(appState: AppState) {
    this.appState = appState;
    this.element = document.createElement("div");
    this.element.className = "settings-modal-backdrop";
    this.element.hidden = true;

    this.render();
    this.attachStyles();
    this.setupListeners();
  }

  private render(): void {
    const settings = this.appState.getSettings();

    this.element.innerHTML = `
      <div class="settings-modal-dialog glass-panel" role="dialog" aria-modal="true" aria-labelledby="settingsTitle">
        <div class="settings-header">
          <div class="settings-title-group">
            <span class="settings-icon">⚙️</span>
            <h2 id="settingsTitle" class="settings-title">Application Settings</h2>
          </div>
          <button class="settings-close-btn" type="button" aria-label="Close settings">&times;</button>
        </div>

        <div class="settings-body">
          <!-- Visual Theme Section -->
          <section class="settings-section">
            <h3 class="section-title">Visual Theme</h3>
            <p class="section-desc">Select the aesthetic appearance of the dice tray and tabletop environment.</p>
            <div class="theme-options">
              <label class="theme-option ${settings.theme === "dark-slate" ? "selected" : ""}">
                <input type="radio" name="app-theme" value="dark-slate" ${settings.theme === "dark-slate" ? "checked" : ""}>
                <div class="theme-card">
                  <span class="theme-preview slate-preview"></span>
                  <span class="theme-name">Dark Slate (Default)</span>
                </div>
              </label>
              <label class="theme-option ${settings.theme === "classic-felt" ? "selected" : ""}">
                <input type="radio" name="app-theme" value="classic-felt" ${settings.theme === "classic-felt" ? "checked" : ""}>
                <div class="theme-card">
                  <span class="theme-preview felt-preview"></span>
                  <span class="theme-name">Classic Emerald Felt</span>
                </div>
              </label>
              <label class="theme-option ${settings.theme === "obsidian-gold" ? "selected" : ""}">
                <input type="radio" name="app-theme" value="obsidian-gold" ${settings.theme === "obsidian-gold" ? "checked" : ""}>
                <div class="theme-card">
                  <span class="theme-preview obsidian-preview"></span>
                  <span class="theme-name">Obsidian & Gold</span>
                </div>
              </label>
            </div>
          </section>

          <!-- Audio Preferences Section -->
          <section class="settings-section">
            <h3 class="section-title">Audio & Sound FX</h3>
            <p class="section-desc">Procedural dice collision synthesis is scheduled for Phase 4.</p>
            
            <div class="setting-row">
              <label for="masterVolumeInput">Master Volume</label>
              <div class="slider-wrapper">
                <input type="range" id="masterVolumeInput" min="0" max="1" step="0.05" value="${settings.audio.masterVolume}">
                <span class="slider-val" id="masterVolumeVal">${Math.round(settings.audio.masterVolume * 100)}%</span>
              </div>
            </div>

            <div class="setting-row">
              <label for="collisionSoundToggle">Collision Sound FX</label>
              <input type="checkbox" id="collisionSoundToggle" ${settings.audio.collisionSoundsEnabled ? "checked" : ""}>
            </div>
          </section>

          <!-- Physics Configuration Section -->
          <section class="settings-section">
            <h3 class="section-title">Physics Simulation</h3>
            <p class="section-desc">Tune Cannon-es rigid body dynamics and surface elasticity.</p>

            <div class="setting-row">
              <label for="restitutionInput">Restitution (Bounciness)</label>
              <div class="slider-wrapper">
                <input type="range" id="restitutionInput" min="0.1" max="0.9" step="0.05" value="${settings.physics.defaultRestitution}">
                <span class="slider-val" id="restitutionVal">${settings.physics.defaultRestitution}</span>
              </div>
            </div>

            <div class="setting-row">
              <label for="frictionInput">Surface Friction</label>
              <div class="slider-wrapper">
                <input type="range" id="frictionInput" min="0.05" max="0.8" step="0.05" value="${settings.physics.defaultFriction}">
                <span class="slider-val" id="frictionVal">${settings.physics.defaultFriction}</span>
              </div>
            </div>
          </section>

          <!-- Project Information -->
          <section class="settings-section">
            <h3 class="section-title">Phase Roadmap & Architecture</h3>
            <div class="roadmap-box">
              <div class="roadmap-item active"><strong>Phase 1:</strong> Application Foundation & 3D Tray Shell (Active)</div>
              <div class="roadmap-item"><strong>Phase 2:</strong> Polyhedral 3D Dice Geometries & Face Reading</div>
              <div class="roadmap-item"><strong>Phase 3:</strong> Rigid Body Physics Integration & Collisions</div>
              <div class="roadmap-item"><strong>Phase 4:</strong> Procedural Audio Synthesis & Visual Themes</div>
              <div class="roadmap-item"><strong>Phase 5:</strong> Portable Executable Distribution & Polish</div>
            </div>
          </section>
        </div>

        <div class="settings-footer">
          <button class="footer-btn footer-btn-primary" id="saveAndCloseBtn" type="button">Done</button>
        </div>
      </div>
    `;
  }

  private setupListeners(): void {
    // Backdrop click to close
    this.element.addEventListener("click", (e) => {
      if (e.target === this.element) {
        this.close();
      }
    });

    // Close button
    this.element.addEventListener("click", (e) => {
      const target = e.target as HTMLElement;
      if (target.closest(".settings-close-btn") || target.closest("#saveAndCloseBtn")) {
        this.close();
      }
    });

    // Theme change
    this.element.addEventListener("change", (e) => {
      const target = e.target as HTMLInputElement;
      if (target.name === "app-theme") {
        const theme = target.value as VisualThemeId;
        this.appState.updateSettings((s) => ({ ...s, theme }));
        this.render();
      }
    });

    // Master volume slider
    this.element.addEventListener("input", (e) => {
      const target = e.target as HTMLInputElement;
      if (target.id === "masterVolumeInput") {
        const val = parseFloat(target.value);
        const display = this.element.querySelector("#masterVolumeVal");
        if (display) display.textContent = `${Math.round(val * 100)}%`;
        this.appState.updateSettings((s) => ({
          ...s,
          audio: { ...s.audio, masterVolume: val },
        }));
      }

      if (target.id === "restitutionInput") {
        const val = parseFloat(target.value);
        const display = this.element.querySelector("#restitutionVal");
        if (display) display.textContent = `${val}`;
        this.appState.updateSettings((s) => ({
          ...s,
          physics: { ...s.physics, defaultRestitution: val },
        }));
      }

      if (target.id === "frictionInput") {
        const val = parseFloat(target.value);
        const display = this.element.querySelector("#frictionVal");
        if (display) display.textContent = `${val}`;
        this.appState.updateSettings((s) => ({
          ...s,
          physics: { ...s.physics, defaultFriction: val },
        }));
      }
    });

    // Collision sound toggle
    this.element.addEventListener("change", (e) => {
      const target = e.target as HTMLInputElement;
      if (target.id === "collisionSoundToggle") {
        this.appState.updateSettings((s) => ({
          ...s,
          audio: { ...s.audio, collisionSoundsEnabled: target.checked },
        }));
      }
    });

    // Escape key
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
      .settings-modal-backdrop {
        position: fixed;
        inset: 0;
        background-color: rgba(0, 0, 0, 0.7);
        backdrop-filter: blur(6px);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
        padding: var(--space-4);
      }
      .settings-modal-backdrop[hidden] {
        display: none !important;
      }
      .settings-modal-dialog {
        width: 100%;
        max-width: 580px;
        max-height: 85vh;
        display: flex;
        flex-direction: column;
        background: var(--color-bg-surface);
        border: 1px solid var(--color-border-default);
        border-radius: var(--radius-lg);
        box-shadow: var(--shadow-lg);
        overflow: hidden;
      }
      .settings-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: var(--space-4) var(--space-5);
        border-bottom: 1px solid var(--color-border-subtle);
      }
      .settings-title-group {
        display: flex;
        align-items: center;
        gap: var(--space-2);
      }
      .settings-icon {
        font-size: 1.25rem;
      }
      .settings-title {
        font-size: var(--font-size-base);
        font-weight: 700;
        color: var(--color-text-primary);
      }
      .settings-close-btn {
        font-size: 1.5rem;
        color: var(--color-text-muted);
        padding: 0 4px;
        transition: color var(--transition-fast);
      }
      .settings-close-btn:hover {
        color: var(--color-text-primary);
      }
      .settings-body {
        padding: var(--space-5);
        overflow-y: auto;
        display: flex;
        flex-direction: column;
        gap: var(--space-6);
      }
      .settings-section {
        display: flex;
        flex-direction: column;
        gap: var(--space-2);
      }
      .section-title {
        font-size: var(--font-size-sm);
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        color: var(--color-accent-gold);
      }
      .section-desc {
        font-size: var(--font-size-xs);
        color: var(--color-text-muted);
        margin-bottom: var(--space-2);
      }
      .theme-options {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: var(--space-3);
      }
      .theme-option input {
        display: none;
      }
      .theme-card {
        cursor: pointer;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 8px;
        padding: var(--space-3);
        border-radius: var(--radius-md);
        background: var(--color-bg-surface-elevated);
        border: 2px solid transparent;
        transition: all var(--transition-fast);
      }
      .theme-option.selected .theme-card {
        border-color: var(--color-accent-gold);
        background: rgba(217, 119, 6, 0.1);
      }
      .theme-preview {
        width: 36px;
        height: 24px;
        border-radius: var(--radius-sm);
        border: 1px solid rgba(255, 255, 255, 0.2);
      }
      .slate-preview { background: #0f172a; }
      .felt-preview { background: #064e3b; }
      .obsidian-preview { background: #18181b; }
      .theme-name {
        font-size: 0.7rem;
        font-weight: 600;
        text-align: center;
      }
      .setting-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: var(--space-2) 0;
        font-size: var(--font-size-sm);
      }
      .slider-wrapper {
        display: flex;
        align-items: center;
        gap: var(--space-3);
      }
      .slider-wrapper input[type="range"] {
        accent-color: var(--color-accent-gold);
      }
      .slider-val {
        font-family: var(--font-family-mono);
        font-size: var(--font-size-xs);
        min-width: 40px;
        text-align: right;
        color: var(--color-text-secondary);
      }
      .roadmap-box {
        background: var(--color-bg-base);
        border: 1px solid var(--color-border-subtle);
        border-radius: var(--radius-md);
        padding: var(--space-3);
        font-size: var(--font-size-xs);
        display: flex;
        flex-direction: column;
        gap: 6px;
      }
      .roadmap-item {
        color: var(--color-text-muted);
      }
      .roadmap-item.active {
        color: var(--color-accent-gold);
      }
      .settings-footer {
        padding: var(--space-4) var(--space-5);
        border-top: 1px solid var(--color-border-subtle);
        display: flex;
        justify-content: flex-end;
      }
      .footer-btn-primary {
        background: var(--color-accent-gold);
        color: #000;
        font-weight: 700;
        padding: 6px 20px;
        border-radius: var(--radius-md);
      }
      .footer-btn-primary:hover {
        background: var(--color-accent-gold-hover);
      }
    `;
    this.element.appendChild(style);
  }
}
