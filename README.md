# 3D D&D Dice Roller (Windows Desktop)

A standalone Windows desktop application featuring real-time 3D polyhedral dice rolling with physical collisions, fair random number generation, dynamic dice pools, results history, and customizable tabletop environments.

## Technology Stack

- **Desktop Shell:** Tauri 2.x with Rust & Windows WebView2
- **Frontend Core:** Vite, TypeScript (Strict Mode)
- **3D Graphics Engine:** Three.js
- **Physics Engine:** Cannon-es
- **Test Framework:** Vitest
- **Linting & Formatting:** ESLint 9 (typescript-eslint) & Prettier
- **Target OS:** Windows 10 / Windows 11 (64-bit)

## Project Structure

```text
DnDDiceRoller/
├── src/
│   ├── app/              # Application lifecycle, orchestrator, bootstrap
│   ├── audio/            # Audio manager & procedural collision sound contracts
│   ├── config/           # Centralized configuration (settings, dice, physics)
│   ├── core/
│   │   ├── dice/         # Dice factory and instantiation logic
│   │   ├── physics/      # Cannon-es physics world and tray colliders
│   │   ├── random/       # Fair cryptographically secure random number provider
│   │   ├── results/      # Aggregate result and critical evaluation
│   │   └── state/        # Central AppState and localStorage persistence
│   ├── rendering/
│   │   ├── camera/       # Perspective camera rig with tabletop angle
│   │   ├── geometries/   # 3D tray meshes and procedural dice geometry contracts
│   │   ├── lighting/     # Key directional light with soft shadows and fill light
│   │   ├── materials/    # Material factory (felt, wood, rim trim, dice shaders)
│   │   └── scene/        # Three.js scene manager, animation loop, disposal
│   ├── styles/           # Design tokens, dark desktop theme, glassmorphism UI
│   ├── tests/            # Vitest unit test suites
│   ├── types/            # Strict TypeScript contracts for dice, physics, rolls
│   ├── ui/
│   │   ├── components/   # DiceToolbar, ResultHud, FooterControls, HistoryDrawer
│   │   ├── icons/        # Polyhedral dice symbols and UI glyphs
│   │   ├── menus/        # Desktop MenuBar
│   │   └── settings/     # Settings modal with audio, physics, and theme tabs
│   ├── utils/            # Math and vector helper functions
│   └── main.ts           # Frontend entry point
├── src-tauri/            # Tauri 2 Rust desktop shell and native windowing
├── docs/                 # Architecture, development instructions, phase tracking
├── public/               # Static assets
├── package.json
└── tsconfig.json
```

## Quick Start & Development

### Prerequisites

- **Node.js:** v20+ LTS and npm
- **Rust:** Stable toolchain (`x86_64-pc-windows-msvc`)
- **C++ Build Tools:** Visual Studio C++ Build Tools & Windows SDK
- **Edge WebView2 Runtime:** Standard on Windows 10/11

*Note: On this development environment, toolchains are configured on the `F:` drive (`F:\tools\nodejs`, `F:\tools\cargo`, `F:\tools\git`).*

### Commands

```powershell
# Install frontend dependencies
npm install

# Run TypeScript compilation check
npm run build

# Run unit tests
npm test

# Run ESLint
npm run lint

# Check formatting
npm run format:check

# Start Vite frontend development server
npm run dev

# Launch full Tauri desktop application
npm run tauri dev
```

## Roadmap

- [x] **Phase 1:** Application Foundation, Modular Architecture & 3D Tray Shell
- [ ] **Phase 2:** Polyhedral Dice Geometries (D4, D6, D8, D10, D12, D20) & Face Reading
- [ ] **Phase 3:** Full Rigid Body Dynamics, Throw Impulses & Collision Detection
- [ ] **Phase 4:** Procedural Sound Synthesis & Custom Visual Themes
- [ ] **Phase 5:** Portable Windows Executable Distribution & Final Polish
