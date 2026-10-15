import { cn } from "./cn";
type Tone = "blue" | "gold" | "green" | "red" | "gray";
const tones: Record<Tone, string> = {
  blue: "bg-brand-soft text-brand",
  gold: "bg-[#fff4d6] text-[#8a6100]",
  green: "bg-[#dff5ea] text-[#0d7a50]",
  red: "bg-[#fde8e8] text-[#a82b2b]",
  gray: "bg-navy/5 text-navy/75",
};
export function Badge({ tone = "blue", className, ...p }: { tone?: Tone } & React.HTMLAttributes<HTMLSpanElement>) {
  return <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold", tones[tone], className)} {...p} />;
}

/** Statut visuel unique pour documents, paiements, candidatures (texte + icône : jamais la couleur seule). */
const STATUS: Record<string, { label: string; tone: Tone; icon: string }> = {
  requested: { label: "Demandé", tone: "gray", icon: "○" },
  uploaded: { label: "Téléversé", tone: "blue", icon: "↑" },
  in_review: { label: "En vérification", tone: "gold", icon: "⏳" },
  validated: { label: "Validé", tone: "green", icon: "✓" },
  to_fix: { label: "À corriger", tone: "gold", icon: "⚠" },
  rejected: { label: "Rejeté", tone: "red", icon: "✕" },
  pending: { label: "En attente", tone: "gray", icon: "○" },
  under_review: { label: "En vérification", tone: "gold", icon: "⏳" },
  confirmed: { label: "Validé", tone: "green", icon: "✓" },
  paid: { label: "Payé", tone: "green", icon: "✓" },
  upcoming: { label: "À venir", tone: "gray", icon: "⏳" },
};
export function StatusBadge({ status }: { status: string }) {
  const s = STATUS[status] ?? { label: status, tone: "gray" as Tone, icon: "•" };
  return (
    <Badge tone={s.tone}>
      <span aria-hidden className="mr-1">{s.icon}</span>
      {s.label}
    </Badge>
  );
}
