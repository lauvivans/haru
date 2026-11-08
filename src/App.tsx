import { useEffect } from 'react';
import { BrowserRouter, Outlet, Route, Routes, useLocation } from 'react-router';
import { CreateRoom } from '@/components/game/CreateRoom/CreateRoom';
import { Landing } from '@/components/game/Landing/Landing';
import { Header } from '@/components/game/Header/Header';
import { Room } from '@/components/game/Room/Room';
import { Solo } from '@/components/game/Solo/Solo';
import { World } from '@/components/game/World/World';
import { useLocale } from '@/i18n/i18n';
import { pathIn } from '@/i18n/locale';
import type { Scene } from '@/pixel/world';

// The part of the village behind each screen, as in docs/prototypes/
const SCENE_OF_SECTION: Partial<Record<string, Scene>> = { solo: 'square', room: 'tavern' };

function Layout() {
  const locale = useLocale();
  const { pathname } = useLocation();
  const section = pathIn('en', pathname).split('/')[1].toLowerCase();
  const scene = SCENE_OF_SECTION[section] ?? 'castle';

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
      <Routes>
        <Route path="pt-BR?" element={<Layout />}>
          <Route index element={<Landing />} />
          <Route path="solo" element={<Solo />} />
          <Route path="room" element={<CreateRoom />} />
          <Route path="room/:code" element={<Room />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
