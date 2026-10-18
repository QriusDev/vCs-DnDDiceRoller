# [vCs] 3D D&D Dice Roller (Windows Desktop)

A high-performance standalone Windows desktop application featuring real-time 3D polyhedral dice rolling with physically accurate rigid-body dynamics, procedural Web Audio API collision sound synthesis, cryptographically fair random number generation, dynamic dice pool management, roll history, and rich visual customization.

Feel free to make pull requests for further improvements or fork for a different direction. Add issues for any bugs.

---

## Highlights & Features

- **Six Mathematically Accurate Polyhedral Dice:** D4 (tetrahedron), D6 (cube), D8 (octahedron), D10 (pentagonal trapezohedron with analytical golden ratio kite proportions), D12 (dodecahedron), and D20 (icosahedron).
- **Two Distinct Geometry Styles:** Sharp Edge (crisp artisan resin with flat facets) and Rounded / Soft Edge (beveled and chamfered edges for smooth tumbling).
- **Six PBR Materials & Themes:** Classic Ivory, Obsidian & Gold, Royal Purple Gem, Cyber Neon, Crimson Dragon, and Walnut Wood.
- **Custom Body & Numeral Colors:** Color pickers allowing custom resin hues and numeral ink.
- **Adjustable 3D Dice Tray:** Three containment presets (Small 11×14, Standard 15×19, Large 20×25) with 5 tray floor materials: Green Velvet, Navy Velvet, Burgundy Velvet, Dark Oak, and Stitched Leather.
- **Dual Rolling Modes:**
  - **Fair PRNG Target Landing (Default):** Authoritative results determined via unbiased `crypto.getRandomValues` sampling, with target landing solver and physics-guided rotational settling.
  - **Pure Physics Simulation:** Unconstrained chaotic tumbling where the final upward-resting face determines the authoritative result.
- **Procedural Web Audio API Sound Engine:** Zero external audio file dependencies. Synthesizes material-specific impact thuds (velvet, oak, leather), resonant die-on-die clatter, tray wall knocks, roll toss swooshes, celebratory Natural 20 major-chord fanfares, and ominous Natural 1 low-frequency descending rumbles.
- **Dynamic Safeguards:** DynamicsCompressor anti-clipping protection, 16-voice concurrency limiting, velocity thresholds, and 28ms event cooldown preventing audio overload during large multi-dice rolls.
- **Interactive Controls:** Left-click to add, right-click to remove, mouse raycast pickup and drag-to-toss, right-click/middle-click camera orbiting, and scroll-wheel zoom.
- **Result HUD & History:** Roll total, structured formulas (e.g. `2d6 [4, 5] + 1d20 [20] = 29`), individual die pills, and a slide-out drawer holding the 20 most recent rolls.
- **Persistent Preferences:** Schema-versioned LocalStorage with automatic fallback and "Reset to Defaults".

---

## Technology Stack

- **Desktop Shell:** Tauri 2.x (Rust Backend, minimal native footprint)
- **Frontend Core:** Vite 6, TypeScript 5 (Strict Mode)
- **3D Graphics Engine:** Three.js (WebGL PBR shaders, soft directional shadows)
- **Physics Engine:** Cannon-es (Rigid-body dynamics with 1/60s fixed timestep and substepping)
- **Audio Engine:** Web Audio API (Synthesized oscillators, biquad filters, and noise buffers)
- **Test Framework:** Vitest (52 automated unit and integration tests)
- **Code Standards:** ESLint 9 (typescript-eslint) & Prettier

---

## Supported Windows Versions & Runtime Requirements

- **Supported Operating Systems:** Windows 10 (64-bit) & Windows 11 (64-bit).
- **Runtime Dependency:** Microsoft Edge WebView2 Runtime.
  - Standard and pre-installed on modern Windows 10 and all Windows 11 machines.
  - If missing on older Windows installations, download the official evergreen bootstrapper from Microsoft.
- **Hardware Acceleration:** DirectX 11 / WebGL-compatible graphics driver.
- **Offline Self-Sufficiency:** The application has **zero** runtime dependency on Node.js, npm, Rust, Git, or internet connectivity. All fonts, shaders, and procedural sounds are self-contained.

