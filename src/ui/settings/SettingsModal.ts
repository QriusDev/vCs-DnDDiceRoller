import type { AppState } from "@/core/state/AppState";
import type {
  DiceGeometryStyle,
  DiceThemeId,
  RollMode,
  TrayMaterialId,
  TraySizePreset,
} from "@/types";
import { DICE_THEMES } from "@/config/themeConfig";
import { PHYSICS_BOUNDS } from "@/config/physicsConfig";
import { UI_ICONS } from "@/ui/icons";

export type SettingsTabId = "physics" | "models" | "audio";

export class SettingsModal {
  readonly element: HTMLElement;
  private readonly appState: AppState;
  private isOpen = false;
  private activeTab: SettingsTabId = "physics";

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
    const diceThemes = Object.values(DICE_THEMES);

    const trayMaterials: { id: TrayMaterialId; label: string; preview: string; desc: string }[] = [
      {
        id: "green-velvet",
        label: "Green Velvet",
        preview: "#14532d",
        desc: "Classic casino green cloth surface",
      },
      {
        id: "navy-velvet",
        label: "Navy Velvet",
        preview: "#1e3a8a",
        desc: "Rich midnight blue royal felt",
      },
      {
        id: "burgundy-velvet",
        label: "Burgundy Velvet",
        preview: "#881337",
        desc: "Deep crimson tavern plush felt",
      },
      {
        id: "dark-oak",
        label: "Dark Oak",
        preview: "#451a03",
        desc: "Rustic handcrafted hardwood grain",
      },
      {
        id: "stitched-leather",
        label: "Stitched Leather",
        preview: "#78350f",
        desc: "Heavy textured leather battlemat",
      },
    ];

    this.element.innerHTML = `
      <div class="settings-modal-dialog glass-panel" role="dialog" aria-modal="true" aria-labelledby="settingsTitle">
        <!-- Header -->
        <div class="settings-header">
          <div class="settings-title-group">
            <span class="settings-icon" aria-hidden="true">${UI_ICONS.settings}</span>
            <h2 id="settingsTitle" class="settings-title">Preferences</h2>
          </div>
          <button class="settings-close-btn" type="button" aria-label="Close preferences">&times;</button>
        </div>

        <!-- Tab Navigation -->
        <div class="settings-tabs" role="tablist" aria-label="Preferences Categories">
          <button 
            class="tab-btn ${this.activeTab === "physics" ? "active" : ""}" 
            role="tab" 
            aria-selected="${this.activeTab === "physics"}" 
            data-tab="physics"
            type="button"
          >
            Physics & Roll Behavior
          </button>
          <button 
            class="tab-btn ${this.activeTab === "models" ? "active" : ""}" 
            role="tab" 
            aria-selected="${this.activeTab === "models"}" 
            data-tab="models"
            type="button"
          >
            Dice Models & Designs
          </button>
          <button 
            class="tab-btn ${this.activeTab === "audio" ? "active" : ""}" 
            role="tab" 
            aria-selected="${this.activeTab === "audio"}" 
            data-tab="audio"
            type="button"
          >
            Audio & Sound FX
          </button>
        </div>

        <!-- Tab Body Content -->
        <div class="settings-body">
          ${
            this.activeTab === "physics"
              ? `
                <!-- TAB 1: PHYSICS & ROLL BEHAVIOR -->
                <section class="settings-section">
                  <h3 class="section-title">Rolling Behavior Mode</h3>
                  <p class="section-desc">Choose between Fair PRNG Target Landing or Pure Physics Simulation.</p>
                  <div class="style-cards-grid">
                    <label class="style-card-option ${settings.rollMode === "fair-rng" ? "selected" : ""}">
                      <input type="radio" name="roll-mode-setting" value="fair-rng" ${settings.rollMode === "fair-rng" ? "checked" : ""}>
                      <div class="style-card-content">
                        <span class="style-card-icon">🎯</span>
                        <div class="style-card-text">
                          <strong>Fair PRNG Target Landing (Default)</strong>
                          <span>crypto.getRandomValues determines result; dice tumble naturally to target</span>
                        </div>
                      </div>
                    </label>

