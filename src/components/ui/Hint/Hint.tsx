import type { ReactNode } from "react";

// A short label on the accent color, like the category of the word
export function Hint({ children }: { children: ReactNode }) {
  return <span className="hint">{children}</span>;
}
