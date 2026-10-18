# Release & Distribution Guide

This document describes the build procedures, distribution packages, runtime dependencies, and verification steps for releasing the **3D D&D Dice Roller** desktop application for Windows.

---

## 1. Available Distribution Artifacts

The project produces three Windows distribution options located in `src-tauri/target/release/` and `dist-portable/`:

| Artifact Type | File Path | File Size | Description |
|---|---|---|---|
| **Portable Standalone Executable** | `dist-portable/DnD3DDiceRoller.exe` | **~4.5 MB** | **Recommended portable distribution.** Single-file executable that runs directly without installation. |
| **Release Binary** | `src-tauri/target/release/dnd_dice_roller.exe` | **~4.5 MB** | Direct compiled release binary output from Cargo. |
| **NSIS Setup Installer** | `src-tauri/target/release/bundle/nsis/DnD 3D Dice Roller_1.0.0_x64-setup.exe` | **~1.5 MB** | Standard Windows installer with desktop shortcut and uninstaller. |
| **WiX MSI Installer** | `src-tauri/target/release/bundle/msi/DnD 3D Dice Roller_1.0.0_x64_en-US.msi` | **~2.2 MB** | Enterprise Windows Installer package. |

---

## 2. Runtime Requirements & Architecture

### Windows Runtime Dependencies
- **Operating System:** Windows 10 (64-bit) or Windows 11 (64-bit).
- **Microsoft Edge WebView2 Runtime:**
  - Standard, pre-installed component on Windows 11 and all updated Windows 10 installations.
  - If deploying to a bare-metal older Windows installation lacking WebView2, download the official evergreen bootstrapper from Microsoft: https://developer.microsoft.com/en-us/microsoft-edge/webview2/
- **Hardware Acceleration:** Direct3D 11 / WebGL-compatible GPU driver.

### Zero Development Dependencies
The compiled application is 100% self-contained:
- Does **not** require Node.js or npm.
- Does **not** require Rust or Cargo.
- Does **not** require Visual Studio or MSVC build tools.
- Does **not** require a running local development server (Vite).
- Does **not** require an active internet connection (all textures, fonts, shaders, and procedural sounds are embedded locally).

---

## 3. Build Commands

### Step 1: Environment Setup
Ensure Node.js and Rust are available in your PowerShell session:
```powershell
$env:RUSTUP_HOME = "F:\tools\rustup"
$env:CARGO_HOME = "F:\tools\cargo"
$env:PATH = "F:\tools\nodejs;F:\tools\cargo\bin;F:\tools\git\cmd;$env:PATH"
```

### Step 2: Build Portable Standalone Executable
```powershell
# Compile optimized frontend assets and optimized Rust binary
npm run build:release

# Copy to portable distribution directory
New-Item -ItemType Directory -Force -Path "dist-portable"
Copy-Item "src-tauri/target/release/dnd_dice_roller.exe" -Destination "dist-portable/DnD3DDiceRoller.exe"
```

### Step 3: Build Full Installers (MSI + NSIS)
```powershell
npx tauri build
```
This runs the full bundling pipeline, producing the signed `.msi` and `.exe` setup packages in `src-tauri/target/release/bundle/`.

---

## 4. Clean-Machine Validation Checklist

To verify the standalone executable on a clean Windows machine without development tools:

1. Copy `dist-portable/DnD3DDiceRoller.exe` to the test machine (or a clean virtual machine).
2. Double-click `DnD3DDiceRoller.exe` (no terminal, no Node.js required).
3. **Verify Launch:** Main application window opens centered with title *"DnD 3D Dice Roller"*.
4. **Verify Viewport:** 3D tabletop tray renders with soft shadows and default D20 die.
5. **Verify Dice Selection:** Click D4, D6, D8, D10, D12 on the toolbar; observe real-time addition into the tray.
6. **Verify Rolling & Settlement:** Press `Space` or click "ROLL DICE"; dice tumble realistically and settle cleanly with upward faces matching the Result HUD total.
7. **Verify Audio Synthesis:** Hear physically modulated collision thuds, die-on-die clatter, and Natural 20 / Natural 1 fanfares.
8. **Verify Camera Orbit:** Right-click and drag across the canvas to orbit around the tray; scroll wheel to zoom.
9. **Verify Preferences & Persistence:** Open Settings -> Preferences; change tray material to Dark Oak, close application, and reopen. Verify tray material and roll history persist across sessions.
