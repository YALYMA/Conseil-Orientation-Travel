import type { Metadata } from "next";
import { PackCard } from "@/components/public/PackCard";
import { getPacks } from "@/lib/content/public";

export const metadata: Metadata = {
  title: "Nos packs d'accompagnement",
  description: "Orientation, Audit & Correction, Candidature, Premium : choisissez l'accompagnement adapté et payez 50 % pour commencer.",
  alternates: { canonical: "/packs" },
};

const ROWS: [string, (boolean | string)[]][] = [
  ["Analyse du profil", [true, true, true, true]],
  ["Orientation", [true, false, true, true]],
  ["Choix des formations", [true, true, true, true]],
  ["Correction du CV", [false, true, true, true]],
  ["Lettres", [false, true, true, true]],
  ["Vérification des documents", [false, true, true, true]],
  ["Dépôt de candidature", [false, "Selon pack", true, true]],
  ["Préparation à l'entretien", [false, false, true, true]],
  ["Suivi dans l'espace étudiant", [false, true, true, true]],
  ["Conseiller dédié", [false, false, false, true]],
];

export const revalidate = 60;

const STANDARD = ["orientation", "audit-correction", "candidature", "premium"];

export default async function PacksPage() {
  const PACKS = await getPacks();
  // Le comparateur est défini pour les 4 packs standard ; si l'admin modifie la gamme, on le masque plutôt que d'afficher un tableau faux.
  const showCompare = PACKS.length === STANDARD.length && STANDARD.every((s) => PACKS.some((p) => p.slug === s));
  const ORDERED = showCompare ? STANDARD.map((s) => PACKS.find((p) => p.slug === s)!) : [];
  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="font-display text-3xl font-extrabold">Nos packs d&apos;accompagnement</h1>
      <p className="mt-2 max-w-2xl text-navy/75">Vous ne payez que 50 % pour commencer. Le solde est dû à la finalisation des prestations prévues dans votre pack.</p>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{PACKS.map((p) => <PackCard key={p.slug} pack={p} />)}</div>

      {showCompare && (<>
      <h2 className="font-display mt-14 text-2xl font-bold">Comparer les packs</h2>
      <div className="mt-4 overflow-x-auto rounded-xl border border-navy/10 bg-white" tabIndex={0} role="region" aria-label="Tableau comparatif des packs">
        <table className="w-full min-w-[640px] text-sm">
          <thead className="bg-brand-soft text-left"><tr>
            <th scope="col" className="p-3">Fonctionnalité</th>
            {ORDERED.map((p) => <th key={p.slug} scope="col" className="p-3">{p.name}</th>)}
          </tr></thead>
          <tbody className="divide-y divide-navy/10">
            {ROWS.map(([label, vals]) => (
              <tr key={label}>
                <th scope="row" className="p-3 text-left font-medium">{label}</th>
                {vals.map((v, i) => (
                  <td key={i} className="p-3">
                    {v === true ? <><span aria-hidden className="text-success">✓</span><span className="sr-only">Inclus</span></>
                      : v === false ? <><span aria-hidden>—</span><span className="sr-only">Non inclus</span></> : v}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      </>)}
      <p className="mt-6 text-sm text-navy/70">Nous ne garantissons ni admission ni visa : la décision finale appartient aux établissements et aux autorités compétentes.</p>
    </div>
  );
}
