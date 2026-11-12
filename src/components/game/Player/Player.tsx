import type { ReactNode } from 'react';

// A player's nickname and role in a two-player round
export function Player({ name, role }: { name: string; role?: ReactNode }) {
  return (
    <span className="player">
      {name}
      {role && <span className="player__role">{role}</span>}
    </span>
  );
}
