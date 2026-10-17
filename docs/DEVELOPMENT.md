# Development & Environment Guide

## 1. Prerequisites & Toolchain Setup

The application targets Windows 10 and Windows 11 with the following development toolchains:

| Tool | Version Tested | Location / Requirement |
|---|---|---|
| **Node.js** | v24.22.0 LTS | `F:\tools\nodejs` |
| **npm** | 11.19.1 | `F:\tools\nodejs\npm.cmd` |
| **Rust / Cargo** | 1.99.1 (MSVC) | `F:\tools\cargo\bin`, target `x86_64-pc-windows-msvc` |
| **MSVC C++ Tools** | Visual Studio 2026 Community | VC++ Tools, Windows SDK |
| **WebView2** | 155.0.4283.60+ | Microsoft Edge Evergreen Runtime |
| **Git** | 2.56.0 (MinGit) | `F:\tools\git\cmd` |

### Environment Variables

Ensure your session or user environment includes:

```powershell
$env:RUSTUP_HOME = "F:\tools\rustup"
$env:CARGO_HOME  = "F:\tools\cargo"
$env:PATH        = "F:\tools\nodejs;F:\tools\git\cmd;F:\tools\cargo\bin;$env:PATH"
```

---

## 2. Standard Development Commands

### Frontend Development

- **Start Vite Dev Server:**
  ```powershell
  npm run dev
  ```
  Opens frontend on `http://localhost:1420` with Hot Module Replacement (HMR).

- **TypeScript Type-Check & Production Build:**
  ```powershell
  npm run build
  ```
  Executes `tsc --noEmit` and bundles via Vite into `dist/`.

### Testing & Code Quality

- **Run Unit Tests (Vitest):**
  ```powershell
  npm test
  ```

- **Run Watch Mode for Unit Tests:**
  ```powershell
  npm run test:watch
  ```

- **Run ESLint:**
  ```powershell
  npm run lint
  ```

- **Run Prettier Check / Format:**
  ```powershell
  npm run format:check
  npm run format
  ```

### Desktop Shell (Tauri)

- **Inspect Tauri Diagnostics:**
  ```powershell
  npm run tauri info
  ```

- **Compile Self-Contained Desktop Binary (Standalone `.exe`):**
  ```powershell
  npm run build:exe
  ```
  This builds the frontend bundle and compiles `src-tauri/target/debug/dnd_dice_roller.exe` with all frontend assets embedded directly into the binary. You can double-click and run `dnd_dice_roller.exe` without running any dev server or localhost connection.

- **Launch Full Tauri Desktop Development Window (Live HMR):**
  ```powershell
  npm run tauri dev
  ```

---

## 3. Troubleshooting

- **PowerShell Execution Policy Error on npm:**
  If PowerShell blocks running `npm.ps1`, delete `npm.ps1` and `npx.ps1` from your Node.js directory to force PowerShell to use the native `npm.cmd` batch runner.

- **WebView2 Not Found:**
  Download and install the Microsoft Edge WebView2 Evergreen Bootstrapper if running on stripped Windows installations.

- **Cargo Linker Errors:**
  Ensure the MSVC target is selected:
  ```powershell
  rustup default stable-x86_64-pc-windows-msvc
  ```
