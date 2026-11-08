// The gallows, built one piece per miss, with Haru on it:
// 1 platform, 2 post, 3 beam, 4 brace, 5 rope, 6 noose, 7 the trapdoor opens.
// A win takes the noose off.
import { gsap } from "gsap";
import { to, token, pen, onFrame } from "@/pixel/core";
import { drawHaru, newState, react, type Mood, type SpriteSize } from "@/pixel/haru";
import { MAX_MISSES } from "@/round";

const STAGE_W = 112, STAGE_H = 104;
const HARU_X = 58;
const HY = { ground: 76, platform: 54, dropped: 62 };

// size: a fixed sprite scale. Without it the stage fills its parent, up to --stage-height.
export function mountGallows(canvas: HTMLCanvasElement, size?: SpriteSize) {
  canvas.width = STAGE_W;
  canvas.height = STAGE_H;
  const ctx = canvas.getContext("2d")!;
  const r = pen(ctx);
  const s = { ...newState(), hy: HY.ground };
  const part: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0 };
  let fitted = "";

  function fit() {
    const wrap = canvas.parentElement;
    if (!wrap) return;
    const key = `${wrap.clientWidth}x${innerHeight}`;
    if (key === fitted) return;
    fitted = key;
    let scale: number;
    if (size) scale = Number(token(`--sprite-${size}`));
    else {
      const maxH = (innerHeight * parseFloat(token("--stage-height"))) / 100;
      scale = Math.floor(Math.min(wrap.clientWidth / STAGE_W, maxH / STAGE_H));
    }
    scale = Math.max(1, scale || 1);
    canvas.style.width = `${STAGE_W * scale}px`;
    canvas.style.height = `${STAGE_H * scale}px`;
  }

  function draw(T: number) {
    fit();
    ctx.clearRect(0, 0, STAGE_W, STAGE_H);
    const p = part;
    const drop = (i: number) => -(1 - p[i]) * 30;

    // Stone base of the square
    r(10, 100, 92, 4, "stone-shade");
    r(10, 100, 92, 1, "stone");
    for (let x = 13; x < 100; x += 7) r(x, 102, 4, 1, "stone-dark");

    // 1. Platform with its legs
    if (p[1] > 0.01) {
      const dy = drop(1);
      r(25, 82 + dy, 6, 18, "outline"); r(26, 82 + dy, 4, 18, "wood");
      r(97, 82 + dy, 6, 18, "outline"); r(98, 82 + dy, 4, 18, "wood");
      r(22, 77 + dy, 84, 6, "outline");
      r(23, 78 + dy, 82, 3, "wood");
      r(23, 81 + dy, 82, 1, "wood-dark");
      for (let x = 31; x < 104; x += 8) r(x, 78 + dy, 1, 3, "wood-dark");
      r(56, 78 + dy, 1, 3, "outline");
      r(77, 78 + dy, 1, 3, "outline");
    }
    // 2. Post
    if (p[2] > 0.01) {
      const dy = drop(2);
      r(27, 7 + dy, 6, 71, "outline"); r(28, 8 + dy, 4, 70, "wood"); r(31, 8 + dy, 1, 70, "wood-dark");
    }
    // 3. Beam
    if (p[3] > 0.01) {
      const dy = drop(3);
      r(25, 6 + dy, 52, 6, "outline"); r(26, 7 + dy, 50, 4, "wood"); r(26, 10 + dy, 50, 1, "wood-dark");
    }
    // 4. Brace
    if (p[4] > 0.01) {
      const dy = drop(4);
      for (let i = 0; i < 9; i++) r(32 + i * 2, 27 - i * 2 + dy, 5, 5, "outline");
      for (let i = 0; i < 9; i++) r(33 + i * 2, 28 - i * 2 + dy, 3, 3, "wood");
    }

    // Haru
    const ox = HARU_X + Math.round(s.dx);
    const oy = Math.round(s.hy - s.hop);
    const neck = oy + 9;

    // 5. Rope, 6. down to the neck
    if (p[5] > 0.01) {
      const end = p[6] > 0.01 ? 31 + (neck - 31) * p[6] : 11 + 20 * p[5];
      const rx = 65 + Math.round(s.dx * 0.5);
      r(rx, 11, 2, end - 11, "rope");
      for (let y = 12; y < end; y += 3) r(rx, y, 1, 1, "rope-shade");
    }

    drawHaru(r, ox, oy, s, T);

    if (p[6] > 0.99) {
      r(ox + 4, oy + 10, 8, 2, "rope");
      r(ox + 6, oy + 8, 4, 3, "rope-shade");
    }

    // 7. The trapdoor opens
    if (p[7] > 0.01) {
      ctx.clearRect(57, 77, 20, 6);
      r(56, 78, 4, Math.round(16 * p[7]), "outline");
      r(57, 78, 2, Math.round(16 * p[7]), "wood");
    }
  }

  const stop = onFrame(draw);

  function stopTweens() {
    gsap.killTweensOf(part);
    gsap.killTweensOf(s);
    s.loop = null;
  }
  // A new round: no pieces, Haru on the ground
  function reset() {
    stopTweens();
    for (let i = 1; i <= MAX_MISSES; i++) part[i] = 0;
    s.hy = HY.ground;
    s.mood = "idle";
    react(s, "idle");
  }

  // instant: no falling pieces, for a round shown already in progress
  function setMisses(n: number, instant: boolean) {
    for (let i = 1; i <= MAX_MISSES; i++) {
      const want = i <= n ? 1 : 0;
      if (part[i] === want) continue;
      if (instant || want === 0) part[i] = want;
      else to(part, { [i]: 1, duration: i === 7 ? 0.2 : 0.45, ease: i >= 5 ? "power2.in" : "bounce.out" });
    }
    const hy = n >= MAX_MISSES ? HY.dropped : n >= 1 ? HY.platform : HY.ground;
    if (instant) s.hy = hy;
    else if (hy !== s.hy) to(s, { hy, duration: 0.35, delay: n === 1 ? 0.35 : 0, ease: n >= MAX_MISSES ? "power2.in" : "back.out(2)" });
  }

  function setMood(m: Mood) {
    s.mood = m;
    react(s, m);
    if (m === "win" && part[6] > 0) to(part, { 6: 0, duration: 0.4, ease: "power2.out" });
    if (m === "loss") {
      s.dx = -1;
      s.loop = to(s, { dx: 1, duration: 0.7, yoyo: true, repeat: -1, ease: "sine.inOut", delay: 0.2 });
    }
  }

  let misses = -1; // nothing shown yet
  let guesses = 0;
  return {
    // Acts only on what changed. The first call shows the pieces without the fall;
    // going back to 0 misses resets it for a new round. A new guess count replays
    // the mood, so two misses in a row both get a reaction.
    update(next: { misses: number; mood: Mood; guesses: number }) {
      if (next.misses !== misses) {
        if (next.misses === 0) reset();
        else setMisses(next.misses, misses === -1);
      }
      if (misses === -1 || next.mood !== s.mood || next.guesses !== guesses) setMood(next.mood);
      misses = next.misses;
      guesses = next.guesses;
    },
    stop() {
      stopTweens();
      stop();
    },
  };
}
