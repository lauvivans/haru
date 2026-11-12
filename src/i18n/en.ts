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
  nickname: {
    look: 'Your Haru',
    label: 'Your nickname',
    hint: '1 to 16 characters. Your browser remembers it.',
  },
  room: {
    create: {
      title: 'Play with a friend',
      submit: 'Create room',
      failed: "The room couldn't be created. Try again.",
    },
    join: {
      title: 'Join the room',
      invitedBy: (name: string) => `${name} invited you`,
      submit: 'Join room',
    },
    invite: {
      title: 'Invite a friend',
      intro: 'Send this link. The game starts when your friend joins.',
      link: 'Room link',
      copy: 'Copy',
      waiting: 'Waiting for your friend…',
    },
    code: 'Room code',
    room: 'Room',
    full: {
      title: 'This room is full',
      intro: 'A room holds two players. You can create your own room or play solo.',
      create: 'Create a room',
      solo: 'Play solo',
    },
    left: {
      title: (name: string) => `${name} left the room`,
      intro: (name: string) =>
        `The connection was lost. You can wait for ${name} to come back with the same link, or go back home.`,
      score: 'Score',
      wait: 'Wait in the room',
      home: 'Back home',
    },
  },
  duo: {
    picks: 'picks',
    guesses: 'guesses',
    waiting: (name: string) => `${name} is picking a word…`,
    waitingIntro: 'The round starts when the word is ready.',
    guessing: (name: string) => `${name} picked the word. Save Haru!`,
    watching: (name: string) => `${name} is guessing your word…`,
    saved: (name: string) => `${name} saved Haru!`,
    youSaved: 'You saved Haru!',
    nextPicker: (name: string) => `Next round: ${name} picks the word.`,
    youPickNext: 'Next round: you pick the word.',
    next: 'Next round',
    leave: 'Leave room',
  },
  pickWord: {
    title: (name: string) => `Pick a word for ${name}`,
    word: 'Word',
    show: 'Show',
    rule: '2 to 24 characters: letters, spaces and hyphens. Accents are fine.',
    refused: 'Use 2 to 24 characters, only letters, spaces and hyphens.',
    hint: 'Hint (optional)',
    hintRule: 'Up to 40 characters.',
    start: 'Start round',
  },
  howItWorks: {
    title: 'How it works',
    game: {
      title: 'The game',
      intro:
        'Haru is on the gallows. The word shows as one blank per letter. Pick one letter at a time:',
      rules: [
        'If the letter is in the word, it shows everywhere it appears.',
        "If it isn't, one more piece of the gallows goes up. On the 7th miss the trapdoor opens.",
        "Accents don't count: picking A also reveals Á, Â, Ã and À, and C reveals Ç.",
      ],
      solo: 'Solo:',
      soloText: 'a random word, with its category as a hint.',
      friend: 'With a friend:',
      friendText:
        'one player picks the word and an optional hint, the other guesses. Roles swap every round and the room keeps the score.',
    },
    p2p: {
      title: 'Peer-to-peer',
      intro:
        "In a game with a friend, the two browsers talk to each other directly. Haru's server only introduces them.",
      steps: [
        {
          title: 'Signaling.',
          text: 'Each browser tells the server how it can be reached. The server passes this on to the other player. STUN helps each browser find its public address.',
        },
        {
          title: 'Data channel.',
          text: 'The browsers open a WebRTC channel between them and the moves go through it. If a network blocks the direct path, a TURN server relays the moves.',
        },
      ],
      storesNothing: 'The server stores nothing. The room only exists in memory while it is open.',
    },
    diagram: {
      label:
        'Two browsers connected by a data channel, with a signaling server above and a TURN relay below',
      signaling: 'Signaling',
      introduces: 'introduces the players',
      you: 'Your browser',
      friend: "Friend's browser",
      moves: '2 · moves',
      relay: 'TURN relay, only if the direct path is blocked',
    },
    play: 'Play now',
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
