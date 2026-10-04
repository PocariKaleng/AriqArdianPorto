import { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { Pause, Play } from "lucide-react";
import { Macbook } from "@/components/ui/animated-3d-mac-book-air";

export function MacbookShowcase() {
  const root = useRef<HTMLElement>(null);
  const [paused, setPaused] = useState(false);
  const [inView, setInView] = useState(false);
  const [hidden, setHidden] = useState(document.hidden);
  const [reduced, setReduced] = useState(() => window.matchMedia("(prefers-reduced-motion: reduce)").matches);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onMotionChange = () => setReduced(media.matches);
    const onVisibilityChange = () => setHidden(document.hidden);
    const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), { threshold: 0.05 });
    if (root.current) observer.observe(root.current);
    media.addEventListener("change", onMotionChange);
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      observer.disconnect();
      media.removeEventListener("change", onMotionChange);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, []);

  return (
    <figure ref={root} className="macbook-showcase" data-running={!paused && inView && !hidden && !reduced}>
      <div className="macbook-scene" aria-hidden="true"><Macbook /></div>
      <figcaption className="macbook-caption">
        <span>MACBOOK AIR / 3D</span>
        {!reduced && (
          <button type="button" className="macbook-motion-toggle" aria-label={paused ? "Play MacBook animation" : "Pause MacBook animation"} aria-pressed={paused} onClick={() => setPaused((value) => !value)}>
            {paused ? <Play size={13} aria-hidden="true" /> : <Pause size={13} aria-hidden="true" />}
            <span>{paused ? "Play" : "Pause"}</span>
          </button>
        )}
      </figcaption>
    </figure>
  );
}

const mount = document.getElementById("about-macbook");
if (mount) createRoot(mount).render(<MacbookShowcase />);
