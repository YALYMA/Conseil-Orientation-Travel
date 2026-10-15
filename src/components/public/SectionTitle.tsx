import { cn } from "@/components/ui/cn";
export function SectionTitle({ eyebrow, title, text, align = "left", light, className }: { eyebrow?: string; title: string; text?: string; align?: "left" | "center"; light?: boolean; className?: string }) {
  return (
    <div className={cn(align === "center" && "mx-auto text-center", "max-w-2xl", className)}>
      {eyebrow && <p className={cn("text-xs font-bold uppercase tracking-[.14em]", light ? "text-gold" : "text-brand")}>{eyebrow}</p>}
      <h2 className={cn("mt-2 font-display text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl", light ? "text-white" : "text-ink")}>{title}</h2>
      {text && <p className={cn("mt-3 text-base leading-relaxed sm:text-lg", light ? "text-white/90" : "text-navy/75")}>{text}</p>}
    </div>
  );
}
