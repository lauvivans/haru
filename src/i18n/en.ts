// Interface strings in English, grouped by the component that shows them.
// pt-BR.ts has the same shape, so a missing translation fails the type check.
export const en = {
  langSwitch: {
    label: 'Language',
  },
  themeSwitch: {
    label: 'Day or night',
    light: 'Day',
    dark: 'Night',
  },
  landing: {
    tagline:
      "Save Haru from the gallows: guess the word before it's built. Alone or with a friend.",
    cycleMoods: "Click to see Haru's reactions",
    chooseLook: 'Choose your Haru',
    solo: {
      title: 'Solo',
      description: 'A random word from the village scrolls, with its category as a hint.',
      play: 'Play solo',
    },
    friend: {
      title: 'With a friend',
      description: 'One picks the word, the other guesses. Send the room link and take turns.',
      play: 'Play with a friend',
    },
    howItWorks: 'How it works',
  },
  lookPicker: {
    label: "Haru's look",
    villager: 'Villager',
    wizard: 'Wizard',
    knight: 'Knight',
  },
  round: {
    won: 'Haru is free!',
    lost: "Haru didn't make it",
    wordWas: 'The word was',
    playAgain: 'Play again',
    backHome: 'Back home',
  },
  solo: {
    categories: {
      animals: 'Animals',
      food: 'Food',
      countries: 'Countries',
      objects: 'Objects',
      jobs: 'Jobs',
    },
  },
};

export type Strings = typeof en;
