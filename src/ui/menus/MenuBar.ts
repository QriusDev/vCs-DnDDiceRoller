export interface MenuBarCallbacks {
  onOpenSettings: () => void;
  onOpenHelp: () => void;
  onResetCamera: () => void;
  onToggleHistory: () => void;
  onClearTray: () => void;
}

export class MenuBar {
  readonly element: HTMLElement;
  private activeDropdown: HTMLElement | null = null;

  constructor(callbacks: MenuBarCallbacks) {
    this.element = document.createElement("header");
    this.element.className = "app-menu-bar";
    this.element.innerHTML = `
      <div class="menu-brand">
        <span class="brand-icon">🎲</span>
        <span class="brand-title">D&D 3D Dice Roller</span>
        <span class="badge badge-placeholder">v1.0.0</span>
      </div>
      <nav class="menu-nav">
        <!-- File Menu -->
        <div class="menu-item" data-menu="file">
          <button class="menu-button" type="button" aria-haspopup="true" aria-expanded="false">File</button>
          <div class="menu-dropdown" hidden>
            <button class="menu-dropdown-item" type="button" data-action="clear-tray">Clear Tray</button>
            <div class="menu-divider"></div>
            <button class="menu-dropdown-item" type="button" data-action="exit">Exit</button>
          </div>
        </div>

        <!-- View Menu -->
        <div class="menu-item" data-menu="view">
          <button class="menu-button" type="button" aria-haspopup="true" aria-expanded="false">View</button>
          <div class="menu-dropdown" hidden>
            <button class="menu-dropdown-item" type="button" data-action="reset-camera">Reset Camera View</button>
            <button class="menu-dropdown-item" type="button" data-action="toggle-history">Toggle Roll History</button>
            <div class="menu-divider"></div>
            <button class="menu-dropdown-item" type="button" data-action="fullscreen">Toggle Fullscreen</button>
          </div>
        </div>

        <!-- Settings Menu -->
        <div class="menu-item" data-menu="settings">
          <button class="menu-button" type="button" aria-haspopup="true" aria-expanded="false">Settings</button>
          <div class="menu-dropdown" hidden>
            <button class="menu-dropdown-item" type="button" data-action="open-settings">Preferences...</button>
          </div>
        </div>

        <!-- Help Menu -->
        <div class="menu-item" data-menu="help">
          <button class="menu-button" type="button" aria-haspopup="true" aria-expanded="false">Help</button>
          <div class="menu-dropdown" hidden>
            <button class="menu-dropdown-item" type="button" data-action="open-help">User Guide & About</button>
          </div>
        </div>
      </nav>
      <div class="menu-meta">
        <span class="system-status"><span class="status-dot"></span> Three.js + Cannon-es Ready</span>
      </div>
    `;

    this.attachStyles();
    this.setupListeners(callbacks);
  }

  private setupListeners(callbacks: MenuBarCallbacks): void {
    // Menu interactions
    this.element.addEventListener("click", (e) => {
      const target = e.target as HTMLElement;
      const button = target.closest("button");
      if (!button) return;

      const action = button.dataset.action;
      if (action === "clear-tray") {
        callbacks.onClearTray();
        this.closeAllDropdowns();
        return;
      }

      if (action === "reset-camera") {
        callbacks.onResetCamera();
        this.closeAllDropdowns();
        return;
      }

      if (action === "toggle-history") {
        callbacks.onToggleHistory();
        this.closeAllDropdowns();
        return;
      }

      if (action === "open-settings") {
        callbacks.onOpenSettings();
        this.closeAllDropdowns();
        return;
      }

      if (action === "open-help") {
        callbacks.onOpenHelp();
        this.closeAllDropdowns();
        return;
      }

      if (action === "fullscreen") {
        if (!document.fullscreenElement) {
          document.documentElement.requestFullscreen().catch(() => {});
        } else {
          document.exitFullscreen().catch(() => {});
        }
        this.closeAllDropdowns();
        return;
      }

      if (action === "exit") {
        window.close();
        return;
      }

      const menuItem = button.closest(".menu-item");
      if (menuItem) {
        const dropdown = menuItem.querySelector<HTMLElement>(".menu-dropdown");
        if (dropdown) {
          e.stopPropagation();
          const isOpen = !dropdown.hidden;
          this.closeAllDropdowns();
          dropdown.hidden = isOpen;
          button.setAttribute("aria-expanded", String(!isOpen));
          if (!isOpen) {
            this.activeDropdown = dropdown;
          }
        }
      }
    });

    // Close on outside click
    document.addEventListener("click", (e) => {
      if (this.activeDropdown && !this.element.contains(e.target as Node)) {
        this.closeAllDropdowns();
      }
    });
  }

