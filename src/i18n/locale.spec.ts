import { describe, expect, it } from "vitest";
import { localeOf, pathIn } from "./locale";

describe("locale", () => {
  it.each([
    ["/", "en"],
    ["/room/ABC234", "en"],
    ["/pt-BR", "pt-BR"],
    ["/pt-BR/", "pt-BR"],
    ["/pt-BR/room/ABC234", "pt-BR"],
    ["/pt-br/", "pt-BR"],
    ["/PT-BR/room/ABC234", "pt-BR"],
    ["/pt-BRx/room", "en"],
    ["/room/pt-BR", "en"],
  ])("reads the locale of %s as %s", (pathname, locale) => {
    expect(localeOf(pathname)).toBe(locale);
  });

  it.each([
    ["/", "pt-BR", "/pt-BR/"],
    ["/room/ABC234", "pt-BR", "/pt-BR/room/ABC234"],
    ["/pt-BR", "en", "/"],
    ["/pt-BR/", "en", "/"],
    ["/pt-BR/room/ABC234", "en", "/room/ABC234"],
    ["/room/ABC234", "en", "/room/ABC234"],
    ["/pt-BR/room/ABC234", "pt-BR", "/pt-BR/room/ABC234"],
    ["/pt-br/room/ABC234", "en", "/room/ABC234"],
    ["/pt-br/room/ABC234", "pt-BR", "/pt-BR/room/ABC234"],
  ] as const)("opens %s in %s as %s", (pathname, locale, path) => {
    expect(pathIn(locale, pathname)).toBe(path);
  });
});
