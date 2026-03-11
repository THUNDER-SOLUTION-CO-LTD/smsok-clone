"use client";

import { motion } from "framer-motion";
import { pageVariants } from "@/lib/motion";

export default function DashboardTemplate({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="flex-1"
    >
      {children}
    </motion.div>
  );
}
