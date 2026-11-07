import { useEffect, useRef } from "react";
import { mountWorld, type Scene } from "@/pixel/world";

// The village behind every screen. Mount it once; a new scene slides the camera.
export function World({ scene }: { scene: Scene }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const world = useRef<ReturnType<typeof mountWorld>>(null);

  useEffect(() => {
    const w = mountWorld(ref.current!);
    world.current = w;
    return w.stop;
  }, []);

  useEffect(() => {
    world.current!.update({ scene });
  }, [scene]);

  return <canvas ref={ref} className="world" aria-hidden="true" />;
}
