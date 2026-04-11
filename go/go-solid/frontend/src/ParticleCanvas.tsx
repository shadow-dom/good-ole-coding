import { onMount, onCleanup, createEffect } from 'solid-js';
import { useTheme } from './theme';
import { PARTICLE_COUNT } from './App';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  baseSpeed: number;
  angle: number;
  orbitRadius: number;
  orbitSpeed: number;
  life: number;
  maxLife: number;
  opacity: number;
}

interface Props {
  intensity: () => number;
}

export default function ParticleCanvas(props: Props) {
  let canvas!: HTMLCanvasElement;
  let ctx: CanvasRenderingContext2D;
  let particles: Particle[] = [];
  let animId: number;
  let mouseX = -1000;
  let mouseY = -1000;

  const { theme } = useTheme();

  function createParticle(w: number, h: number, colors: string[]): Particle {
    const angle = Math.random() * Math.PI * 2;
    const baseSpeed = 0.2 + Math.random() * 0.8;
    return {
      x: Math.random() * w,
      y: Math.random() * h,
      vx: Math.cos(angle) * baseSpeed,
      vy: Math.sin(angle) * baseSpeed,
      radius: 1 + Math.random() * 3,
      color: colors[Math.floor(Math.random() * colors.length)],
      baseSpeed,
      angle,
      orbitRadius: 20 + Math.random() * 60,
      orbitSpeed: 0.005 + Math.random() * 0.02,
      life: 0,
      maxLife: 300 + Math.random() * 500,
      opacity: 0,
    };
  }

  function resize() {
    const dpr = window.devicePixelRatio || 1;
    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;
    canvas.style.width = window.innerWidth + 'px';
    canvas.style.height = window.innerHeight + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function draw() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    const t = theme();
    const inten = props.intensity();

    // Speed multiplier: base 1x, up to 6x at full intensity
    const speedMult = 1 + inten * 5;

    ctx.fillStyle = t.bg;
    ctx.fillRect(0, 0, w, h);

    // Maintain particle count
    while (particles.length < PARTICLE_COUNT) {
      particles.push(createParticle(w, h, t.particleColors));
    }

    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.life++;

      // Fade in/out
      if (p.life < 30) {
        p.opacity = p.life / 30;
      } else if (p.life > p.maxLife - 60) {
        p.opacity = Math.max(0, (p.maxLife - p.life) / 60);
      } else {
        p.opacity = 1;
      }

      if (p.life >= p.maxLife) {
        particles[i] = createParticle(w, h, t.particleColors);
        continue;
      }

      // Orbital drift
      p.angle += p.orbitSpeed * speedMult;
      const driftX = Math.cos(p.angle) * 0.3 * speedMult;
      const driftY = Math.sin(p.angle) * 0.3 * speedMult;

      // Mouse repulsion
      const dx = p.x - mouseX;
      const dy = p.y - mouseY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      let repelX = 0, repelY = 0;
      if (dist < 150 && dist > 0) {
        const force = (150 - dist) / 150 * 2;
        repelX = (dx / dist) * force;
        repelY = (dy / dist) * force;
      }

      p.x += (p.vx * speedMult + driftX + repelX);
      p.y += (p.vy * speedMult + driftY + repelY);

      // Wrap
      if (p.x < -10) p.x = w + 10;
      if (p.x > w + 10) p.x = -10;
      if (p.y < -10) p.y = h + 10;
      if (p.y > h + 10) p.y = -10;

      // Draw glow at high intensity
      if (inten > 0.3) {
        const glowSize = p.radius * (2 + inten * 4);
        const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, glowSize);
        gradient.addColorStop(0, p.color + hexAlpha(p.opacity * inten * 0.5));
        gradient.addColorStop(1, p.color + '00');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(p.x, p.y, glowSize, 0, Math.PI * 2);
        ctx.fill();
      }

      // Draw particle
      ctx.globalAlpha = p.opacity;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius + inten * 1.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }

    // Draw connections between nearby particles
    const connectDist = 100 + inten * 60;
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const a = particles[i], b = particles[j];
        const dx = a.x - b.x, dy = a.y - b.y;
        const d = dx * dx + dy * dy;
        if (d < connectDist * connectDist) {
          const alpha = (1 - Math.sqrt(d) / connectDist) * 0.15 * Math.min(a.opacity, b.opacity);
          ctx.strokeStyle = t.accent + hexAlpha(alpha);
          ctx.lineWidth = 0.5 + inten;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }
    }

    animId = requestAnimationFrame(draw);
  }

  function hexAlpha(a: number): string {
    return Math.round(Math.max(0, Math.min(1, a)) * 255).toString(16).padStart(2, '0');
  }

  function onMouseMove(e: MouseEvent) {
    mouseX = e.clientX;
    mouseY = e.clientY;
  }

  // Re-colorize particles when theme changes
  createEffect(() => {
    const colors = theme().particleColors;
    for (const p of particles) {
      p.color = colors[Math.floor(Math.random() * colors.length)];
    }
  });

  onMount(() => {
    ctx = canvas.getContext('2d')!;
    resize();
    window.addEventListener('resize', resize);
    window.addEventListener('mousemove', onMouseMove);
    animId = requestAnimationFrame(draw);
  });

  onCleanup(() => {
    cancelAnimationFrame(animId);
    window.removeEventListener('resize', resize);
    window.removeEventListener('mousemove', onMouseMove);
  });

  return (
    <canvas
      ref={canvas}
      class="fixed inset-0 z-0"
      style={{ "pointer-events": "none" }}
    />
  );
}
