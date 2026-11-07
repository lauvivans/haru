// Haru pixel art: the village behind every screen, the gallows stage and Haru's sprite.
// Everything is painted with rectangles on small canvases and scaled up with
// image-rendering: pixelated. Colors come from the --px-* tokens; GSAP runs the motion.
(function () {
  const g = window.gsap;
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const root = document.documentElement;

  // Palette, read from tokens.css on load and on every theme switch
  const NAMES = ("sky-top sky-mid sky-low sky-light cloud cloud-shade star mountain mountain-shade hill hill-shade " +
    "stone stone-shade stone-dark roof roof-shade roof-blue flag flag-alt wood wood-light wood-dark wall window " +
    "window-lit tree tree-shade ground ground-shade cobble water water-light flame flame-light awning awning-alt " +
    "outline skin hair hair-light tunic tunic-shade belt pants boots eye cheek sweat sparkle rope rope-shade " +
    "gold robe robe-shade steel steel-shade tabard tabard-shade plume").split(" ");
  const P = {};
  let night = false;

  function token(name) {
    return getComputedStyle(root).getPropertyValue(name).trim();
  }

  function readPalette() {
    const s = getComputedStyle(root);
    NAMES.forEach((n) => (P[n] = s.getPropertyValue("--px-" + n).trim()));
    night = root.dataset.theme === "dark";
  }

  // GSAP when it loaded and motion is allowed; otherwise jump to the end state
  function to(target, vars) {
    if (g && !reduced) return g.to(target, vars);
    const values = { ...vars };
    ["duration", "ease", "delay", "repeat", "yoyo", "onComplete", "keyframes"].forEach((k) => delete values[k]);
    Object.assign(target, values);
    vars.onComplete?.();
    return null;
  }

  function pen(ctx) {
    return (x, y, w, h, c) => {
      ctx.fillStyle = P[c] || c;
      ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
    };
  }

  function disc(r, cx, cy, rad, c) {
    for (let dy = -rad; dy <= rad; dy++) {
      const w = Math.round(Math.sqrt(rad * rad - dy * dy));
      r(cx - w, cy + dy, w * 2 + 1, 1, c);
    }
  }

  function seeded(seed) {
    return () => {
      seed = (seed + 0x6d2b79f5) | 0;
      let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  /* ---------- Haru: 16 x 24 art pixels, feet on the bottom row ---------- */

  // Three looks for Haru. Same body and faces, different clothes.
  const LOOKS = {
    villager: { head: "hair", body: "tunic", shade: "tunic-shade", arms: "tunic", legs: "pants", belt: "belt", hands: "skin" },
    wizard: { head: "hair", body: "robe", shade: "robe-shade", arms: "robe", legs: "robe", belt: "gold", hands: "skin", robe: true, hat: true },
    knight: { head: "steel", body: "tabard", shade: "tabard-shade", arms: "steel", legs: "steel", belt: "wood-dark", hands: "steel-shade", helmet: true },
  };
  const HAT = [[7, -6, 2, 1], [7, -5, 3, 1], [6, -4, 4, 1], [6, -3, 5, 1], [5, -2, 6, 1], [5, -1, 7, 1], [4, 0, 8, 2], [3, 2, 10, 1], [1, 3, 14, 1]];
  const PLUME = [[7, -3, 3, 2], [6, -1, 4, 2]];
  let currentLook = "villager";

  function haruParts(L, armsUp) {
    const parts = [
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

  function drawHaru(r, ox, oy, s, T) {
    const L = LOOKS[s.look || currentLook] || LOOKS.villager;
    const armsUp = s.mood === "hit" || s.mood === "win";
    const q = (x, y, w, h, c) => r(ox + x, oy + y, w, h, c);
    const dots = (pts, c = "eye") => pts.forEach(([x, y]) => q(x, y, 1, 1, c));
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
    if (L.helmet) { q(7, 12, 2, 3, "gold"); q(6, 13, 4, 1, "gold"); }
    if (armsUp) { q(1, 4, 2, 1, L.hands); q(13, 4, 2, 1, L.hands); }
    else { q(2, 16, 2, 1, L.hands); q(12, 16, 2, 1, L.hands); }

    // Face by mood
    const blink = ((T + s.seed) % 3.7) < 0.12;
    const happyEyes = [[4, 7], [5, 6], [6, 7], [9, 7], [10, 6], [11, 7]];
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
        if (blink) { q(4, 7, 2, 1, "eye"); q(10, 7, 2, 1, "eye"); }
        else { q(5, 6, 1, 2, "eye"); q(10, 6, 1, 2, "eye"); }
        q(7, 9, 2, 1, "eye");
    }
    if (s.mood !== "loss") dots([[4, 8], [11, 8]], "cheek");

    if (s.mood === "win") {
      const set = Math.floor(T * 4) % 2 ? [[-3, 3], [18, 12]] : [[18, 1], [-4, 14]];
      set.forEach(([x, y]) => { q(x, y - 1, 1, 3, "sparkle"); q(x - 1, y, 3, 1, "sparkle"); });
    }
  }

  // Shared reactions: a hop on a hit, a shiver on a miss, jumping on a win
  function react(s, mood) {
    s.loop?.kill?.();
    s.loop = null;
    s.hop = 0;
    s.dx = 0;
    if (mood === "hit") s.loop = to(s, { hop: 4, duration: 0.14, yoyo: true, repeat: 1, ease: "power2.out" });
    if (mood === "miss" && g && !reduced) s.loop = g.to(s, { keyframes: { dx: [-1, 1, -1, 1, 0] }, duration: 0.4 });
    if (mood === "win") s.loop = to(s, { hop: 5, duration: 0.25, yoyo: true, repeat: -1, ease: "power2.out" });
  }

  function newState(mood) {
    return { mood: mood || "idle", hop: 0, dx: 0, loop: null, seed: Math.random() * 4 };
  }

  /* ---------- Sprite: Haru alone, for the landing, cards and dialogs ---------- */

  const sprites = [];

  function mountSprite(canvas) {
    if (canvas._haru) return canvas._haru;
    const W = 26, H = 40;
    canvas.width = W;
    canvas.height = H;
    const scale = Number(token(`--sprite-${canvas.dataset.size || "md"}`)) || 4;
    canvas.style.width = `${W * scale}px`;
    canvas.style.height = `${H * scale}px`;
    const ctx = canvas.getContext("2d");
    const s = newState(canvas.dataset.mood);
    s.look = canvas.dataset.look; // a fixed look; otherwise the player's choice
    react(s, s.mood);
    new MutationObserver(() => {
      const m = canvas.dataset.mood;
      if (m && m !== s.mood) { s.mood = m; react(s, m); }
    }).observe(canvas, { attributes: true, attributeFilter: ["data-mood"] });

    const api = {
      draw(T) {
        ctx.clearRect(0, 0, W, H);
        const oy = H - 24 - Math.round(s.hop) + (s.mood === "loss" ? 1 : 0);
        drawHaru(pen(ctx), 5 + Math.round(s.dx), oy, s, T);
      },
    };
    canvas._haru = api;
    sprites.push(api);
    return api;
  }

  /* ---------- Stage: the gallows, built one part per miss, with Haru on it ---------- */

  const STAGE_W = 112, STAGE_H = 104;
  const HARU_X = 58;
  const HY = { ground: 76, platform: 54, dropped: 62 };
  const stages = [];

  function mountStage(canvas) {
    if (canvas._haru) return canvas._haru;
    canvas.width = STAGE_W;
    canvas.height = STAGE_H;
    const ctx = canvas.getContext("2d");
    const s = { ...newState("idle"), hy: HY.ground, part: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0 } };
    let lastWidth = -1;

    function fit() {
      const wrap = canvas.parentElement;
      if (!wrap || wrap.clientWidth === lastWidth) return;
      lastWidth = wrap.clientWidth;
      let scale;
      if (canvas.dataset.size) scale = Number(token(`--sprite-${canvas.dataset.size}`));
      else {
        const maxH = (innerHeight * parseFloat(token("--stage-height"))) / 100;
        scale = Math.floor(Math.min(wrap.clientWidth / STAGE_W, maxH / STAGE_H));
      }
      scale = Math.max(1, scale || 1);
      canvas.style.width = `${STAGE_W * scale}px`;
      canvas.style.height = `${STAGE_H * scale}px`;
    }
    addEventListener("resize", () => { lastWidth = -1; });

    function draw(T) {
      fit();
      ctx.clearRect(0, 0, STAGE_W, STAGE_H);
      const r = pen(ctx);
      const p = s.part;
      const drop = (i) => -(1 - p[i]) * 30;

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

    const api = {
      reset() {
        s.loop?.kill?.();
        for (let i = 1; i <= 7; i++) s.part[i] = 0;
        s.hy = HY.ground;
        s.mood = "idle";
        react(s, "idle");
      },
      setMisses(n, instant) {
        for (let i = 1; i <= 7; i++) {
          const want = i <= n ? 1 : 0;
          if (s.part[i] === want) continue;
          if (instant || want === 0) s.part[i] = want;
          else to(s.part, { [i]: 1, duration: i === 7 ? 0.2 : 0.45, ease: i >= 5 ? "power2.in" : "bounce.out" });
        }
        const hy = n >= 7 ? HY.dropped : n >= 1 ? HY.platform : HY.ground;
        if (instant) s.hy = hy;
        else if (hy !== s.hy) to(s, { hy, duration: 0.35, delay: n === 1 ? 0.35 : 0, ease: n >= 7 ? "power2.in" : "back.out(2)" });
      },
      mood(m) {
        s.mood = m;
        react(s, m);
        if (m === "win" && s.part[6] > 0) to(s.part, { 6: 0, duration: 0.4, ease: "power2.out" });
        if (m === "loss") {
          s.dx = -1;
          s.loop = to(s, { dx: 1, duration: 0.7, yoyo: true, repeat: -1, ease: "sine.inOut", delay: 0.2 });
        }
      },
      draw,
    };
    if (canvas.dataset.misses) api.setMisses(Number(canvas.dataset.misses), true);
    if (canvas.dataset.mood) api.mood(canvas.dataset.mood);
    canvas._haru = api;
    stages.push(api);
    return api;
  }

  /* ---------- World: one wide village, each screen is a spot in it ---------- */

  const FOCUS = { castle: 200, tavern: 520, market: 820, square: 1120 };
  const VILLAGE = [
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

  function roof(r, x, y, w, c) {
    let i = 0;
    for (; w - 2 * i > 1; i++) r(x + i, y - 2 - i * 2, w - 2 * i, 2, c);
    return i * 2;
  }

  function flag(r, x, top, T) {
    const f = Math.floor(T * 4 + x) % 2;
    r(x, top, 1, 10, "wood-dark");
    r(x + 1, top + f, 6, 2, "flag");
    r(x + 1, top + 2 + f, 5, 2, "flag-alt");
  }

  function castle(r, x, base, T) {
    const win = night ? "window-lit" : "window";
    const block = (X, Y, w, h) => { r(X, Y, w, h, "stone"); r(X + w - 2, Y, 2, h, "stone-shade"); };
    const merlons = (X, Y, w) => { for (let i = 0; i < w; i += 4) r(X + i, Y - 3, 2, 3, "stone"); };
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

  function pine(r, x, base, tiers) {
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

  function windowAt(r, x, y) {
    r(x - 1, y - 1, 7, 7, "outline");
    r(x, y, 5, 5, night ? "window-lit" : "window");
    r(x + 2, y, 1, 5, "wood-dark");
    r(x, y + 2, 5, 1, "wood-dark");
  }

  function house(r, X, G, o) {
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

  function lamp(r, X, G, T) {
    if (night) {
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

  function stall(r, X, G) {
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

  function fountain(r, X, G, T) {
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

  function banner(r, X, G, T) {
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

  function mountWorld() {
    const canvas = document.createElement("canvas");
    canvas.className = "world";
    canvas.setAttribute("aria-hidden", "true");
    document.body.prepend(canvas);
    const ctx = canvas.getContext("2d");
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

    // Camera: slides from the last screen's spot to this one
    const target = FOCUS[document.body.dataset.scene] ?? FOCUS.castle;
    const cam = { x: target - 160 };
    try {
      const saved = Number(sessionStorage.getItem("haru-cam"));
      if (saved) cam.x = saved;
    } catch { /* storage blocked */ }
    to(cam, { x: target, duration: Math.min(2.6, 0.6 + Math.abs(target - cam.x) / 400), ease: "power2.inOut" });
    addEventListener("pagehide", () => {
      try { sessionStorage.setItem("haru-cam", String(cam.x)); } catch { /* storage blocked */ }
    });

    function draw(T) {
      const r = pen(ctx);
      const cx = cam.x;
      const G = H - 20;
      const horizon = G - 60;
      const layer = (p) => cx * p - W / 2; // art x on screen = layer x - layer(p)

      // Sky in three dithered bands
      r(0, 0, W, H, "sky-top");
      [[Math.round(horizon * 0.55), "sky-mid"], [Math.round(horizon * 0.82), "sky-low"]].forEach(([y, c]) => {
        for (let x = 0; x < W; x += 2) { r(x, y, 1, 1, c); r(x + 1, y + 1, 1, 1, c); }
        r(0, y + 2, W, H, c);
      });

      // Sun by day, moon and stars by night
      const lx = Math.round(W * 0.78), ly = Math.max(16, horizon - 100);
      if (night) {
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
      const mh = (x) => 26 + 10 * Math.sin(x * 0.035) + 7 * Math.sin(x * 0.083 + 1.3) + 4 * Math.sin(x * 0.17);
      const m0 = layer(0.2);
      for (let x = 0; x < W; x++) {
        const h = mh(x + m0);
        const top = Math.round(horizon + 12 - h);
        r(x, top, 1, G - top, mh(x + m0 + 1) < h ? "mountain-shade" : "mountain");
        if (h > 37) r(x, top, 1, 2, "cloud");
      }

      // Hills, with a flat top for the castle
      const castleX = FOCUS.castle * 0.4;
      const hh = (x) => {
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
        if (o.t === "house" || o.t === "tavern") house(r, X, G, o);
        else if (o.t === "lamp") lamp(r, X, G, T);
        else if (o.t === "stall") stall(r, X, G);
        else if (o.t === "fountain") fountain(r, X, G, T);
        else if (o.t === "banner") banner(r, X, G, T);
      });
    }
    return { draw };
  }

  /* ---------- Loop ---------- */

  readPalette();
  document.addEventListener("haru:theme", readPalette);

  // The player's look, kept in the browser
  function setLook(look) {
    if (!LOOKS[look]) return;
    currentLook = look;
    try { localStorage.setItem("haru-look", look); } catch { /* storage blocked */ }
    document.querySelectorAll("[data-pick-look]").forEach((b) => b.setAttribute("aria-checked", String(b.dataset.pickLook === look)));
  }
  let savedLook = null;
  try { savedLook = localStorage.getItem("haru-look"); } catch { /* storage blocked */ }
  setLook(savedLook || "villager");
  document.querySelectorAll("[data-pick-look]").forEach((b) => b.addEventListener("click", () => setLook(b.dataset.pickLook)));
  const world = mountWorld();
  document.querySelectorAll("canvas.sprite").forEach(mountSprite);
  document.querySelectorAll("canvas.stage").forEach(mountStage);

  function frame() {
    const T = reduced ? 0 : performance.now() / 1000;
    world.draw(T);
    stages.forEach((s) => s.draw(T));
    sprites.forEach((s) => s.draw(T));
  }
  if (g) g.ticker.add(frame);
  else (function loop() { frame(); requestAnimationFrame(loop); })();

  window.HaruPixel = { mountStage, mountSprite, setLook };
})();
