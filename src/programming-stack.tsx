import { useEffect, useRef, useState, type CSSProperties } from "react";
import { Pause, Play } from "lucide-react";
import { Sparkles } from "@/components/ui/sparkles";
import { InfiniteSlider } from "@/components/ui/infinite-slider";
import { ProgressiveBlur } from "@/components/ui/progressive-blur";

const technologies = [
  { name: "Python", icon: "python", detail: "Security scripts & CTF" },
  { name: "JavaScript", icon: "javascript", detail: "Browser interactions" },
  { name: "TypeScript", icon: "typescript", detail: "Typed web interfaces" },
  { name: "Kotlin", icon: "kotlin", detail: "Android development" },
  { name: "Java", icon: "openjdk", detail: "Application development" },
  { name: "HTML", icon: "html5", detail: "Web structure" },
  { name: "CSS", icon: "css", detail: "Layout & visual styling" },
  { name: "Docker", icon: "docker", detail: "Reproducible containers" },
];

export function ProgrammingStack() {
  const section = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [pageVisible, setPageVisible] = useState(!document.hidden);
  const [reduced, setReduced] = useState(false);
  const [paused, setPaused] = useState(false);
  const [light, setLight] = useState(document.documentElement.dataset.theme === "light");
  const [density, setDensity] = useState(60);
  const [entered, setEntered] = useState(false);
  const running = visible && pageVisible && !reduced && !paused;

  useEffect(() => {
    const element = section.current;
    if (!element) return;
    const motion = matchMedia("(prefers-reduced-motion: reduce)");
    const updateMotion = () => setReduced(motion.matches);
    const updateVisibility = () => setPageVisible(!document.hidden);
    updateMotion();
    motion.addEventListener("change", updateMotion);
    document.addEventListener("visibilitychange", updateVisibility);
    const intersection = new IntersectionObserver(entries => {
      const shown = entries.some(entry => entry.isIntersecting);
      setVisible(shown);
      if (shown) setEntered(true);
    }, { threshold: 0 });
    intersection.observe(element);
    const resize = new ResizeObserver(entries => {
      const { width, height } = entries[0].contentRect;
      setDensity(Math.round(Math.max(28, Math.min(110, width * Math.min(height, 260) / 2500))));
    });
    resize.observe(element);
    const theme = new MutationObserver(() => setLight(document.documentElement.dataset.theme === "light"));
    theme.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    return () => {
      intersection.disconnect(); resize.disconnect(); theme.disconnect();
      motion.removeEventListener("change", updateMotion);
      document.removeEventListener("visibilitychange", updateVisibility);
    };
  }, []);

  return <div className="programming-stack" ref={section} data-running={running} data-reduced={reduced}>
    <div className="programming-stack-heading">
      <div><h3>Languages & Docker</h3><p>Across my web, mobile and CTF projects.</p></div>
      {!reduced && <button type="button" className="stack-motion-toggle" aria-label={paused ? "Play stack animation" : "Pause stack animation"} onClick={() => setPaused(value => !value)}>
        {paused ? <Play size={14} aria-hidden="true" /> : <Pause size={14} aria-hidden="true" />}<span>{paused ? "Play" : "Pause"}</span>
      </button>}
    </div>
    <div className="programming-stack-logos">
      <InfiniteSlider duration={40} gap={40} paused={!running} label="Programming languages and Docker">
        {technologies.map(technology => <li className="programming-stack-logo" key={technology.name}>
          <span className="programming-stack-icon" aria-hidden="true" style={{ "--stack-logo": `url(assets/stack-icons/${technology.icon}.svg)` } as CSSProperties} />
          <div><span className="programming-stack-name">{technology.name}</span><span className="programming-stack-detail">{technology.detail}</span></div>
        </li>)}
      </InfiniteSlider>
      <ProgressiveBlur direction="left" blurIntensity={.35} />
      <ProgressiveBlur direction="right" blurIntensity={.35} />
    </div>
    <div className="programming-stack-atmosphere" aria-hidden="true">
      <div className="programming-stack-glow" />
      {entered && !reduced && <Sparkles className="programming-stack-sparkles" enabled={running} density={density} color={light ? "#6e4299" : "#eee4ff"} speed={.25} opacity={light ? .5 : .8} />}
      <div className="programming-stack-horizon" />
    </div>
  </div>;
}
