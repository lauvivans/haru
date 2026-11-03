import { createContext, useContext, useEffect, useRef, useState } from "react";
import { useSocket } from "./SocketContext";

interface PeerConnectionContextProps {
  createPeerConnection: (
    targetPeerId: string,
    initiator: boolean,
  ) => Promise<RTCPeerConnection>;
  peerConnection: RTCPeerConnection | null;
  dataChannel: RTCDataChannel | null;
}

const PeerConnectionContext = createContext<PeerConnectionContextProps>(
  {} as PeerConnectionContextProps,
);

const ICE_SERVERS_URLS = ["stun:stun.l.google.com:19302"];

const PeerConnectionProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const { socket, handlePeerId, handlePeerIdExt } = useSocket();
  const [peerConnection, setPeerConnection] =
    useState<RTCPeerConnection | null>(null);
  const [dataChannel, setDataChannel] = useState<RTCDataChannel | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const pendingCandidatesRef = useRef<RTCIceCandidateInit[]>([]);

  const handleDataChannel = (dc: RTCDataChannel) => {
    dc.onclose = () => console.log("Data Channel closed");
    dc.onerror = (error) => console.error("Data Channel error", error);
    setDataChannel(dc);
  };

  const createPeerConnection = async (
    targetPeerId: string,
    initiator = false,
  ) => {
    const pc = new RTCPeerConnection({
      iceServers: [{ urls: ICE_SERVERS_URLS }],
    });

    peerConnectionRef.current = pc;
    setPeerConnection(pc);
    handlePeerIdExt(targetPeerId);

    pc.onicecandidate = (event) => {
      if (
        event.candidate &&
        socket?.readyState === WebSocket.OPEN &&
        targetPeerId
      ) {
        socket.send(
          JSON.stringify({
            type: "ice-candidate",
            targetPeerId,
            data: event.candidate,
          }),
        );
      }
    };

    pc.onconnectionstatechange = () => {
      console.log("Peer connection:", pc.connectionState);
    };

    if (initiator) {
      handleDataChannel(pc.createDataChannel("messages"));
      await createAndSendOffer(pc, targetPeerId);
    } else {
      pc.ondatachannel = (event) => handleDataChannel(event.channel);
    }

    return pc;
  };

  const createAndSendOffer = async (
    pc: RTCPeerConnection,
    targetPeerId: string,
  ) => {
    if (socket?.readyState !== WebSocket.OPEN || !targetPeerId) {
      throw new Error("Signaling socket is not open or target peer is empty");
    }

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    socket.send(JSON.stringify({ type: "offer", targetPeerId, data: offer }));
  };

  useEffect(() => {
    if (!socket) return;

    socket.onmessage = async (event) => {
      const data = JSON.parse(event.data);

      try {
        switch (data.type) {
          case "register":
            handlePeerId(data.peerId);
            break;

          case "offer": {
            const targetPeerId = data.fromPeerId;
            const pc = await createPeerConnection(targetPeerId, false);

            await pc.setRemoteDescription(new RTCSessionDescription(data.data));

            for (const candidate of pendingCandidatesRef.current) {
              await pc.addIceCandidate(candidate);
            }
            pendingCandidatesRef.current = [];

            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            socket.send(
              JSON.stringify({
                type: "answer",
                targetPeerId,
                data: answer,
              }),
            );
            break;
          }

          case "answer": {
            const pc = peerConnectionRef.current;
            if (pc) {
              await pc.setRemoteDescription(
                new RTCSessionDescription(data.data),
              );
              for (const candidate of pendingCandidatesRef.current) {
                await pc.addIceCandidate(candidate);
              }
              pendingCandidatesRef.current = [];
            }
            break;
          }

          case "ice-candidate": {
            const candidate = new RTCIceCandidate(data.data);
            const pc = peerConnectionRef.current;

            if (pc?.remoteDescription) {
              await pc.addIceCandidate(candidate);
            } else {
              pendingCandidatesRef.current.push(candidate.toJSON());
            }
            break;
          }

          case "error":
            console.error("Signaling server error:", data.message);
            break;
        }
      } catch (error) {
        console.error(`Failed to handle ${data.type}`, error);
      }
    };

    return () => {
      socket.onmessage = null;
    };
  }, [socket]);

  return (
    <PeerConnectionContext.Provider
      value={{ createPeerConnection, peerConnection, dataChannel }}
    >
      {children}
    </PeerConnectionContext.Provider>
  );
};

export default PeerConnectionProvider;
export const usePeerConnection = () => useContext(PeerConnectionContext);
