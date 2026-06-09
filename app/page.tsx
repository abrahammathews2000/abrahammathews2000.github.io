"use client";

import { useEffect, useRef, useState } from "react";

type Ember = {
  id: number;
  left: string;
  top: string;
  size: string;
  duration: string;
  delay: string;
  drift: string;
  opacity: number;
};

const embers: Ember[] = Array.from({ length: 18 }, (_, index) => ({
  id: index,
  left: `${(index * 11 + 8) % 100}%`,
  top: `${72 + (index % 5) * 4}%`,
  size: `${0.18 + (index % 4) * 0.08}rem`,
  duration: `${10 + (index % 6) * 2}s`,
  delay: `${-(index % 9) * 1.1}s`,
  drift: `${(index % 2 === 0 ? 1 : -1) * (8 + (index % 5) * 4)}px`,
  opacity: 0.35 + (index % 4) * 0.08,
}));

const runes = [
  { left: "12%", top: "16%", size: "5rem", delay: "0s" },
  { left: "78%", top: "22%", size: "4rem", delay: "1.8s" },
  { left: "84%", top: "72%", size: "6rem", delay: "4.2s" },
];

function useReveal<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.22, rootMargin: "10% 0px -8% 0px" },
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return { ref, visible };
}

function DragonCursor() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const finePointer = window.matchMedia("(pointer: fine)").matches;

    if (!finePointer || prefersReducedMotion) {
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext("2d");
    if (!context) return;

    let animationFrame = 0;
    let width = 0;
    let height = 0;
    let targetX = window.innerWidth / 2;
    let targetY = window.innerHeight / 2;
    let dragonX = targetX;
    let dragonY = targetY;
    let lastAngle = 0;
    let fireUntil = 0;
    let pressed = false;
    const particles: Array<{
      x: number;
      y: number;
      vx: number;
      vy: number;
      life: number;
      ttl: number;
      size: number;
      hue: number;
    }> = [];

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const emitFire = (x: number, y: number, angle: number) => {
      const baseX = x + Math.cos(angle) * 18;
      const baseY = y + Math.sin(angle) * 18;

      for (let index = 0; index < 4; index += 1) {
        const spread = (Math.random() - 0.5) * 0.72;
        const speed = 4.5 + Math.random() * 4.5;
        particles.push({
          x: baseX,
          y: baseY,
          vx: Math.cos(angle + spread) * speed + (Math.random() - 0.5) * 1.2,
          vy: Math.sin(angle + spread) * speed + (Math.random() - 0.5) * 1.2,
          life: 0,
          ttl: 28 + Math.random() * 22,
          size: 2 + Math.random() * 4,
          hue: 18 + Math.random() * 22,
        });
      }
    };

    const drawDragon = (x: number, y: number, angle: number, now: number) => {
      context.save();
      context.translate(x, y);
      context.rotate(angle);
      context.translate(-x, -y);

      const bodyGradient = context.createRadialGradient(
        x - 4,
        y - 3,
        2,
        x,
        y,
        24,
      );
      bodyGradient.addColorStop(0, "rgba(245, 214, 162, 0.95)");
      bodyGradient.addColorStop(0.25, "rgba(180, 116, 54, 0.95)");
      bodyGradient.addColorStop(1, "rgba(55, 27, 17, 0.95)");

      // Wing silhouette
      context.fillStyle = "rgba(57, 25, 16, 0.92)";
      context.beginPath();
      context.moveTo(x - 13, y - 2);
      context.quadraticCurveTo(x - 6, y - 14, x + 1, y - 10);
      context.quadraticCurveTo(x - 2, y - 2, x - 13, y - 2);
      context.closePath();
      context.fill();

      // Tail and body
      context.strokeStyle = bodyGradient;
      context.lineWidth = 7;
      context.lineCap = "round";
      context.beginPath();
      context.moveTo(x - 8, y + 4);
      context.quadraticCurveTo(x - 17, y + 7, x - 19, y + 13);
      context.stroke();

      context.fillStyle = bodyGradient;
      context.beginPath();
      context.ellipse(x, y, 10, 7, 0, 0, Math.PI * 2);
      context.fill();

      // Head and jaw
      context.beginPath();
      context.moveTo(x + 7, y - 2);
      context.lineTo(x + 19, y - 6);
      context.lineTo(x + 18, y + 2);
      context.lineTo(x + 7, y + 4);
      context.closePath();
      context.fill();

      // Horns
      context.strokeStyle = "rgba(241, 202, 141, 0.92)";
      context.lineWidth = 1.5;
      context.beginPath();
      context.moveTo(x + 12, y - 5);
      context.lineTo(x + 16, y - 10);
      context.moveTo(x + 14, y - 4);
      context.lineTo(x + 19, y - 8);
      context.stroke();

      // Eye
      context.fillStyle = "rgba(255, 235, 190, 0.95)";
      context.beginPath();
      context.arc(x + 13, y - 1, 0.9, 0, Math.PI * 2);
      context.fill();

      if (now < fireUntil || pressed) {
        context.save();
        context.globalCompositeOperation = "lighter";
        const flameLength = 14;
        const flameGradient = context.createLinearGradient(
          x + 16,
          y - 1,
          x + 16 + Math.cos(angle) * flameLength,
          y - 1 + Math.sin(angle) * flameLength,
        );
        flameGradient.addColorStop(0, "rgba(255, 244, 190, 0.95)");
        flameGradient.addColorStop(0.4, "rgba(255, 153, 61, 0.88)");
        flameGradient.addColorStop(1, "rgba(175, 25, 15, 0)");
        context.strokeStyle = flameGradient;
        context.lineWidth = 6;
        context.beginPath();
        context.moveTo(x + 16, y - 1);
        context.lineTo(
          x + 16 + Math.cos(angle) * flameLength,
          y - 1 + Math.sin(angle) * flameLength,
        );
        context.stroke();
        context.restore();
      }

      context.restore();
    };

    const tick = () => {
      context.clearRect(0, 0, width, height);

      dragonX += (targetX - dragonX) * 0.18;
      dragonY += (targetY - dragonY) * 0.18;
      lastAngle = Math.atan2(targetY - dragonY, targetX - dragonX);

      const now = performance.now();

      if (now < fireUntil || pressed) {
        emitFire(dragonX, dragonY, lastAngle);
      }

      if (particles.length > 96) {
        particles.splice(0, particles.length - 96);
      }

      for (let index = particles.length - 1; index >= 0; index -= 1) {
        const particle = particles[index];
        particle.life += 1;
        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.vx *= 0.968;
        particle.vy *= 0.968;

        const progress = particle.life / particle.ttl;
        const alpha = Math.max(0, 1 - progress);
        const radius = particle.size * (0.8 + progress * 1.8);

        const gradient = context.createRadialGradient(
          particle.x,
          particle.y,
          0,
          particle.x,
          particle.y,
          radius * 2.4,
        );
        gradient.addColorStop(0, `hsla(${particle.hue}, 100%, 88%, ${alpha})`);
        gradient.addColorStop(
          0.35,
          `hsla(${particle.hue - 2}, 100%, 60%, ${alpha * 0.85})`,
        );
        gradient.addColorStop(1, `hsla(${particle.hue - 10}, 100%, 35%, 0)`);

        context.fillStyle = gradient;
        context.beginPath();
        context.arc(particle.x, particle.y, radius, 0, Math.PI * 2);
        context.fill();

        if (particle.life >= particle.ttl) {
          particles.splice(index, 1);
        }
      }

      drawDragon(dragonX, dragonY, lastAngle, now);
      animationFrame = window.requestAnimationFrame(tick);
    };

    const onPointerMove = (event: PointerEvent) => {
      targetX = event.clientX;
      targetY = event.clientY;
    };

    const onPointerDown = (event: PointerEvent) => {
      pressed = true;
      fireUntil = performance.now() + 260;
      targetX = event.clientX;
      targetY = event.clientY;
    };

    const onPointerUp = () => {
      pressed = false;
    };

    resize();
    window.addEventListener("resize", resize);
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("pointerup", onPointerUp);
    window.addEventListener("pointercancel", onPointerUp);
    animationFrame = window.requestAnimationFrame(tick);

    return () => {
      window.cancelAnimationFrame(animationFrame);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointercancel", onPointerUp);
    };
  }, []);

  return <canvas aria-hidden="true" className="dragon-cursor" ref={canvasRef} />;
}

