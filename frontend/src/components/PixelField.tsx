import { useEffect, useRef } from "react";

/**
 * Fundo ambiente: grade de quadradinhos cuja opacidade pulsa por uma soma de
 * senóides (campo de fluxo lento), tingida com o accent roxo. Puramente
 * decorativo — fica atrás do conteúdo e não captura ponteiro.
 *
 * Adaptado do mockup "pixelblast", sem os ripples de clique. Respeita
 * prefers-reduced-motion: pinta um único quadro estático e não anima.
 */
export function PixelField() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    // getContext pode não existir (ex.: jsdom nos testes); se falhar, não anima.
    let ctx: CanvasRenderingContext2D | null = null;
    try {
      ctx = cv.getContext("2d");
    } catch {
      return;
    }
    if (!ctx) return;

    const accent = [139, 92, 246];
    const cell = 16;
    const sq = cell * 0.78;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let w = 0;
    let h = 0;
    let raf = 0;

    const resize = () => {
      w = cv.clientWidth;
      h = cv.clientHeight;
      cv.width = w * dpr;
      cv.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const draw = (t: number) => {
      ctx.clearRect(0, 0, w, h);
      const cols = Math.ceil(w / cell);
      const rows = Math.ceil(h / cell);
      const [r, g, b] = accent;
      for (let gy = 0; gy < rows; gy++) {
        const py = gy * cell;
        for (let gx = 0; gx < cols; gx++) {
          const px = gx * cell;
          let v =
            Math.sin(px * 0.012 + t * 0.8) +
            Math.sin(py * 0.015 - t * 0.6) +
            Math.sin((px + py) * 0.008 + t * 0.5);
          v /= 3;
          let a = Math.pow((v + 1) / 2, 3) * 0.7;
          if (a <= 0.014) continue;
          if (a > 0.6) a = 0.6;
          ctx.fillStyle = `rgba(${r},${g},${b},${a.toFixed(3)})`;
          ctx.fillRect(px, py, sq, sq);
        }
      }
    };

    resize();
    window.addEventListener("resize", resize);

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      draw(2.0); // quadro estático, sem animar
    } else {
      const loop = () => {
        draw(performance.now() / 1000);
        raf = requestAnimationFrame(loop);
      };
      loop();
    }

    return () => {
      window.removeEventListener("resize", resize);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <canvas
      ref={ref}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10 h-full w-full opacity-60"
    />
  );
}
