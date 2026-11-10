import { useEffect, useMemo, useState } from 'react';
import type { Move } from '@/duo';
import { parsePeerMessage, parseServerMessage, type ServerMessage } from '@/room';

// Enough for most home networks. The room sends TURN for the strict ones (decision 001)
const STUN_ONLY: RTCIceServer[] = [{ urls: 'stun:stun.cloudflare.com:3478' }];

function roomUrl(code: string) {
  const protocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${protocol}//${location.host}/rooms/${code.toUpperCase()}`;
}

// Game moves to and from the other player, over the data channel
export interface PeerLink {
  send: (move: Move) => void;
  listen: (onMove: (move: Move) => void) => () => void;
}

export interface RoomState {
  full: boolean;
  peerName: string | null; // the other player, once they said their nickname
  first: boolean; // this player was in the room before the other joined
  left: string | null; // nickname of the player who left, until someone joins again
  link: PeerLink | null;
}

function linkOf(channel: RTCDataChannel): PeerLink {
  return {
    send(move) {
      if (channel.readyState === 'open') channel.send(JSON.stringify(move));
    },
    listen(onMove) {
      const onMessage = (event: MessageEvent) => {
        const message = parsePeerMessage(event.data);
        if (message && message.type !== 'hello') onMove(message);
      };
      channel.addEventListener('message', onMessage);
      return () => channel.removeEventListener('message', onMessage);
    },
  };
}

// Joins the room's signaling socket and connects to the other player over WebRTC.
// The player already in the room makes the offer when someone joins, so there is
// never an offer from both sides. `name` is sent once the data channel opens.
export function useRoom(code: string, name: string | null): RoomState {
  const [full, setFull] = useState(false);
  const [peerName, setPeerName] = useState<string | null>(null);
  const [first, setFirst] = useState(false);
  const [left, setLeft] = useState<string | null>(null);
  const [channel, setChannel] = useState<RTCDataChannel | null>(null);

  useEffect(() => {
    const socket = new WebSocket(roomUrl(code));
    let peer: RTCPeerConnection | null = null;
    let peerNickname: string | null = null;
    let iceServers = STUN_ONLY;
    // Handled one at a time, so a candidate never lands before its offer or answer
    let queue = Promise.resolve();

    const signal = (type: string, data: object | null) => {
      if (data && socket.readyState === WebSocket.OPEN) socket.send(JSON.stringify({ type, data }));
    };

    function hangUp() {
      peer?.close();
      peer = null;
      peerNickname = null;
      setChannel(null);
      setPeerName(null);
    }

    function connect() {
      hangUp();
      setLeft(null);
      const connection = new RTCPeerConnection({ iceServers });
      // Negotiated on both sides with the same id, so no ondatachannel round trip
      const dataChannel = connection.createDataChannel('game', { negotiated: true, id: 0 });
      dataChannel.onopen = () => setChannel(dataChannel);
      dataChannel.onmessage = (event) => {
        const message = parsePeerMessage(event.data);
        if (message?.type !== 'hello') return;
        peerNickname = message.nickname;
        setPeerName(message.nickname);
      };
      connection.onicecandidate = (event) => signal('ice-candidate', event.candidate);
      peer = connection;
      return connection;
    }

    async function handle(message: ServerMessage) {
      switch (message.type) {
        // Sent by the room right before the offer, fresh every time two players meet
        case 'ice-servers':
          iceServers = message.data;
          break;
        case 'room-full':
          setFull(true);
          break;
        case 'peer-joined': {
          setFirst(true);
          const connection = connect();
          await connection.setLocalDescription();
          signal('offer', connection.localDescription);
          break;
        }
        case 'offer': {
          setFirst(false);
          const connection = connect();
          await connection.setRemoteDescription(message.data);
          await connection.setLocalDescription();
          signal('answer', connection.localDescription);
          break;
        }
        case 'answer':
          await peer?.setRemoteDescription(message.data);
          break;
        case 'ice-candidate':
          if (peer?.remoteDescription) await peer.addIceCandidate(message.data);
          break;
        case 'peer-disconnected':
          setLeft(peerNickname);
          hangUp();
          break;
      }
    }

    socket.onmessage = (event) => {
      const message = parseServerMessage(event.data);
      if (!message) return;
      // A failed step leaves this attempt behind; the next join starts a new one
      queue = queue.then(() => handle(message)).catch(() => {});
    };

    return () => {
      socket.onmessage = null;
      socket.close();
      peer?.close();
    };
  }, [code]);

  useEffect(() => {
    if (channel?.readyState === 'open' && name) {
      channel.send(JSON.stringify({ type: 'hello', nickname: name }));
    }
  }, [channel, name]);

  const link = useMemo(() => channel && linkOf(channel), [channel]);
  return { full, peerName, first, left, link };
}
