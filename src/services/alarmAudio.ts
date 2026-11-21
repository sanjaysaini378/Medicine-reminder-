import { AlarmTone } from '../types/medicine';

let activeInterval: number | null = null;
let sharedCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioCtx) return null;
  if (!sharedCtx) {
    sharedCtx = new AudioCtx();
  }
  if (sharedCtx.state === 'suspended') {
    sharedCtx.resume().catch(() => {});
  }
  return sharedCtx;
}

export function playToneOnce(tone: AlarmTone): void {
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const playNote = (freq: number, start: number, duration: number, type: OscillatorType, gainPeak: number) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, start);
    gain.gain.setValueAtTime(0.001, start);
    gain.gain.exponentialRampToValueAtTime(gainPeak, start + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(start);
    osc.stop(start + duration + 0.02);
  };

  if (tone === 'gentle') {
    playNote(523.25, now, 0.35, 'sine', 0.22); // C5
    playNote(659.25, now + 0.22, 0.45, 'sine', 0.22); // E5
    playNote(783.99, now + 0.45, 0.65, 'sine', 0.2); // G5
  } else if (tone === 'bell') {
    playNote(880, now, 0.5, 'triangle', 0.28); // A5
    playNote(1318.5, now + 0.02, 0.4, 'sine', 0.14); // E6 overtone
    playNote(880, now + 0.55, 0.55, 'triangle', 0.26);
  } else {
    // urgent pulse
    playNote(987.77, now, 0.16, 'square', 0.14);
    playNote(987.77, now + 0.22, 0.16, 'square', 0.14);
    playNote(1174.66, now + 0.44, 0.25, 'square', 0.16);
  }
}

export function startAlarmRinging(tone: AlarmTone, soundEnabled: boolean, vibrationEnabled: boolean): void {
  stopAlarmRinging();

  const triggerCycle = () => {
    if (soundEnabled) {
      playToneOnce(tone);
    }
    if (vibrationEnabled && typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
      try {
        navigator.vibrate([300, 150, 300]);
      } catch {
        // Ignore on unsupported browsers
      }
    }
  };

  triggerCycle();
  activeInterval = window.setInterval(triggerCycle, 2200);
}

export function stopAlarmRinging(): void {
  if (activeInterval !== null) {
    window.clearInterval(activeInterval);
    activeInterval = null;
  }
  if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
    try {
      navigator.vibrate(0);
    } catch {
      // Ignore
    }
  }
}
