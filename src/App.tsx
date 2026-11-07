import SocketProvider from "@/context/SocketContext";
import PeerConnectionProvider from "@/context/PeerConnectionContext";
import Welcome from "@/components/welcome/Welcome";
import { BrowserRouter, Route, Routes } from "react-router";
import Hangman from "@/components/hangman/Hangman";
import { Header } from "@/components/ui/Header";
import { World } from "@/components/pixel/World";

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
