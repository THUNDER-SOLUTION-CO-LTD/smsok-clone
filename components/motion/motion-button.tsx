"use client";

import { motion, useReducedMotion } from "framer-motion";
import { buttonVariants, primaryButtonVariants } from "@/lib/motion";

interface MotionButtonProps {
  variant?: "default" | "primary";
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  disabled?: boolean;
  type?: "button" | "submit" | "reset";
}

export function MotionButton({
  variant = "default",
  children,
  className,
  ...props
}: MotionButtonProps) {
  const shouldReduce = useReducedMotion();

  if (shouldReduce) {
    return (
      <button className={className} {...props}>
        {children}
      </button>
    );
  }

  const variants =
    variant === "primary" ? primaryButtonVariants : buttonVariants;

  return (
    <motion.button
      variants={variants}
      initial="idle"
      whileHover="hover"
      whileTap="tap"
      className={className}
      {...props}
    >
      {children}
    </motion.button>
  );
}
