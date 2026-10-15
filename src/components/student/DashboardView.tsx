import Link from "next/link";
import { ButtonLink } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState, ErrorState } from "@/components/ui/EmptyState";
import { ProgressRing } from "@/components/ui/ProgressRing";
import { Icon, type IconName } from "@/components/visual/Icon";
import { Rings, DotGrid } from "@/components/visual/Decor";
import { cn } from "@/components/ui/cn";
import { ORDER_LABELS } from "@/lib/payments/labels";
import { formatFcfa } from "@/lib/payments/split";
import { nextStepHref, stepStates } from "@/lib/dashboard";
import type { OrderStatus } from "@/lib/payments/workflow";

export interface DashboardProps {
  firstName: string;
  failed?: boolean;
  order: { packName: string; status: OrderStatus; price: number; first: number; balance: number } | null;
  project: { country: string | null; level: string | null; domain: string | null; year: number | null } | null;
  progress: { percent: number; next?: string | null; steps: { key: string; label: string; done: boolean }[] } | null;
  notifications: { id: string; title: string; body: string | null; read: boolean }[];
}

const QUICK: { href: string; label: string; icon: IconName; tone: string }[] = [
  { href: "/app/documents", label: "Documents", icon: "folder", tone: "bg-brand-soft text-brand" },
  { href: "/app/candidatures", label: "Candidatures", icon: "send", tone: "bg-[#E7F7F0] text-[#0D7A50]" },
  { href: "/app/rendez-vous", label: "Rendez-vous", icon: "calendar", tone: "bg-[#FFF4D6] text-[#8A6100]" },
  { href: "/app/messages", label: "Messages", icon: "chat", tone: "bg-brand-soft text-navy" },
];

