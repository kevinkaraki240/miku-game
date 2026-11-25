const BARS = [
  { x: 14, h: 8 },
  { x: 20, h: 14 },
  { x: 26, h: 20 },
  { x: 32, h: 12 },
  { x: 38, h: 22 },
  { x: 44, h: 10 },
  { x: 50, h: 16 },
];

export function LogoMark({ className = 'h-8 w-auto' }) {
  return (
    <svg viewBox="-2 4 70 38" className={className} aria-hidden="true">
      <defs>
        <linearGradient id="miku-grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#39C5BB" />
          <stop offset="100%" stopColor="#FF6FB5" />
        </linearGradient>
      </defs>
      <path
        d="M14 6h36c6 0 10 4 12 12l3 14c1 5-2 8-6 8-3 0-5-2-7-5l-3-5H15l-3 5c-2 3-4 5-7 5-4 0-7-3-6-8l3-14C4 10 8 6 14 6z"
        fill="none"
        stroke="url(#miku-grad)"
        strokeWidth="3"
        strokeLinejoin="round"
      />
      {BARS.map((b, i) => (
        <rect
          key={b.x}
          className="wave-bar"
          style={{ animationDelay: `${i * 0.12}s` }}
          x={b.x - 1.5}
          y={18 - b.h / 2}
          width="3"
          height={b.h}
          rx="1.5"
          fill="url(#miku-grad)"
        />
      ))}
    </svg>
  );
}

export default function Logo({ name = 'Miku Game' }) {
  return (
    <span className="flex items-center gap-2.5">
      <LogoMark />
      <span className="text-xl font-extrabold tracking-tight text-glow">{name}</span>
    </span>
  );
}