import './Welcome.css';
import { useEffect, useRef } from 'react';
import { usePeerConnection } from '@/context/PeerConnectionContext';
import { useSocket } from '@/context/SocketContext';
import Mascot from '@/assets/mascot.svg';
import { useNavigate } from 'react-router';

const Welcome = () => {
  const { isServerAwake, peerId, connectToSignalingServer } = useSocket();
  const { createPeerConnection, dataChannel } = usePeerConnection();
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const handleInitiateConnection = async () => {
    if (inputRef && inputRef.current) {
      const targetPeerId = inputRef.current.value;
      await createPeerConnection(targetPeerId, true);
    }
  };

  useEffect(() => {
    if (dataChannel) {
      dataChannel.onopen = () => {
        navigate('/hangman');
      };
    }
  }, [dataChannel]);

  return (
    <section className="welcome-section">
      <h1>Welcome to Haru</h1>
      <img src={Mascot} />
      <p>Server is {isServerAwake ? 'awake' : 'down'}</p>
      <button className="btn btn--ghost" onClick={connectToSignalingServer}>
        Connect to server
      </button>
      {isServerAwake && peerId && <p>Your peerId is: {peerId}</p>}
      <div className="welcome-section__connection">
        <input ref={inputRef} placeholder="Set peerId you want to connect" />
        <button className="btn btn--ghost" onClick={handleInitiateConnection}>
          Initiate connection
        </button>
      </div>
    </section>
  );
};

export default Welcome;
