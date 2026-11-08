// Interface strings in English, grouped by the component that shows them.
// pt-BR.ts has the same shape, so a missing translation fails the type check.
export const en = {
  langSwitch: {
    label: "Language",
  },
  themeSwitch: {
    label: "Day or night",
    light: "Day",
    dark: "Night",
  },
  lookPicker: {
    label: "Haru's look",
    villager: "Villager",
    wizard: "Wizard",
    knight: "Knight",
  },
  round: {
    won: "Haru is free!",
    lost: "Haru didn't make it",
    wordWas: "The word was",
    playAgain: "Play again",
    backHome: "Back home",
  },
};

export type Strings = typeof en;
