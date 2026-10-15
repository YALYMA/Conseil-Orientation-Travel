"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/components/ui/cn";
import { Icon, type IconName } from "@/components/visual/Icon";

export type NavVariant = "side" | "tab" | "fab" | "top" | "row";
interface Props { href: string; label: string; icon?: IconName; variant: NavVariant; exact?: boolean; onNavigate?: () => void }

/** Lien de navigation avec état actif (aria-current) : le même composant sert aux barres latérales, onglets, menu et en-tête. */
export function NavLink({ href, label, icon, variant, exact, onNavigate }: Props) {
  const pathname = usePathname();
  const active = pathname === href || (!exact && href !== "/" && pathname.startsWith(href + "/"));
  const common = { href, "aria-current": active ? ("page" as const) : undefined, onClick: onNavigate };

  if (variant === "tab")
    return (
      <Link {...common} className={cn("relative flex min-h-14 flex-1 flex-col items-center justify-center gap-0.5 text-[11px] font-semibold transition-colors", active ? "text-brand" : "text-navy/75 hover:text-navy")}>
        {active && <span aria-hidden className="absolute top-0 h-[3px] w-8 rounded-b-full bg-brand" />}
        {icon && <Icon name={icon} className={cn("size-6 transition-transform", active && "scale-110")} strokeWidth={active ? 2.2 : 1.8} />}
        <span>{label}</span>
      </Link>
    );

  if (variant === "fab")
    return (
      <Link {...common} className="relative flex min-h-14 flex-1 flex-col items-center justify-end gap-0.5 pb-1 text-[11px] font-semibold text-navy">
        <span aria-hidden className={cn("absolute -top-6 flex size-14 items-center justify-center rounded-full border-4 border-white bg-gold text-navy shadow-[0_8px_20px_-6px_rgba(245,181,27,.9)] transition-transform", active ? "scale-105" : "")}>
          {icon && <Icon name={icon} className="size-6" strokeWidth={2.2} />}
        </span>
        <span className="mt-7">{label}</span>
      </Link>
    );

  if (variant === "top")
    return (
      <Link {...common} className={cn("relative inline-flex min-h-11 items-center px-1 text-sm font-medium transition-colors", active ? "text-navy" : "text-navy/75 hover:text-brand")}>
        {label}
        <span aria-hidden className={cn("absolute inset-x-0 bottom-1.5 h-0.5 rounded-full bg-gold transition-opacity", active ? "opacity-100" : "opacity-0")} />
      </Link>
    );

  if (variant === "row")
    return (
      <Link {...common} className={cn("flex min-h-12 items-center gap-3 rounded-xl px-3 text-sm font-semibold transition-colors", active ? "bg-brand-soft text-brand" : "text-navy hover:bg-brand-soft")}>
        {icon && <Icon name={icon} />}{label}
      </Link>
    );

  return (
    <Link {...common} className={cn("group relative flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium transition-colors", active ? "bg-white/15 text-white" : "text-white/80 hover:bg-white/10 hover:text-white")}>
      {active && <span aria-hidden className="absolute -left-3 h-6 w-1 rounded-r-full bg-gold" />}
      {icon && <Icon name={icon} className={cn(active ? "text-gold" : "text-white/70 group-hover:text-white")} />}
      {label}
    </Link>
  );
}
