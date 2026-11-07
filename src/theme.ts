import { stored } from "@/stored";

// Day (light) or night (dark). The first visit follows the system; the player's
// pick is kept in the browser. index.html sets data-theme before the first paint.
export type Theme = "light" | "dark";

const systemTheme = (): Theme => (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");

export const theme = stored<Theme>("haru-theme", systemTheme, (v): v is Theme => v === "light" || v === "dark");

theme.subscribe((t) => {
  document.documentElement.dataset.theme = t;
});
document.documentElement.dataset.theme = theme.get();
