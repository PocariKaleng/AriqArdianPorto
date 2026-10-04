"use client";

import { useEffect, useRef, useState } from "react";

export interface AnimatedTabsProps {
  tabs: { label: string; href?: string }[];
  activeLabel?: string | null;
  variant?: "pill" | "underline";
}

// Keep real links for page navigation; the clipped layer is decorative only.
export function AnimatedTabs({ tabs, activeLabel, variant = "pill" }: AnimatedTabsProps) {
  const [selected, setSelected] = useState(tabs[0]?.label ?? null);
  const [hovered, setHovered] = useState<string | null>(null);
  const [focused, setFocused] = useState<string | null>(null);
  const active = activeLabel === undefined ? selected : activeLabel;
  const target = hovered ?? focused ?? active;
  const containerRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const rowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    const overlay = overlayRef.current;
    const row = rowRef.current;
    if (!container || !overlay || !row) return;
    let disposed = false;
    const measure = () => {
      if (disposed) return;
      const item = Array.from(row.children).find(el => el.textContent === target) as HTMLElement | undefined;
      overlay.style.opacity = item ? "1" : "0";
      if (!item) return;
      const bounds = container.getBoundingClientRect();
      const box = item.getBoundingClientRect();
      const left = box.left - bounds.left;
      const top = box.top - bounds.top;
      if (variant === "underline") {
        const style = getComputedStyle(item);
        const start = Number.parseFloat(style.paddingLeft);
        const end = Number.parseFloat(style.paddingRight);
        overlay.style.setProperty("--indicator-left", `${left + start}px`);
        overlay.style.setProperty("--indicator-width", `${Math.max(0, box.width - start - end)}px`);
        overlay.style.clipPath = "";
        return;
      }
      overlay.style.clipPath = `inset(${top}px ${Math.max(0, bounds.width - left - box.width)}px ${Math.max(0, bounds.height - top - box.height)}px ${left}px round 999px)`;
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(container);
    observer.observe(row);
    void document.fonts.ready.then(measure);
    return () => { disposed = true; observer.disconnect(); };
  }, [target, tabs, variant]);

  if (!tabs.length) return null;
  return (
    <div className={`animated-tabs animated-tabs--${variant}`} ref={containerRef} onPointerLeave={() => setHovered(null)}>
      <div className="animated-tabs-overlay" ref={overlayRef} aria-hidden="true">
        {variant === "pill" && <div className="animated-tabs-overlay-row">
          {tabs.map(tab => <span className="animated-tab" key={tab.label}>{tab.label}</span>)}
        </div>}
      </div>
      <div className="animated-tabs-row" ref={rowRef} onBlur={event => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setFocused(null);
      }}>
        {tabs.map(tab => {
          const interaction = {
            className: "animated-tab",
            onPointerEnter: (event: React.PointerEvent<HTMLElement>) => { if (event.pointerType !== "touch") setHovered(tab.label); },
            onFocus: () => setFocused(tab.label),
          };
          return tab.href ? (
            <a {...interaction} key={tab.label} href={tab.href} aria-current={active === tab.label ? "page" : undefined}>{tab.label}</a>
          ) : (
            <button {...interaction} key={tab.label} type="button" aria-pressed={active === tab.label} onClick={() => setSelected(tab.label)}>{tab.label}</button>
          );
        })}
      </div>
    </div>
  );
}
