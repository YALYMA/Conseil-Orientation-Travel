import type { Metadata } from "next";
import Link from "next/link";
import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Field";
import { ErrorState } from "@/components/ui/EmptyState";
import { Flash } from "@/components/staff/Flash";
import { Icon } from "@/components/visual/Icon";
import { updateProfile } from "@/app/app/actions";

export const metadata: Metadata = { title: "Mon profil", robots: { index: false } };

const initials = (n: string) => n.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]!.toUpperCase()).join("") || "?";

export default async function ProfilePage({ searchParams }: { searchParams: Promise<{ ok?: string; erreur?: string }> }) {
  const me = await requireRole(["student"]);
  const { ok, erreur } = await searchParams;
  const { data, error } = await (await createClient()).from("profiles").select("full_name, phone, created_at").eq("id", me.id).maybeSingle();
  const name = data?.full_name ?? me.fullName ?? "";

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="font-display text-2xl font-extrabold">Mon profil</h1>
      <Flash ok={ok} erreur={erreur} />
      {error && <ErrorState message="Impossible de charger votre profil." />}

      <Card className="flex items-center gap-4">
        <div aria-hidden className="flex size-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-navy to-brand font-display text-xl font-extrabold text-white">{initials(name)}</div>
        <div className="min-w-0">
          <p className="truncate font-display text-lg font-bold">{name || "Sans nom"}</p>
          <p className="truncate text-sm text-navy/75">{me.email}</p>
          {data?.created_at && <p className="text-xs text-navy/75">Compte créé le {new Date(data.created_at).toLocaleDateString("fr-FR")}</p>}
        </div>
      </Card>

      <Card>
        <h2 className="font-display text-lg font-bold">Mes informations</h2>
        <form action={updateProfile} className="mt-4 space-y-4">
          <Field label="Nom complet" htmlFor="name"><Input id="name" name="name" required minLength={2} maxLength={120} autoComplete="name" defaultValue={name} /></Field>
          <Field label="Téléphone" htmlFor="phone" hint="Utilisé par votre conseiller. Ex. +221 77 000 00 00"><Input id="phone" name="phone" type="tel" required autoComplete="tel" defaultValue={data?.phone ?? ""} /></Field>
          <Field label="Adresse e-mail" htmlFor="email" hint="Pour changer d'adresse e-mail, contactez-nous."><Input id="email" value={me.email} readOnly disabled /></Field>
          <Button type="submit">Enregistrer</Button>
        </form>
      </Card>

      <Card>
        <h2 className="font-display text-lg font-bold">Sécurité</h2>
        <p className="mt-1 text-sm text-navy/75">Changez votre mot de passe régulièrement. Vos autres appareils seront déconnectés.</p>
        <Link href="/mot-de-passe/nouveau" className="mt-3 inline-flex min-h-11 items-center gap-2 font-semibold text-brand"><Icon name="lock" />Changer mon mot de passe</Link>
      </Card>
    </div>
  );
}
