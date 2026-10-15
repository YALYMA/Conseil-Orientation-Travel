/** Anneau de progression (accessible : valeur annoncée). */
export function ProgressRing({ value, size = 96, stroke = 10, label = "Progression globale", className }: { value: number; size?: number; stroke?: number; label?: string; className?: string }) {
  const v = Math.max(0, Math.min(100, Math.round(value)));
  const r = (size - stroke) / 2, c = 2 * Math.PI * r;
  return (
    <div role="progressbar" aria-label={label} aria-valuenow={v} aria-valuemin={0} aria-valuemax={100} className={`relative shrink-0 ${className ?? ""}`} style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90" aria-hidden>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#fff" strokeOpacity=".22" strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#F5B51B" strokeWidth={stroke} strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - v / 100)} className="transition-[stroke-dashoffset] duration-700" />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center font-display text-xl font-extrabold text-white">{v}<span className="text-xs">%</span></span>
    </div>
  );
}
