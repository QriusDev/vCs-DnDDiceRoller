import { AppState } from "@/core/state/AppState";
import { SceneManager } from "@/rendering/scene/SceneManager";
import { MenuBar } from "@/ui/menus/MenuBar";
import { DiceToolbar } from "@/ui/components/DiceToolbar";
import { ResultHud } from "@/ui/components/ResultHud";
import { FooterControls } from "@/ui/components/FooterControls";
import { SettingsModal } from "@/ui/settings/SettingsModal";
import { HistoryDrawer } from "@/ui/components/HistoryDrawer";
import { HelpModal } from "@/ui/components/HelpModal";

export class App {
  private readonly root: HTMLElement;
  private appState: AppState | null = null;
  private sceneManager: SceneManager | null = null;
  private menuBar: MenuBar | null = null;
  private diceToolbar: DiceToolbar | null = null;
  private resultHud: ResultHud | null = null;
  private footerControls: FooterControls | null = null;
  private settingsModal: SettingsModal | null = null;
  private historyDrawer: HistoryDrawer | null = null;
  private helpModal: HelpModal | null = null;
  private viewportEl: HTMLElement | null = null;

  constructor(root: HTMLElement) {
    this.root = root;
  }

  async initialize(): Promise<void> {
    try {
      this.root.innerHTML = "";

      // 1. Initialize State
      this.appState = new AppState();

      // 2. Build DOM shell
      this.menuBar = new MenuBar({
        onOpenSettings: () => this.settingsModal?.open(),
        onOpenHelp: () => this.helpModal?.open(),
      });
      this.root.appendChild(this.menuBar.element);

      this.diceToolbar = new DiceToolbar(this.appState);
      this.root.appendChild(this.diceToolbar.element);

      // Central 3D Viewport container
      this.viewportEl = document.createElement("main");
      this.viewportEl.className = "three-viewport-container";
      this.viewportEl.style.cssText = `
        position: relative;
        flex: 1;
        width: 100%;
        height: 100%;
        overflow: hidden;
      `;
      this.root.appendChild(this.viewportEl);

      // Overlays
      this.resultHud = new ResultHud(this.appState);
      this.viewportEl.appendChild(this.resultHud.element);

      this.historyDrawer = new HistoryDrawer(this.appState);
      this.root.appendChild(this.historyDrawer.element);

      this.settingsModal = new SettingsModal(this.appState);
      this.root.appendChild(this.settingsModal.element);

      this.helpModal = new HelpModal();
      this.root.appendChild(this.helpModal.element);

      this.footerControls = new FooterControls(this.appState, {
        onOpenHistory: () => this.historyDrawer?.open(),
      });
      this.root.appendChild(this.footerControls.element);

      // 3. Initialize Three.js 3D Scene
      this.sceneManager = new SceneManager(this.viewportEl, this.appState.getSettings());

      // 4. React to Theme and Style updates in real-time
      this.appState.onSettingsChange((newSettings, oldSettings) => {
        if (!this.sceneManager) return;
        if (newSettings.diceGeometryStyle !== oldSettings.diceGeometryStyle) {
          this.sceneManager.updateGeometryStyle(newSettings.diceGeometryStyle);
        }
        if (newSettings.diceTheme !== oldSettings.diceTheme) {
          this.sceneManager.updateTheme(newSettings.diceTheme);
        }
      });
    } catch (err) {
      console.error("Critical failure during App initialization:", err);
      this.renderErrorFallback(err instanceof Error ? err.message : String(err));
    }
  }

  private renderErrorFallback(errorMessage: string): void {
    this.root.innerHTML = `
      <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;padding:2rem;text-align:center;background:#090d16;color:#f8fafc;">
        <h1 style="color:#e11d48;margin-bottom:1rem;font-size:1.8rem;">Application Initialization Error</h1>
        <p style="color:#94a3b8;max-width:500px;margin-bottom:1.5rem;line-height:1.6;">
          An unexpected error occurred while initializing the 3D graphics environment or desktop shell.
        </p>
        <pre style="background:#0f172a;border:1px solid #334155;padding:1rem;border-radius:8px;font-size:0.85rem;color:#fbbf24;max-width:600px;overflow-x:auto;margin-bottom:1.5rem;">${errorMessage}</pre>
        <button onclick="window.location.reload()" style="background:#d97706;color:#000;font-weight:700;padding:10px 24px;border-radius:6px;border:none;cursor:pointer;">
          Retry Application Launch
        </button>
      </div>
    `;
  }

  dispose(): void {
    if (this.sceneManager) {
      this.sceneManager.dispose();
      this.sceneManager = null;
    }
    if (this.diceToolbar) {
      this.diceToolbar.dispose();
      this.diceToolbar = null;
    }
    if (this.resultHud) {
      this.resultHud.dispose();
      this.resultHud = null;
    }
    if (this.footerControls) {
      this.footerControls.dispose();
      this.footerControls = null;
    }
  }
}
