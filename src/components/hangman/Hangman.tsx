import "./Hangman.css";
import { useSocket } from "@/context/SocketContext";
import useChannel from "@/hooks/useChannel";
import { useMemo, useRef } from "react";
import { Gallows } from "@/components/pixel/Gallows";

const ALPHABET = [
  "A",
  "B",
  "C",
  "D",
  "E",
  "F",
  "G",
  "H",
  "I",
  "J",
  "K",
  "L",
  "M",
  "N",
  "O",
  "P",
  "Q",
  "R",
  "S",
  "T",
  "U",
  "V",
  "W",
  "X",
  "Y",
  "Z",
];

const Hangman = () => {
  const { peerId, peerIdExt } = useSocket();
  const {
    masterPlayer,
    handleWord,
    word,
    letters,
    handleLetters,
    misses,
    hits,
    selectMaster,
    startover
  } = useChannel();

  const inputRef = useRef<HTMLInputElement>(null);

  const setWord = () => {
    if (inputRef && inputRef.current)
      handleWord(inputRef.current.value.toUpperCase());
  };

  const handleMaster = (peerId: string) => {
    selectMaster(peerId);
  };

  const isGameFinished = useMemo(() => {
    return (misses === 7) || (word && hits === word.length)
  }, [misses, word, hits])

  return (
    <div className="hangman-section">
      <span className="hangman-section__peerId">Your peer ID: {peerId}</span>
      {!masterPlayer && (
        <div className="hangman-section__master">
          <h3>Select master player</h3>
          <div className="welcome-section__master__cards">
            <button
              data-is-active={masterPlayer && masterPlayer === peerId}
              className="welcome-section__master__cards__card"
              disabled={!!masterPlayer}
              onClick={() => handleMaster(peerId)}
            >
              You
            </button>
            <button
              data-is-active={masterPlayer && masterPlayer === peerIdExt}
              className="welcome-section__master__cards__card"
              disabled={!!masterPlayer}
              onClick={() => handleMaster(peerIdExt)}
            >
              Other player
            </button>
          </div>
        </div>
      )}
      {masterPlayer && (
        <section className="hangman-section__game">
          <button onClick={startover}>Start again</button>
          {masterPlayer && peerId === masterPlayer && (
            <div>
              <input ref={inputRef} placeholder="Type word" />
              <button onClick={setWord}>Ready</button>
            </div>
          )}
          {word && (
            <div className="hangman-section__word">
              {Array.from({ length: word.length }, (_, index) => (
                <span className="hangman-section__word__letter" key={index}>
                  {letters.includes(word[index].toUpperCase())
                    ? word[index]
                    : "___"}
                </span>
              ))}
            </div>
          )}
          {masterPlayer && peerId !== masterPlayer && (
            <div>
              {ALPHABET.map((letter) => (
                <button
                  onClick={() => handleLetters(letter.toUpperCase())}
                  disabled={!!(letters.includes(letter) || isGameFinished)}
                  key={letter}
                >
                  {letter}
                </button>
              ))}
            </div>
          )}

          <div className="hangman-drawing">
            <Gallows misses={misses} mood={misses === 7 ? "loss" : word && hits === word.length ? "win" : "idle"} />
          </div>

          {misses === 7 && (
            <div>
              <h3>Looser</h3>
              <img src="https://media3.giphy.com/media/v1.Y2lkPTc5MGI3NjExdnlhMXl2d2Ntdjh6NjJ6bmNoYWd1bjVudHVucGx0ZWxsY2xtdHRnaiZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/62bRBJV1ccA9nyLmKy/giphy.gif" />
            </div>
          )}

          {word && hits === word.length && (
            <div>
              <h3>Winner</h3>
              <img src="https://media4.giphy.com/media/v1.Y2lkPTc5MGI3NjExbnhpMDZ6N3MwaHRveGRsN285d2Z0OWc5dnhtbWk3cDk3dWk2NzR6cCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/125E8v90blHqtr4HrB/giphy.gif" />
            </div>
          )}
        </section>
      )}
    </div>
  );
};

export default Hangman;
