import type { Metadata } from "next";
import { PackRail } from "@/components/public/PackCard";
import { PageHero } from "@/components/public/PageHero";
import { CtaBand } from "@/components/public/CtaBand";
import { SectionTitle } from "@/components/public/SectionTitle";
import { Icon } from "@/components/visual/Icon";
import { cn } from "@/components/ui/cn";
import { getPacks } from "@/lib/content/public";
import { packStyle } from "@/lib/visuals";

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
    <>
      <PageHero eyebrow="Nos packs" title="Un accompagnement adapté à votre projet" text="Vous ne payez que 50 % pour commencer. Le solde est dû à la finalisation des prestations prévues dans votre pack." />
      <div className="mx-auto max-w-6xl px-4 pb-16">
        <div className="relative z-10 -mt-6"><PackRail packs={PACKS} /></div>

        {showCompare && (
          <section className="mt-12" aria-labelledby="compare">
            <SectionTitle eyebrow="Comparatif" title="Comparer les packs" />
            <p className="mt-2 text-sm text-navy/75 md:hidden">Faites défiler le tableau vers la droite pour voir tous les packs.</p>
            <div className="relative mt-5 overflow-x-auto rounded-3xl border border-navy/10 bg-white shadow-[0_12px_30px_-18px_rgba(6,59,112,.25)]" tabIndex={0} role="region" aria-label="Tableau comparatif des packs">
              <table className="w-full min-w-[680px] border-collapse text-sm">
                <thead>
                  <tr>
                    <th scope="col" className="sticky left-0 z-10 bg-white p-4 text-left font-display text-base">Fonctionnalité</th>
                    {ORDERED.map((p) => { const st = packStyle(p.slug); const hot = p.badge === "Populaire"; return (
                      <th key={p.slug} scope="col" className={cn("p-4 text-center align-bottom", hot && "bg-brand-soft")}>
                        <span className={cn("mx-auto mb-2 flex size-10 items-center justify-center rounded-xl bg-gradient-to-br shadow", st.iconBg, p.slug === "premium" ? "text-navy" : "text-white")}><Icon name={st.icon} className="size-5" /></span>
                        <span className="block font-display text-[15px]">{p.name}</span>
                        {hot && <span className="mt-1 inline-block rounded-full bg-gold px-2 py-0.5 text-[11px] font-bold text-navy">Populaire</span>}
                      </th>
                    ); })}
                  </tr>
                </thead>
                <tbody>
                  {ROWS.map(([label, vals], r) => (
                    <tr key={label} className={r % 2 ? "bg-surface/60" : ""}>
                      <th scope="row" className={cn("sticky left-0 z-10 p-3.5 text-left font-medium", r % 2 ? "bg-[#fafbfd]" : "bg-white")}>{label}</th>
                      {vals.map((v, i) => (
                        <td key={i} className={cn("p-3.5 text-center", ORDERED[i].badge === "Populaire" && "bg-brand-soft/60")}>
                          {v === true ? <><span aria-hidden className="mx-auto flex size-6 items-center justify-center rounded-full bg-[#dff5ea] text-[#0d7a50]"><Icon name="check" className="size-4" strokeWidth={3} /></span><span className="sr-only">Inclus</span></>
                            : v === false ? <><span aria-hidden className="text-navy/40">—</span><span className="sr-only">Non inclus</span></>
                            : <span className="text-xs font-semibold text-navy/75">{v}</span>}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        <p className="mt-8 rounded-2xl bg-white p-4 text-sm text-navy/75 ring-1 ring-navy/10">Nous ne garantissons ni admission ni visa : la décision finale appartient aux établissements et aux autorités compétentes.</p>
        <div className="mt-12"><CtaBand title="Pas sûr du pack à choisir ?" text="Faites le test d'orientation gratuit : il vous suggère un point de départ adapté à votre profil." /></div>
      </div>
    </>
  );
}
