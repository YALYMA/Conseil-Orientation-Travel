import { Icon, type IconName } from "@/components/visual/Icon";
import { HOW_IT_WORKS } from "@/lib/content/defaults";

const ICONS: IconName[] = ["sparkles", "pin", "crown", "wallet", "users", "shield"];

/** Les 6 étapes du parcours, en cartes numérotées reliées par un trait sur ordinateur. */
export function StepsGrid() {
  return (
    <ol className="relative grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {HOW_IT_WORKS.map((s, i) => (
        <li key={s.title} className="group relative rounded-3xl border border-navy/10 bg-white p-5 shadow-[0_1px_2px_rgba(6,59,112,.04),0_12px_30px_-18px_rgba(6,59,112,.25)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_24px_44px_-22px_rgba(6,59,112,.35)]">
          <div className="flex items-center justify-between">
            <span aria-hidden className="flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br from-brand to-[#4D93FF] text-white shadow-lg"><Icon name={ICONS[i] ?? "check"} /></span>
            <span aria-hidden className="font-display text-5xl font-extrabold text-navy/[.07]">{String(i + 1).padStart(2, "0")}</span>
          </div>
          <h3 className="mt-4 font-display text-lg font-bold leading-snug"><span className="sr-only">Étape {i + 1} : </span>{s.title}</h3>
          <p className="mt-1.5 text-sm leading-relaxed text-navy/75">{s.text}</p>
        </li>
      ))}
    </ol>
  );
}
