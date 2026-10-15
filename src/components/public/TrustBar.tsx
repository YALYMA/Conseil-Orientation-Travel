import { Icon, type IconName } from "@/components/visual/Icon";

const ITEMS: { icon: IconName; title: string; text: string; tone: string }[] = [
  { icon: "wallet", title: "Paiement en 2 étapes", text: "50 % pour commencer", tone: "bg-[#FFF4D6] text-[#8A6100]" },
  { icon: "users", title: "Suivi personnalisé", text: "Un conseiller à vos côtés", tone: "bg-brand-soft text-brand" },
  { icon: "lock", title: "Espace étudiant sécurisé", text: "Documents privés", tone: "bg-[#E7F7F0] text-[#0D7A50]" },
  { icon: "chat", title: "Conseillers disponibles", text: "Messages et rendez-vous", tone: "bg-brand-soft text-navy" },
];

/** Bandeau de réassurance chevauchant la bannière. */
export function TrustBar() {
  return (
    <section aria-label="Nos engagements" className="relative z-10 mx-auto -mt-10 max-w-6xl px-4 sm:-mt-12">
      <ul className="grid grid-cols-2 gap-3 rounded-3xl bg-white p-4 shadow-[0_24px_50px_-24px_rgba(6,59,112,.45)] ring-1 ring-navy/5 sm:p-5 lg:grid-cols-4">
        {ITEMS.map((i) => (
          <li key={i.title} className="flex flex-col items-start gap-2.5 p-2 sm:flex-row sm:items-center sm:gap-3">
            <span aria-hidden className={`flex size-11 shrink-0 items-center justify-center rounded-2xl ${i.tone}`}><Icon name={i.icon} /></span>
            <span className="text-sm leading-tight"><strong className="block font-display text-[15px]">{i.title}</strong><span className="text-navy/75">{i.text}</span></span>
          </li>
        ))}
      </ul>
    </section>
  );
}
