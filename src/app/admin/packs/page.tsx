import type { Metadata } from "next";
import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Field, Input, Textarea } from "@/components/ui/Field";
import { ErrorState } from "@/components/ui/EmptyState";
import { Flash } from "@/components/staff/Flash";
import { formatFcfa, splitPayment } from "@/lib/payments/split";
import { featuresToText } from "@/lib/admin/parse";
import { savePack } from "@/app/admin/content-actions";

export const metadata: Metadata = { title: "Packs", robots: { index: false } };

interface Pack { id: string; slug: string; name: string; tagline: string | null; description: string | null; price_total: number; badge: string | null; indicative_duration: string | null; included_applications: number | null; deliverables: string[] | null; excluded_services: string[]; is_active: boolean; sort_order: number; pack_features: { category: string; label: string; sort_order: number }[] }

function PackForm({ p }: { p?: Pack }) {
  const k = p?.id ?? "new";
  return (
    <form action={savePack} className="space-y-3">
      {p && <input type="hidden" name="id" value={p.id} />}
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Nom" htmlFor={`n-${k}`}><Input id={`n-${k}`} name="name" required maxLength={80} defaultValue={p?.name} /></Field>
        <Field label="Identifiant (URL)" htmlFor={`s-${k}`} hint="minuscules, chiffres, tirets"><Input id={`s-${k}`} name="slug" required pattern="[a-z0-9-]{2,60}" defaultValue={p?.slug} /></Field>
        <Field label="Prix total (FCFA)" htmlFor={`p-${k}`} hint="Le 50/50 est calculé automatiquement"><Input id={`p-${k}`} name="price" type="number" min={1} max={10000000} step={1} required defaultValue={p?.price_total} /></Field>
        <Field label="Badge (facultatif)" htmlFor={`b-${k}`}><Input id={`b-${k}`} name="badge" maxLength={40} defaultValue={p?.badge ?? ""} /></Field>
        <Field label="Durée indicative" htmlFor={`d-${k}`}><Input id={`d-${k}`} name="duration" maxLength={60} defaultValue={p?.indicative_duration ?? ""} /></Field>
        <Field label="Candidatures incluses (facultatif)" htmlFor={`a-${k}`}><Input id={`a-${k}`} name="apps" inputMode="numeric" pattern="\d{0,3}" defaultValue={p?.included_applications ?? ""} /></Field>
        <Field label="Accroche" htmlFor={`t-${k}`}><Input id={`t-${k}`} name="tagline" maxLength={160} defaultValue={p?.tagline ?? ""} /></Field>
        <Field label="Ordre d'affichage" htmlFor={`o-${k}`}><Input id={`o-${k}`} name="sort" type="number" min={0} defaultValue={p?.sort_order ?? 0} /></Field>
      </div>
      <Field label="Description" htmlFor={`de-${k}`}><Textarea id={`de-${k}`} name="description" maxLength={1000} defaultValue={p?.description ?? ""} /></Field>
      <Field label="Services inclus (une ligne par service, « Catégorie | libellé »)" htmlFor={`f-${k}`}><Textarea id={`f-${k}`} name="features" rows={6} defaultValue={featuresToText([...(p?.pack_features ?? [])].sort((a, b) => a.sort_order - b.sort_order))} /></Field>
      <Field label="Services non inclus (une ligne par élément)" htmlFor={`e-${k}`}><Textarea id={`e-${k}`} name="excluded" rows={5} defaultValue={(p?.excluded_services ?? []).join("\n")} /></Field>
      <Field label="Livrables (une ligne par élément)" htmlFor={`l-${k}`}><Textarea id={`l-${k}`} name="deliverables" rows={3} defaultValue={(p?.deliverables ?? []).join("\n")} /></Field>
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="active" defaultChecked={p?.is_active ?? true} className="size-4 accent-[#0b63f6]" />Pack actif (visible et commandable)</label>
      <Button type="submit">{p ? "Enregistrer" : "Créer le pack"}</Button>
    </form>
  );
}

export default async function AdminPacks({ searchParams }: { searchParams: Promise<{ ok?: string; erreur?: string }> }) {
  await requireRole(["admin"]);
  const { ok, erreur } = await searchParams;
  const { data, error } = await (await createClient()).from("service_packs").select("id, slug, name, tagline, description, price_total, badge, indicative_duration, included_applications, deliverables, excluded_services, is_active, sort_order, pack_features(category, label, sort_order)").order("sort_order");
  const packs = (data ?? []) as unknown as Pack[];
  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <h1 className="font-display text-2xl font-extrabold">Packs</h1>
      <p className="text-sm text-navy/75">Modifier un prix ne change jamais les commandes déjà passées : leurs montants sont figés. Chaque changement de prix est journalisé.</p>
      <Flash ok={ok} erreur={erreur} />
      {error && <ErrorState message="Impossible de charger les packs." />}
      {packs.map((p) => {
        const s = splitPayment(p.price_total);
        return (
          <Card key={p.id}>
            <details>
              <summary className="flex cursor-pointer flex-wrap items-center justify-between gap-2 font-semibold">
                <span>{p.name}{!p.is_active && <span className="ml-2 text-xs font-normal text-navy/75">(inactif)</span>}</span>
                <span className="text-sm font-normal text-navy/75">{formatFcfa(p.price_total)} = {formatFcfa(s.first)} + {formatFcfa(s.balance)}</span>
              </summary>
              <div className="mt-4"><PackForm p={p} /></div>
            </details>
          </Card>
        );
      })}
      <Card><h2 className="font-display text-lg font-bold">Nouveau pack</h2><div className="mt-3"><PackForm /></div></Card>
    </div>
  );
}
