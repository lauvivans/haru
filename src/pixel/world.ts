// The world: one wide village behind every screen. Each screen is a spot in it,
// and the camera slides to the new spot when the screen changes.
import { to, token, pen, disc, seeded, onFrame, view, type Pen } from "@/pixel/core";

export const SCENES = { castle: 200, tavern: 520, market: 820, square: 1120 };
export type Scene = keyof typeof SCENES;

type Building = { t: string; x: number; w?: number; h?: number; chimney?: boolean };
type House = Building & { w: number; h: number };

const VILLAGE: Building[] = [
  { t: "house", x: 20, w: 30, h: 26 }, { t: "lamp", x: 70 },
  { t: "house", x: 290, w: 26, h: 22 }, { t: "house", x: 330, w: 34, h: 30, chimney: true }, { t: "lamp", x: 380 },
  { t: "house", x: 412, w: 28, h: 24 }, { t: "lamp", x: 470 }, { t: "tavern", x: 498, w: 44, h: 34, chimney: true },
  { t: "lamp", x: 575 }, { t: "house", x: 600, w: 30, h: 28 }, { t: "house", x: 640, w: 26, h: 22, chimney: true },
  { t: "lamp", x: 740 }, { t: "stall", x: 768 }, { t: "fountain", x: 808 }, { t: "stall", x: 848 }, { t: "lamp", x: 900 },
  { t: "house", x: 930, w: 32, h: 30 }, { t: "house", x: 975, w: 28, h: 24, chimney: true },
  { t: "lamp", x: 1060 }, { t: "banner", x: 1080 }, { t: "banner", x: 1160 }, { t: "lamp", x: 1182 },
  { t: "house", x: 1210, w: 30, h: 28 }, { t: "house", x: 1250, w: 34, h: 32, chimney: true }, { t: "house", x: 1300, w: 26, h: 22 },
];

const rand = seeded(7);
const STARS = Array.from({ length: 70 }, () => [rand(), rand(), rand()]);
const CLOUDS = [[0.05, 0.3], [0.35, 0.18], [0.6, 0.38], [0.85, 0.24]];
const TREES = Array.from({ length: 140 }, (_, i) => [i * 15 - 200 + rand() * 8, 3 + Math.floor(rand() * 2)]);

function roof(r: Pen, x: number, y: number, w: number, c: string) {
  let i = 0;
  for (; w - 2 * i > 1; i++) r(x + i, y - 2 - i * 2, w - 2 * i, 2, c);
  return i * 2;
}

function flag(r: Pen, x: number, top: number, T: number) {
  const f = Math.floor(T * 4 + x) % 2;
  r(x, top, 1, 10, "wood-dark");
  r(x + 1, top + f, 6, 2, "flag");
  r(x + 1, top + 2 + f, 5, 2, "flag-alt");
}

function castle(r: Pen, x: number, base: number, T: number) {
  const win = view.night ? "window-lit" : "window";
  const block = (X: number, Y: number, w: number, h: number) => { r(X, Y, w, h, "stone"); r(X + w - 2, Y, 2, h, "stone-shade"); };
  const merlons = (X: number, Y: number, w: number) => { for (let i = 0; i < w; i += 4) r(X + i, Y - 3, 2, 3, "stone"); };
  block(x - 36, base - 22, 72, 30); merlons(x - 36, base - 22, 72);
  [x - 44, x + 32].forEach((tx) => {
    block(tx, base - 40, 12, 48);
    const h = roof(r, tx - 2, base - 40, 16, "roof-blue");
    flag(r, tx + 6, base - 40 - h - 9, T);
    r(tx + 5, base - 32, 2, 4, win);
  });
  block(x - 14, base - 50, 28, 30); merlons(x - 14, base - 50, 28);
  block(x - 5, base - 62, 10, 12);
  const h = roof(r, x - 7, base - 62, 14, "roof-blue");
  flag(r, x, base - 62 - h - 9, T);
  r(x - 8, base - 42, 2, 4, win); r(x + 6, base - 42, 2, 4, win); r(x - 1, base - 58, 2, 3, win);
  r(x - 6, base - 13, 12, 21, "stone-dark");
  for (let i = 0; i < 5; i++) r(x - 5 + i * 2 + 1, base - 12, 1, 20, "wood-dark");
  r(x - 6, base - 6, 12, 1, "wood-dark");
}

