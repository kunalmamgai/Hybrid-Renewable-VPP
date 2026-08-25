/**
 * Shared motion conventions — Framer Motion variants + number count-up.
 */
import { useEffect, useRef, useState } from 'react';
import { useReducedMotion } from 'framer-motion';

export const pageVariants = {
  initial: { opacity: 0, y: 12 },
  enter: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] as const },
  },
  exit: {
    opacity: 0,
    y: -12,
    transition: { duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] as const },
  },
};

export const staggerContainer = {
  enter: {
    transition: { staggerChildren: 0.06 },
  },
};

export const fadeUpItem = {
  initial: { opacity: 0, y: 14 },
  enter: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.42, ease: [0.25, 0.46, 0.45, 0.94] as const },
  },
};

/**
 * Count-up animation for numeric values. Re-animates whenever `target`
 * changes; respects prefers-reduced-motion.
 */
export function useCountUp(target: number, durationMs = 700): number {
  const reduced = useReducedMotion();
  const [value, setValue] = useState(target);
  const fromRef = useRef(target);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    if (reduced) {
      setValue(target);
      return undefined;
    }
    const from = fromRef.current;
    if (from === target) return undefined;
    const start = performance.now();

    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / durationMs);
      const eased = 1 - Math.pow(1 - t, 3);
      setValue(from + (target - from) * eased);
      if (t < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        fromRef.current = target;
      }
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [target, durationMs, reduced]);

  return value;
}
