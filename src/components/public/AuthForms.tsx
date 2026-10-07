"use client";
import { useActionState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Field";
import { signIn, signUp, type FormState } from "@/app/(auth)/actions";

const initial: FormState = {};

function Banner({ state }: { state: FormState }) {
  if (state.error) return <p role="alert" className="rounded-lg bg-[#fde8e8] p-3 text-sm font-medium text-[#a82b2b]">{state.error}</p>;
  if (state.message) return <p role="status" className="rounded-lg bg-[#dff5ea] p-3 text-sm font-medium text-[#0d7a50]">{state.message}</p>;
  return null;
}

export function SignInForm({ next }: { next?: string }) {
  const [state, action, pending] = useActionState(signIn, initial);
  const e = state.fieldErrors ?? {};
  return (
    <form action={action} className="space-y-4" noValidate>
      <Banner state={state} />
      {next && <input type="hidden" name="next" value={next} />}
      <Field label="Adresse e-mail" htmlFor="email" error={e.email}><Input id="email" name="email" type="email" autoComplete="email" required aria-invalid={!!e.email} /></Field>
      <Field label="Mot de passe" htmlFor="password" error={e.password}><Input id="password" name="password" type="password" autoComplete="current-password" required aria-invalid={!!e.password} /></Field>
      <Button type="submit" className="w-full" disabled={pending}>{pending ? "Connexion…" : "Se connecter"}</Button>
      <p className="text-center text-sm">Pas encore de compte ? <Link href="/inscription" className="font-semibold text-brand">Inscription</Link></p>
    </form>
  );
}

export function SignUpForm({ pack }: { pack?: string }) {
  const [state, action, pending] = useActionState(signUp, initial);
  const e = state.fieldErrors ?? {};
  return (
    <form action={action} className="space-y-4" noValidate>
      <Banner state={state} />
      {pack && <input type="hidden" name="pack" value={pack} />}
      <Field label="Nom complet" htmlFor="fullName" error={e.fullName}><Input id="fullName" name="fullName" autoComplete="name" required aria-invalid={!!e.fullName} /></Field>
      <Field label="Téléphone" htmlFor="phone" error={e.phone} hint="Ex. +221 77 000 00 00"><Input id="phone" name="phone" type="tel" autoComplete="tel" required aria-invalid={!!e.phone} /></Field>
      <Field label="Adresse e-mail" htmlFor="email" error={e.email}><Input id="email" name="email" type="email" autoComplete="email" required aria-invalid={!!e.email} /></Field>
      <Field label="Mot de passe" htmlFor="password" error={e.password} hint="10 caractères minimum"><Input id="password" name="password" type="password" autoComplete="new-password" required aria-invalid={!!e.password} /></Field>
      <div>
        <label className="flex items-start gap-3 text-sm"><input type="checkbox" name="terms" className="mt-1 size-4 accent-[#0b63f6]" aria-invalid={!!e.terms} />
          <span>J&apos;accepte les <Link href="/cgu" className="underline">CGU</Link> et la <Link href="/confidentialite" className="underline">politique de confidentialité</Link>.</span></label>
        {e.terms && <p role="alert" className="mt-1 text-xs font-medium text-danger">{e.terms}</p>}
      </div>
      <Button type="submit" className="w-full" disabled={pending}>{pending ? "Création…" : "Créer mon compte"}</Button>
      <p className="text-center text-sm">Déjà inscrit ? <Link href="/connexion" className="font-semibold text-brand">Connexion</Link></p>
    </form>
  );
}