  private closeAllDropdowns(): void {
    const dropdowns = this.element.querySelectorAll<HTMLElement>(".menu-dropdown");
    dropdowns.forEach((d) => (d.hidden = true));
    const buttons = this.element.querySelectorAll<HTMLButtonElement>(".menu-button");
    buttons.forEach((b) => b.setAttribute("aria-expanded", "false"));
    this.activeDropdown = null;
  }

  private attachStyles(): void {
    if (document.getElementById("menu-bar-styles")) return;
    const style = document.createElement("style");
    style.id = "menu-bar-styles";
    style.textContent = `
      .app-menu-bar {
        display: flex;
        align-items: center;
        justify-content: space-between;
        height: 40px;
        background-color: var(--color-bg-surface);
        border-bottom: 1px solid var(--color-border-subtle);
        padding: 0 var(--space-4);
        z-index: 50;
        user-select: none;
      }
      .menu-brand {
        display: flex;
        align-items: center;
        gap: var(--space-2);
      }
      .brand-icon {
        font-size: var(--font-size-base);
      }
      .brand-title {
        font-weight: 700;
        font-size: var(--font-size-sm);
        letter-spacing: 0.02em;
        color: var(--color-text-primary);
      }
      .menu-nav {
        display: flex;
        align-items: center;
        gap: var(--space-1);
      }
      .menu-item {
        position: relative;
      }
      .menu-button {
        padding: 4px 10px;
        font-size: var(--font-size-sm);
        color: var(--color-text-secondary);
        border-radius: var(--radius-sm);
        transition: background-color var(--transition-fast), color var(--transition-fast);
      }
      .menu-button:hover {
        background-color: var(--color-bg-surface-elevated);
        color: var(--color-text-primary);
      }
      .menu-dropdown {
        position: absolute;
        top: 100%;
        left: 0;
        margin-top: 4px;
        background: var(--color-bg-surface-overlay);
        backdrop-filter: blur(12px);
        border: 1px solid var(--color-border-default);
        border-radius: var(--radius-md);
        box-shadow: var(--shadow-lg);
        min-width: 190px;
        padding: var(--space-1) 0;
        display: flex;
        flex-direction: column;
        z-index: 100;
      }
      .menu-dropdown-item {
        padding: 6px var(--space-3);
        font-size: var(--font-size-xs);
        color: var(--color-text-primary);
        display: flex;
        align-items: center;
        justify-content: space-between;
        width: 100%;
        text-align: left;
        transition: background-color var(--transition-fast);
      }
      .menu-dropdown-item:hover:not(:disabled) {
        background-color: var(--color-accent-gold);
        color: #000;
      }
      .menu-divider {
        height: 1px;
        background-color: var(--color-border-subtle);
        margin: var(--space-1) 0;
      }
      .menu-meta {
        font-size: var(--font-size-xs);
        color: var(--color-text-muted);
      }
      .system-status {
        display: flex;
        align-items: center;
        gap: 6px;
      }
      .status-dot {
        width: 8px;
        height: 8px;
        border-radius: var(--radius-full);
        background-color: var(--color-accent-emerald);
        box-shadow: 0 0 6px var(--color-accent-emerald);
      }
    `;
    document.head.appendChild(style);
  }
}
