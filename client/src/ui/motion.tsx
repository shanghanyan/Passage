import { useEffect, useRef, useState, type ReactNode } from "react";

const RISE_EASE = "cubic-bezier(0.16, 1, 0.3, 1)";

/** Fade up on mount — header/content/actions stagger via --rise-delay (e.g. 0s, 0.15s, 0.3s). */
export function RiseIn({
  children,
  className = "",
  delay = 0,
  as: Tag = "div",
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  as?: "div" | "section" | "p" | "span" | "li";
}) {
  return (
    <Tag
      className={`rise-in ${className}`.trim()}
      style={{ "--rise-delay": `${delay}s` } as React.CSSProperties}
    >
      {children}
    </Tag>
  );
}

/** Count up from 0 to target — for stats, span counts, recall scores. */
export function CountUp({
  value,
  duration = 600,
  className = "",
  suffix = "",
  decimals = 0,
}: {
  value: number;
  duration?: number;
  className?: string;
  suffix?: string;
  decimals?: number;
}) {
  const [display, setDisplay] = useState(value);

  useEffect(() => {
    if (value === 0) {
      setDisplay(0);
      return;
    }

    let raf = 0;
    const start = performance.now();

    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - (1 - t) ** 3;
      const next = value * eased;
      setDisplay(decimals > 0 ? next : Math.round(next));
      if (t < 1) raf = requestAnimationFrame(tick);
      else setDisplay(value);
    };

    setDisplay(0);
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, duration, decimals]);

  const formatted =
    decimals > 0 ? display.toFixed(decimals) : String(Math.round(display));

  return (
    <span className={className} aria-live="polite">
      {formatted}
      {suffix}
    </span>
  );
}

/** Re-triggers rise-in when `signal` changes (e.g. live transcript updates). */
export function useRiseOnChange(signal: string): string {
  const [pulse, setPulse] = useState(false);
  const prev = useRef("");

  useEffect(() => {
    if (!signal.trim() || signal === prev.current) return;
    prev.current = signal;
    setPulse(true);
    const t = window.setTimeout(() => setPulse(false), 520);
    return () => window.clearTimeout(t);
  }, [signal]);

  return pulse ? "rise-in-pulse" : "";
}

export { RISE_EASE };
