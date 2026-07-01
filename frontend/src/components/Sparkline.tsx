interface Props {
  /** Saldo após cada transação, cronológico (mais antigo → mais novo). */
  series: number[];
}

/**
 * Trajetória real do saldo da conta a partir dos balance_after do backend.
 * Linha + preenchimento gradiente roxo. Sem dados suficientes (0–1 pontos),
 * não desenha — o card mostra só o saldo.
 */
export function Sparkline({ series }: Props) {
  if (series.length < 2) return null;

  const w = 600;
  const h = 132;
  const pad = 6;
  const min = Math.min(...series);
  const max = Math.max(...series);
  const span = max - min || 1;

  const points = series.map((v, i) => {
    const x = (i / (series.length - 1)) * w;
    const y = pad + (1 - (v - min) / span) * (h - pad * 2);
    return [x, y] as const;
  });

  const line = points.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const area = `${line} L${w},${h} L0,${h} Z`;
  const last = points[points.length - 1];

  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      preserveAspectRatio="none"
      aria-hidden="true"
      className="mt-3 block h-[132px] w-full overflow-visible"
    >
      <defs>
        <linearGradient id="spark" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#8b5cf6" stopOpacity="0.4" />
          <stop offset="1" stopColor="#8b5cf6" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill="url(#spark)" />
      <path
        d={line}
        fill="none"
        stroke="#8b5cf6"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx={last[0]} cy={last[1]} r="4.5" fill="#8b5cf6" stroke="#14141d" strokeWidth="2.5" />
    </svg>
  );
}
