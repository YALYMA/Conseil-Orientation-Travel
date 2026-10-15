import type { Metadata } from "next";
import { SiteHeader } from "@/components/public/SiteHeader";
import { ButtonLink } from "@/components/ui/Button";

export const metadata: Metadata = { title: "Page introuvable", robots: { index: false } };

export default function NotFound() {
  return (
    <>
      <SiteHeader />
      <main id="contenu" className="mx-auto max-w-xl flex-1 px-4 py-20 text-center">
        <p className="text-5xl font-extrabold text-brand" aria-hidden>404</p>
        <h1 className="font-display mt-4 text-2xl font-extrabold">Cette page est introuvable</h1>
        <p className="mt-2 text-navy/75">L&apos;adresse est peut-être erronée ou la page a été déplacée.</p>
        <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
          <ButtonLink href="/">Retour à l&apos;accueil</ButtonLink>
          <ButtonLink href="/packs" variant="outline">Voir nos packs</ButtonLink>
        </div>
      </main>
    </>
  );
}
