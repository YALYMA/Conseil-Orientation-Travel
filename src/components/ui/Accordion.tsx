export function Accordion({ items }: { items: { q: string; a: string }[] }) {
  return (
    <div className="divide-y divide-navy/10 rounded-xl border border-navy/10 bg-white">
      {items.map((i) => (
        <details key={i.q} className="group p-4">
          <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-4 font-semibold">
            {i.q}<span aria-hidden className="text-brand transition-transform group-open:rotate-45">+</span>
          </summary>
          <p className="mt-2 text-sm leading-relaxed text-navy/80">{i.a}</p>
        </details>
      ))}
    </div>
  );
}
