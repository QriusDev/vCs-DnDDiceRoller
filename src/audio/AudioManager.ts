import type { AudioPreferences, CollisionEventData, TrayMaterialId } from "@/types";

export interface AcousticMaterialProfile {
  name: string;
  resonanceFreq: number; // Hz
  brightness: number; // Filter cutoff multiplier / Q
  dampingTime: number; // Seconds
  lowPassCutoff: number; // Hz
  noiseGain: number; // 0.0 - 1.0
  toneGain: number; // 0.0 - 1.0
}

export const TRAY_ACOUSTIC_PROFILES: Record<TrayMaterialId, AcousticMaterialProfile> = {
  // Soft, subdued cloth impacts with high damping and low brightness
  "green-velvet": {
    name: "Green Velvet Felt",
    resonanceFreq: 140,
    brightness: 0.8,
    dampingTime: 0.045,
    lowPassCutoff: 650,
    noiseGain: 0.45,
    toneGain: 0.25,
  },
  "navy-velvet": {
    name: "Navy Velvet Felt",
    resonanceFreq: 130,
    brightness: 0.75,
    dampingTime: 0.048,
    lowPassCutoff: 600,
    noiseGain: 0.45,
    toneGain: 0.22,
  },
  "burgundy-velvet": {
    name: "Burgundy Velvet Felt",
    resonanceFreq: 150,
    brightness: 0.85,
    dampingTime: 0.05,
    lowPassCutoff: 700,
    noiseGain: 0.48,
    toneGain: 0.26,
  },
  // Hard, bright, resonant wooden thuds with distinct midrange pitch and longer ring
  "dark-oak": {
    name: "Dark Oak Hardwood",
    resonanceFreq: 260,
    brightness: 2.2,
    dampingTime: 0.08,
    lowPassCutoff: 2400,
    noiseGain: 0.25,
    toneGain: 0.75,
  },
  // Damped, punchy, slightly percussive leather slap
  "stitched-leather": {
    name: "Stitched Heavy Leather",
    resonanceFreq: 190,
    brightness: 1.2,
    dampingTime: 0.06,
    lowPassCutoff: 1200,
    noiseGain: 0.6,
    toneGain: 0.4,
  },
};

export interface IAudioManager {
  setPreferences(prefs: AudioPreferences): void;
  setTrayMaterial(materialId: TrayMaterialId): void;
  handleCollision(event: CollisionEventData): void;
  playRollStartSound(): void;
  playCriticalHitFanfare(): void;
  playCriticalMissRumble(): void;
  unlockAudioContext(): Promise<void>;
  dispose(): void;
}

/**
 * Procedural Web Audio API Engine
 * Generates all dice impacts, clatters, fanfares, and rumbles purely from synthesized oscillators and noise.
 * Zero external audio file dependencies.
 */
export class AudioManager implements IAudioManager {
  private preferences: AudioPreferences;
  private trayMaterial: TrayMaterialId;
  private audioCtx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private compressor: DynamicsCompressorNode | null = null;
  private noiseBuffer: AudioBuffer | null = null;

  // Concurrency & Rate Limiting safeguards
  private activeVoices = 0;
  private readonly maxSimultaneousVoices = 16;
  private lastCollisionTime = 0;
  private readonly minCollisionIntervalMs = 28; // Throttles spamming (>35 events/sec)
  private readonly velocityThreshold = 0.5; // Min m/s impact to produce sound

  constructor(preferences: AudioPreferences, trayMaterial: TrayMaterialId = "green-velvet") {
    this.preferences = preferences;
    this.trayMaterial = trayMaterial;
    this.setupUserInteractionListener();
  }

  /**
   * Browser / WebView2 security requires user gesture before Web Audio can output sound.
   * We automatically unlock on the first pointerdown or keydown.
   */
  private setupUserInteractionListener(): void {
    if (typeof window === "undefined") return;
    const unlock = () => {
      this.unlockAudioContext().catch(() => {});
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
    };
    window.addEventListener("pointerdown", unlock, { once: true });
    window.addEventListener("keydown", unlock, { once: true });
  }

