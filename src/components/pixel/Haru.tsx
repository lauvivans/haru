import { useEffect, useRef } from "react";
import { mountSprite, type Look, type Mood, type SpriteSize } from "@/pixel/haru";

type Props = {
  mood?: Mood;
  size?: SpriteSize;
  look?: Look; // a fixed look; otherwise the player's choice
  onClick?: () => void;
};

// Haru alone, for the landing, cards and dialogs
export function Haru({ mood = "idle", size = "md", look, onClick }: Props) {
  const ref = useRef<HTMLCanvasElement>(null);
  const sprite = useRef<ReturnType<typeof mountSprite>>(null);

  // A new size or look mounts a new canvas, so the mood runs again after it
  useEffect(() => {
    const s = mountSprite(ref.current!, size, look);
    sprite.current = s;
    return s.stop;
  }, [size, look]);

  useEffect(() => {
    sprite.current!.update({ mood });
  }, [mood, size, look]);

  return <canvas ref={ref} className="sprite" aria-hidden="true" onClick={onClick} />;
}
