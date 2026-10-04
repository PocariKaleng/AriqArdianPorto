"use client";

import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import Particles, { ParticlesProvider } from "@tsparticles/react";
import { loadSlim } from "@tsparticles/slim";
import type { Container, Engine, ISourceOptions } from "@tsparticles/engine";

export interface SparklesProps {
  className?: string;
  size?: number;
  minSize?: number | null;
  density?: number;
  speed?: number;
  minSpeed?: number | null;
  opacity?: number;
  opacitySpeed?: number;
  minOpacity?: number | null;
  color?: string;
  background?: string;
  options?: ISourceOptions;
  enabled?: boolean;
}

// tsParticles v4 initializes through a provider; keep its registrar stable.
const initializeEngine = async (engine: Engine) => { await loadSlim(engine); };

export function Sparkles({
  className, size = 1.5, minSize = null, density = 90, speed = .3,
  minSpeed = null, opacity = .7, opacitySpeed = .5, minOpacity = null,
  color = "#FFFFFF", background = "transparent", options, enabled = true,
}: SparklesProps) {
  const [started, setStarted] = useState(false);
  const container = useRef<Container | undefined>(undefined);
  const enabledRef = useRef(enabled);
  enabledRef.current = enabled;
  const id = `sparkles-${useId().replace(/[^a-zA-Z0-9-]/g, "")}`;

  useEffect(() => {
    if (enabled) setStarted(true);
  }, [enabled]);

  useEffect(() => {
    if (enabled) container.current?.play();
    else container.current?.pause();
  }, [enabled]);

  const handleLoaded = useCallback(async (instance?: Container) => {
    container.current = instance;
    if (!enabledRef.current) instance?.pause();
  }, []);

  const particleOptions = useMemo<ISourceOptions>(() => ({
    background: { color: { value: background } },
    fullScreen: { enable: false },
    fpsLimit: 45,
    // The parent owns visibility and manual pausing, so engine observers must
    // not restart a manually paused layer when the user returns to the page.
    pauseOnBlur: false,
    pauseOnOutsideViewport: false,
    particles: {
      color: { value: color },
      move: { enable: true, direction: "none", speed: { min: minSpeed ?? speed / 10, max: speed }, straight: false },
      number: { value: density, density: { enable: false } },
      opacity: { value: { min: minOpacity ?? opacity / 10, max: opacity }, animation: { enable: true, sync: false, speed: opacitySpeed } },
      size: { value: { min: minSize ?? size / 2.5, max: size } },
    },
    detectRetina: window.devicePixelRatio <= 2,
    ...options,
  }), [background, color, density, minOpacity, minSize, minSpeed, opacity, opacitySpeed, options, size, speed]);

  return started ? <ParticlesProvider init={initializeEngine}>
    <div className={className} aria-hidden="true">
      <Particles id={id} options={particleOptions} particlesLoaded={handleLoaded} />
    </div>
  </ParticlesProvider> : null;
}

export default Sparkles;
