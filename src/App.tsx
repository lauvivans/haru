import SocketProvider from "@/context/SocketContext";
import PeerConnectionProvider from "@/context/PeerConnectionContext";
import Welcome from "@/components/game/Welcome/Welcome";
import { BrowserRouter, Route, Routes } from "react-router";
import Hangman from "@/components/game/Hangman/Hangman";
import { Header } from "@/components/game/Header/Header";
import { World } from "@/components/game/World/World";

function App() {
  return (
    <BrowserRouter>
      <SocketProvider>
        <PeerConnectionProvider>
          <World scene="castle" />
          <div className="page">
            <Header />
            <main>
              <Routes>
                <Route index element={<Welcome />}></Route>
                <Route path="hangman" element={<Hangman />}></Route>
              </Routes>
            </main>
          </div>
        </PeerConnectionProvider>
      </SocketProvider>
    </BrowserRouter>
  );
}

export default App;