function pine(r: Pen, x: number, base: number, tiers: number) {
  r(x - 1, base - 3, 2, 3, "wood-dark");
  for (let t = 0; t < tiers; t++) {
    const k = 4 - t;
    const top = base - 3 - (t + 1) * 4 - k;
    for (let j = 0; j <= k; j++) {
      r(x - j - 1, top + j, j + 1, 1, "tree");
      r(x, top + j, j + 1, 1, "tree-shade");
    }
  }
}

function windowAt(r: Pen, x: number, y: number) {
  r(x - 1, y - 1, 7, 7, "outline");
  r(x, y, 5, 5, view.night ? "window-lit" : "window");
  r(x + 2, y, 1, 5, "wood-dark");
  r(x, y + 2, 5, 1, "wood-dark");
}

function house(r: Pen, X: number, G: number, o: House) {
  const { w, h } = o;
  const top = G - h;
  if (o.chimney) { r(X + w - 11, top - 18, 6, 14, "outline"); r(X + w - 10, top - 17, 4, 13, "stone"); }
  r(X - 1, top - 1, w + 2, h + 1, "outline");
  r(X, top, w, h, "wall");
  r(X, top, w, 2, "wood-dark");
  r(X, top + Math.floor(h / 2), w, 1, "wood-dark");
  for (let i = 0; i < w - 2; i += 9) r(X + i, top, 2, h, "wood-dark");
  r(X + w - 2, top, 2, h, "wood-dark");
  windowAt(r, X + 4, top + 4);
  if (w > 26) windowAt(r, X + w - 10, top + 4);
  const d = X + Math.floor(w / 2) - 3;
  r(d - 1, G - 11, 8, 11, "outline");
  r(d, G - 10, 6, 10, "wood");
  r(d + 4, G - 5, 1, 1, "flame-light");
  const rw = w + 6;
  for (let i = 0; i < 10 && rw - 2 * i > 6; i++) r(X - 3 + i, top - 2 - i * 2, rw - 2 * i, 2, i % 2 ? "roof-shade" : "roof");
  r(X - 3, top - 1, rw, 1, "outline");
  if (o.t === "tavern") {
    const sx = X + w;
    r(sx, top + 8, 8, 1, "wood-dark");
    r(sx + 1, top + 11, 8, 7, "outline");
    r(sx + 2, top + 12, 6, 5, "wood");
    r(sx + 3, top + 13, 3, 3, "flame-light");
    r(sx + 6, top + 14, 1, 1, "flame-light");
    r(sx + 4, top + 9, 1, 2, "wood-dark");
  }
}

function lamp(r: Pen, X: number, G: number, T: number) {
  if (view.night) {
    for (let dy = -9; dy <= 9; dy++) {
      for (let dx = -9; dx <= 9; dx++) {
        const d = Math.hypot(dx, dy);
        if (d > 3 && d < 9 && (dx + dy) % 4 === 0) r(X + 1 + dx, G - 28 + dy, 1, 1, "flame-light");
      }
    }
  }
  r(X, G - 26, 2, 26, "outline");
  r(X - 2, G - 31, 6, 6, "outline");
  const flicker = Math.sin(T * 13 + X) > 0;
  r(X - 1, G - 30, 4, 4, flicker ? "flame" : "flame-light");
  r(X, G - 29, 2, 2, "flame-light");
}

