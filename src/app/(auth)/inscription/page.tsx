import type { Metadata } from "next";
import { SignUpForm } from "@/components/public/AuthForms";
export const metadata: Metadata = { title: "Inscription", robots: { index: false } };

export default async function Page({ searchParams }: { searchParams: Promise<{ pack?: string }> }) {
  const { pack } = await searchParams;
  const safe = pack && /^[a-z0-9-]{1,60}$/.test(pack) ? pack : undefined;
  return (<><h1 className="font-display mb-6 text-2xl font-extrabold">Créer mon compte</h1><SignUpForm pack={safe} /></>);
}
