import SocketProvider from "@/context/SocketContext";
import PeerConnectionProvider from "@/context/PeerConnectionContext";
import Welcome from "@/components/welcome/Welcome";
import { BrowserRouter, Route, Routes } from "react-router";
import Hangman from "@/components/hangman/Hangman";

function App() {
  return (
    <BrowserRouter>
      <SocketProvider>
        <PeerConnectionProvider>
          <Routes>
            <Route index element={<Welcome />}></Route>
            <Route path="hangman" element={<Hangman />}></Route>
          </Routes>
        </PeerConnectionProvider>
      </SocketProvider>
    </BrowserRouter>
  );
}

export default App;
