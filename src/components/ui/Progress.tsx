export function Progress({ value, label }: { value: number; label: string }) {
  const v = Math.max(0, Math.min(100, Math.round(value)));
  return (
    <div>
      <div className="mb-1 flex justify-between text-sm"><span>{label}</span><span className="font-semibold">{v} %</span></div>
      <div role="progressbar" aria-label={label} aria-valuenow={v} aria-valuemin={0} aria-valuemax={100} className="h-2.5 overflow-hidden rounded-full bg-brand-soft">
        <div className="h-full rounded-full bg-brand" style={{ width: `${v}%` }} />
      </div>
    </div>
  );
}
