import type { Metadata } from "next";
import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Field, Input, Textarea } from "@/components/ui/Field";
import { ErrorState } from "@/components/ui/EmptyState";
import { Flash } from "@/components/staff/Flash";
import { saveFaq, deleteFaq } from "@/app/admin/content-actions";

export const metadata: Metadata = { title: "FAQ", robots: { index: false } };
interface Faq { id: string; question: string; answer: string; sort_order: number; is_published: boolean }

function FaqForm({ f }: { f?: Faq }) {
  const k = f?.id ?? "new";
  return (
    <form action={saveFaq} className="space-y-3">
      {f && <input type="hidden" name="id" value={f.id} />}
      <Field label="Question" htmlFor={`q-${k}`}><Input id={`q-${k}`} name="question" required maxLength={300} defaultValue={f?.question} /></Field>
      <Field label="Réponse" htmlFor={`a-${k}`}><Textarea id={`a-${k}`} name="answer" required maxLength={3000} defaultValue={f?.answer} /></Field>
      <div className="flex flex-wrap items-end gap-4">
        <Field label="Ordre" htmlFor={`o-${k}`}><Input id={`o-${k}`} name="sort" type="number" min={0} defaultValue={f?.sort_order ?? 0} className="w-24" /></Field>
        <label className="flex min-h-11 items-center gap-2 text-sm"><input type="checkbox" name="published" defaultChecked={f?.is_published ?? true} className="size-4 accent-[#0b63f6]" />Publiée</label>
        <Button type="submit">{f ? "Enregistrer" : "Ajouter"}</Button>
        {f && <Button type="submit" variant="outline" formAction={deleteFaq} formNoValidate>Supprimer</Button>}
      </div>
    </form>
  );
}

export default async function AdminFaq({ searchParams }: { searchParams: Promise<{ ok?: string; erreur?: string }> }) {
  await requireRole(["admin"]);
  const { ok, erreur } = await searchParams;
  const { data, error } = await (await createClient()).from("faqs").select("id, question, answer, sort_order, is_published").order("sort_order");
  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <h1 className="font-display text-2xl font-extrabold">FAQ</h1>
      <Flash ok={ok} erreur={erreur} />
      {error && <ErrorState message="Impossible de charger la FAQ." />}
      {((data ?? []) as Faq[]).map((f) => <Card key={f.id}><details><summary className="cursor-pointer font-semibold">{f.question}{!f.is_published && <span className="ml-2 text-xs font-normal text-navy/60">(masquée)</span>}</summary><div className="mt-4"><FaqForm f={f} /></div></details></Card>)}
      <Card><h2 className="font-display text-lg font-bold">Nouvelle question</h2><div className="mt-3"><FaqForm /></div></Card>
    </div>
  );
}
