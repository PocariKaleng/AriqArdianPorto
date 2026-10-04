"use client";

import { useEffect, useRef, useState } from "react";
import { useInView } from "framer-motion";

export interface SpecialTextProps {
  children: string;
  speed?: number;
  delay?: number;
  className?: string;
  inView?: boolean;
  once?: boolean;
}

const RANDOM_CHARS = "_!X$0-+*#";

function getRandomChar(previous?: string) {
  let character: string;
  do { character = RANDOM_CHARS[Math.floor(Math.random() * RANDOM_CHARS.length)]; }
  while (character === previous);
  return character;
}

export function SpecialText({ children, speed = 20, delay = 0, className = "", inView = false, once = true }: SpecialTextProps) {
  const container = useRef<HTMLSpanElement>(null);
  const visible = useInView(container, { once, margin: "-100px" });
  const shouldAnimate = !inView || visible;
  const [displayText, setDisplayText] = useState(children);
  const [reduced, setReduced] = useState(() => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches);

  useEffect(() => {
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(preference.matches);
    preference.addEventListener("change", update);
    return () => preference.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    let timer: number | undefined;
    let step = 0;
    const characters = Array.from(children);
    const length = characters.length;
    const phaseLength = length * 2;
    setDisplayText(children);
    if (!shouldAnimate || reduced || !length) return;

    function tick() {
      if (document.hidden) { setDisplayText(children); return; }
      if (step >= phaseLength * 2) { setDisplayText(children); return; }
      const revealed = Math.floor((step - phaseLength) / 2);
      const filled = Math.min(step + 1, length);
      const next: string[] = [];
      for (let index = 0; index < length; index++) {
        if (characters[index] === " ") next.push(" ");
        else if (step < phaseLength && index >= filled) next.push("\u00a0");
        else if (step >= phaseLength && index < revealed) next.push(characters[index]);
        else if (step >= phaseLength && index === revealed && step % 2 === 0) next.push("_");
        else next.push(getRandomChar(next[index - 1]));
      }
      setDisplayText(next.join(""));
      step++;
      timer = window.setTimeout(tick, Math.max(16, speed));
    }

    const finishWhenHidden = () => {
      if (document.hidden) { window.clearTimeout(timer); setDisplayText(children); }
    };
    document.addEventListener("visibilitychange", finishWhenHidden);
    timer = window.setTimeout(tick, Math.max(0, delay) * 1000);
    return () => { window.clearTimeout(timer); document.removeEventListener("visibilitychange", finishWhenHidden); };
  }, [children, shouldAnimate, speed, delay, reduced]);

  return <span ref={container} className={`special-text ${className}`} aria-label={children}>
    <span className="special-text-measure" aria-hidden="true">{children}</span>
    <span className="special-text-visual" aria-hidden="true">{displayText}</span>
  </span>;
}
