"use client";
import { useState } from "react";
import Link from "next/link";
import { Flag } from "@/components/visual/Flag";
import { Icon } from "@/components/visual/Icon";
import { Rings } from "@/components/visual/Decor";

/**
 * Bannière à texte défilant. Accessibilité : le texte défilant est masqué aux lecteurs d'écran (version fixe en sr-only),
 * un bouton permet de le mettre en pause (WCAG 2.2.2 : tout contenu animé plus de 5 s doit pouvoir être arrêté),
 * et `prefers-reduced-motion` supprime l'animation (règle globale).
 */
export function PromoTicker({ text, href, linkLabel, note }: { text: string; href: string; linkLabel: string; note: string }) {
  const [paused, setPaused] = useState(false);
  const item = (key: number) => (
    <span key={key} className="flex shrink-0 items-center gap-4 pr-4 sm:gap-5 sm:pr-5">
      <Flag code="fr" className="h-5 w-8 sm:h-6 sm:w-9" />
      <span className="whitespace-nowrap font-display text-lg font-extrabold uppercase tracking-wide sm:text-2xl">{text}</span>
      <Icon name="sparkles" className="size-5 text-gold sm:size-6" />
    </span>
  );
  return (
    <div>
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-navy via-[#08457F] to-[#0A56CF] text-white shadow-[0_22px_44px_-24px_rgba(6,59,112,.8)]">
        <Rings className="absolute -left-10 -top-16 w-56 text-white/15" />
        <Rings className="absolute -bottom-20 -right-8 w-56 text-white/15" />
        <p className="sr-only">{text}</p>
        <div className="relative flex items-center">
          <div aria-hidden className="flex-1 overflow-hidden py-4 [-webkit-mask-image:linear-gradient(to_right,transparent,#000_7%,#000_93%,transparent)] [mask-image:linear-gradient(to_right,transparent,#000_7%,#000_93%,transparent)] sm:py-5">
            <div className="flex w-max animate-marquee" style={{ animationPlayState: paused ? "paused" : "running" }}>
              {Array.from({ length: 8 }, (_, i) => item(i))}
            </div>
          </div>
          <button type="button" onClick={() => setPaused((p) => !p)} aria-pressed={paused}
            aria-label={paused ? "Reprendre le défilement du texte" : "Mettre en pause le défilement du texte"}
            className="mr-3 flex size-11 shrink-0 items-center justify-center rounded-full bg-white/15 text-white ring-1 ring-white/30 transition-colors hover:bg-white/25">
            <Icon name={paused ? "play" : "pause"} className="size-5" />
          </button>
        </div>
      </div>
      <p className="mt-3 flex flex-wrap items-center justify-center gap-x-3 text-center text-xs text-navy/75">
        <span>{note}</span>
        <Link href={href} className="inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-brand">{linkLabel}<Icon name="arrow" className="size-4" /></Link>
      </p>
    </div>
  );
}