                    <label class="style-card-option ${settings.rollMode === "physics" ? "selected" : ""}">
                      <input type="radio" name="roll-mode-setting" value="physics" ${settings.rollMode === "physics" ? "checked" : ""}>
                      <div class="style-card-content">
                        <span class="style-card-icon">🎲</span>
                        <div class="style-card-text">
                          <strong>Pure Physics Simulation</strong>
                          <span>Free chaotic tumbling; outcome determined strictly by resting face</span>
                        </div>
                      </div>
                    </label>
                  </div>
                </section>

                <section class="settings-section">
                  <h3 class="section-title">Dice Tray Dimensions</h3>
                  <p class="section-desc">Select the physical containment size preset for rolling.</p>
                  <div class="style-cards-grid" style="grid-template-columns: repeat(3, 1fr);">
                    <label class="style-card-option ${settings.traySize === "small" ? "selected" : ""}">
                      <input type="radio" name="tray-size-setting" value="small" ${settings.traySize === "small" ? "checked" : ""}>
                      <div class="style-card-content" style="padding: 10px; justify-content: center; text-align: center;">
                        <div class="style-card-text">
                          <strong>Small</strong>
                          <span>11 × 14 units</span>
                        </div>
                      </div>
                    </label>

                    <label class="style-card-option ${settings.traySize === "standard" ? "selected" : ""}">
                      <input type="radio" name="tray-size-setting" value="standard" ${settings.traySize === "standard" ? "checked" : ""}>
                      <div class="style-card-content" style="padding: 10px; justify-content: center; text-align: center;">
                        <div class="style-card-text">
                          <strong>Standard</strong>
                          <span>15 × 19 units</span>
                        </div>
                      </div>
                    </label>

                    <label class="style-card-option ${settings.traySize === "large" ? "selected" : ""}">
                      <input type="radio" name="tray-size-setting" value="large" ${settings.traySize === "large" ? "checked" : ""}>
                      <div class="style-card-content" style="padding: 10px; justify-content: center; text-align: center;">
                        <div class="style-card-text">
                          <strong>Large</strong>
                          <span>20 × 25 units</span>
                        </div>
                      </div>
                    </label>
                  </div>
                </section>

                <section class="settings-section">
                  <h3 class="section-title">Dynamics & Rigidbody Tuning</h3>
                  <p class="section-desc">Adjust throwing impulse strength, angular spin, gravity, and bounciness.</p>

                  <div class="setting-row">
                    <label for="impulseInput">Linear Throw Impulse (${PHYSICS_BOUNDS.linearImpulse.min} - ${PHYSICS_BOUNDS.linearImpulse.max} N·s)</label>
                    <div class="slider-wrapper">
                      <input type="range" id="impulseInput" min="${PHYSICS_BOUNDS.linearImpulse.min}" max="${PHYSICS_BOUNDS.linearImpulse.max}" step="1" value="${settings.physics.linearImpulseMax}">
                      <span class="slider-val" id="impulseVal">${settings.physics.linearImpulseMax} N·s</span>
                    </div>
                  </div>

                  <div class="setting-row">
                    <label for="spinInput">Angular Spin Intensity (${PHYSICS_BOUNDS.angularSpin.min} - ${PHYSICS_BOUNDS.angularSpin.max} rad/s)</label>
                    <div class="slider-wrapper">
                      <input type="range" id="spinInput" min="${PHYSICS_BOUNDS.angularSpin.min}" max="${PHYSICS_BOUNDS.angularSpin.max}" step="1" value="${settings.physics.angularSpinMax}">
                      <span class="slider-val" id="spinVal">${settings.physics.angularSpinMax} rad/s</span>
                    </div>
                  </div>

