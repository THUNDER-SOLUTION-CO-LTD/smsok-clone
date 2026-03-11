"use client";

import { motion } from "framer-motion";
import { useReducedMotion } from "framer-motion";
import {
  staggerContainer,
  staggerItem,
  reducedStaggerContainer,
  reducedStaggerItem,
} from "@/lib/motion";

interface StaggerContainerProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  staggerDelay?: number;
}

export function StaggerContainer({
  children,
  className,
  delay = 0.1,
  staggerDelay = 0.06,
}: StaggerContainerProps) {
  const shouldReduce = useReducedMotion();

  const container = shouldReduce
    ? reducedStaggerContainer
    : {
        ...staggerContainer,
        show: {
          ...staggerContainer.show,
          transition: {
            staggerChildren: staggerDelay,
            delayChildren: delay,
          },
        },
      };

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className={className}
    >
      {children}
    </motion.div>
  );
}

interface StaggerItemProps {
  children: React.ReactNode;
  className?: string;
}

export function StaggerItem({ children, className }: StaggerItemProps) {
  const shouldReduce = useReducedMotion();

  return (
    <motion.div
      variants={shouldReduce ? reducedStaggerItem : staggerItem}
      className={className}
    >
      {children}
    </motion.div>
  );
}
