import type { Strings } from './en';

export const ptBR: Strings = {
  langSwitch: {
    label: 'Idioma',
  },
  themeSwitch: {
    label: 'Dia ou noite',
    light: 'Dia',
    dark: 'Noite',
  },
  landing: {
    tagline:
      'Salve o Haru da forca: descubra a palavra antes de ela ficar pronta. Sozinho ou com um amigo.',
    cycleMoods: 'Clique para ver as reações do Haru',
    chooseLook: 'Escolha seu Haru',
    solo: {
      title: 'Solo',
      description: 'Uma palavra sorteada dos pergaminhos da vila, com a categoria como dica.',
      play: 'Jogar sozinho',
    },
    friend: {
      title: 'Com um amigo',
      description:
        'Um escolhe a palavra e o outro tenta adivinhar. Mande o link da sala e revezem.',
      play: 'Jogar com um amigo',
    },
    howItWorks: 'Como funciona',
  },
  lookPicker: {
    label: 'Visual do Haru',
    villager: 'Aldeão',
    wizard: 'Mago',
    knight: 'Cavaleiro',
  },
  round: {
    won: 'O Haru está livre!',
    lost: 'Não deu para salvar o Haru',
    wordWas: 'A palavra era',
    playAgain: 'Jogar de novo',
    backHome: 'Voltar ao início',
  },
  nickname: {
    look: 'Seu Haru',
    label: 'Seu apelido',
    hint: 'De 1 a 16 caracteres. O navegador guarda para a próxima vez.',
  },
  room: {
    create: {
      title: 'Jogar com um amigo',
      submit: 'Criar sala',
      failed: 'Não deu para criar a sala. Tente de novo.',
    },
    join: {
      title: 'Entrar na sala',
      invitedBy: (name: string) => `${name} te convidou`,
      submit: 'Entrar na sala',
    },
    invite: {
      title: 'Convide um amigo',
      intro: 'Mande este link. O jogo começa quando seu amigo entrar.',
      link: 'Link da sala',
      copy: 'Copiar',
      waiting: 'Esperando seu amigo…',
    },
    code: 'Código da sala',
    room: 'Sala',
    full: {
      title: 'Esta sala está cheia',
      intro: 'Cada sala tem dois jogadores. Você pode criar a sua sala ou jogar sozinho.',
      create: 'Criar uma sala',
      solo: 'Jogar sozinho',
    },
    left: {
      title: (name: string) => `${name} saiu da sala`,
      intro: (name: string) =>
        `A conexão caiu. Você pode esperar ${name} voltar pelo mesmo link ou voltar ao início.`,
      score: 'Placar',
      wait: 'Esperar na sala',
      home: 'Voltar ao início',
    },
  },
  duo: {
    picks: 'escolhe',
    guesses: 'adivinha',
    waiting: (name: string) => `${name} está escolhendo uma palavra…`,
    waitingIntro: 'A rodada começa quando a palavra estiver pronta.',
    guessing: (name: string) => `${name} escolheu a palavra. Salve o Haru!`,
    watching: (name: string) => `${name} está adivinhando sua palavra…`,
    saved: (name: string) => `${name} salvou o Haru!`,
    youSaved: 'Você salvou o Haru!',
    nextPicker: (name: string) => `Próxima rodada: ${name} escolhe a palavra.`,
    youPickNext: 'Próxima rodada: você escolhe a palavra.',
    next: 'Próxima rodada',
    leave: 'Sair da sala',
  },
  pickWord: {
    title: (name: string) => `Escolha uma palavra para ${name}`,
    word: 'Palavra',
    show: 'Mostrar',
    rule: 'De 2 a 24 caracteres: letras, espaços e hífens. Pode ter acento.',
    refused: 'Use de 2 a 24 caracteres, só letras, espaços e hífens.',
    hint: 'Dica (opcional)',
    hintRule: 'Até 40 caracteres.',
    start: 'Começar rodada',
  },
  howItWorks: {
    title: 'Como funciona',
    game: {
      title: 'O jogo',
      intro:
        'O Haru está na forca. A palavra aparece com um espaço por letra. Escolha uma letra por vez:',
      rules: [
        'Se a letra está na palavra, ela aparece em todas as posições.',
        'Se não está, mais uma peça da forca é montada. No 7º erro o alçapão abre.',
        'Acentos não contam: escolher A revela também Á, Â, Ã e À, e C revela Ç.',
      ],
      solo: 'Solo:',
      soloText: 'uma palavra sorteada, com a categoria como dica.',
      friend: 'Com um amigo:',
      friendText:
        'um jogador escolhe a palavra e uma dica opcional, o outro adivinha. Os papéis trocam a cada rodada e a sala guarda o placar.',
    },
    p2p: {
      title: 'Peer-to-peer',
      intro:
        'Numa partida com um amigo, os dois navegadores conversam direto. O servidor do Haru só apresenta um ao outro.',
      steps: [
        {
          title: 'Sinalização.',
          text: 'Cada navegador conta ao servidor como pode ser encontrado, e o servidor repassa isso ao outro jogador. O STUN ajuda cada navegador a descobrir o próprio endereço público.',
        },
        {
          title: 'Canal de dados.',
          text: 'Os navegadores abrem um canal WebRTC entre eles e as jogadas passam por ali. Se uma rede bloqueia o caminho direto, um servidor TURN repassa as jogadas.',
        },
      ],
      storesNothing:
        'O servidor não guarda nada. A sala só existe na memória enquanto está aberta.',
    },
    diagram: {
      label:
        'Dois navegadores ligados por um canal de dados, com o servidor de sinalização acima e um repasse TURN abaixo',
      signaling: 'Sinalização',
      introduces: 'apresenta os jogadores',
      you: 'Seu navegador',
      friend: 'Navegador do amigo',
      moves: '2 · jogadas',
      relay: 'TURN repassa, só se o caminho direto estiver bloqueado',
    },
    play: 'Jogar agora',
  },
  solo: {
    categories: {
      animals: 'Animais',
      food: 'Comida',
      countries: 'Países',
      objects: 'Objetos',
      jobs: 'Profissões',
    },
  },
};