                  <div class="setting-row">
                    <label for="gravityInput">Gravity Magnitude (${PHYSICS_BOUNDS.gravityMagnitude.min} - ${PHYSICS_BOUNDS.gravityMagnitude.max} m/s²)</label>
                    <div class="slider-wrapper">
                      <input type="range" id="gravityInput" min="${PHYSICS_BOUNDS.gravityMagnitude.min}" max="${PHYSICS_BOUNDS.gravityMagnitude.max}" step="0.5" value="${settings.physics.gravityMagnitude}">
                      <span class="slider-val" id="gravityVal">${settings.physics.gravityMagnitude} m/s²</span>
                    </div>
                  </div>

                  <div class="setting-row">
                    <label for="restitutionInput">Restitution / Bounciness (${PHYSICS_BOUNDS.restitution.min} - ${PHYSICS_BOUNDS.restitution.max})</label>
                    <div class="slider-wrapper">
                      <input type="range" id="restitutionInput" min="${PHYSICS_BOUNDS.restitution.min}" max="${PHYSICS_BOUNDS.restitution.max}" step="0.05" value="${settings.physics.defaultRestitution}">
                      <span class="slider-val" id="restitutionVal">${settings.physics.defaultRestitution}</span>
                    </div>
                  </div>

                  <div class="setting-row">
                    <label for="frictionInput">Surface Friction (${PHYSICS_BOUNDS.friction.min} - ${PHYSICS_BOUNDS.friction.max})</label>
                    <div class="slider-wrapper">
                      <input type="range" id="frictionInput" min="${PHYSICS_BOUNDS.friction.min}" max="${PHYSICS_BOUNDS.friction.max}" step="0.05" value="${settings.physics.defaultFriction}">
                      <span class="slider-val" id="frictionVal">${settings.physics.defaultFriction}</span>
                    </div>
                  </div>
                </section>
              `
              : this.activeTab === "models"
                ? `
                <!-- TAB 2: DICE MODELS & DESIGNS -->
                <section class="settings-section">
                  <h3 class="section-title">3D Dice Geometry Style</h3>
                  <p class="section-desc">Select the physical edge and corner profile for polyhedral dice meshes.</p>
                  <div class="style-cards-grid">
                    <label class="style-card-option ${settings.diceGeometryStyle === "sharp" ? "selected" : ""}">
                      <input type="radio" name="dice-geom-style" value="sharp" ${settings.diceGeometryStyle === "sharp" ? "checked" : ""}>
                      <div class="style-card-content">
                        <span class="style-card-icon">💎</span>
                        <div class="style-card-text">
                          <strong>Sharp Edge</strong>
                          <span>Crisp artisan resin silhouettes, flat facet faces</span>
                        </div>
                      </div>
                    </label>

                    <label class="style-card-option ${settings.diceGeometryStyle === "rounded" ? "selected" : ""}">
                      <input type="radio" name="dice-geom-style" value="rounded" ${settings.diceGeometryStyle === "rounded" ? "checked" : ""}>
                      <div class="style-card-content">
                        <span class="style-card-icon">🎲</span>
                        <div class="style-card-text">
                          <strong>Rounded / Soft Edge</strong>
                          <span>Chamfered beveled edges, softened corners for smooth tumbling</span>
                        </div>
                      </div>
                    </label>
                  </div>
                </section>

                <section class="settings-section">
                  <h3 class="section-title">Dice Materials & Themes</h3>
                  <p class="section-desc">Select from six artisan material presets or customize specific colors below.</p>
                  <div class="dice-themes-grid">
                    ${diceThemes
                      .map(
                        (theme) => `
                      <label class="dice-theme-option ${settings.diceTheme === theme.id ? "selected" : ""}">
                        <input type="radio" name="dice-theme-preset" value="${theme.id}" ${settings.diceTheme === theme.id ? "checked" : ""}>
                        <div class="dice-theme-card">
                          <div class="swatch-container">
                            <span class="swatch-body" style="background-color: ${theme.bodyColor}"></span>
                            <span class="swatch-number" style="background-color: ${theme.numberColor}"></span>
                          </div>
                          <span class="dice-theme-name">${theme.label}</span>
                        </div>
                      </label>
                    `
                      )
                      .join("")}
                  </div>
                </section>