  /**
   * Lazily initializes the AudioContext and signal chain.
   */
  private ensureAudioContext(): AudioContext | null {
    if (typeof window === "undefined") return null;

    if (!this.audioCtx) {
      const AudioContextClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;

      if (!AudioContextClass) return null;

      try {
        this.audioCtx = new AudioContextClass();

        // 1. Master Dynamics Compressor prevents clipping & audio overload during multi-dice tumbles
        this.compressor = this.audioCtx.createDynamicsCompressor();
        this.compressor.threshold.setValueAtTime(-12, this.audioCtx.currentTime);
        this.compressor.knee.setValueAtTime(8, this.audioCtx.currentTime);
        this.compressor.ratio.setValueAtTime(4, this.audioCtx.currentTime);
        this.compressor.attack.setValueAtTime(0.003, this.audioCtx.currentTime);
        this.compressor.release.setValueAtTime(0.08, this.audioCtx.currentTime);

        // 2. Master Gain Node
        this.masterGain = this.audioCtx.createGain();
        this.updateMasterVolume();

        // Chain: voice -> compressor -> masterGain -> destination
        this.compressor.connect(this.masterGain);
        this.masterGain.connect(this.audioCtx.destination);

        // 3. Pre-generate procedural white noise buffer for impact transients
        this.generateNoiseBuffer();
      } catch (err) {
        console.warn("Unable to create Web Audio context:", err);
        return null;
      }
    }

    if (this.audioCtx.state === "suspended") {
      this.audioCtx.resume().catch(() => {});
    }

    return this.audioCtx;
  }

  public async unlockAudioContext(): Promise<void> {
    const ctx = this.ensureAudioContext();
    if (ctx && ctx.state === "suspended") {
      await ctx.resume();
    }
  }

  private generateNoiseBuffer(): void {
    if (!this.audioCtx) return;
    const sampleRate = this.audioCtx.sampleRate;
    const duration = 0.5; // 500ms of noise buffer
    const buffer = this.audioCtx.createBuffer(1, Math.floor(sampleRate * duration), sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    this.noiseBuffer = buffer;
  }

  setPreferences(prefs: AudioPreferences): void {
    this.preferences = prefs;
    this.updateMasterVolume();
  }

  setTrayMaterial(materialId: TrayMaterialId): void {
    this.trayMaterial = materialId;
  }

  private updateMasterVolume(): void {
    if (!this.masterGain || !this.audioCtx) return;
    const effectiveVol = this.preferences.muted
      ? 0.0
      : Math.max(0, Math.min(1, this.preferences.masterVolume));
    this.masterGain.gain.setValueAtTime(effectiveVol, this.audioCtx.currentTime);
  }

  /**
   * Triggered by Cannon-es physics collision events.
   */
  handleCollision(event: CollisionEventData): void {
    if (!this.preferences.collisionSoundsEnabled || this.preferences.muted) return;
    if (this.preferences.masterVolume <= 0) return;

    const velocity = event.impactVelocity;
    if (velocity < this.velocityThreshold) return;

    const now = performance.now();
    if (now - this.lastCollisionTime < this.minCollisionIntervalMs) {
      return; // Rate limited
    }
    this.lastCollisionTime = now;

    if (this.activeVoices >= this.maxSimultaneousVoices) {
      return; // Cap concurrent active voices
    }

    const ctx = this.ensureAudioContext();
    if (!ctx || !this.compressor) return;

    // Normalize velocity (0.5 to 15 m/s) -> (0.1 to 1.0)
    const normVel = Math.min(1.0, Math.max(0.1, (velocity - 0.5) / 10.0));
    const profile =
      TRAY_ACOUSTIC_PROFILES[this.trayMaterial] || TRAY_ACOUSTIC_PROFILES["green-velvet"];

    switch (event.targetType) {
      case "die":
        this.synthesizeDieOnDieCollision(ctx, normVel);
        break;
      case "wall":
        this.synthesizeWallImpact(ctx, normVel, profile);
        break;
      case "floor":
      default:
        this.synthesizeFloorImpact(ctx, normVel, profile);
        break;
    }
  }

  /**
   * Synthesize crisp, resonant clatter when two hard resin polyhedrals hit each other
   */
  private synthesizeDieOnDieCollision(ctx: AudioContext, normVel: number): void {
    const t0 = ctx.currentTime;
    const duration = 0.04 + normVel * 0.03;

    this.activeVoices++;

    // High resonant clack frequencies for resin (1200 - 3200 Hz with micro-random variation)
    const pitch = 1600 + Math.random() * 800 + normVel * 600;

    // Resonant bandpass filter
    const filter = ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.setValueAtTime(pitch, t0);
    filter.Q.setValueAtTime(4.5 + Math.random() * 2.0, t0);

    const gain = ctx.createGain();
    const peakGain = 0.35 * Math.pow(normVel, 0.7);
    gain.gain.setValueAtTime(0.001, t0);
    gain.gain.linearRampToValueAtTime(peakGain, t0 + 0.002);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);

    // Filtered noise transient
    if (this.noiseBuffer) {
      const noise = ctx.createBufferSource();
      noise.buffer = this.noiseBuffer;
      noise.playbackRate.value = 1.0 + Math.random() * 0.4;
      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.compressor!);
      noise.start(t0);
      noise.stop(t0 + duration);
    }

