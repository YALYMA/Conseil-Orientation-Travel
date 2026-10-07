import type { Metadata } from "next";
import { SignInForm } from "@/components/public/AuthForms";
import { safeNext } from "@/lib/validators/auth";

export const metadata: Metadata = { title: "Connexion", alternates: { canonical: "/connexion" } };

export default async function Page({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  return (<><h1 className="font-display mb-6 text-2xl font-extrabold">Connexion</h1><SignInForm next={safeNext(next) ?? undefined} /></>);
}