                <section class="settings-section">
                  <h3 class="section-title">Custom Dice Colors</h3>
                  <p class="section-desc">Override theme colors with your own custom resin body and numeral ink.</p>
                  <div class="custom-color-pickers">
                    <div class="color-picker-row">
                      <label for="customBodyColorInput">Custom Die Body Color:</label>
                      <div class="color-input-wrapper">
                        <input type="color" id="customBodyColorInput" value="${settings.customBodyColor || "#1e293b"}">
                        <span class="color-code" id="bodyColorCode">${settings.customBodyColor || "Default"}</span>
                      </div>
                    </div>
                    <div class="color-picker-row">
                      <label for="customNumberColorInput">Custom Numeral Ink Color:</label>
                      <div class="color-input-wrapper">
                        <input type="color" id="customNumberColorInput" value="${settings.customNumberColor || "#f8fafc"}">
                        <span class="color-code" id="numberColorCode">${settings.customNumberColor || "Default"}</span>
                      </div>
                    </div>
                  </div>
                </section>

                <section class="settings-section">
                  <h3 class="section-title">Tray Floor Material Preset</h3>
                  <p class="section-desc">Select the physical look and texture of the containment tray surface.</p>
                  <div class="tray-materials-grid">
                    ${trayMaterials
                      .map(
                        (mat) => `
                      <label class="tray-mat-option ${settings.trayMaterial === mat.id ? "selected" : ""}">
                        <input type="radio" name="tray-material-preset" value="${mat.id}" ${settings.trayMaterial === mat.id ? "checked" : ""}>
                        <div class="tray-mat-card">
                          <span class="tray-mat-preview" style="background-color: ${mat.preview};"></span>
                          <div class="tray-mat-info">
                            <strong>${mat.label}</strong>
                            <span>${mat.desc}</span>
                          </div>
                        </div>
                      </label>
                    `
                      )
                      .join("")}
                  </div>
                </section>
              `
                : `
                <!-- TAB 3: AUDIO & SOUND EFFECTS -->
                <section class="settings-section">
                  <h3 class="section-title">Volume & Audio Preferences</h3>
                  <p class="section-desc">Configure audio playback and sound effects volume levels.</p>

                  <div class="setting-row">
                    <label for="muteToggle">Mute All Audio</label>
                    <input type="checkbox" id="muteToggle" ${settings.audio.muted ? "checked" : ""}>
                  </div>

                  <div class="setting-row">
                    <label for="masterVolumeInput">Master Volume</label>
                    <div class="slider-wrapper">
                      <input type="range" id="masterVolumeInput" min="0" max="1" step="0.05" value="${settings.audio.masterVolume}" ${settings.audio.muted ? "disabled" : ""}>
                      <span class="slider-val" id="masterVolumeVal">${Math.round(settings.audio.masterVolume * 100)}%</span>
                    </div>
                  </div>

                  <div class="setting-row">
                    <label for="collisionSoundToggle">Collision Sound FX Enabled</label>
                    <input type="checkbox" id="collisionSoundToggle" ${settings.audio.collisionSoundsEnabled ? "checked" : ""} ${settings.audio.muted ? "disabled" : ""}>
                  </div>
                </section>

