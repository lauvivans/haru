// Haru prototype script: header, theme, language, prototype states and one round
// of hangman. The pixel art lives in pixel.js. Plain JS so pages open from disk.

const store = {
  get(key) {
    try { return localStorage.getItem(key); } catch { return null; }
  },
  set(key, value) {
    try { localStorage.setItem(key, value); } catch { /* private mode */ }
  },
};

const root = document.documentElement;

// Theme: day (light) or night (dark). Follows the system until the player picks one
function systemTheme() {
  return matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function setTheme(theme) {
  root.dataset.theme = theme;
  document.querySelectorAll("[data-set-theme]").forEach((b) => {
    b.setAttribute("aria-pressed", String(b.dataset.setTheme === theme));
  });
  document.dispatchEvent(new CustomEvent("haru:theme", { detail: theme }));
}

// Language: the app uses the /pt-BR/ prefix; the prototype uses a switch
function setLang(lang) {
  root.dataset.lang = lang;
  root.lang = lang;
  document.querySelectorAll("[data-set-lang]").forEach((b) => {
    b.setAttribute("aria-pressed", String(b.dataset.setLang === lang));
  });
  document.dispatchEvent(new CustomEvent("haru:lang", { detail: lang }));
}

function lang() {
  return root.dataset.lang || "en";
}

// Header shared by every page
function renderHeader() {
  const header = document.querySelector("[data-header]");
  if (!header) return;
  header.className = "header";
  header.innerHTML = `
    <a class="logo" href="index.html">Haru</a>
    <div class="header__tools">
      <a class="header__link" href="how-it-works.html"><span lang="en">How it works</span><span lang="pt-BR">Como funciona</span></a>
      <div class="toggle" role="group" aria-label="Language">
        <button data-set-lang="en">EN</button>
        <button data-set-lang="pt-BR">PT</button>
      </div>
      <div class="toggle" role="group" aria-label="Day or night">
        <button data-set-theme="light" aria-label="Day">☀</button>
        <button data-set-theme="dark" aria-label="Night">☾</button>
      </div>
    </div>`;
  header.querySelectorAll("[data-set-lang]").forEach((b) =>
    b.addEventListener("click", () => {
      store.set("haru-lang", b.dataset.setLang);
      setLang(b.dataset.setLang);
    }),
  );
  header.querySelectorAll("[data-set-theme]").forEach((b) =>
    b.addEventListener("click", () => {
      store.set("haru-theme", b.dataset.setTheme);
      setTheme(b.dataset.setTheme);
    }),
  );
}

const MAX_MISSES = 7;

// Letters: accents and cedilla don't count when guessing
function plain(letter) {
  return letter.normalize("NFD").replace(/[̀-ͯ]/g, "").toUpperCase();
}

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

// One round. `el` holds .stage, .word, .keyboard and .misses.
function startRound(el, { word, used = [], canGuess = true, onEnd } = {}) {
  const chars = [...word.toUpperCase()];
  const letters = new Set(chars.filter((c) => /\p{L}/u.test(c)).map(plain));
  const picked = new Set();
  let misses = 0;
  let over = false;
  let replaying = false;

  const wordEl = el.querySelector(".word");
  const keyboardEl = el.querySelector(".keyboard");
  const missesEl = el.querySelector(".misses");
  const stage = window.HaruPixel?.mountStage(el.querySelector(".stage"));
  stage?.reset();

  keyboardEl.innerHTML = ALPHABET.map((l) => `<button class="key" data-key="${l}">${l}</button>`).join("");
  keyboardEl.classList.toggle("keyboard--locked", !canGuess);

  function renderWord(reveal) {
    wordEl.innerHTML = word
      .toUpperCase()
      .split(" ")
      .map(
        (part) =>
          `<span class="word__group">${[...part]
            .map((c) => {
              if (c === "-") return `<span class="word__slot word__slot--fixed">-</span>`;
              if (picked.has(plain(c))) return `<span class="word__slot">${c}</span>`;
              if (reveal) return `<span class="word__slot word__slot--missed">${c}</span>`;
              return `<span class="word__slot"></span>`;
            })
            .join("")}</span>`,
      )
      .join("");
  }

  function renderState() {
    stage?.setMisses(misses, replaying);
    if (missesEl) missesEl.textContent = `${misses} / ${MAX_MISSES}`;
  }

  function mood(m) {
    if (!replaying) stage?.mood(m);
  }

  function guess(letter) {
    if (over || picked.has(letter)) return;
    picked.add(letter);
    const key = keyboardEl.querySelector(`[data-key="${letter}"]`);
    key.disabled = true;
    const hit = letters.has(letter);
    key.classList.add(hit ? "key--hit" : "key--miss");
    if (!hit) misses += 1;
    mood(hit ? "hit" : "miss");
    renderState();
    const won = [...letters].every((l) => picked.has(l));
    const lost = misses >= MAX_MISSES;
    renderWord(lost);
    if (won || lost) {
      over = true;
      keyboardEl.classList.add("keyboard--locked");
      mood(won ? "win" : "loss");
      onEnd?.({ won, word });
    }
  }

  keyboardEl.addEventListener("click", (e) => {
    const key = e.target.closest("[data-key]");
    if (key && canGuess) guess(key.dataset.key);
  });

  function onKey(e) {
    if (!canGuess || e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.target.closest("input, textarea")) return;
    const letter = e.key.toUpperCase();
    if (ALPHABET.includes(letter)) guess(letter);
  }
  document.addEventListener("keydown", onKey);

  renderWord(false);
  renderState();
  // Replays letters already picked, for screens that show a round in progress
  replaying = true;
  used.forEach((l) => guess(l));
  replaying = false;

  return {
    stop() {
      document.removeEventListener("keydown", onKey);
    },
  };
}

// Prototype-only: buttons that switch between the states of a screen
function initStates() {
  const bar = document.querySelector(".proto-states");
  if (!bar) return;
  const states = [...document.querySelectorAll("[data-state]")];
  function show(name) {
    states.forEach((s) => (s.hidden = s.dataset.state !== name));
    bar.querySelectorAll("[data-show]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.show === name)));
    history.replaceState(null, "", `#${name}`);
    document.dispatchEvent(new CustomEvent("haru:state", { detail: name }));
  }
  bar.querySelectorAll("[data-show]").forEach((b) => b.addEventListener("click", () => show(b.dataset.show)));
  document.querySelectorAll("[data-go]").forEach((b) => b.addEventListener("click", () => show(b.dataset.go)));
  const fromHash = location.hash.slice(1);
  show(states.some((s) => s.dataset.state === fromHash) ? fromHash : states[0].dataset.state);
}

// Clicking a lone Haru cycles its moods, so every reaction can be seen
function initMoodCycle() {
  const moods = ["idle", "hit", "miss", "win", "loss"];
  document.querySelectorAll("[data-cycle]").forEach((el) =>
    el.addEventListener("click", () => {
      el.dataset.mood = moods[(moods.indexOf(el.dataset.mood) + 1) % moods.length];
    }),
  );
}

renderHeader();
setTheme(store.get("haru-theme") || systemTheme());
setLang(store.get("haru-lang") || "en");
initMoodCycle();
initStates();

window.Haru = { startRound, plain, lang, MAX_MISSES };
