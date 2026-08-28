// High-grade Web Audio API sound synthesizer for tactile UI feedback

class SoundEffects {
  private ctx: AudioContext | null = null;
  private soundEnabled: boolean = true;
  private isUnlocked: boolean = false;

  constructor() {
    if (typeof window !== 'undefined') {
      // Auto-unlock on first user interaction anywhere on the page
      const unlockAudio = () => {
        this.unlockContext();
        window.removeEventListener('click', unlockAudio);
        window.removeEventListener('touchstart', unlockAudio);
        window.removeEventListener('keydown', unlockAudio);
      };
      window.addEventListener('click', unlockAudio, { once: true, passive: true });
      window.addEventListener('touchstart', unlockAudio, { once: true, passive: true });
      window.addEventListener('keydown', unlockAudio, { once: true, passive: true });
    }
  }

  private unlockContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    try {
      if (!this.ctx) {
        const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (AudioCtx) {
          this.ctx = new AudioCtx();
        }
      }
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }
      this.isUnlocked = true;
      return this.ctx;
    } catch {
      return null;
    }
  }

  private getContext(): AudioContext | null {
    return this.unlockContext();
  }

  public setEnabled(enabled: boolean) {
    this.soundEnabled = enabled;
    if (enabled) {
      this.unlockContext();
    }
  }

  public isEnabled(): boolean {
    return this.soundEnabled;
  }

  /**
   * Crisp tactile click on button press
   */
  public playClick(pitch: number = 800) {
    if (!this.soundEnabled) return;
    try {
      const ctx = this.getContext();
      if (!ctx) return;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      const now = ctx.currentTime;
      osc.type = 'sine';
      osc.frequency.setValueAtTime(pitch, now);
      osc.frequency.exponentialRampToValueAtTime(140, now + 0.05);

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.05);
    } catch {
      // Audio error fallback
    }
  }

  /**
   * Mechanical tick for roulette / swipe items
   */
  public playTick(frequency: number = 650) {
    if (!this.soundEnabled) return;
    try {
      const ctx = this.getContext();
      if (!ctx) return;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      const now = ctx.currentTime;
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(frequency, now);
      osc.frequency.exponentialRampToValueAtTime(90, now + 0.04);

      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.04);
    } catch {
      // Audio error fallback
    }
  }

  /**
   * Harmonious chime for decision resolution / celebration
   */
  public playSuccess() {
    if (!this.soundEnabled) return;
    try {
      const ctx = this.getContext();
      if (!ctx) return;

      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
      const now = ctx.currentTime;

      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const start = now + idx * 0.07;
        const end = start + 0.28;

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, start);

        gain.gain.setValueAtTime(0.18, start);
        gain.gain.exponentialRampToValueAtTime(0.001, end);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(start);
        osc.stop(end);
      });
    } catch {
      // Audio error fallback
    }
  }
}

export const sound = new SoundEffects();
