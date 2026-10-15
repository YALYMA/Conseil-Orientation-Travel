import { cn } from "@/components/ui/cn";

/** Décors purement graphiques (aria-hidden, non interactifs). */
export function DotGrid({ className, rows = 6, cols = 8, gap = 14 }: { className?: string; rows?: number; cols?: number; gap?: number }) {
  return (
    <svg width={cols * gap} height={rows * gap} className={cn("pointer-events-none", className)} aria-hidden>
      {Array.from({ length: rows * cols }, (_, i) => <circle key={i} cx={(i % cols) * gap + 3} cy={Math.floor(i / cols) * gap + 3} r="1.6" fill="currentColor" />)}
    </svg>
  );
}

export function Rings({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 200" className={cn("pointer-events-none", className)} aria-hidden fill="none" stroke="currentColor">
      {[30, 55, 80, 105].map((r, i) => <circle key={r} cx="100" cy="100" r={r} strokeWidth="1" opacity={1 - i * 0.2} />)}
    </svg>
  );
}

export function Blob({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 200" className={cn("pointer-events-none", className)} aria-hidden>
      <path fill="currentColor" d="M44.8,-58.6C58.2,-48.3,69.3,-34.2,73.6,-18.2C77.9,-2.2,75.4,15.7,67,29.9C58.6,44.1,44.3,54.5,28.6,61.2C12.9,67.9,-4.2,70.8,-20.6,66.9C-37,63,-52.7,52.3,-62.4,37.7C-72.1,23.1,-75.8,4.6,-71.6,-11.5C-67.4,-27.6,-55.3,-41.3,-41.6,-51.6C-27.9,-61.9,-13.9,-68.8,0.9,-70C15.8,-71.2,31.5,-68.9,44.8,-58.6Z" transform="translate(100 100)" />
    </svg>
  );
}

/** Vague de transition entre deux sections. `color` = couleur de la section SUIVANTE. */
export function Wave({ className, flip }: { className?: string; flip?: boolean }) {
  return (
    <svg viewBox="0 0 1440 80" preserveAspectRatio="none" className={cn("block h-10 w-full sm:h-16", flip && "rotate-180", className)} aria-hidden>
      <path fill="currentColor" d="M0,40 C240,90 480,0 720,30 C960,60 1200,90 1440,35 L1440,80 L0,80 Z" />
    </svg>
  );
}
