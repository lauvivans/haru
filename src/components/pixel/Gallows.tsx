import { useEffect, useRef } from "react";
import { mountGallows } from "@/pixel/gallows";
import type { Mood, SpriteSize } from "@/pixel/haru";

type Props = {
  misses: number; // 0 to 7: one piece per miss
  mood?: Mood;
  size?: SpriteSize; // fixed scale; without it the stage fills its parent
};

// The gallows with Haru on it. Back to 0 misses resets it for a new round.
// A round that mounts already in progress shows its pieces without the fall.
export function Gallows({ misses, mood = "idle", size }: Props) {
  const ref = useRef<HTMLCanvasElement>(null);
  const stage = useRef<ReturnType<typeof mountGallows>>(null);
  const mounted = useRef(false);

  useEffect(() => {
    const g = mountGallows(ref.current!, size);
    stage.current = g;
    mounted.current = false;
    return () => g.stop();
  }, [size]);

  useEffect(() => {
    const g = stage.current!;
    if (misses === 0) g.reset();
    else g.setMisses(misses, !mounted.current);
    mounted.current = true;
  }, [misses, size]);

  useEffect(() => {
    stage.current?.setMood(mood);
  }, [mood, size]);

  return <canvas ref={ref} className="stage" aria-hidden="true" />;
}
