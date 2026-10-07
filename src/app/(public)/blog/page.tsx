import type { Metadata } from "next";
import { EmptyState } from "@/components/ui/EmptyState";
export const metadata: Metadata = { title: "Blog", description: "Conseils et actualités sur les études à l'étranger.", alternates: { canonical: "/blog" } };

export default function BlogPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <h1 className="font-display text-3xl font-extrabold">Blog</h1>
      <div className="mt-8"><EmptyState title="Aucun article publié pour le moment" text="Nos premiers conseils arrivent bientôt. Vous pouvez dès maintenant faire le test d'orientation." /></div>
    </div>
  );
}
