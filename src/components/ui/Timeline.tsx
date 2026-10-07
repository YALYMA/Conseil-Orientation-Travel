import { cn } from "./cn";
export interface Step { title: string; text?: string; done?: boolean }
export function Timeline({ steps }: { steps: Step[] }) {
  return (
    <ol className="space-y-6">
      {steps.map((s, i) => (
        <li key={s.title} className="flex gap-4">
          <span className={cn("flex size-9 shrink-0 items-center justify-center rounded-full text-sm font-bold", s.done ? "bg-success text-white" : "bg-brand text-white")}>{s.done ? "✓" : i + 1}</span>
          <div><p className="font-semibold">{s.title}</p>{s.text && <p className="text-sm text-navy/70">{s.text}</p>}</div>
        </li>
      ))}
    </ol>
  );
}