function stall(r: Pen, X: number, G: number) {
  r(X, G - 26, 2, 26, "wood-dark");
  r(X + 30, G - 26, 2, 26, "wood-dark");
  r(X - 1, G - 11, 34, 11, "outline");
  r(X, G - 10, 32, 10, "wood");
  r(X, G - 10, 32, 2, "wood-light");
  for (let i = 0; i < 36; i += 4) {
    const c = (i / 4) % 2 ? "awning-alt" : "awning";
    r(X - 2 + i, G - 32, 4, 6, c);
    r(X - 1 + i, G - 26, 2, 1, c);
  }
  r(X + 3, G - 13, 4, 3, "flame");
  r(X + 9, G - 13, 4, 3, "tree");
  r(X + 15, G - 13, 4, 3, "roof");
  r(X + 21, G - 14, 5, 4, "flag-alt");
}

function fountain(r: Pen, X: number, G: number, T: number) {
  r(X - 1, G - 9, 32, 9, "outline");
  r(X, G - 8, 30, 8, "stone");
  r(X, G - 8, 30, 2, "stone-shade");
  r(X + 2, G - 7, 26, 2, "water");
  r(X + 13, G - 22, 4, 14, "stone");
  r(X + 8, G - 24, 14, 3, "stone");
  r(X + 9, G - 25, 12, 1, "water");
  for (let k = 0; k < 6; k++) {
    const ph = (T * 1.2 + k / 6) % 1;
    const y = G - 24 + ph * ph * 17;
    r(X + 8 - ph * 5, y, 1, 1, "water-light");
    r(X + 21 + ph * 5, y, 1, 1, "water-light");
  }
}

function banner(r: Pen, X: number, G: number, T: number) {
  const w = Math.floor(T * 3 + X) % 2;
  r(X, G - 42, 2, 42, "wood-dark");
  r(X - 1, G - 44, 4, 2, "flag-alt");
  r(X + 2, G - 40, 9, 16, "flag");
  r(X + 2, G - 40, 9, 2, "flag-alt");
  r(X + 2, G - 24, 3, 2 + w, "flag");
  r(X + 8, G - 24, 3, 3 - w, "flag");
  r(X + 6, G - 35, 1, 6, "flag-alt");
  r(X + 4, G - 33, 5, 1, "flag-alt");
}

