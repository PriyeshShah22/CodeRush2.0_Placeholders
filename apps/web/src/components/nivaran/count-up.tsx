"use client";

import { useEffect, useState } from "react";

export function CountUp({ value, suffix = "" }: { value: number; suffix?: string }) {
  const [shown, setShown] = useState(value);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      const reducedFrame = requestAnimationFrame(() => setShown(value));
      return () => cancelAnimationFrame(reducedFrame);
    }
    const started = performance.now();
    const duration = 500;
    let frame = 0;
    const animate = (now: number) => {
      const progress = Math.min(1, (now - started) / duration);
      setShown(value * (1 - Math.pow(1 - progress, 3)));
      if (progress < 1) frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [value]);

  const precision = Number.isInteger(value) ? 0 : 1;
  return <>{shown.toFixed(precision)}{suffix}</>;
}
