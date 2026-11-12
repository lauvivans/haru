// Shared pieces of the pixel art: the palette, the pen, motion and the frame loop.
// Everything is painted with rectangles on small canvases and scaled up with
// image-rendering: pixelated. Colors come from the --px-* tokens; GSAP runs the motion.
import { gsap } from 'gsap';
import { theme } from '@/theme';

export const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

const NAMES = (
  'sky-top sky-mid sky-low sky-light cloud cloud-shade star mountain mountain-shade hill hill-shade ' +
  'stone stone-shade stone-dark roof roof-shade roof-blue flag flag-alt wood wood-light wood-dark wall window ' +
  'window-lit tree tree-shade ground ground-shade cobble water water-light flame flame-light awning awning-alt ' +
  'outline skin hair hair-light tunic tunic-shade belt pants boots eye cheek sweat sparkle rope rope-shade ' +
  'gold robe robe-shade steel steel-shade tabard tabard-shade plume'
).split(' ');

// Palette, read from the tokens on load and on every theme switch
export const P: Record<string, string> = {};
export const view = { night: false };

export function token(name: string) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

function readPalette() {
  const s = getComputedStyle(document.documentElement);
  NAMES.forEach((n) => (P[n] = s.getPropertyValue('--px-' + n).trim()));
  view.night = theme.get() === 'dark';
}
readPalette();
theme.subscribe(readPalette);

// GSAP unless the system asks for reduced motion; then jump to the end state
type Vars = gsap.TweenVars;
export function to(target: object, vars: Vars) {
  if (!reduced) return gsap.to(target, vars);
  const values: Record<string, unknown> = { ...vars };
  ['duration', 'ease', 'delay', 'repeat', 'yoyo', 'onComplete', 'keyframes', 'overwrite'].forEach(
    (k) => delete values[k],
  );
  // A yoyo ends where it started, so there is nothing to set
  if (!vars.yoyo) Object.assign(target, values);
  vars.onComplete?.();
  return null;
}

export type Pen = (x: number, y: number, w: number, h: number, c: string) => void;

export function pen(ctx: CanvasRenderingContext2D): Pen {
  return (x, y, w, h, c) => {
    ctx.fillStyle = P[c] || c;
    ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
  };
}

export function disc(r: Pen, cx: number, cy: number, rad: number, c: string) {
  for (let dy = -rad; dy <= rad; dy++) {
    const w = Math.round(Math.sqrt(rad * rad - dy * dy));
    r(cx - w, cy + dy, w * 2 + 1, 1, c);
  }
}

export function seeded(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// One loop for every canvas on screen. T is the time in seconds, frozen on reduced motion.
type Draw = (T: number) => void;
const draws = new Set<Draw>();

function frame() {
  const T = reduced ? 0 : performance.now() / 1000;
  draws.forEach((d) => d(T));
}

export function onFrame(draw: Draw) {
  if (draws.size === 0) gsap.ticker.add(frame);
  draws.add(draw);
  return () => {
    draws.delete(draw);
    if (draws.size === 0) gsap.ticker.remove(frame);
  };
}
