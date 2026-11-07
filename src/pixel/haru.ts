// Haru: 16 x 24 art pixels, feet on the bottom row. Three looks, five moods.
import { gsap } from "gsap";
import { stored } from "@/stored";
import { reduced, to, token, pen, onFrame, type Pen } from "@/pixel/core";

export const MOODS = ["idle", "hit", "miss", "win", "loss"] as const;
export type Mood = (typeof MOODS)[number];

type LookParts = {
  head: string;
  body: string;
  shade: string;
  arms: string;
  legs: string;
  belt: string;
  hands: string;
  robe?: boolean;
  hat?: boolean;
  helmet?: boolean;
};

// Same body and faces, different clothes
const LOOKS = {
  villager: { head: "hair", body: "tunic", shade: "tunic-shade", arms: "tunic", legs: "pants", belt: "belt", hands: "skin" },
  wizard: { head: "hair", body: "robe", shade: "robe-shade", arms: "robe", legs: "robe", belt: "gold", hands: "skin", robe: true, hat: true },
  knight: { head: "steel", body: "tabard", shade: "tabard-shade", arms: "steel", legs: "steel", belt: "wood-dark", hands: "steel-shade", helmet: true },
} satisfies Record<string, LookParts>;

export type Look = keyof typeof LOOKS;
export const LOOK_NAMES = Object.keys(LOOKS) as Look[];

// The player's look, kept in the browser. Each player sees their own.
export const look = stored<Look>("haru-look", () => "villager", (v): v is Look => v in LOOKS);

type Rect = [number, number, number, number];
const HAT: Rect[] = [[7, -6, 2, 1], [7, -5, 3, 1], [6, -4, 4, 1], [6, -3, 5, 1], [5, -2, 6, 1], [5, -1, 7, 1], [4, 0, 8, 2], [3, 2, 10, 1], [1, 3, 14, 1]];
const PLUME: Rect[] = [[7, -3, 3, 2], [6, -1, 4, 2]];

function haruParts(L: LookParts, armsUp: boolean) {
  const parts: [number, number, number, number, string][] = [
    [3, 1, 10, 10, L.head], // head block: the face is painted over it
    [4, 11, 8, 7, L.body],
    [4, 21, 3, 2, "boots"], [9, 21, 3, 2, "boots"],
  ];
  if (L.robe) parts.push([4, 18, 8, 3, L.body]);
  else parts.push([5, 18, 2, 3, L.legs], [9, 18, 2, 3, L.legs]);
  if (armsUp) parts.push([1, 4, 2, 8, L.arms], [13, 4, 2, 8, L.arms], [3, 11, 1, 2, L.arms], [12, 11, 1, 2, L.arms]);
  else parts.push([2, 12, 2, 5, L.arms], [12, 12, 2, 5, L.arms]);
  if (L.hat) HAT.forEach(([x, y, w, h]) => parts.push([x, y, w, h, "robe"]));
  if (L.helmet) PLUME.forEach(([x, y, w, h]) => parts.push([x, y, w, h, "plume"]));
  return parts;
}

// Motion state shared by the lone sprite and Haru on the gallows
export type HaruState = {
  mood: Mood;
  look?: Look; // a fixed look; otherwise the player's choice
  hop: number;
  dx: number;
  loop: gsap.core.Tween | null;
  seed: number;
};

export function newState(mood: Mood = "idle"): HaruState {
  return { mood, hop: 0, dx: 0, loop: null, seed: Math.random() * 4 };
}

