import type { Metadata } from "next";
import { requireRole } from "@/lib/auth/session";
import { getPublicSettings } from "@/lib/data/student";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Field, Input, Textarea } from "@/components/ui/Field";
import { ErrorState } from "@/components/ui/EmptyState";
import { saveSettings } from "@/app/admin/actions";

export const metadata: Metadata = { title: "Réglages", robots: { index: false } };

export default async function SettingsPage({ searchParams }: { searchParams: Promise<{ ok?: string; erreur?: string }> }) {
  await requireRole(["admin"]);
  const { ok, erreur } = await searchParams;
  const s = await getPublicSettings();
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="font-display text-2xl font-extrabold">Réglages de paiement et de contact</h1>
      {ok && <p role="status" className="rounded-lg bg-[#dff5ea] p-3 text-sm font-medium text-[#0d7a50]">{ok.slice(0, 120)}</p>}
      {erreur && <ErrorState message={erreur.slice(0, 200)} />}
      <form action={saveSettings} className="space-y-6">
        <Card className="space-y-4">
          <h2 className="font-display text-lg font-bold">Wave</h2>
          <Field label="Nom du bénéficiaire" htmlFor="wave_name"><Input id="wave_name" name="wave_name" defaultValue={s.wave.display_name ?? ""} maxLength={80} /></Field>
          <Field label="Numéro Wave" htmlFor="wave_phone" hint="Affiché aux étudiants pour le paiement"><Input id="wave_phone" name="wave_phone" type="tel" defaultValue={s.wave.phone ?? ""} /></Field>
          <Field label="Lien de paiement officiel (facultatif)" htmlFor="wave_url" hint="Doit commencer par https://"><Input id="wave_url" name="wave_url" defaultValue={s.wave.payment_url ?? ""} /></Field>
          <Field label="Instructions" htmlFor="wave_instructions"><Textarea id="wave_instructions" name="wave_instructions" defaultValue={s.wave.instructions ?? ""} maxLength={400} /></Field>
        </Card>
        <Card className="space-y-4">
          <h2 className="font-display text-lg font-bold">WhatsApp</h2>
          <Field label="Numéro WhatsApp" htmlFor="wa_phone" hint="Reçoit les preuves de paiement"><Input id="wa_phone" name="wa_phone" type="tel" defaultValue={s.whatsapp.phone ?? ""} /></Field>
          <Field label="Lien WhatsApp Business (facultatif)" htmlFor="wa_url"><Input id="wa_url" name="wa_url" defaultValue={s.whatsapp.business_url ?? ""} /></Field>
        </Card>
        <Button type="submit">Enregistrer</Button>
      </form>
    </div>
  );
}
