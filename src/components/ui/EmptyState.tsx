export function EmptyState({ title, text, action }: { title: string; text: string; action?: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-dashed border-navy/20 bg-white p-8 text-center">
      <p className="font-semibold">{title}</p>
      <p className="mx-auto mt-1 max-w-md text-sm text-navy/70">{text}</p>
      {action && <div className="mt-4 flex justify-center">{action}</div>}
    </div>
  );
}
export function ErrorState({ message }: { message: string }) {
  return <div role="alert" className="rounded-xl border border-danger/30 bg-[#fde8e8] p-4 text-sm text-[#a82b2b]">{message}</div>;
}
export function LoadingSkeleton({ lines = 3 }: { lines?: number }) {
  return (
    <div aria-busy="true" aria-live="polite" className="space-y-3">
      {Array.from({ length: lines }).map((_, i) => <div key={i} className="h-4 animate-pulse rounded bg-navy/10" style={{ width: `${90 - i * 12}%` }} />)}
      <span className="sr-only">Chargement…</span>
    </div>
  );
}
