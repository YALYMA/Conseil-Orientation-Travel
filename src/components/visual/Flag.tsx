import { cn } from "@/components/ui/cn";

export type FlagCode = "fr" | "be" | "lu" | "it" | "ma" | "sn";

/** Point d'une étoile à 5 branches (angle de départ : vers le haut). */
const pt = (cx: number, cy: number, r: number, i: number) => {
  const a = (-90 + i * 72) * (Math.PI / 180);
  return [cx + r * Math.cos(a), cy + r * Math.sin(a)] as const;
};
/** Pentagramme (contour entrelacé) : sommets reliés de 2 en 2. */
const pentagram = (cx: number, cy: number, r: number) => [0, 2, 4, 1, 3].map((i) => pt(cx, cy, r, i).map((n) => n.toFixed(2)).join(",")).join(" ");
/** Étoile pleine à 5 branches. */
const solidStar = (cx: number, cy: number, R: number, r: number) =>
  Array.from({ length: 10 }, (_, i) => {
    const a = (-90 + i * 36) * (Math.PI / 180), d = i % 2 ? r : R;
    return `${(cx + d * Math.cos(a)).toFixed(2)},${(cy + d * Math.sin(a)).toFixed(2)}`;
  }).join(" ");

/** Drapeaux dessinés en SVG : les emoji-drapeaux ne s'affichent pas sous Windows. Décoratif par défaut (le nom du pays est toujours écrit à côté). */
export function Flag({ code, className, title }: { code: FlagCode; className?: string; title?: string }) {
  const id = `fc-${code}`;
  return (
    <svg viewBox="0 0 36 24" className={cn("inline-block shrink-0 rounded-[3px] shadow-[0_0_0_1px_rgba(6,59,112,0.15)]", className)} role={title ? "img" : undefined} aria-label={title} aria-hidden={title ? undefined : true}>
      <defs><clipPath id={id}><rect width="36" height="24" rx="3" /></clipPath></defs>
      <g clipPath={`url(#${id})`}>
        {code === "fr" && (<><rect width="12" height="24" fill="#0055A4" /><rect x="12" width="12" height="24" fill="#fff" /><rect x="24" width="12" height="24" fill="#EF4135" /></>)}
        {code === "be" && (<><rect width="12" height="24" fill="#111" /><rect x="12" width="12" height="24" fill="#FAE042" /><rect x="24" width="12" height="24" fill="#ED2939" /></>)}
        {code === "lu" && (<><rect width="36" height="8" fill="#EF3340" /><rect y="8" width="36" height="8" fill="#fff" /><rect y="16" width="36" height="8" fill="#00A3E0" /></>)}
        {code === "it" && (<><rect width="12" height="24" fill="#009246" /><rect x="12" width="12" height="24" fill="#fff" /><rect x="24" width="12" height="24" fill="#CE2B37" /></>)}
        {code === "ma" && (<><rect width="36" height="24" fill="#C1272D" /><polygon points={pentagram(18, 12.6, 6.4)} fill="none" stroke="#006233" strokeWidth="1.1" strokeLinejoin="miter" /></>)}
        {code === "sn" && (<><rect width="12" height="24" fill="#00853F" /><rect x="12" width="12" height="24" fill="#FDEF42" /><rect x="24" width="12" height="24" fill="#E31B23" /><polygon points={solidStar(18, 12.4, 4.4, 1.8)} fill="#00853F" /></>)}
      </g>
    </svg>
  );
}

export const FLAG_BY_SLUG: Record<string, FlagCode> = { france: "fr", belgique: "be", luxembourg: "lu", italie: "it", maroc: "ma" };
export const flagFor = (slug: string): FlagCode | null => FLAG_BY_SLUG[slug] ?? null;