export function drawHaru(r: Pen, ox: number, oy: number, s: HaruState, T: number) {
  const L: LookParts = LOOKS[s.look ?? look.get()];
  const armsUp = s.mood === "hit" || s.mood === "win";
  const q: Pen = (x, y, w, h, c) => r(ox + x, oy + y, w, h, c);
  const dots = (pts: [number, number][], c = "eye") => pts.forEach(([x, y]) => q(x, y, 1, 1, c));
  const parts = haruParts(L, armsUp);
  // Outline first, with the corners left out so shapes look round
  parts.forEach(([x, y, w, h]) => {
    q(x - 1, y, w + 2, h, "outline");
    q(x, y - 1, w, h + 2, "outline");
  });
  parts.forEach(([x, y, w, h, c]) => q(x, y, w, h, c));

  // Face and clothes
  q(4, 4, 8, 7, "skin");
  q(3, 6, 1, 4, "skin");
  q(12, 6, 1, 4, "skin");
  if (L.helmet) {
    q(3, 4, 10, 1, "steel-shade");
    q(7, 4, 2, 2, "steel-shade");
    q(3, 6, 1, 4, "steel");
    q(12, 6, 1, 4, "steel");
  } else {
    q(4, 4, 3, 1, "hair");
    q(9, 4, 2, 1, "hair");
  }
  if (L.hat) {
    q(1, 3, 14, 1, "robe-shade");
    dots([[7, -1], [9, -3], [6, 1]], "gold");
  } else if (!L.helmet) {
    q(5, 2, 4, 1, "hair-light");
    q(10, 3, 1, 1, "hair-light");
  }
  q(7, 11, 2, 1, "skin");
  q(4, 15, 8, 1, L.belt);
  q(4, 16, 8, 2, L.shade);
  if (L.robe) q(4, 20, 8, 1, L.shade);
  if (L.helmet) {
    q(7, 12, 2, 3, "gold");
    q(6, 13, 4, 1, "gold");
  }
  if (armsUp) {
    q(1, 4, 2, 1, L.hands);
    q(13, 4, 2, 1, L.hands);
  } else {
    q(2, 16, 2, 1, L.hands);
    q(12, 16, 2, 1, L.hands);
  }

  // Face by mood
  const blink = (T + s.seed) % 3.7 < 0.12;
  const happyEyes: [number, number][] = [[4, 7], [5, 6], [6, 7], [9, 7], [10, 6], [11, 7]];
  switch (s.mood) {
    case "hit":
      dots(happyEyes);
      q(6, 9, 4, 1, "eye");
      q(7, 10, 2, 1, "eye");
      break;
    case "win":
      dots(happyEyes);
      q(6, 8, 4, 2, "eye");
      q(7, 9, 2, 1, "cheek");
      break;
    case "miss":
      dots([[4, 6], [5, 5], [6, 5], [9, 5], [10, 5], [11, 6]]);
      dots([[5, 7], [10, 7]]);
      dots([[6, 10], [7, 9], [8, 10], [9, 9]]);
      q(14, 5, 1, 2, "sweat");
      break;
    case "loss":
      dots([[4, 5], [6, 5], [5, 6], [4, 7], [6, 7], [9, 5], [11, 5], [10, 6], [9, 7], [11, 7]]);
      q(6, 9, 4, 1, "eye");
      break;
    default:
      if (blink) {
        q(4, 7, 2, 1, "eye");
        q(10, 7, 2, 1, "eye");
      } else {
        q(5, 6, 1, 2, "eye");
        q(10, 6, 1, 2, "eye");
      }
      q(7, 9, 2, 1, "eye");
  }
  if (s.mood !== "loss") dots([[4, 8], [11, 8]], "cheek");

  if (s.mood === "win") {
    const set = Math.floor(T * 4) % 2 ? [[-3, 3], [18, 12]] : [[18, 1], [-4, 14]];
    set.forEach(([x, y]) => {
      q(x, y - 1, 1, 3, "sparkle");
      q(x - 1, y, 3, 1, "sparkle");
    });
  }
}

// Shared reactions: a hop on a hit, a shiver on a miss, jumping on a win
export function react(s: HaruState, mood: Mood) {
  s.loop?.kill();
  s.loop = null;
  s.hop = 0;
  s.dx = 0;
  if (mood === "hit") s.loop = to(s, { hop: 4, duration: 0.14, yoyo: true, repeat: 1, ease: "power2.out" });
  if (mood === "miss" && !reduced) s.loop = gsap.to(s, { keyframes: { dx: [-1, 1, -1, 1, 0] }, duration: 0.4 });
  if (mood === "win") s.loop = to(s, { hop: 5, duration: 0.25, yoyo: true, repeat: -1, ease: "power2.out" });
}

// Haru alone, for the landing, cards and dialogs
export type SpriteSize = "sm" | "md" | "lg";

export function mountSprite(canvas: HTMLCanvasElement, size: SpriteSize, fixedLook?: Look) {
  const W = 26, H = 40;
  canvas.width = W;
  canvas.height = H;
  const scale = Number(token(`--sprite-${size}`)) || 4;
  canvas.style.width = `${W * scale}px`;
  canvas.style.height = `${H * scale}px`;
  const ctx = canvas.getContext("2d")!;
  const r = pen(ctx);
  const s = newState();
  s.look = fixedLook;

  const stop = onFrame((T) => {
    ctx.clearRect(0, 0, W, H);
    const oy = H - 24 - Math.round(s.hop) + (s.mood === "loss" ? 1 : 0);
    drawHaru(r, 5 + Math.round(s.dx), oy, s, T);
  });

  return {
    setMood(m: Mood) {
      s.mood = m;
      react(s, m);
    },
    stop() {
      s.loop?.kill();
      stop();
    },
  };
}
