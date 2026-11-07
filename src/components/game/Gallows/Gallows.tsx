import { useEffect, useRef } from "react";
import { mountGallows } from "@/pixel/gallows";
import type { Mood, SpriteSize } from "@/pixel/haru";

type Props = {
  misses: number; // 0 to 7: one piece per miss
  mood?: Mood;
  size?: SpriteSize; // fixed scale; without it the stage fills its parent
};

// The gallows with Haru on it. Back to 0 misses resets it for a new round.
export function Gallows({ misses, mood = "idle", size }: Props) {
  const ref = useRef<HTMLCanvasElement>(null);
  const stage = useRef<ReturnType<typeof mountGallows>>(null);

  // A new size mounts a new canvas, so the state runs again after it
  useEffect(() => {
    const g = mountGallows(ref.current!, size);
    stage.current = g;
    return g.stop;
  }, [size]);

  useEffect(() => {
    stage.current!.update({ misses, mood });
  }, [misses, mood, size]);

  return <canvas ref={ref} className="stage" aria-hidden="true" />;
}
