# System Architecture Documentation

This document describes the software architecture, simulation subsystems, mathematics, audio pipeline, and state contracts of the 3D D&D Dice Roller desktop application.

---

## 1. High-Level Architectural Overview

The application is structured as a layered desktop hybrid using **Tauri 2.x** with a lightweight native Rust shell and a high-performance **TypeScript** frontend driving **Three.js** and **Cannon-es**.

```
┌─────────────────────────────────────────────────────────────┐
│                   Tauri 2 Native Window                     │
│                (Rust Shell / Edge WebView2)                 │
└──────────────────────────────┬──────────────────────────────┘
                               │
┌──────────────────────────────▼──────────────────────────────┐
│                    Desktop UI / DOM Layer                   │
│   MenuBar │ DiceToolbar │ ResultHud │ Footer │ Drawer │ Modal│
└──────────────────────────────┬──────────────────────────────┘
                               │
┌──────────────────────────────▼──────────────────────────────┐
│                     Application State                       │
│    AppState (Observable Store) ◄──► StorageService (JSON)   │
└──────────────┬──────────────────────────────┬───────────────┘
               │                              │
┌──────────────▼──────────────┐┌──────────────▼───────────────┐
│     Three.js 3D Viewport    ││    Cannon-es Physics World   │
│  SceneManager & CameraRig   ││  Rigid Body Dynamics Solver  │
│  Polyhedral PBR DieMeshes   ││  Collision Detection System  │
│  Procedural Texture Atlas   ││  Multi-Frame Rest Detection  │
└──────────────┬──────────────┘└──────────────┬───────────────┘
               │                              │
               └──────────────┬───────────────┘
                              │
┌─────────────────────────────▼───────────────────────────────┐
│              Procedural Web Audio API Engine                │
│    Material Profiles │ Noise Transients │ Tone Oscillators  │
│    Compressor Limiter │ Concurrency Safeguards & Cooldowns  │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Polyhedral Dice Geometries & Face Coordinate Systems

All six polyhedral dice geometries are mathematically constructed from regular platonic and Archimedean/Catalan polyhedra in `src/rendering/geometries/`:

1. **D4 (Tetrahedron):** 4 triangular faces. Vertices derived from alternating cube vertices `(±1, ±1, ±1)`.
2. **D6 (Cube):** 6 square faces with unit normals aligned with cardinal axes.
3. **D8 (Octahedron):** 8 triangular faces with dual vertices along the cardinal axes `(±1, 0, 0)`, `(0, ±1, 0)`, `(0, 0, ±1)`.
4. **D10 (Pentagonal Trapezohedron):** 10 deltoidal (kite-shaped) faces. The vertices are derived analytically using golden ratio proportions $H/h = 5 + 2\sqrt{5} \approx 9.472136$, ensuring exact planarity of every kite facet.
5. **D12 (Dodecahedron):** 12 regular pentagonal faces using coordinates based on golden ratio $\phi = (1 + \sqrt{5})/2$.
6. **D20 (Icosahedron):** 20 equilateral triangular faces constructed from 3 mutually orthogonal golden rectangles.

### Face Orientation & Value Reading (`FaceDetector.ts`)
Each die geometry has precomputed metadata:
- Outward local unit normal for each face.
- Centroid of each face.
- Numeric value mapped to that face.
- Critical hit (natural 20) and critical miss (natural 1) indicators for D20.
- D10 face 0 mapped to value 10 for game-score reporting.

During settlement, world-space face normals are transformed by the body orientation quaternion $q$:
$$\mathbf{n}_{\text{world}} = q \cdot \mathbf{n}_{\text{local}} \cdot q^{-1}$$
The face whose normal has the highest dot product with world-up $(0, 1, 0)$ is identified as the resting face:
$$\text{Upward Face} = \operatorname*{argmax}_{i} (\mathbf{n}_{\text{world}, i} \cdot \mathbf{u}_{\text{world}})$$

---

## 3. Physics Pipeline & Dual Rolling Modes

### Fixed-Timestep Rigid Body Dynamics (`PhysicsWorld.ts`)
- Fixed physics timestep of $1/60$s ($16.66$ms) with up to 10 sub-stepping iterations per render frame.
- Static collision bodies for the tray floor and 4 surrounding containment walls.
- Dynamic rigid bodies for dice:
  - D6 uses `CANNON.Box` for anti-jitter stability.
  - D4, D8, D10, D12, and D20 use `CANNON.ConvexPolyhedron` hulls mapped directly to mathematical facet vertices.
- Scaled inertia tensors and masses ($0.8\text{ kg} - 1.25\text{ kg}$) with linear damping ($0.12$) and angular damping ($0.12$).
- Multi-frame settlement detection: requires linear velocity $< 0.25\text{ m/s}$ and angular velocity $< 0.45\text{ rad/s}$ across 25 consecutive simulation frames ($\approx 420\text{ ms}$).

### Dual Rolling Modes (`DiceSimulationManager.ts`)
1. **Fair PRNG Target Landing (Default):**
   - Authoritative integer result is pre-sampled using `crypto.getRandomValues` with unbiased rejection sampling.
   - The die's initial rotational orientation is computed to align the target face outward.
   - Strategic randomized rotational impulses are imparted.
   - Physics-guided trajectory simulation executes.
   - If chaotic perturbations cause the die to rest on an unintended face, a bounded corrective rotation aligns the authoritative face upward seamlessly before marking the roll completed.
2. **Pure Physics Simulation:**
   - Free chaotic rigid-body tumble with random linear impulse and angular spin.
   - Authoritative result is determined strictly by the physical upward-facing normal once settlement conditions are satisfied.

---

## 4. Procedural Audio Synthesis Architecture (`AudioManager.ts`)

The audio engine produces 100% of sound effects via the browser/WebView2 **Web Audio API** without external audio samples or network assets.

### Signal Chain
```
[Noise Buffer Source] ──► [BiquadFilter] ──► [Noise Gain] ──┐
                                                            ├──► [DynamicsCompressor] ──► [MasterGain] ──► [Destination]