                <section class="settings-section">
                  <div class="audio-notice-box">
                    <div class="notice-header">
                      <span class="notice-icon">🔊</span>
                      <strong>Procedural Web Audio Synthesis Active</strong>
                    </div>
                    <p class="notice-text">
                      Sound effects are synthesized in real-time using the Web Audio API without pre-recorded audio files. Includes physics-driven impact intensity, material-specific damping (velvet, oak, leather), die-on-die clattering, and procedural fanfare/rumble for Natural 20s and Natural 1s.
                    </p>
                  </div>
                </section>
              `
          }
        </div>

        <!-- Footer -->
        <div class="settings-footer">
          <button class="footer-btn footer-btn-danger" id="resetDefaultsBtn" type="button" title="Reset all settings to default factory values">
            Reset to Defaults
          </button>
          <button class="footer-btn footer-btn-primary" id="settingsDoneBtn" type="button">
            Done
          </button>
        </div>
      </div>
    `;
  }

  private setupListeners(): void {
    // Close handlers
    this.element.addEventListener("click", (e) => {
      const target = e.target as HTMLElement;

      if (
        target === this.element ||
        target.closest(".settings-close-btn") ||
        target.closest("#settingsDoneBtn")
      ) {
        this.close();
        return;
      }

      // Tab navigation
      const tabBtn = target.closest<HTMLButtonElement>(".tab-btn");
      if (tabBtn && tabBtn.dataset.tab) {
        this.activeTab = tabBtn.dataset.tab as SettingsTabId;
        this.render();
        return;
      }

      // Reset to defaults
      if (target.closest("#resetDefaultsBtn")) {
        if (confirm("Reset all settings to their original factory defaults?")) {
          this.appState.resetSettingsToDefaults();
          this.render();
        }
        return;
      }
    });

    // Form controls and radiogroups
    this.element.addEventListener("change", (e) => {
      const target = e.target as HTMLInputElement;

      if (target.name === "roll-mode-setting") {
        const mode = target.value as RollMode;
        this.appState.setRollMode(mode);
        this.render();
        return;
      }

      if (target.name === "tray-size-setting") {
        const size = target.value as TraySizePreset;
        this.appState.setTraySize(size);
        this.render();
        return;
      }

      if (target.name === "dice-geom-style") {
        const style = target.value as DiceGeometryStyle;
        this.appState.setDiceGeometryStyle(style);
        this.render();
        return;
      }

      if (target.name === "dice-theme-preset") {
        const theme = target.value as DiceThemeId;
        this.appState.setDiceTheme(theme);
        this.render();
        return;
      }

      if (target.name === "tray-material-preset") {
        const mat = target.value as TrayMaterialId;
        this.appState.setTrayMaterial(mat);
        this.render();
        return;
      }

      if (target.id === "muteToggle") {
        this.appState.setMuted(target.checked);
        this.render();
        return;
      }

      if (target.id === "collisionSoundToggle") {
        this.appState.updateSettings((s) => ({
          ...s,
          audio: { ...s.audio, collisionSoundsEnabled: target.checked },
        }));
      }

      if (target.id === "customBodyColorInput") {
        this.appState.setCustomColors(target.value, undefined);
        const code = this.element.querySelector("#bodyColorCode");
        if (code) code.textContent = target.value;
      }

      if (target.id === "customNumberColorInput") {
        this.appState.setCustomColors(undefined, target.value);
        const code = this.element.querySelector("#numberColorCode");
        if (code) code.textContent = target.value;
      }
    });

    // Sliders
    this.element.addEventListener("input", (e) => {
      const target = e.target as HTMLInputElement;

      if (target.id === "masterVolumeInput") {
        const val = parseFloat(target.value);
        const display = this.element.querySelector("#masterVolumeVal");
        if (display) display.textContent = `${Math.round(val * 100)}%`;
        this.appState.setMasterVolume(val);
      }

      if (target.id === "impulseInput") {
        const val = parseFloat(target.value);
        const display = this.element.querySelector("#impulseVal");
        if (display) display.textContent = `${val} N·s`;
        this.appState.updateSettings((s) => ({
          ...s,
          physics: { ...s.physics, linearImpulseMax: val },
        }));
      }

      if (target.id === "spinInput") {
        const val = parseFloat(target.value);
        const display = this.element.querySelector("#spinVal");
        if (display) display.textContent = `${val} rad/s`;
        this.appState.updateSettings((s) => ({
          ...s,
          physics: { ...s.physics, angularSpinMax: val },
        }));
      }

      if (target.id === "gravityInput") {
        const val = parseFloat(target.value);
        const display = this.element.querySelector("#gravityVal");
        if (display) display.textContent = `${val} m/s²`;
        this.appState.updateSettings((s) => ({
          ...s,
          physics: {
            ...s.physics,
            gravityMagnitude: val,
            gravity: [0, -val, 0],
          },
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
    if (document.getElementById("settings-modal-styles")) return;
    const style = document.createElement("style");
    style.id = "settings-modal-styles";
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
        overflow-y: auto;
      }
      .settings-modal-backdrop[hidden] {
        display: none !important;
      }
      .settings-modal-dialog {
        width: 100%;
        max-width: 680px;
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
      .settings-header {
        flex-shrink: 0;
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
        display: flex;
        align-items: center;
        color: var(--color-accent-gold);
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
      .settings-tabs {
        display: flex;
        background: var(--color-bg-base);
        border-bottom: 1px solid var(--color-border-default);
        padding: 0 var(--space-4);
        gap: var(--space-2);
        flex-shrink: 0;
      }
      .tab-btn {
        padding: 10px 16px;
        font-size: var(--font-size-xs);
        font-weight: 600;
        color: var(--color-text-secondary);
        border-bottom: 2px solid transparent;
        transition: all var(--transition-fast);
      }
      .tab-btn:hover {
        color: var(--color-text-primary);
      }
      .tab-btn.active {
        color: var(--color-accent-gold);
        border-bottom-color: var(--color-accent-gold);
        font-weight: 700;
      }
      .settings-body {
        padding: var(--space-5);
        overflow-y: auto;
        overflow-x: hidden;
        flex: 1 1 auto;
        min-height: 0;
        display: flex;
        flex-direction: column;
        gap: var(--space-5);
        scrollbar-width: thin;
        scrollbar-color: var(--color-border-hover) var(--color-bg-surface-elevated);
      }
      .settings-body::-webkit-scrollbar {
        width: 8px;
      }
      .settings-body::-webkit-scrollbar-track {
        background: var(--color-bg-surface-elevated);
        border-radius: var(--radius-full);
      }
      .settings-body::-webkit-scrollbar-thumb {
        background: var(--color-border-hover);
        border-radius: var(--radius-full);
      }
      .settings-body::-webkit-scrollbar-thumb:hover {
        background: var(--color-accent-gold);
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
      .style-cards-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: var(--space-3);
      }
      .style-card-option input {
        display: none;
      }
      .style-card-content {
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: var(--space-3);
        padding: var(--space-3);
        background: var(--color-bg-surface-elevated);
        border: 2px solid transparent;
        border-radius: var(--radius-md);
        transition: all var(--transition-fast);
      }
      .style-card-option.selected .style-card-content {
        border-color: var(--color-accent-gold);
        background: rgba(217, 119, 6, 0.12);
      }
      .style-card-icon {
        font-size: 1.6rem;
      }
      .style-card-text {
        display: flex;
        flex-direction: column;
        gap: 2px;
      }
      .style-card-text strong {
        font-size: var(--font-size-sm);
        color: var(--color-text-primary);
      }
      .style-card-text span {
        font-size: 0.68rem;
        color: var(--color-text-muted);
        line-height: 1.3;
      }
      .dice-themes-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: var(--space-3);
      }
      .dice-theme-option input {
        display: none;
      }
      .dice-theme-card {
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
      .dice-theme-option.selected .dice-theme-card {
        border-color: var(--color-accent-gold);
        background: rgba(217, 119, 6, 0.12);
      }
      .swatch-container {
        position: relative;
        width: 38px;
        height: 24px;
        border-radius: var(--radius-sm);
        overflow: hidden;
        border: 1px solid rgba(255, 255, 255, 0.2);
      }
      .swatch-body {
        position: absolute;
        inset: 0;
      }
      .swatch-number {
        position: absolute;
        right: 4px;
        bottom: 4px;
        width: 10px;
        height: 10px;
        border-radius: var(--radius-full);
        border: 1px solid rgba(0, 0, 0, 0.5);
      }
      .dice-theme-name {
        font-size: 0.72rem;
        font-weight: 600;
        text-align: center;
      }
      .custom-color-pickers {
        display: flex;
        flex-direction: column;
        gap: var(--space-3);
        background: var(--color-bg-surface-elevated);
        padding: var(--space-3) var(--space-4);
        border-radius: var(--radius-md);
      }
      .color-picker-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
      }
      .color-picker-row label {
        font-size: var(--font-size-xs);
        font-weight: 600;
        color: var(--color-text-secondary);
      }
      .color-input-wrapper {
        display: flex;
        align-items: center;
        gap: var(--space-2);
      }
      .color-input-wrapper input[type="color"] {
        border: 1px solid var(--color-border-default);
        border-radius: var(--radius-sm);
        width: 32px;
        height: 28px;
        padding: 0;
        cursor: pointer;
        background: transparent;
      }
      .color-code {
        font-family: var(--font-family-mono);
        font-size: var(--font-size-xs);
        color: var(--color-text-muted);
      }
      .tray-materials-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: var(--space-3);
      }
      .tray-mat-option input {
        display: none;
      }
      .tray-mat-card {
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: var(--space-3);
        padding: var(--space-3);
        border-radius: var(--radius-md);
        background: var(--color-bg-surface-elevated);
        border: 2px solid transparent;
        transition: all var(--transition-fast);
      }
      .tray-mat-option.selected .tray-mat-card {
        border-color: var(--color-accent-gold);
        background: rgba(217, 119, 6, 0.12);
      }
      .tray-mat-preview {
        width: 34px;
        height: 34px;
        border-radius: var(--radius-md);
        border: 1px solid rgba(255, 255, 255, 0.2);
        flex-shrink: 0;
      }
      .tray-mat-info {
        display: flex;
        flex-direction: column;
        gap: 2px;
      }
      .tray-mat-info strong {
        font-size: var(--font-size-xs);
        color: var(--color-text-primary);
      }
      .tray-mat-info span {
        font-size: 0.65rem;
        color: var(--color-text-muted);
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
        min-width: 65px;
        text-align: right;
        color: var(--color-text-secondary);
      }
      .audio-notice-box {
        background: rgba(56, 189, 248, 0.1);
        border: 1px solid rgba(56, 189, 248, 0.3);
        border-radius: var(--radius-md);
        padding: var(--space-3) var(--space-4);
      }
      .notice-header {
        display: flex;
        align-items: center;
        gap: 8px;
        color: #38bdf8;
        font-size: var(--font-size-sm);
        margin-bottom: 6px;
      }
      .notice-text {
        font-size: var(--font-size-xs);
        color: var(--color-text-secondary);
        line-height: 1.5;
      }
      .settings-footer {
        flex-shrink: 0;
        padding: var(--space-4) var(--space-5);
        border-top: 1px solid var(--color-border-subtle);
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      .footer-btn-danger {
        background: rgba(225, 29, 72, 0.12);
        color: var(--color-accent-crimson);
        border: 1px solid rgba(225, 29, 72, 0.3);
        padding: 6px 14px;
        font-size: var(--font-size-xs);
        font-weight: 600;
        border-radius: var(--radius-md);
        transition: all var(--transition-fast);
      }
      .footer-btn-danger:hover {
        background: var(--color-accent-crimson);
        color: #fff;
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
    document.head.appendChild(style);
  }
}
