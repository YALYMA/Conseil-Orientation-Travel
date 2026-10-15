import { cn } from "@/components/ui/cn";
/** Logo : toque stylisée (même motif que l'icône du site). */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={cn("size-9 shrink-0", className)} aria-hidden>
      <rect width="64" height="64" rx="15" fill="#063B70" /><rect width="64" height="64" rx="15" fill="url(#lm)" opacity=".5" />
      <defs><linearGradient id="lm" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#0B63F6" /><stop offset="1" stopColor="#063B70" stopOpacity="0" /></linearGradient></defs>
      <path d="M32 17 L52 27 L32 37 L12 27Z" fill="#fff" /><path d="M20 33 V42 Q32 50 44 42 V33 L32 39Z" fill="#CFE0FF" /><path d="M50 28 V42" stroke="#F5B51B" strokeWidth="3" strokeLinecap="round" /><circle cx="50" cy="45" r="3.2" fill="#F5B51B" />
    </svg>
  );
}