export function mountWorld(canvas: HTMLCanvasElement, scene: Scene) {
  const ctx = canvas.getContext("2d")!;
  const r = pen(ctx);
  let W = 0, H = 0;

  function size() {
    const artH = Number(token("--world-height")) || 180;
    const scale = Math.max(2, Math.min(Math.ceil(innerHeight / artH), Math.floor(innerWidth / 200)));
    W = Math.ceil(innerWidth / scale);
    H = Math.ceil(innerHeight / scale);
    canvas.width = W;
    canvas.height = H;
    canvas.style.width = `${W * scale}px`;
    canvas.style.height = `${H * scale}px`;
  }
  size();
  addEventListener("resize", size);

  // Camera: on the first load it slides in a little; then from spot to spot
  const cam = { x: SCENES[scene] - 160 };
  function goTo(next: Scene) {
    const target = SCENES[next];
    to(cam, { x: target, duration: Math.min(2.6, 0.6 + Math.abs(target - cam.x) / 400), ease: "power2.inOut", overwrite: true });
  }
  goTo(scene);

  function draw(T: number) {
    const cx = cam.x;
    const G = H - 20;
    const horizon = G - 60;
    const layer = (p: number) => cx * p - W / 2; // art x on screen = layer x - layer(p)

    // Sky in three dithered bands
    r(0, 0, W, H, "sky-top");
    ([[Math.round(horizon * 0.55), "sky-mid"], [Math.round(horizon * 0.82), "sky-low"]] as const).forEach(([y, c]) => {
      for (let x = 0; x < W; x += 2) { r(x, y, 1, 1, c); r(x + 1, y + 1, 1, 1, c); }
      r(0, y + 2, W, H, c);
    });

    // Sun by day, moon and stars by night
    const lx = Math.round(W * 0.78), ly = Math.max(16, horizon - 100);
    if (view.night) {
      STARS.forEach(([sx, sy, ph], i) => {
        if (Math.sin(T * 1.6 + ph * 20) < -0.4) return;
        const x = Math.round((((sx * W * 1.4 - cx * 0.05) % W) + W) % W);
        const y = Math.round(sy * (horizon - 6));
        r(x, y, 1, 1, "star");
        if (i % 9 === 0) { r(x - 1, y, 3, 1, "star"); r(x, y - 1, 1, 3, "star"); }
      });
      disc(r, lx, ly, 7, "sky-light");
      r(lx - 3, ly - 2, 2, 2, "cloud-shade");
      r(lx + 2, ly + 2, 3, 2, "cloud-shade");
    } else {
      disc(r, lx, ly, 8, "sky-light");
    }

    // Clouds drift on their own
    CLOUDS.forEach(([cx0, cy]) => {
      const span = W + 60;
      const x = Math.round((((cx0 * span + T * 3 - cx * 0.15) % span) + span) % span) - 30;
      const y = Math.round(horizon * cy);
      r(x, y + 4, 26, 4, "cloud"); r(x + 4, y + 1, 10, 4, "cloud");
      r(x + 11, y - 1, 9, 6, "cloud"); r(x + 18, y + 2, 8, 3, "cloud");
      r(x + 2, y + 7, 22, 1, "cloud-shade");
    });

    // Far mountains
    const mh = (x: number) => 26 + 10 * Math.sin(x * 0.035) + 7 * Math.sin(x * 0.083 + 1.3) + 4 * Math.sin(x * 0.17);
    const m0 = layer(0.2);
    for (let x = 0; x < W; x++) {
      const h = mh(x + m0);
      const top = Math.round(horizon + 12 - h);
      r(x, top, 1, G - top, mh(x + m0 + 1) < h ? "mountain-shade" : "mountain");
      if (h > 37) r(x, top, 1, 2, "cloud");
    }

    // Hills, with a flat top for the castle
    const castleX = SCENES.castle * 0.4;
    const hh = (x: number) => {
      const d = Math.abs(x - castleX);
      return 10 + 5 * Math.sin(x * 0.025) + 3 * Math.sin(x * 0.061 + 2) + 24 * Math.min(1, Math.max(0, (64 - d) / 28));
    };
    const h0 = layer(0.4);
    for (let x = 0; x < W; x++) {
      const top = Math.round(G - 12 - hh(x + h0));
      r(x, top, 1, G - top, (x + Math.round(h0)) % 2 && hh(x + h0 + 1) < hh(x + h0) ? "hill-shade" : "hill");
    }
    const castleScreen = Math.round(castleX - h0);
    if (castleScreen > -60 && castleScreen < W + 60) castle(r, castleScreen, Math.round(G - 12 - hh(castleX)), T);

    // Pines
    const t0 = layer(0.65);
    TREES.forEach(([tx, tiers]) => {
      const x = Math.round(tx - t0);
      if (x > -10 && x < W + 10) pine(r, x, G - 2, tiers);
    });

    // Cobbled ground
    r(0, G, W, H - G, "ground");
    r(0, G, W, 1, "ground-shade");
    const shift = Math.round(cx) % 6;
    for (let y = G + 3, row = 0; y < H; y += 4, row++) {
      for (let x = -shift - 6 + (row % 2) * 3; x < W; x += 6) r(x, y, 4, 2, "cobble");
    }

    // The village
    const v0 = layer(1);
    VILLAGE.forEach((o) => {
      const X = Math.round(o.x - v0);
      if (X < -80 || X > W + 40) return;
      if (o.t === "house" || o.t === "tavern") house(r, X, G, o as House);
      else if (o.t === "lamp") lamp(r, X, G, T);
      else if (o.t === "stall") stall(r, X, G);
      else if (o.t === "fountain") fountain(r, X, G, T);
      else if (o.t === "banner") banner(r, X, G, T);
    });
  }

  const stop = onFrame(draw);

  return {
    goTo,
    stop() {
      removeEventListener("resize", size);
      stop();
    },
  };
}
