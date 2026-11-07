import type { HTMLAttributes } from "react";
import { cx } from "@/cx";

// Parchment by day, stone by night
export function Panel({ className, ...rest }: HTMLAttributes<HTMLElement>) {
  return <section className={cx("panel", className)} {...rest} />;
}