function RevealSection({
  children,
  className = "",
}: Readonly<{
  children: React.ReactNode;
  className?: string;
}>) {
  const { ref, visible } = useReveal<HTMLElement>();

  return (
    <section
      ref={ref}
      className={`reveal-panel ${visible ? "is-visible" : ""} ${className}`}
    >
      {children}
    </section>
  );
}

function SparkIcon({ className = "" }: Readonly<{ className?: string }>) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 2 14.8 8.2 22 12l-7.2 3.8L12 22l-2.8-6.2L2 12l7.2-3.8L12 2Z" />
    </svg>
  );
}

export default function Page() {
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const updatePointer = (event: PointerEvent) => {
      root.style.setProperty("--mx", `${event.clientX}px`);
      root.style.setProperty("--my", `${event.clientY}px`);
    };

    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 3;
    root.style.setProperty("--mx", `${centerX}px`);
    root.style.setProperty("--my", `${centerY}px`);

    window.addEventListener("pointermove", updatePointer, { passive: true });
    return () => window.removeEventListener("pointermove", updatePointer);
  }, []);

  return (
    <div className="realm" ref={rootRef}>
      <div className="realm__glow realm__glow--one" aria-hidden="true" />
      <div className="realm__glow realm__glow--two" aria-hidden="true" />
      <div className="realm__fog" aria-hidden="true" />

      <div className="ember-layer" aria-hidden="true">
        {embers.map((ember) => (
          <span
            key={ember.id}
            className="ember"
            style={
              {
                left: ember.left,
                top: ember.top,
                width: ember.size,
                height: ember.size,
                animationDuration: ember.duration,
                animationDelay: ember.delay,
                "--drift": ember.drift,
                opacity: ember.opacity,
              } as React.CSSProperties
            }
          />
        ))}

        {runes.map((rune, index) => (
          <span
            key={index}
            className="rune"
            style={
              {
                left: rune.left,
                top: rune.top,
                width: rune.size,
                height: rune.size,
                animationDelay: rune.delay,
              } as React.CSSProperties
            }
          >
            <SparkIcon className="rune__icon" />
          </span>
        ))}
      </div>

      <DragonCursor />

      <main className="site-shell">
        <section className="hero-panel reveal-panel is-visible">
          <div className="hero-panel__sigil" aria-hidden="true">
            <div className="sigil-orb" />
            <SparkIcon className="sigil-flare" />
          </div>

          <p className="hero-panel__name">Abraham Mathews</p>
        </section>

        <div className="grid-layout">
          <RevealSection className="quest-card quest-card--building">
            <div className="section-heading">
              <SparkIcon className="section-heading__icon" />
              <h2>Building</h2>
            </div>

            <div className="quest-entry">
              <span className="quest-entry__marker" aria-hidden="true" />
              <div>
                <p className="quest-entry__title">Drakoon — Dragon Simulator</p>
              </div>
            </div>
          </RevealSection>

          <RevealSection className="quest-card quest-card--aim">
            <div className="section-heading">
              <SparkIcon className="section-heading__icon" />
              <h2>Aim</h2>
            </div>

            <ol className="oath-list">
              <li>
                To become a better software developer by learning from LLMs and
                great human programmers through studying open-source codebases.
              </li>
              <li>To stay curious.</li>
              <li>To contribute something good to at least some people.</li>
            </ol>
          </RevealSection>

          <RevealSection className="quest-card quest-card--links">
            <div className="section-heading">
              <SparkIcon className="section-heading__icon" />
              <h2>Links</h2>
            </div>

            <div className="links-grid">
              <a
                className="link-card"
                href="https://www.linkedin.com/in/abraham2000/"
                target="_blank"
                rel="noreferrer"
              >
                <span className="link-card__label">LinkedIn</span>
                <span className="link-card__url">
                  https://www.linkedin.com/in/abraham2000/
                </span>
              </a>

              <a
                className="link-card"
                href="https://github.com/abrahammathews2000"
                target="_blank"
                rel="noreferrer"
              >
                <span className="link-card__label">GitHub</span>
                <span className="link-card__url">
                  https://github.com/abrahammathews2000
                </span>
              </a>
            </div>
          </RevealSection>
        </div>
      </main>
    </div>
  );
}
