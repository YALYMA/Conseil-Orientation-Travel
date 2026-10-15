import type { Metadata } from "next";
import { PageHero } from "@/components/public/PageHero";
import { StepsGrid } from "@/components/public/StepsGrid";
import { CtaBand } from "@/components/public/CtaBand";
import { Icon } from "@/components/visual/Icon";

export const metadata: Metadata = {
  title: "Comment ça marche",
  description: "Six étapes : évaluer votre profil, choisir destination et pack, payer 50 % pour commencer, être suivi par un conseiller, régler le solde à la finalisation.",
  alternates: { canonical: "/comment-ca-marche" },
};

export default function HowPage() {
  return (
    <>
      <PageHero eyebrow="Le parcours" title="Comment ça marche" text="Un parcours simple et transparent, de votre premier test d'orientation jusqu'au suivi de vos candidatures." />
      <div className="mx-auto max-w-6xl px-4 pb-16">
        <div className="relative z-10 -mt-6"><StepsGrid /></div>
        <p className="mt-8 flex gap-3 rounded-2xl bg-white p-4 text-sm leading-relaxed ring-1 ring-navy/10"><Icon name="shield" className="mt-0.5 size-5 text-brand" />La décision finale appartient aux établissements et aux autorités compétentes. Nous vous accompagnons dans la préparation et le suivi de votre candidature.</p>
        <div className="mt-12"><CtaBand title="Prêt à commencer ?" text="Le test d'orientation est gratuit et ne demande pas de compte." cta="Évaluer mon profil gratuitement" /></div>
      </div>
    </>
  );
}
