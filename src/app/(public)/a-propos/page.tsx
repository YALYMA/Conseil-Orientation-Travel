import type { Metadata } from "next";
import { PageHero } from "@/components/public/PageHero";
import { CtaBand } from "@/components/public/CtaBand";
import { Icon, type IconName } from "@/components/visual/Icon";

export const metadata: Metadata = { title: "À propos", description: "Plateforme digitale d'orientation, de conseil et d'accompagnement aux études à l'étranger pour les étudiants sénégalais.", alternates: { canonical: "/a-propos" } };

const VALUES: { icon: IconName; title: string; text: string }[] = [
  { icon: "compass", title: "Orienter", text: "Vous aider à choisir une formation et une destination adaptées à votre profil." },
  { icon: "folder", title: "Préparer", text: "Construire avec vous un dossier solide : CV, lettres, documents vérifiés." },
  { icon: "gauge", title: "Suivre", text: "Un espace personnel pour voir où en est votre projet, à chaque étape." },
];

export default function AboutPage() {
  return (
    <>
      <PageHero eyebrow="À propos" title="Une plateforme pour étudier à l'étranger, sereinement" text="Conseil-Orientation-Travel est une plateforme digitale d'orientation, de conseil et d'accompagnement aux études à l'étranger, destinée aux étudiants sénégalais." />
      <div className="mx-auto max-w-5xl px-4 pb-16">
        <ul className="relative z-10 -mt-6 grid gap-4 sm:grid-cols-3">
          {VALUES.map((v) => (
            <li key={v.title} className="rounded-3xl bg-white p-6 shadow-[0_12px_30px_-18px_rgba(6,59,112,.3)] ring-1 ring-navy/5">
              <span aria-hidden className="flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br from-brand to-[#4D93FF] text-white shadow-lg"><Icon name={v.icon} /></span>
              <h2 className="mt-4 font-display text-lg font-extrabold">{v.title}</h2><p className="mt-1 text-sm leading-relaxed text-navy/75">{v.text}</p>
            </li>
          ))}
        </ul>
        <section className="mt-8 rounded-3xl bg-white p-6 ring-1 ring-navy/5 sm:p-8">
          <h2 className="flex items-center gap-3 font-display text-xl font-extrabold"><Icon name="shield" className="size-6 text-brand" />Ce que nous ne faisons pas</h2>
          <p className="mt-3 leading-relaxed">Nous ne garantissons ni admission ni visa. La décision finale appartient aux établissements et aux autorités compétentes. Nous ne sommes affiliés à aucune université, ambassade ni à Campus France.</p>
        </section>
        <div className="mt-12"><CtaBand /></div>
      </div>
    </>
  );
}
