import type { Metadata } from "next";
export const metadata: Metadata = { title: "Politique de confidentialité", alternates: { canonical: "/confidentialite" }, robots: { index: true } };

export default function Page() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 leading-relaxed">
      <h1 className="font-display text-3xl font-extrabold">Politique de confidentialité</h1>
      <p className="mt-4 rounded-lg bg-[#fff4d6] p-4 text-sm">Gabarit à compléter et à faire valider par un juriste avant l&apos;ouverture au public (identité de l&apos;éditeur, hébergeur, traitement des données personnelles, durées de conservation, conditions de paiement en deux étapes).</p>
    </div>
  );
}
