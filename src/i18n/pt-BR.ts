import type { Strings } from "./en";

export const ptBR: Strings = {
  langSwitch: {
    label: "Idioma",
  },
  themeSwitch: {
    label: "Dia ou noite",
    light: "Dia",
    dark: "Noite",
  },
  lookPicker: {
    label: "Visual do Haru",
    villager: "Aldeão",
    wizard: "Mago",
    knight: "Cavaleiro",
  },
  round: {
    misses: (n: number, max: number) => `Erros: ${n} de ${max}`,
    won: "O Haru está livre!",
    lost: "Não deu para salvar o Haru",
    wordWas: "A palavra era",
    playAgain: "Jogar de novo",
    backHome: "Voltar ao início",
  },
};
