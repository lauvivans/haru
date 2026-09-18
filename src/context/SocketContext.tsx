import { createContext, useContext, useState } from "react";

interface SocketContextProps {
  peerId: string;
  handlePeerId: (peerId: string) => void;
  isServerAwake: boolean;
  socket: WebSocket | null;
  connectToSignalingServer: () => void;
  peerIdExt: string;
  handlePeerIdExt: (peerId: string) => void;
}

const SocketContext = createContext<SocketContextProps>(
  {} as SocketContextProps,
);

const SIGNALING_SERVER = import.meta.env.VITE_SERVER_URL;

const SocketProvider = ({ children }: { children: React.ReactNode }) => {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [peerId, setPeerId] = useState("");
  const [peerIdExt, setPeerIdExt] = useState("");
  const [isServerAwake, setIsServerAwake] = useState(false);

  const handlePeerId = (peerId: string) => setPeerId(peerId);

  const handlePeerIdExt = (peerId: string) => setPeerIdExt(peerId);

  const connectToSignalingServer = () => {
    const s = new WebSocket(SIGNALING_SERVER);

    s.onopen = () => {
      setIsServerAwake(true);
    };

    s.onclose = () => {
      setIsServerAwake(false);
    };

    s.onerror = () => {
      setIsServerAwake(false);
    };

    setSocket(s);
  };

  return (
    <SocketContext.Provider
      value={{
        peerId,
        handlePeerId,
        isServerAwake,
        socket,
        connectToSignalingServer,
        peerIdExt,
        handlePeerIdExt,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export default SocketProvider;

export const useSocket = () => useContext(SocketContext);
