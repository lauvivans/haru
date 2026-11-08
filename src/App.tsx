import { useEffect } from "react";
import { BrowserRouter, Outlet, Route, Routes } from "react-router";
import SocketProvider from "@/context/SocketContext";
import PeerConnectionProvider from "@/context/PeerConnectionContext";
import Welcome from "@/components/game/Welcome/Welcome";
import Hangman from "@/components/game/Hangman/Hangman";
import { Header } from "@/components/game/Header/Header";
import { World } from "@/components/game/World/World";
import { useLocale } from "@/i18n/i18n";

function Layout() {
  const locale = useLocale();
  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  return (
    <>
      <World scene="castle" />
      <div className="page">
        <Header />
        <main>
          <Outlet />
        </main>
      </div>
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      <SocketProvider>
        <PeerConnectionProvider>
          <Routes>
            <Route path="pt-BR?" element={<Layout />}>
              <Route index element={<Welcome />} />
              <Route path="hangman" element={<Hangman />} />
            </Route>
          </Routes>
        </PeerConnectionProvider>
      </SocketProvider>
    </BrowserRouter>
  );
}

export default App;
