import type { Metadata } from "next";
import { Questionnaire } from "@/components/public/Questionnaire";
import { PageHero } from "@/components/public/PageHero";

export const metadata: Metadata = {
  title: "Test d'orientation gratuit",
  description: "Évaluez votre profil en quelques questions : niveau, domaine, destination, budget. Obtenez des pistes pour vos études à l'étranger.",
  alternates: { canonical: "/orientation" },
};

export default function OrientationPage() {
  return (
    <>
      <PageHero eyebrow="Test gratuit" title="Évaluez votre profil gratuitement" text="9 questions, environ 3 minutes. Vos réponses ne sont pas enregistrées tant que vous n'avez pas de compte." />
      <div className="mx-auto max-w-2xl px-4 pb-16"><div className="relative z-10 -mt-8"><Questionnaire /></div></div>
    </>
  );
}
