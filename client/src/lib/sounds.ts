import { Capacitor } from "@capacitor/core";
import { Haptics, ImpactStyle, NotificationType } from "@capacitor/haptics";

let audioCtx: AudioContext | null = null;
let audioInitialized = false;

function getAudioContext() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  return audioCtx;
}

function nativeHaptic(action: () => Promise<void>) {
  if (Capacitor.isNativePlatform()) void action().catch(() => undefined);
}

export function initAudio() {
  if (audioInitialized) return;
  const ctx = getAudioContext();
  if (ctx.state === "suspended") void ctx.resume();
  audioInitialized = true;
}

export function suspendAudio() {
  if (audioCtx?.state === "running") void audioCtx.suspend();
}

export function resumeAudio() {
  if (audioInitialized && audioCtx?.state === "suspended") void audioCtx.resume();
}

function playTone(frequency: number, duration: number, type: OscillatorType = "sine", volume = 0.3) {
  if (!audioInitialized) initAudio();
  const ctx = getAudioContext();
  if (ctx.state === "suspended") void ctx.resume();

  const oscillator = ctx.createOscillator();
  const gainNode = ctx.createGain();
  oscillator.connect(gainNode);
  gainNode.connect(ctx.destination);
  oscillator.frequency.value = frequency;
  oscillator.type = type;
  gainNode.gain.setValueAtTime(volume, ctx.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);
  oscillator.start(ctx.currentTime);
  oscillator.stop(ctx.currentTime + duration);
}

export function playMoveSound() {
  playTone(880, 0.08, "sine", 0.15);
  nativeHaptic(() => Haptics.impact({ style: ImpactStyle.Light }));
}

export function playBacktrackSound() {
  playTone(440, 0.1, "sine", 0.12);
  nativeHaptic(() => Haptics.impact({ style: ImpactStyle.Medium }));
}

export function playLoseLifeSound() {
  playTone(200, 0.3, "sawtooth", 0.2);
  setTimeout(() => playTone(150, 0.3, "sawtooth", 0.15), 100);
  nativeHaptic(() => Haptics.notification({ type: NotificationType.Error }));
}

export function playWinSound() {
  const notes = [523, 659, 784, 1047];
  notes.forEach((note, i) => {
    setTimeout(() => playTone(note, 0.2, "sine", 0.2), i * 100);
  });
  nativeHaptic(() => Haptics.notification({ type: NotificationType.Success }));
}

export function playClickSound() {
  playTone(600, 0.05, "square", 0.08);
  nativeHaptic(() => Haptics.selectionStart().then(() => Haptics.selectionEnd()));
}
