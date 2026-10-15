import type { Metadata } from "next";
import { PageHero } from "@/components/public/PageHero";
import { EmptyState } from "@/components/ui/EmptyState";
import { ButtonLink } from "@/components/ui/Button";

export const metadata: Metadata = { title: "Blog", description: "Conseils et actualités sur les études à l'étranger.", alternates: { canonical: "/blog" } };

export default function BlogPage() {
  return (
    <>
      <PageHero eyebrow="Blog" title="Conseils et actualités" text="Des articles pour préparer votre projet d'études à l'étranger." />
      <div className="mx-auto max-w-4xl px-4 pb-16">
        <div className="relative z-10 -mt-6"><EmptyState title="Aucun article publié pour le moment" text="Nos premiers conseils arrivent bientôt. Vous pouvez dès maintenant faire le test d'orientation." action={<ButtonLink href="/orientation" variant="cta">Faire le test d&apos;orientation</ButtonLink>} /></div>
      </div>
    </>
  );
}
