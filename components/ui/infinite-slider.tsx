"use client";

import type { CSSProperties, ReactNode } from "react";

export interface InfiniteSliderProps {
  children: ReactNode;
  className?: string;
  duration?: number;
  gap?: number;
  paused?: boolean;
  label?: string;
}

export function InfiniteSlider({ children, className = "", duration = 36, gap = 36, paused = false, label = "Technologies" }: InfiniteSliderProps) {
  return <div className={`infinite-slider ${className}`} data-paused={paused} style={{ "--slider-duration": `${duration}s`, "--slider-gap": `${gap}px` } as CSSProperties}>
    <div className="infinite-slider-track">
      <ul className="infinite-slider-group" aria-label={label}>{children}</ul>
      <ul className="infinite-slider-group" aria-hidden="true">{children}</ul>
    </div>
  </div>;
}
