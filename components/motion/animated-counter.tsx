"use client";

import { useEffect } from "react";
import {
  motion,
  useMotionValue,
  useTransform,
  animate,
  useReducedMotion,
} from "framer-motion";

interface AnimatedCounterProps {
  value: number;
  duration?: number;
  className?: string;
  format?: (n: number) => string;
}

export function AnimatedCounter({
  value,
  duration = 1.2,
  className,
  format,
}: AnimatedCounterProps) {
  const shouldReduce = useReducedMotion();
  const count = useMotionValue(0);
  const rounded = useTransform(count, (v) =>
    format ? format(Math.round(v)) : Math.round(v).toLocaleString()
  );

  useEffect(() => {
    if (shouldReduce) {
      count.set(value);
      return;
    }
    const animation = animate(count, value, {
      duration,
      ease: "easeOut",
    });
    return animation.stop;
  }, [value, duration, shouldReduce, count]);

  return <motion.span className={className}>{rounded}</motion.span>;
}
