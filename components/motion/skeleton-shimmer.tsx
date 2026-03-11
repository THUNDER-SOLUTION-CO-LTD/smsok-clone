"use client";

import { motion, useReducedMotion } from "framer-motion";
import { shimmerVariants, contentReveal } from "@/lib/motion";

interface SkeletonShimmerProps {
  className?: string;
  width?: string | number;
  height?: string | number;
}

export function SkeletonShimmer({
  className,
  width = "100%",
  height = 20,
}: SkeletonShimmerProps) {
  const shouldReduce = useReducedMotion();

  return (
    <div
      className={`relative overflow-hidden rounded bg-[var(--bg-muted)] ${className ?? ""}`}
      style={{ width, height }}
    >
      {!shouldReduce && (
        <motion.div
          variants={shimmerVariants}
          initial="initial"
          animate="animate"
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent"
        />
      )}
    </div>
  );
}

interface ContentRevealProps {
  isLoaded: boolean;
  children: React.ReactNode;
  className?: string;
}

export function ContentReveal({
  isLoaded,
  children,
  className,
}: ContentRevealProps) {
  return (
    <motion.div
      variants={contentReveal}
      initial="hidden"
      animate={isLoaded ? "visible" : "hidden"}
      className={className}
    >
      {children}
    </motion.div>
  );
}
