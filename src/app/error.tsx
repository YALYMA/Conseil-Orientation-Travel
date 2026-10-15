"use client";
import { Button, ButtonLink } from "@/components/ui/Button";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="mx-auto max-w-xl flex-1 px-4 py-20 text-center">
      <h1 className="font-display text-2xl font-extrabold">Une erreur est survenue</h1>
      <p className="mt-2 text-navy/75">Nous n&apos;avons pas pu afficher cette page. Réessayez ; si le problème continue, contactez-nous.</p>
      {/* Le détail technique n'est jamais affiché : seulement un code de référence pour le support. */}
      {error.digest && <p className="mt-3 text-xs text-navy/75">Code de référence : <code>{error.digest}</code></p>}
      <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
        <Button onClick={reset}>Réessayer</Button>
        <ButtonLink href="/" variant="outline">Retour à l&apos;accueil</ButtonLink>
      </div>
    </main>
  );
}
