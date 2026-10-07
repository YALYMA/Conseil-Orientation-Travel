import type { Metadata } from "next";
export const metadata: Metadata = { title: "À propos", description: "Plateforme digitale d'orientation, de conseil et d'accompagnement aux études à l'étranger pour les étudiants sénégalais.", alternates: { canonical: "/a-propos" } };

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 leading-relaxed">
      <h1 className="font-display text-3xl font-extrabold">À propos</h1>
      <p className="mt-4">Conseil-Orientation-Travel est une plateforme digitale d&apos;orientation, de conseil et d&apos;accompagnement aux études à l&apos;étranger, destinée aux étudiants sénégalais.</p>
      <p className="mt-4">Notre rôle : vous aider à choisir une formation, préparer un dossier solide et suivre vos candidatures dans un espace personnel, avec un conseiller.</p>
      <h2 className="font-display mt-8 text-xl font-bold">Ce que nous ne faisons pas</h2>
      <p className="mt-2">Nous ne garantissons ni admission ni visa. La décision finale appartient aux établissements et aux autorités compétentes. Nous ne sommes affiliés à aucune université, ambassade ni à Campus France.</p>
    </div>
  );
}
