# User Guide & Controls Reference

Welcome to the **3D D&D Dice Roller** desktop application! This guide explains how to use the interactive 3D tray, manage your dice pool, customize appearance, and tweak physics and audio settings.

---

## 1. Quick Start & Basic Controls

| Action | Control | Description |
|---|---|---|
| **Add Die** | Left-Click Toolbar Button | Adds 1 die of that type to the tray (D4, D6, D8, D10, D12, D20). |
| **Remove Die** | Right-Click Toolbar Button | Removes 1 die of that type from the tray. |
| **Clear Tray** | Click "Clear All" or "Clear Tray" | Removes all active dice from the tray. |
| **Roll Dice** | Click "ROLL DICE" or press `Space` | Tosses all dice currently in the tray. |
| **Pick Up & Toss** | Left-Click & Drag on a 3D Die | Picks up an individual die and flings it across the tray. |
| **Orbit Camera** | Right-Click & Drag (or Middle-Click) | Rotates and pitches the 3D camera around the tray center. |
| **Zoom View** | Mouse Scroll Wheel | Zooms in or out of the dice tray. |
| **Reset Camera** | View Menu -> "Reset Camera View" | Restores default tabletop viewing angle. |
| **Toggle History** | Click "History" in Footer | Slides out the 20-roll history drawer. |
| **Fullscreen** | View Menu -> "Toggle Fullscreen" (`F11`) | Expands application to fullscreen desktop mode. |
| **Close Dialogs** | Press `Escape` | Closes any open modal dialog or drawer. |

---

## 2. Reading Roll Results

The **Result HUD** is located in the upper-left corner of the viewport:

- **State Indicator:** Shows current status (`IDLE`, `PREPARING`, `ROLLING`, `SETTLING`, `COMPLETED`).
- **Rolling Indicator:** While dice are tumbling, an animated 3D spinner indicates active physical simulation, suppressing previous results.
- **Total:** Large numeric display of the completed roll sum.
- **Formula:** Mathematical breakdown, e.g.:
  ```text
  2d6 [4, 5] + 1d20 [20] = 29
  ```
- **Individual Die Pills:** Each die is shown with its type and rolled value.
- **Natural 20 Critical Hit:** Displayed with a shimmering gold banner and accompanied by an ascending triumphal major-chord fanfare.
- **Natural 1 Critical Miss:** Displayed with a crimson banner and accompanied by an ominous low-frequency descending rumble.

---

## 3. Roll History Drawer

Access the roll history drawer by clicking **"History"** in the footer or selecting **View -> Toggle Roll History**:

- Records the **20 most recent rolls** in reverse chronological order (newest on top).
- Shows timestamp, formula, total, and individual critical badges.
- Click **"Clear"** inside the drawer to reset your roll history at any time without resetting your tray dice.

---

## 4. Customizing Your Experience (Preferences)

Open **Settings -> Preferences...** from the top menu bar to access three tabs:

### Tab 1: Physics & Roll Behavior
- **Rolling Mode:** Switch between:
  - *Fair PRNG Target Landing (Default):* Uses cryptographically secure random numbers (`crypto.getRandomValues`) to ensure fair distribution.
  - *Pure Physics Simulation:* Organic, chaotic tumbling where outcome is determined strictly by the resting face.
- **Dice Tray Dimensions:** Choose between *Small (11×14)*, *Standard (15×19)*, or *Large (20×25)*.
- **Linear Throw Impulse:** Adjust throw velocity from 5 to 50 N·s.
- **Angular Spin Intensity:** Adjust tumble spin from 10 to 60 rad/s.
- **Gravity Magnitude:** Tune gravity from 9.8 m/s² (Earth standard) up to 25.0 m/s² (heavy tabletop).
- **Restitution / Bounciness:** Adjust elasticity from 0.2 (dead drop) to 0.8 (super bouncy).
- **Surface Friction:** Adjust felt resistance from 0.1 to 0.9.

### Tab 2: Dice Models & Designs
- **3D Geometry Style:**
  - *Sharp Edge:* Crisp artisan resin silhouettes with flat facet faces.
  - *Rounded / Soft Edge:* Chamfered beveled edges and softened corners for smooth rolling.
- **Artisan Themes:** Choose from 6 PBR material presets: Classic Ivory, Obsidian & Gold, Royal Purple Gem, Cyber Neon, Crimson Dragon, and Walnut Wood.
- **Custom Dice Colors:** Color pickers to override theme colors with custom body resin and numeral ink colors.
- **Tray Floor Material:** Select between Green Velvet, Navy Velvet, Burgundy Velvet, Dark Oak Hardwood, or Stitched Heavy Leather.

### Tab 3: Audio & Sound FX
- **Mute All Audio:** Instant master mute toggle.
- **Master Volume:** Linear volume control from 0% to 100%.
- **Collision Sounds Enabled:** Enable or disable impact and clattering audio.
- **Procedural Engine:** Uses real-time Web Audio API synthesis without external audio files.
