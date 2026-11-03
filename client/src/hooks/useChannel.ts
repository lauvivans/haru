import { usePeerConnection } from "@/context/PeerConnectionContext";
import { useEffect, useState } from "react";

const useChannel = () => {
  const { dataChannel } = usePeerConnection();
  const [hits, setHits] = useState(0);
  const [misses, setMisses] = useState(0);
  const [masterPlayer, setMasterPlayer] = useState("");
  const [word, setWord] = useState("");
  const [letters, setLetters] = useState<string[]>([]);

  const sendToDataChannel = (id: string, data: unknown) => {
    if (dataChannel?.readyState !== "open") {
      console.warn("Data channel is not open");
      return;
    }

    dataChannel.send(JSON.stringify({ id, data }));
  };

  const countOccurrences = (value: string, letter: string) =>
    [...value].filter((item) => item === letter).length;

  const handleHits = (letter: string) => {
    const occurrences = countOccurrences(word, letter);

    if (occurrences > 0) {
      setHits((previous) => previous + occurrences);
    }
  };

  const reset = () => {
    setMasterPlayer("");
    setWord("");
    setLetters([]);
    setMisses(0);
    setHits(0);
  };

  const selectMaster = (peerId: string) => {
    setMasterPlayer(peerId);
    sendToDataChannel("master-selection", { peerId });
  };

  const handleWord = (word: string) => {
    setWord(word);
    sendToDataChannel("wordset", { word });
  };

  const handleLetters = (letter: string) => {
    if (letters.includes(letter)) return;

    setLetters((previous) => [...previous, letter]);

    if (word.includes(letter)) {
      handleHits(letter);
    } else {
      setMisses((previous) => previous + 1);
    }

    sendToDataChannel("letterset", { letter });
  };

  useEffect(() => {
    if (!dataChannel) return;

    const handleMessage = (event: MessageEvent) => {
      try {
        const message = JSON.parse(event.data);

        switch (message.id) {
          case "master-selection":
            setMasterPlayer(message.data.peerId);
            break;

          case "wordset":
            setWord(message.data.word);
            break;

          case "letterset": {
            const letter = message.data.letter;

            if (letters.includes(letter)) break;

            setLetters((previous) => [...previous, letter]);

            if (word.includes(letter)) {
              handleHits(letter);
            } else {
              setMisses((previous) => previous + 1);
            }

            break;
          }

          case "reset":
            reset();
            break;
        }
      } catch (error) {
        console.error("Invalid data-channel message:", error);
      }
    };

    dataChannel.addEventListener("message", handleMessage);

    return () => {
      dataChannel.removeEventListener("message", handleMessage);
    };
  }, [dataChannel, word]);

  const startover = () => {
    reset();
    sendToDataChannel("reset", {});
  };

  return {
    selectMaster,
    handleWord,
    handleLetters,
    masterPlayer,
    word,
    letters,
    misses,
    hits,
    startover,
  };
};

export default useChannel;
