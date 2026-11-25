const STYLE = {
  STEAM: { label: 'Steam', cls: 'bg-sky-500/20 text-sky-300 border-sky-400/40' },
  PS4: { label: 'PS4', cls: 'bg-indigo-500/20 text-indigo-300 border-indigo-400/40' },
  PS5: { label: 'PS5', cls: 'bg-violet-500/20 text-violet-300 border-violet-400/40' },
};

export default function PlatformBadge({ platform }) {
  const s = STYLE[platform] ?? { label: platform, cls: 'bg-panel text-muted border-line' };
  return (
    <span className={`rounded-md border px-1.5 py-0.5 text-[11px] font-bold leading-none ${s.cls}`}>
      {s.label}
    </span>
  );
}