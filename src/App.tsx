import { useEffect } from 'react';
import { BrowserRouter, Outlet, Route, Routes, useLocation } from 'react-router';
import SocketProvider from '@/context/SocketContext';
import PeerConnectionProvider from '@/context/PeerConnectionContext';
import Welcome from '@/components/game/Welcome/Welcome';
import Hangman from '@/components/game/Hangman/Hangman';
import { Header } from '@/components/game/Header/Header';
import { Solo } from '@/components/game/Solo/Solo';
import { World } from '@/components/game/World/World';
import { useLocale } from '@/i18n/i18n';
import { pathIn } from '@/i18n/locale';
import type { Scene } from '@/pixel/world';

// The part of the village behind each screen, as in docs/prototypes/
const SCENE_OF_PATH: Partial<Record<string, Scene>> = { '/solo': 'square' };

function Layout() {
  const locale = useLocale();
  const { pathname } = useLocation();
  const scene = SCENE_OF_PATH[pathIn('en', pathname).toLowerCase()] ?? 'castle';

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  return (
    <>
      <World scene={scene} />
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
              <Route path="solo" element={<Solo />} />
              <Route path="hangman" element={<Hangman />} />
            </Route>
          </Routes>
        </PeerConnectionProvider>
      </SocketProvider>
    </BrowserRouter>
  );
}

export default App;
