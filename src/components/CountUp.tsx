import { useEffect, useRef, useState } from "react";

interface Props {
  value: number;
  duration?: number;
  suffix?: string;
  className?: string;
}

export function CountUp({ value, duration = 1200, suffix = "", className }: Props) {
  const [display, setDisplay] = useState(0);
  const raf = useRef<number>();

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      setDisplay(value);
      return;
    }
    const start = performance.now();
    const tick = (now: number) => {
      const p = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplay(Math.round(value * eased));
      if (p < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => {
      if (raf.current) cancelAnimationFrame(raf.current);
    };
  }, [value, duration]);

  return (
    <span className={className}>
      {display.toLocaleString("tr-TR")}
      {suffix}
    </span>
  );
}