export function DashboardView({ firstName, failed, order, project, progress, notifications }: DashboardProps) {
  const steps = progress ? stepStates(progress.steps) : [];
  const current = steps.find((s) => s.state === "current");
  const pct = order ? Math.round((order.first / order.price) * 100) : 0;
  const projectLine = project ? [project.country ?? "Pays à définir", project.level, project.domain, project.year].filter(Boolean).join(" · ") : null;

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {failed && <ErrorState message="Impossible de charger vos informations. Réessayez dans un instant." />}

      <section className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-navy via-[#08457F] to-[#0A56CF] p-6 text-white shadow-[0_28px_50px_-26px_rgba(6,59,112,.8)] sm:p-8">
        <Rings className="absolute -right-16 -top-20 w-72 text-white/15" /><DotGrid className="absolute bottom-3 right-4 hidden text-white/20 sm:block" rows={4} cols={8} />
        <div className="relative flex flex-wrap items-center gap-5">
          {progress && <ProgressRing value={progress.percent} size={104} />}
          <div className="min-w-0 flex-1">
            <h1 className="font-display text-2xl font-extrabold leading-tight sm:text-3xl">Bonjour {firstName} <span aria-hidden>👋</span></h1>
            {projectLine
              ? <p className="mt-1 text-white/90">Votre projet : {projectLine}</p>
              : <p className="mt-1 text-white/90">Votre projet n&apos;est pas encore défini.</p>}
          </div>
        </div>
        {progress?.next && current && (
          <div className="relative mt-5 flex flex-col gap-3 rounded-2xl bg-white/12 p-4 ring-1 ring-white/20 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <span aria-hidden className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl bg-gold text-navy"><Icon name="sparkles" /></span>
              <div><p className="text-xs font-semibold uppercase tracking-wider text-gold">Prochaine étape</p><p className="font-semibold">{progress.next}</p></div>
            </div>
            <ButtonLink href={nextStepHref(current.key)} variant="cta" className="w-full shrink-0 sm:w-auto">Continuer<Icon name="arrow" className="size-4" /></ButtonLink>
          </div>
        )}
      </section>

      <nav aria-label="Accès rapides"><ul className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {QUICK.map((q) => (
          <li key={q.href}><Link href={q.href} className="group flex min-h-20 flex-col items-start gap-2.5 rounded-2xl bg-white p-4 sm:flex-row sm:items-center sm:gap-3 shadow-[0_1px_2px_rgba(6,59,112,.04),0_10px_24px_-16px_rgba(6,59,112,.25)] ring-1 ring-navy/5 transition-all hover:-translate-y-0.5 hover:shadow-lg">
            <span aria-hidden className={cn("flex size-11 shrink-0 items-center justify-center rounded-xl", q.tone)}><Icon name={q.icon} /></span>
            <span className="min-w-0 font-display text-[15px] font-bold leading-tight">{q.label}</span>
          </Link></li>
        ))}
      </ul></nav>

      <div className="grid gap-6 lg:grid-cols-[1.25fr_1fr]">
        <div className="space-y-6">
          {steps.length > 0 && (
            <Card>
              <h2 className="font-display text-lg font-bold">Mon parcours</h2>
              <ol className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-3">
                {steps.map((s) => (
                  <li key={s.key} className={cn("flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-semibold",
                    s.state === "done" && "bg-[#E7F7F0] text-[#0D7A50]", s.state === "current" && "bg-brand-soft text-brand ring-2 ring-brand", s.state === "todo" && "bg-surface text-navy/75")}>
                    <span aria-hidden className={cn("flex size-6 shrink-0 items-center justify-center rounded-full text-xs", s.state === "done" && "bg-[#0D7A50] text-white", s.state === "current" && "bg-brand text-white", s.state === "todo" && "border border-navy/25")}>
                      {s.state === "done" ? <Icon name="check" className="size-3.5" strokeWidth={3.2} /> : s.state === "current" ? <span className="size-2 rounded-full bg-white" /> : null}
                    </span>
                    <span>{s.label}<span className="sr-only"> : {s.state === "done" ? "terminé" : s.state === "current" ? "en cours" : "à faire"}</span></span>
                  </li>
                ))}
              </ol>
            </Card>
          )}

          <Card>
            <div className="flex items-center justify-between gap-2"><h2 className="font-display text-lg font-bold">Notifications</h2><Link href="/app/notifications" className="inline-flex min-h-11 items-center text-sm font-semibold text-brand">Tout voir</Link></div>
            {notifications.length === 0 ? <p className="mt-2 text-sm text-navy/75">Aucune notification pour le moment.</p> : (
              <ul className="mt-2 divide-y divide-navy/10">{notifications.map((n) => (
                <li key={n.id} className="flex items-start gap-3 py-3"><span aria-hidden className={cn("mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl", n.read ? "bg-surface text-navy/75" : "bg-brand-soft text-brand")}><Icon name="bell" className="size-[18px]" /></span>
                  <div className="min-w-0 text-sm"><p className={n.read ? "" : "font-bold"}>{n.title}{!n.read && <span className="sr-only"> (non lue)</span>}</p>{n.body && <p className="truncate text-navy/75">{n.body}</p>}</div>
                  {!n.read && <span aria-hidden className="ml-auto mt-2 size-2.5 shrink-0 rounded-full bg-brand" />}</li>
              ))}</ul>
            )}
          </Card>
        </div>

        <div className="space-y-6">
          {order ? (
            <Card className="relative overflow-hidden">
              <p className="text-sm font-semibold text-navy/75">Mon accompagnement</p>
              <h2 className="font-display text-xl font-extrabold">Pack {order.packName}</h2>
              <p className="mt-1 inline-flex rounded-full bg-brand-soft px-3 py-1 text-sm font-bold text-brand">{ORDER_LABELS[order.status].label}</p>
              <p className="mt-3 text-sm leading-relaxed text-navy/75">{ORDER_LABELS[order.status].next}</p>
              <div className="mt-4" role="img" aria-label={`Paiement : ${pct} % à la commande, ${100 - pct} % à la finalisation`}>
                <div className="flex h-2.5 overflow-hidden rounded-full bg-navy/10"><span className="h-full rounded-full bg-gold" style={{ width: `${pct}%` }} /></div>
                <div className="mt-2 flex justify-between text-xs"><span><strong className="block text-sm">{formatFcfa(order.first)}</strong>à la commande</span><span className="text-right"><strong className="block text-sm">{formatFcfa(order.balance)}</strong>à la finalisation</span></div>
              </div>
              <Link href="/app/paiements" className="mt-3 inline-flex min-h-11 items-center gap-2 font-semibold text-brand">Voir mes paiements<Icon name="arrow" className="size-4" /></Link>
            </Card>
          ) : !failed && (
            <EmptyState title="Vous n'avez pas encore de pack" text="Choisissez un pack pour démarrer votre accompagnement. Vous ne payez que 50 % pour commencer." action={<ButtonLink href="/app/commande" variant="cta">Choisir un pack</ButtonLink>} />
          )}
        </div>
      </div>
    </div>
  );
}
