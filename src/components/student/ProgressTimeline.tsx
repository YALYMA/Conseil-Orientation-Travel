import { Progress } from "@/components/ui/Progress";
import type { Overview } from "@/lib/data/overview";

export function ProgressTimeline({ progress }: { progress: Overview["progress"] }) {
  return (
    <div>
      <Progress value={progress.percent} label="Progression globale" />
      <ol className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
        {progress.steps.map((s) => (
          <li key={s.key} className="flex items-center gap-2">
            <span aria-hidden className={s.done ? "text-success" : "text-navy/40"}>{s.done ? "✓" : "○"}</span>
            <span className={s.done ? "font-medium" : "text-navy/70"}>{s.label}</span>
            <span className="sr-only">{s.done ? "terminé" : "à faire"}</span>
          </li>
        ))}
      </ol>
      {progress.next && <p className="mt-4 rounded-lg bg-brand-soft p-3 text-sm"><strong>Prochaine étape :</strong> {progress.next}</p>}
    </div>
  );
}
