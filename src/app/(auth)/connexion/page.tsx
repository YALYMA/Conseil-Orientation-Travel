import type { Metadata } from "next";
import { SignInForm } from "@/components/public/AuthForms";
import { safeNext } from "@/lib/validators/auth";
import { Flash } from "@/components/staff/Flash";

export const metadata: Metadata = { title: "Connexion", robots: { index: false } };

export default async function Page({ searchParams }: { searchParams: Promise<{ next?: string; erreur?: string; ok?: string }> }) {
  const { next, erreur, ok } = await searchParams;
  return (<><h1 className="font-display mb-6 text-2xl font-extrabold">Connexion</h1><div className="mb-4 space-y-3"><Flash ok={ok} erreur={erreur} /></div><SignInForm next={safeNext(next) ?? undefined} /></>);
}
