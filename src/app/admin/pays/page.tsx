import type { Metadata } from "next";
import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Field, Input, Textarea } from "@/components/ui/Field";
import { ErrorState } from "@/components/ui/EmptyState";
import { Flash } from "@/components/staff/Flash";
import { linksToText } from "@/lib/admin/parse";
import { saveCountry, saveProcedure, deleteProcedure } from "@/app/admin/content-actions";

export const metadata: Metadata = { title: "Pays et procédures", robots: { index: false } };

interface Proc { id: string; title: string; body: string | null; required_documents: string[] | null; official_url: string | null; last_verified_at: string | null; sort_order: number }
interface Country { id: string; slug: string; name: string; flag: string | null; summary: string | null; description: string | null; institution_types: string[] | null; budget_info: string | null; visa_info: string | null; housing_info: string | null; official_links: { label: string; url: string }[] | null; is_published: boolean; sort_order: number; country_procedures: Proc[] }

function ProcForm({ countryId, p }: { countryId: string; p?: Proc }) {
  const k = p?.id ?? `new-${countryId}`;
  return (
    <form action={saveProcedure} className="space-y-3">
      <input type="hidden" name="country" value={countryId} />{p && <input type="hidden" name="id" value={p.id} />}
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Titre" htmlFor={`pt-${k}`}><Input id={`pt-${k}`} name="title" required maxLength={160} defaultValue={p?.title} /></Field>
        <Field label="Lien officiel (https://)" htmlFor={`pu-${k}`}><Input id={`pu-${k}`} name="url" maxLength={300} defaultValue={p?.official_url ?? ""} /></Field>
        <Field label="Dernière vérification" htmlFor={`pv-${k}`}><Input id={`pv-${k}`} name="verified" type="date" defaultValue={p?.last_verified_at ?? ""} /></Field>
        <Field label="Ordre" htmlFor={`ps-${k}`}><Input id={`ps-${k}`} name="sort" type="number" min={0} defaultValue={p?.sort_order ?? 0} /></Field>
      </div>
      <Field label="Contenu (d'après la source officielle)" htmlFor={`pb-${k}`}><Textarea id={`pb-${k}`} name="body" maxLength={6000} defaultValue={p?.body ?? ""} /></Field>
      <Field label="Documents requis (une ligne par document)" htmlFor={`pd-${k}`}><Textarea id={`pd-${k}`} name="docs" rows={3} defaultValue={(p?.required_documents ?? []).join("\n")} /></Field>
      <div className="flex gap-2"><Button type="submit">{p ? "Enregistrer la procédure" : "Ajouter la procédure"}</Button>
        {p && <Button type="submit" variant="outline" formAction={deleteProcedure} formNoValidate>Supprimer</Button>}</div>
    </form>
  );
}

function CountryForm({ c }: { c?: Country }) {
  const k = c?.id ?? "new";
  return (
    <form action={saveCountry} className="space-y-3">
      {c && <input type="hidden" name="id" value={c.id} />}
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Nom" htmlFor={`cn-${k}`}><Input id={`cn-${k}`} name="name" required maxLength={80} defaultValue={c?.name} /></Field>
        <Field label="Identifiant (URL)" htmlFor={`cs-${k}`}><Input id={`cs-${k}`} name="slug" required pattern="[a-z0-9-]{2,60}" defaultValue={c?.slug} /></Field>
        <Field label="Drapeau (emoji)" htmlFor={`cf-${k}`}><Input id={`cf-${k}`} name="flag" maxLength={8} defaultValue={c?.flag ?? ""} /></Field>
        <Field label="Ordre" htmlFor={`co-${k}`}><Input id={`co-${k}`} name="sort" type="number" min={0} defaultValue={c?.sort_order ?? 0} /></Field>
      </div>
      <Field label="Résumé" htmlFor={`cm-${k}`}><Input id={`cm-${k}`} name="summary" maxLength={300} defaultValue={c?.summary ?? ""} /></Field>
      <Field label="Présentation" htmlFor={`cd-${k}`}><Textarea id={`cd-${k}`} name="description" maxLength={4000} defaultValue={c?.description ?? ""} /></Field>
      <Field label="Types d'établissements (une ligne par type)" htmlFor={`ct-${k}`}><Textarea id={`ct-${k}`} name="types" rows={3} defaultValue={(c?.institution_types ?? []).join("\n")} /></Field>
      <Field label="Budget" htmlFor={`cb-${k}`}><Textarea id={`cb-${k}`} name="budget" maxLength={4000} defaultValue={c?.budget_info ?? ""} /></Field>
      <Field label="Visa" htmlFor={`cv-${k}`}><Textarea id={`cv-${k}`} name="visa" maxLength={4000} defaultValue={c?.visa_info ?? ""} /></Field>
      <Field label="Logement" htmlFor={`ch-${k}`}><Textarea id={`ch-${k}`} name="housing" maxLength={4000} defaultValue={c?.housing_info ?? ""} /></Field>
      <Field label="Liens officiels (« Libellé | https://… », une ligne par lien)" htmlFor={`cl-${k}`}><Textarea id={`cl-${k}`} name="links" rows={3} defaultValue={linksToText(c?.official_links ?? [])} /></Field>
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="published" defaultChecked={c?.is_published ?? true} className="size-4 accent-[#0b63f6]" />Publié sur le site</label>
      <Button type="submit">{c ? "Enregistrer le pays" : "Créer le pays"}</Button>
    </form>
  );
}

export default async function AdminCountries({ searchParams }: { searchParams: Promise<{ ok?: string; erreur?: string }> }) {
  await requireRole(["admin"]);
  const { ok, erreur } = await searchParams;
  const { data, error } = await (await createClient()).from("countries")
    .select("id, slug, name, flag, summary, description, institution_types, budget_info, visa_info, housing_info, official_links, is_published, sort_order, country_procedures(id, title, body, required_documents, official_url, last_verified_at, sort_order)").order("sort_order");
  const countries = (data ?? []) as unknown as Country[];
  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <h1 className="font-display text-2xl font-extrabold">Pays et procédures</h1>
      <p className="rounded-lg bg-[#fff4d6] p-3 text-sm">Ne saisissez que des informations tirées de sources officielles, avec leur lien et la date de vérification. Rien n&apos;est publié par défaut.</p>
      <Flash ok={ok} erreur={erreur} />
      {error && <ErrorState message="Impossible de charger les pays." />}
      {countries.map((c) => (
        <Card key={c.id}>
          <details>
            <summary className="cursor-pointer font-semibold">{c.flag} {c.name}{!c.is_published && <span className="ml-2 text-xs font-normal text-navy/75">(non publié)</span>} <span className="text-sm font-normal text-navy/75">· {c.country_procedures.length} procédure(s)</span></summary>
            <div className="mt-4 space-y-6">
              <CountryForm c={c} />
              <div className="border-t border-navy/10 pt-4"><h3 className="font-display font-bold">Procédures</h3>
                <div className="mt-3 space-y-4">
                  {[...c.country_procedures].sort((a, b) => a.sort_order - b.sort_order).map((p) => <div key={p.id} className="rounded-lg border border-navy/10 p-3"><ProcForm countryId={c.id} p={p} /></div>)}
                  <div className="rounded-lg border border-dashed border-navy/20 p-3"><p className="mb-2 text-sm font-semibold">Nouvelle procédure</p><ProcForm countryId={c.id} /></div>
                </div></div>
            </div>
          </details>
        </Card>
      ))}
      <Card><h2 className="font-display text-lg font-bold">Nouveau pays</h2><div className="mt-3"><CountryForm /></div></Card>
    </div>
  );
}