---

## Project Structure

```text
DnDDiceRoller/
├── dist/                     # Optimized frontend web bundle
├── dist-portable/            # Portable standalone Windows executable
│   └── DnD3DDiceRoller.exe   # Single-file portable desktop binary (~4.5 MB)
├── src/
│   ├── app/                  # Application orchestrator and lifecycle
│   ├── audio/                # Procedural Web Audio API sound synthesizer
│   ├── config/               # Default settings, dice configs, physics tuning
│   ├── core/
│   │   ├── dice/             # Dice factory & instance generation
│   │   ├── physics/          # Cannon-es physics world, collision shapes & simulation
│   │   ├── random/           # Cryptographic PRNG with unbiased rejection sampling
│   │   ├── results/          # Result calculator & formula formatting
│   │   └── state/            # Reactive AppState & schema-versioned persistence
│   ├── rendering/
│   │   ├── camera/           # Orbiting camera rig with zoom and reset
│   │   ├── geometries/       # Mathematical polyhedral geometry generators
│   │   ├── interaction/      # Mouse raycasting, drag-and-throw, pointer isolation
│   │   ├── lighting/         # Studio lighting rig with directional shadows
│   │   ├── materials/        # PBR material factory & cache
│   │   ├── scene/            # SceneManager, animation loop, resource cleanup
│   │   └── textures/         # Procedural canvas texture generator & numeral engraver
│   ├── styles/               # CSS design tokens, glassmorphism overlays
│   ├── tests/                # Automated Vitest test suites (52 passing tests)
│   ├── types/                # TypeScript type definitions and contracts
│   └── ui/
│       ├── components/       # DiceToolbar, ResultHud, FooterControls, HistoryDrawer, HelpModal
│       ├── icons/            # Polyhedral vector SVG icons & UI symbols
│       ├── menus/            # Desktop MenuBar (File, View, Settings, Help)
│       └── settings/         # Preferences dialog (Physics, Models, Audio)
├── src-tauri/                # Rust backend shell, window management, Cargo manifest
├── docs/                     # Comprehensive architecture and user guides
│   ├── ARCHITECTURE.md       # Full engineering architecture documentation
│   ├── USER_GUIDE.md         # End-user guide and shortcuts
│   ├── RELEASE.md            # Release build, packaging & distribution instructions
│   └── PHASE_STATUS.md       # Verification status across all 5 phases
├── package.json
└── tsconfig.json
```

---

## Build & Distribution Instructions

### 1. Developer Setup

Ensure you have Node.js (v20+ LTS) and the Rust toolchain (`x86_64-pc-windows-msvc`) installed:

```powershell
# Install dependencies
npm install

# Run automated test suites (52 tests across 8 suites)
npm test

# Run linter
npm run lint

# Check code formatting
npm run format:check

# Run frontend dev server
npm run dev
```

### 2. Building the Standalone Portable Executable

To compile the single-file standalone executable without installers:

```powershell
npm run build:release
```

This compiles:
- Frontend assets into `dist/` (HTML/CSS/JS bundled locally).
- The optimized Rust desktop shell into `src-tauri/target/release/dnd_dice_roller.exe` (or `dist-portable/DnD3DDiceRoller.exe`).

### 3. Building Installers (MSI & NSIS)

To build standard Windows installer packages:

```powershell
npx tauri build
```

This produces:
- `src-tauri/target/release/bundle/msi/DnD 3D Dice Roller_1.0.0_x64_en-US.msi` (2.21 MB)
- `src-tauri/target/release/bundle/nsis/DnD 3D Dice Roller_1.0.0_x64-setup.exe` (1.50 MB)

---

## Verification & Status

All 5 development phases are complete and verified:
- [x] **Phase 1:** Application Foundation & 3D Tray Shell
- [x] **Phase 2:** Polyhedral 3D Dice Geometries, Numbering & PBR Materials
- [x] **Phase 3:** Rigid Body Physics, Collisions & Target Landing
- [x] **Phase 4:** Desktop User Experience, SVG Icons, Drawer & Preferences
- [x] **Phase 5:** Procedural Audio Synthesis, Release Hardening & Portable Packaging