    // High ceramic/acrylic chime tone
    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.setValueAtTime(pitch * 1.5, t0);
    osc.frequency.exponentialRampToValueAtTime(pitch * 0.9, t0 + duration);

    const oscGain = ctx.createGain();
    oscGain.gain.setValueAtTime(0.001, t0);
    oscGain.gain.linearRampToValueAtTime(peakGain * 0.45, t0 + 0.001);
    oscGain.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);

    osc.connect(oscGain);
    oscGain.connect(this.compressor!);
    osc.start(t0);
    osc.stop(t0 + duration);

    setTimeout(
      () => {
        this.activeVoices = Math.max(0, this.activeVoices - 1);
        gain.disconnect();
        oscGain.disconnect();
        filter.disconnect();
      },
      (duration + 0.02) * 1000
    );
  }

  /**
   * Synthesize tray floor impact modulated by material profile
   */
  private synthesizeFloorImpact(
    ctx: AudioContext,
    normVel: number,
    profile: AcousticMaterialProfile
  ): void {
    const t0 = ctx.currentTime;
    const duration = profile.dampingTime * (0.8 + normVel * 0.6);

    this.activeVoices++;

    // Low-pass filter tailored to material
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    const cutoff = profile.lowPassCutoff * (0.8 + normVel * 0.5);
    filter.frequency.setValueAtTime(cutoff, t0);

    const gain = ctx.createGain();
    const peakGain = 0.5 * Math.pow(normVel, 0.6);
    gain.gain.setValueAtTime(0.001, t0);
    gain.gain.linearRampToValueAtTime(peakGain, t0 + 0.003);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);

    // 1. Thud body (sine oscillator)
    const baseFreq = profile.resonanceFreq * (0.9 + Math.random() * 0.2);
    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.setValueAtTime(baseFreq * 1.4, t0);
    osc.frequency.exponentialRampToValueAtTime(baseFreq, t0 + duration);

    const oscGain = ctx.createGain();
    oscGain.gain.setValueAtTime(peakGain * profile.toneGain, t0);
    oscGain.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);

    osc.connect(oscGain);
    oscGain.connect(this.compressor!);
    osc.start(t0);
    osc.stop(t0 + duration);

    // 2. Texture slap (filtered noise burst)
    if (this.noiseBuffer) {
      const noise = ctx.createBufferSource();
      noise.buffer = this.noiseBuffer;
      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(peakGain * profile.noiseGain, t0);
      noiseGain.gain.exponentialRampToValueAtTime(0.0001, t0 + duration * 0.7);

      noise.connect(filter);
      filter.connect(noiseGain);
      noiseGain.connect(this.compressor!);
      noise.start(t0);
      noise.stop(t0 + duration);
    }

    setTimeout(
      () => {
        this.activeVoices = Math.max(0, this.activeVoices - 1);
        gain.disconnect();
        filter.disconnect();
      },
      (duration + 0.02) * 1000
    );
  }

  /**
   * Synthesize wall impact (wood perimeter bounce)
   */
  private synthesizeWallImpact(
    ctx: AudioContext,
    normVel: number,
    _profile: AcousticMaterialProfile
  ): void {
    const t0 = ctx.currentTime;
    const duration = 0.055 + normVel * 0.035;

    this.activeVoices++;

    // Wall impacts have a slightly higher, woodier 'knock' sound
    const wallFreq = 340 + Math.random() * 60;
    const osc = ctx.createOscillator();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(wallFreq * 1.3, t0);
    osc.frequency.exponentialRampToValueAtTime(wallFreq, t0 + duration);

    const peakGain = 0.45 * Math.pow(normVel, 0.65);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.001, t0);
    gain.gain.linearRampToValueAtTime(peakGain, t0 + 0.002);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);

    osc.connect(gain);
    gain.connect(this.compressor!);
    osc.start(t0);
    osc.stop(t0 + duration);

    // Add brief filtered click
    if (this.noiseBuffer) {
      const noise = ctx.createBufferSource();
      noise.buffer = this.noiseBuffer;

      const filter = ctx.createBiquadFilter();
      filter.type = "bandpass";
      filter.frequency.setValueAtTime(1200, t0);
      filter.Q.setValueAtTime(2.0, t0);

      const nGain = ctx.createGain();
      nGain.gain.setValueAtTime(peakGain * 0.35, t0);
      nGain.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.02);

      noise.connect(filter);
      filter.connect(nGain);
      nGain.connect(this.compressor!);
      noise.start(t0);
      noise.stop(t0 + 0.02);
    }

    setTimeout(
      () => {
        this.activeVoices = Math.max(0, this.activeVoices - 1);
        gain.disconnect();
      },
      (duration + 0.02) * 1000
    );
  }

  /**
   * Play a clean, tactile rolling swoosh when throw is initiated
   */
  playRollStartSound(): void {
    if (!this.preferences.collisionSoundsEnabled || this.preferences.muted) return;
    if (this.preferences.masterVolume <= 0) return;

    const ctx = this.ensureAudioContext();
    if (!ctx || !this.compressor || !this.noiseBuffer) return;

    const t0 = ctx.currentTime;
    const duration = 0.18;

    const noise = ctx.createBufferSource();
    noise.buffer = this.noiseBuffer;

    const filter = ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.setValueAtTime(400, t0);
    filter.frequency.exponentialRampToValueAtTime(1400, t0 + duration * 0.6);
    filter.frequency.exponentialRampToValueAtTime(300, t0 + duration);
    filter.Q.setValueAtTime(1.8, t0);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.001, t0);
    gain.gain.linearRampToValueAtTime(0.18, t0 + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.compressor);
    noise.start(t0);
    noise.stop(t0 + duration);

    setTimeout(
      () => {
        gain.disconnect();
        filter.disconnect();
      },
      (duration + 0.02) * 1000
    );
  }

  /**
   * Natural 20 Triumphant Fanfare:
   * Multi-oscillator arpeggiated major chord with shimmering sparkle overtones
   */
  playCriticalHitFanfare(): void {
    if (!this.preferences.collisionSoundsEnabled || this.preferences.muted) return;
    if (this.preferences.masterVolume <= 0) return;

    const ctx = this.ensureAudioContext();
    if (!ctx || !this.compressor) return;

    const t0 = ctx.currentTime;
    // Major triad arpeggio: C5 (523.25), E5 (659.25), G5 (783.99), C6 (1046.50)
    const notes = [523.25, 659.25, 783.99, 1046.5];
    const noteDuration = 0.09;
    const sustain = 0.45;

    notes.forEach((freq, idx) => {
      const noteStart = t0 + idx * noteDuration;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, noteStart);

      gain.gain.setValueAtTime(0.001, noteStart);
      gain.gain.linearRampToValueAtTime(0.22, noteStart + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, noteStart + sustain);

      // Shimmer sparkle layer on final octave
      if (idx === notes.length - 1) {
        const chime = ctx.createOscillator();
        const chimeGain = ctx.createGain();
        chime.type = "triangle";
        chime.frequency.setValueAtTime(freq * 2, noteStart);

        chimeGain.gain.setValueAtTime(0.001, noteStart);
        chimeGain.gain.linearRampToValueAtTime(0.12, noteStart + 0.02);
        chimeGain.gain.exponentialRampToValueAtTime(0.0001, noteStart + sustain * 1.2);

        chime.connect(chimeGain);
        chimeGain.connect(this.compressor!);
        chime.start(noteStart);
        chime.stop(noteStart + sustain * 1.2);
      }

      osc.connect(gain);
      gain.connect(this.compressor!);
      osc.start(noteStart);
      osc.stop(noteStart + sustain);
    });
  }

  /**
   * Natural 1 Dramatic Miss:
   * Deep descending ominous low-frequency brassy brass/saw rumble
   */
  playCriticalMissRumble(): void {
    if (!this.preferences.collisionSoundsEnabled || this.preferences.muted) return;
    if (this.preferences.masterVolume <= 0) return;

    const ctx = this.ensureAudioContext();
    if (!ctx || !this.compressor) return;

    const t0 = ctx.currentTime;
    const duration = 0.55;

    const osc = ctx.createOscillator();
    osc.type = "sawtooth";
    // Descend from 160Hz to 45Hz
    osc.frequency.setValueAtTime(160, t0);
    osc.frequency.exponentialRampToValueAtTime(45, t0 + duration);

    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(380, t0);
    filter.frequency.exponentialRampToValueAtTime(120, t0 + duration);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.001, t0);
    gain.gain.linearRampToValueAtTime(0.28, t0 + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.compressor);
    osc.start(t0);
    osc.stop(t0 + duration);

    setTimeout(
      () => {
        gain.disconnect();
        filter.disconnect();
      },
      (duration + 0.05) * 1000
    );
  }

  dispose(): void {
    if (this.audioCtx && this.audioCtx.state !== "closed") {
      this.audioCtx.close().catch(() => {});
      this.audioCtx = null;
    }
  }
}
