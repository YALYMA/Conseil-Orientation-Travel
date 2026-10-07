import type { Metadata } from "next";
import { Timeline } from "@/components/ui/Timeline";
import { ButtonLink } from "@/components/ui/Button";
import { HOW_IT_WORKS } from "@/lib/content/defaults";

export const metadata: Metadata = {
  title: "Comment ça marche",
  description: "Six étapes : évaluer votre profil, choisir destination et pack, payer 50 % pour commencer, être suivi par un conseiller, régler le solde à la finalisation.",
  alternates: { canonical: "/comment-ca-marche" },
};

export default function HowPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="font-display text-3xl font-extrabold">Comment ça marche</h1>
      <div className="mt-8"><Timeline steps={HOW_IT_WORKS} /></div>
      <p className="mt-8 rounded-lg bg-brand-soft p-4 text-sm">La décision finale appartient aux établissements et aux autorités compétentes. Nous vous accompagnons dans la préparation et le suivi de votre candidature.</p>
      <ButtonLink href="/orientation" variant="cta" className="mt-6">Évaluer mon profil gratuitement</ButtonLink>
    </div>
  );
}
