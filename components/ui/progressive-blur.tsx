import type { CSSProperties } from "react";

export function ProgressiveBlur({ className = "", direction = "left", blurIntensity = 1 }: { className?: string; direction?: "left" | "right"; blurIntensity?: number }) {
  return <div className={`progressive-blur progressive-blur--${direction} ${className}`} aria-hidden="true">
    {[0, 1, 2, 3].map(step => <span key={step} style={{ "--blur-step": step, "--blur-amount": `${blurIntensity * 2 ** step}px` } as CSSProperties} />)}
  </div>;
}
