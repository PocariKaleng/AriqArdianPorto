"use client";

import React, { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";

export interface AnimatedListProps {
  className?: string;
  children: React.ReactNode;
  delay?: number;
}

// Keep every entry in the document so the list retains its height and semantics.
// Re-entering the viewport restarts the same spring sequence in either direction.
export const AnimatedList = React.memo(
  ({ className = "", children, delay = 110 }: AnimatedListProps) => {
    const listRef = useRef<HTMLOListElement>(null);
    const [visible, setVisible] = useState(false);
    const reduceMotion = useReducedMotion();

    useEffect(() => {
      const list = listRef.current;
      if (!list || reduceMotion) return;
      if (!("IntersectionObserver" in window)) {
        setVisible(true);
        return;
      }

      const observer = new IntersectionObserver(
        ([entry]) => setVisible(entry.isIntersecting),
        { threshold: 0.08 },
      );
      observer.observe(list);
      return () => observer.disconnect();
    }, [reduceMotion]);

    return (
      <motion.ol
        ref={listRef}
        role="list"
        className={`achievement-list ${className}`.trim()}
        initial={false}
        animate={reduceMotion || visible ? "visible" : "hidden"}
        variants={{
          visible: { transition: { staggerChildren: delay / 1000 } },
          hidden: { transition: { staggerChildren: 0 } },
        }}
      >
        {React.Children.map(children, (child) => (
          <motion.li
            role="listitem"
            whileHover={reduceMotion ? undefined : { y: -6, scale: 1.025, transition: { type: "spring", stiffness: 480, damping: 25 } }}
            variants={{
              hidden: { opacity: 0, y: 18, scale: 0.96, transition: { duration: 0 } },
              visible: {
                opacity: 1,
                y: 0,
                scale: 1,
                transition: { type: "spring", stiffness: 350, damping: 40 },
              },
            }}
          >
            {child}
          </motion.li>
        ))}
      </motion.ol>
    );
  },
);

AnimatedList.displayName = "AnimatedList";
