// START GENAI
// Lightweight audio & haptic feedback for fast retail barcode scanning
export function triggerScanSuccess() {
  if (typeof window === "undefined") return;

  // Haptic feedback for mobile devices
  if ("vibrate" in navigator) {
    try {
      navigator.vibrate(50);
    } catch {
      // Ignore vibration error on unsupported platforms
    }
  }

  // Web Audio synth beep
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(1200, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1800, ctx.currentTime + 0.08);

    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.08);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.08);
  } catch {
    // Graceful fallback if AudioContext is blocked
  }
}

export function triggerScanError() {
  if (typeof window === "undefined") return;

  if ("vibrate" in navigator) {
    try {
      navigator.vibrate([80, 50, 80]);
    } catch {
      // Ignore
    }
  }

  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(280, ctx.currentTime);
    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.15);
  } catch {
    // Ignore
  }
}
// END GENAI
