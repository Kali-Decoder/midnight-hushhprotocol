"use client";

import {motion} from "motion/react";

/**
 * Scroll reveal: rises 32px, un-blurs and fades in once, the first time it
 * scrolls into view. Same look as before, now spring-driven by Motion.
 * Reduced motion: MotionConfig (AppChrome) drops the movement, so only a
 * short fade remains.
 */
export default function Reveal({
  children,
  delay = 0,
  className = "",
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <motion.div
      className={className}
      initial={{opacity: 0, y: 32, filter: "blur(2px)"}}
      whileInView={{opacity: 1, y: 0, filter: "blur(0px)"}}
      viewport={{once: true, amount: 0.18, margin: "0px 0px -8% 0px"}}
      transition={{
        delay: delay / 1000,
        y: {type: "spring", stiffness: 140, damping: 22, mass: 0.9},
        opacity: {duration: 0.6, ease: [0.16, 1, 0.3, 1]},
        filter: {duration: 0.6, ease: [0.16, 1, 0.3, 1]},
      }}
    >
      {children}
    </motion.div>
  );
}
