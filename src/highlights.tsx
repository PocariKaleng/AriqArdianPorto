import { createRoot } from "react-dom/client";
import { flushSync } from "react-dom";
import { useId, useState } from "react";
import { AnimatedList } from "../components/ui/animated-list";
import Timeline from "../components/ui/timeline-01";
import { credentialTimeline } from "./credential-timeline";

const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

function attachSpotlight(element: HTMLElement) {
  let x = 0;
  let y = 0;
  let targetX = 0;
  let targetY = 0;
  let frame = 0;
  let active = false;

  const tick = () => {
    frame = 0;
    const ease = reducedMotion.matches ? 1 : 0.22;
    x += (targetX - x) * ease;
    y += (targetY - y) * ease;
    element.style.setProperty("--spot-x", `${x.toFixed(1)}px`);
    element.style.setProperty("--spot-y", `${y.toFixed(1)}px`);
    if (Math.abs(targetX - x) + Math.abs(targetY - y) > 0.6) {
      frame = requestAnimationFrame(tick);
    }
  };

  const onMove = (event: PointerEvent) => {
    if (event.pointerType !== "mouse" || !finePointer.matches || reducedMotion.matches) return;
    const bounds = element.getBoundingClientRect();
    targetX = event.clientX - bounds.left;
    targetY = event.clientY - bounds.top;
    if (!active) {
      x = targetX;
      y = targetY;
      active = true;
      element.classList.add("is-spotlit");
    }
    if (!frame) frame = requestAnimationFrame(tick);
  };

  const onLeave = () => {
    active = false;
    element.classList.remove("is-spotlit");
    cancelAnimationFrame(frame);
    frame = 0;
  };

  element.addEventListener("pointerenter", onMove);
  element.addEventListener("pointermove", onMove);
  element.addEventListener("pointerleave", onLeave);
  element.addEventListener("pointercancel", onLeave);
  window.addEventListener("blur", onLeave);
}

document.querySelectorAll<HTMLElement>(".credentials-column").forEach(attachSpotlight);

function CredentialEntry({ title, meta, roleTitle, roleDate }: { title: string; meta: string; roleTitle: string; roleDate: string }) {
  const [expanded, setExpanded] = useState(false);
  const detailId = useId();

  return (
    <div className={`credential-copy${expanded ? " is-expanded" : ""}`}>
      <span className="credential-title">{title}</span>
      {meta && <span className="credential-meta">{meta}</span>}
      {roleTitle && (
        <>
          <button
            className="credential-role-toggle"
            type="button"
            aria-label={`${expanded ? "Hide" : "Show"} ${roleTitle}`}
            aria-expanded={expanded}
            aria-controls={detailId}
            onClick={() => setExpanded((value) => !value)}
          >
            <span aria-hidden="true">+</span>
          </button>
          <span className="credential-role-reveal" id={detailId}>
            <span className="credential-role-title">{roleTitle}</span>
            <span className="credential-role-date">{roleDate}</span>
          </span>
        </>
      )}
    </div>
  );
}

document.querySelectorAll<HTMLOListElement>(".credentials-column ol").forEach((original) => {
  const entries = [...original.querySelectorAll("li")]
    .map((item) => ({
      title: item.querySelector(".credential-title")?.textContent?.trim() ?? item.textContent?.trim() ?? "",
      meta: item.querySelector(".credential-meta")?.textContent?.trim() ?? "",
      roleTitle: item.querySelector(".credential-role-title")?.textContent?.trim() ?? "",
      roleDate: item.querySelector(".credential-role-date")?.textContent?.trim() ?? "",
    }))
    .filter((entry) => entry.title);
  if (!entries.length) return;

  const mount = document.createElement("div");
  const isTimeline = original.hasAttribute("data-timeline");
  mount.className = isTimeline ? "timeline-mount" : "achievement-mount";
  original.hidden = true;
  original.after(mount);

  if (isTimeline) {
    const kind = original.getAttribute("data-timeline") === "community" ? "community" : "experience";
    const items = credentialTimeline(entries, kind);
    flushSync(() => createRoot(mount).render(<Timeline items={items} label={kind === "community" ? "Community timeline" : "Experience timeline"} />));
    return;
  }

  flushSync(() => {
    createRoot(mount).render(
      <AnimatedList delay={125}>
        {entries.map(({ title, meta, roleTitle, roleDate }) => (
          <CredentialEntry key={title} title={title} meta={meta} roleTitle={roleTitle} roleDate={roleDate} />
        ))}
      </AnimatedList>,
    );
  });
  mount.querySelectorAll<HTMLElement>(".achievement-list li").forEach((item) => {
    if (item.querySelector(".credential-role-reveal")) {
      item.classList.add("credential-role-history");
    }
    attachSpotlight(item);
  });
});
