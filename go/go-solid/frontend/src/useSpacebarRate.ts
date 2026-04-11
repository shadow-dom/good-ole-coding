import { createSignal, onCleanup, onMount } from 'solid-js';

/**
 * Tracks spacebar tap rate (taps per second) over a rolling window.
 * Returns a normalized intensity 0..1 and the raw taps/sec.
 */
export function useSpacebarRate() {
  const [intensity, setIntensity] = createSignal(0);
  const [tapsPerSec, setTapsPerSec] = createSignal(0);

  const WINDOW_MS = 2000;
  const MAX_TPS = 10; // taps/sec that maps to intensity=1
  const DECAY_INTERVAL = 100;

  let timestamps: number[] = [];
  let decayTimer: number;

  function onKeyDown(e: KeyboardEvent) {
    if (e.code !== 'Space' || e.repeat) return;
    e.preventDefault();
    timestamps.push(performance.now());
  }

  function recalc() {
    const now = performance.now();
    timestamps = timestamps.filter((t) => now - t < WINDOW_MS);
    const tps = timestamps.length / (WINDOW_MS / 1000);
    setTapsPerSec(Math.round(tps * 10) / 10);
    setIntensity(Math.min(1, tps / MAX_TPS));
  }

  onMount(() => {
    window.addEventListener('keydown', onKeyDown);
    decayTimer = window.setInterval(recalc, DECAY_INTERVAL);
  });

  onCleanup(() => {
    window.removeEventListener('keydown', onKeyDown);
    clearInterval(decayTimer);
  });

  return { intensity, tapsPerSec };
}
