"use client";

import { useEffect, useRef } from "react";

interface GhostWordProps {
  text: string;
  color: string;
  opacity: number;
  top?: string;
  bottom?: string;
  align?: "left" | "right";
  fitToParent?: boolean; // dynamically size to fill parent width
  fontSize?: string; // manual font-size (used when fitToParent is false)
}

export default function GhostWord({
  text,
  color,
  opacity,
  top,
  bottom,
  align = "left",
  fitToParent = false,
  fontSize = "16vw",
}: GhostWordProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!fitToParent || !ref.current) return;

    const fit = () => {
      const el = ref.current;
      if (!el) return;
      const parent = el.closest("section") || el.parentElement;
      if (!parent) return;
      const pw = parent.offsetWidth;

      let lo = 10,
        hi = 600,
        best = 10;
      while (lo <= hi) {
        const mid = Math.floor((lo + hi) / 2);
        el.style.fontSize = mid + "px";
        if (el.scrollWidth <= pw) {
          best = mid;
          lo = mid + 1;
        } else {
          hi = mid - 1;
        }
      }
      el.style.fontSize = best + "px";
    };

    fit();
    window.addEventListener("resize", fit);
    return () => window.removeEventListener("resize", fit);
  }, [fitToParent, text]);

  const style: React.CSSProperties = {
    color,
    opacity,
    ...(top ? { top } : {}),
    ...(bottom ? { bottom } : {}),
    ...(align === "left" ? { left: "-1%" } : { right: "-1%" }),
    ...(!fitToParent ? { fontSize } : {}),
  };

  return <div ref={ref} className="ghost-word" style={style}>{text}</div>;
}
