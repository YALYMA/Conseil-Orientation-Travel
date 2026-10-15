import { cn } from "./cn";
export function Card({ className, ...p }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("rounded-2xl border border-navy/10 bg-white p-5 shadow-[0_1px_2px_rgba(6,59,112,.04),0_8px_24px_-12px_rgba(6,59,112,.12)]", className)} {...p} />;
}
