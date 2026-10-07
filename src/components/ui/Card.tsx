import { cn } from "./cn";
export function Card({ className, ...p }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("rounded-xl border border-navy/10 bg-white p-5 shadow-sm", className)} {...p} />;
}
