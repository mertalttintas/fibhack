import { useEffect, useState } from "react";

export function Typewriter({ text, speed = 14 }: { text: string; speed?: number }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    setCount(0);
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      setCount(text.length);
      return;
    }
    const id = setInterval(() => {
      setCount((c) => {
        if (c >= text.length) {
          clearInterval(id);
          return c;
        }
        return c + 1;
      });
    }, speed);
    return () => clearInterval(id);
  }, [text, speed]);

  return (
    <span>
      {text.slice(0, count)}
      {count < text.length && <span className="text-fteal animate-pulse">▍</span>}
    </span>
  );
}
