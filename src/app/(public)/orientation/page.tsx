import type { Metadata } from "next";
import { Questionnaire } from "@/components/public/Questionnaire";

export const metadata: Metadata = {
  title: "Test d'orientation gratuit",
  description: "Évaluez votre profil en quelques questions : niveau, domaine, destination, budget. Obtenez des pistes pour vos études à l'étranger.",
  alternates: { canonical: "/orientation" },
};

export default function OrientationPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="font-display text-3xl font-extrabold">Évaluez votre profil gratuitement</h1>
      <p className="mt-2 mb-8 text-navy/75">9 questions, environ 3 minutes. Vos réponses ne sont pas enregistrées tant que vous n&apos;avez pas de compte.</p>
      <Questionnaire />
    </div>
  );
}