[Oscillator Node]     ──► [Pitch Mod]    ──► [Tone Gain]  ──┘
```

### Acoustic Material Profiles
Tray impact physics dynamically adapts frequency and damping to the tray material:
- **Green/Navy/Burgundy Velvet:** Soft low-frequency thud ($130-150\text{ Hz}$), high damping ($0.045\text{ s}$), low-pass filter at $650\text{ Hz}$.
- **Dark Oak:** Hard resonant wooden knock ($260\text{ Hz}$), longer ring ($0.08\text{ s}$), filter cutoff at $2400\text{ Hz}$ with higher tone gain.
- **Stitched Leather:** Heavy damped punch ($190\text{ Hz}$), $0.06\text{ s}$ decay, balanced noise slap.

### Die-on-Die & Wall Collisions
- **Die-on-Die:** Resonant ceramic/acrylic clatter ($1600-3200\text{ Hz}$) bandpass filter with sharp $40\text{ ms}$ decay.
- **Wall Impacts:** Mid-range wooden perimeter knocks ($340\text{ Hz}$).

### Critical Audio
- **Natural 20:** 4-note ascending major triad arpeggio (C5 $\rightarrow$ E5 $\rightarrow$ G5 $\rightarrow$ C6) with high shimmer sparkle overtone.
- **Natural 1:** Deep descending low-pass sawtooth rumble ($160\text{ Hz} \rightarrow 45\text{ Hz}$) over $550\text{ ms}$.

### Anti-Clipping & Overload Safeguards
- `DynamicsCompressorNode` with $-12\text{ dB}$ threshold, $4:1$ ratio, and $3\text{ ms}$ attack.
- Concurrency limit capped at **16 simultaneous active voices**.
- Event rate limiter enforcing a **$28\text{ ms}$ cooldown** between impact sounds.
- Velocity cutoff ignoring micro-jitter contacts below $0.5\text{ m/s}$.

---

## 5. State Management & Persistence (`AppState.ts`)

- Centralized observable pattern with typed subscriptions (`onDicePoolChange`, `onSettingsChange`, `onRollStateChange`, `onHistoryChange`).
- `StorageService` persists preferences and roll history in LocalStorage with `schemaVersion: 1`.
- Safe schema validation falling back to default settings if stored data is corrupted.
- History drawer strictly capped at the **20 most recent completed rolls** in reverse chronological order.
