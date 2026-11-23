class SoundEngine {
  private ctx: AudioContext | null = null;
  private muted: boolean = false;

  constructor() {
    try {
      const saved = localStorage.getItem('aeroguard_muted');
      if (saved === 'true') this.muted = true;
    } catch {
      // ignore storage failure
    }
  }

  private ensureContext(): AudioContext | null {
    if (this.muted) return null;
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext })
          .webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public isMuted(): boolean {
    return this.muted;
  }

  public toggleMute(): boolean {
    this.muted = !this.muted;
    try {
      localStorage.setItem('aeroguard_muted', String(this.muted));
    } catch {
      // ignore
    }
    if (!this.muted) {
      this.playFilterClick();
    }
    return this.muted;
  }

  private tone(
    freq: number,
    duration: number,
    type: OscillatorType = 'sine',
    gainVal = 0.08,
    delay = 0,
    endFreq?: number
  ) {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    if (endFreq !== undefined) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(20, endFreq), now + duration);
    }
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(gainVal, now + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + duration + 0.02);
  }

  public playFilterClick() {
    this.tone(720, 0.06, 'triangle', 0.06, 0, 960);
  }

  public playSecondaryOpen() {
    this.tone(420, 0.09, 'sine', 0.07, 0, 640);
    this.tone(640, 0.11, 'triangle', 0.06, 0.07, 880);
  }

  public playScanPing(isThreat: boolean) {
    if (isThreat) {
      this.tone(880, 0.08, 'sawtooth', 0.06, 0);
      this.tone(1180, 0.14, 'square', 0.05, 0.08);
    } else {
      this.tone(540, 0.09, 'sine', 0.05, 0, 700);
    }
  }

  public playClearSuccess() {
    this.tone(523.25, 0.09, 'sine', 0.08, 0);
    this.tone(659.25, 0.13, 'sine', 0.08, 0.07);
  }

  public playHoldSuccess() {
    this.tone(330, 0.08, 'triangle', 0.09, 0);
    this.tone(493.88, 0.14, 'triangle', 0.09, 0.06);
  }

  public playErrorAlarm(heavy: boolean) {
    if (heavy) {
      this.tone(220, 0.22, 'sawtooth', 0.1, 0, 140);
      this.tone(196, 0.26, 'sawtooth', 0.1, 0.16, 110);
    } else {
      this.tone(280, 0.14, 'square', 0.06, 0, 200);
    }
  }

  public playLevelClear() {
    this.tone(523.25, 0.11, 'triangle', 0.08, 0);
    this.tone(659.25, 0.11, 'triangle', 0.08, 0.09);
    this.tone(783.99, 0.14, 'triangle', 0.09, 0.18);
    this.tone(1046.5, 0.24, 'sine', 0.1, 0.28);
  }
}

export const soundEngine = new SoundEngine();
