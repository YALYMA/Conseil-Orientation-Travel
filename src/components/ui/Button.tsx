import Link from "next/link";
import { cn } from "./cn";

type Variant = "primary" | "cta" | "outline" | "ghost" | "success" | "glass";
type Size = "md" | "lg";
const styles: Record<Variant, string> = {
  primary: "bg-brand text-white shadow-[0_10px_24px_-10px_rgba(11,99,246,.7)] hover:bg-[#0952d0] hover:-translate-y-px",
  cta: "bg-gold text-navy shadow-[0_10px_24px_-10px_rgba(245,181,27,.8)] hover:bg-[#e3a40f] hover:-translate-y-px",
  outline: "border border-navy/20 bg-white text-navy hover:border-brand/40 hover:bg-brand-soft",
  ghost: "text-navy hover:bg-brand-soft",
  success: "bg-success-ink text-white shadow-[0_10px_24px_-10px_rgba(13,122,80,.7)] hover:bg-[#0b6844]",
  glass: "border border-white/30 bg-white/10 text-white backdrop-blur hover:bg-white/20",
};
const sizes: Record<Size, string> = { md: "min-h-11 px-5 text-sm", lg: "min-h-12 px-6 text-base" };
const base = "inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-all duration-200 active:translate-y-0 active:scale-[.98] disabled:cursor-not-allowed disabled:opacity-50";

type Common = { variant?: Variant; size?: Size; className?: string; children: React.ReactNode };

export function Button({ variant = "primary", size = "md", className, ...p }: Common & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button className={cn(base, sizes[size], styles[variant], className)} {...p} />;
}

export function ButtonLink({
  variant = "primary", size = "md", className, href, external, ...p
}: Common & { href: string; external?: boolean } & Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, "href">) {
  const cls = cn(base, sizes[size], styles[variant], className);
  return external ? (
    <a href={href} className={cls} target="_blank" rel="noopener noreferrer" {...p} />
  ) : (
    <Link href={href} className={cls} {...p} />
  );
}
