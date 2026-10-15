import { Icon } from "@/components/visual/Icon";
import { ButtonLink } from "@/components/ui/Button";
import { Rings } from "@/components/visual/Decor";
import { SectionTitle } from "./SectionTitle";

const POINTS = [
  { icon: "gauge", text: "Une progression claire et la prochaine étape toujours visible" },
  { icon: "folder", text: "Vos documents déposés en sécurité, validés par votre conseiller" },
  { icon: "wallet", text: "Ce que vous avez payé, ce qu'il reste à payer" },
  { icon: "chat", text: "Messages et rendez-vous avec votre conseiller" },
] as const;

const DOCS: [string, string, string][] = [["CV", "Validé", "bg-[#dff5ea] text-[#0d7a50]"], ["Relevés de notes", "À corriger", "bg-[#fff4d6] text-[#8a6100]"], ["Lettre de motivation", "En révision", "bg-brand-soft text-brand"], ["Passeport", "Validé", "bg-[#dff5ea] text-[#0d7a50]"]];

/** Aperçu de l'espace étudiant dans un téléphone. Données fictives, signalées comme telles. */
export function AppPreview() {
  const r = 34, c = 2 * Math.PI * r;
  return (
    <div className="grid items-center gap-10 lg:grid-cols-2">
      <div>
        <SectionTitle eyebrow="Votre espace étudiant" title="Je sais où j'en suis, à chaque étape" text="Un espace sécurisé, sur ordinateur comme sur téléphone, pour suivre tout votre projet sans courir après l'information." />
        <ul className="mt-6 space-y-3">
          {POINTS.map((p) => (
            <li key={p.text} className="flex items-start gap-3"><span aria-hidden className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand"><Icon name={p.icon} className="size-5" /></span><span className="pt-1.5 text-[15px] leading-snug">{p.text}</span></li>
          ))}
        </ul>
        <ButtonLink href="/inscription" size="lg" className="mt-7">Créer mon espace<Icon name="arrow" className="size-5" /></ButtonLink>
      </div>

      <figure className="relative mx-auto w-full max-w-[300px]">
        <Rings className="absolute -inset-10 -z-10 text-brand/15" />
        <div aria-hidden className="rounded-[2.4rem] border-[9px] border-navy bg-surface p-3 shadow-[0_40px_60px_-30px_rgba(6,59,112,.7)]">
          <div className="mx-auto mb-2 h-1.5 w-16 rounded-full bg-navy/20" />
          <div className="rounded-2xl bg-gradient-to-br from-navy to-brand p-4 text-white">
            <p className="text-[11px] text-white/90">Bonjour Abdoulaye</p>
            <div className="mt-2 flex items-center gap-3">
              <svg viewBox="0 0 80 80" className="size-[72px] -rotate-90"><circle cx="40" cy="40" r={r} fill="none" stroke="#fff" strokeOpacity=".25" strokeWidth="9" /><circle cx="40" cy="40" r={r} fill="none" stroke="#F5B51B" strokeWidth="9" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * 0.2} /></svg>
              <div><p className="font-display text-2xl font-extrabold">80 %</p><p className="text-[11px] leading-tight text-white/90">Études en France<br />Master · Informatique</p></div>
            </div>
          </div>
          <div className="mt-2.5 rounded-xl bg-white p-3 text-[11px] shadow-sm"><p className="font-bold text-navy">Prochaine étape</p><p className="text-navy/75">Déposer vos candidatures</p></div>
          <ul className="mt-2.5 space-y-1.5">
            {DOCS.map(([n, s, tone]) => <li key={n} className="flex items-center justify-between rounded-xl bg-white px-3 py-2 text-[11px] shadow-sm"><span className="font-semibold text-navy">{n}</span><span className={`rounded-full px-2 py-0.5 font-bold ${tone}`}>{s}</span></li>)}
          </ul>
        </div>
        <figcaption className="mt-3 text-center text-xs text-navy/75">Exemple d&apos;interface, données fictives.</figcaption>
      </figure>
    </div>
  );
}
