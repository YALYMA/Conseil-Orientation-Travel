import Link from "next/link";
import { cn } from "./cn";

type Variant = "primary" | "cta" | "outline" | "ghost" | "success";
const styles: Record<Variant, string> = {
  primary: "bg-brand text-white hover:bg-[#0952d0]",
  cta: "bg-gold text-navy hover:bg-[#e3a40f]",
  outline: "border border-navy/25 bg-white text-navy hover:bg-brand-soft",
  ghost: "text-navy hover:bg-brand-soft",
  success: "bg-success text-white hover:bg-[#12895a]",
};
const base =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-5 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50";

type Common = { variant?: Variant; className?: string; children: React.ReactNode };

export function Button({ variant = "primary", className, ...p }: Common & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button className={cn(base, styles[variant], className)} {...p} />;
}

export function ButtonLink({
  variant = "primary", className, href, external, ...p
}: Common & { href: string; external?: boolean } & Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, "href">) {
  const cls = cn(base, styles[variant], className);
  return external ? (
    <a href={href} className={cls} target="_blank" rel="noopener noreferrer" {...p} />
  ) : (
    <Link href={href} className={cls} {...p} />
  );
}
