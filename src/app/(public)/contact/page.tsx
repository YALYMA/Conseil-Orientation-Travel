import type { Metadata } from "next";
import { ButtonLink } from "@/components/ui/Button";
import { PageHero } from "@/components/public/PageHero";
import { Icon } from "@/components/visual/Icon";
import { whatsappLink } from "@/lib/payments/links";
import { isSupabaseConfigured } from "@/lib/env";
import { getPublicSettings } from "@/lib/data/student";

export const metadata: Metadata = { title: "Contact", description: "Parlez à un conseiller Conseil-Orientation-Travel.", alternates: { canonical: "/contact" } };

async function loadPhone(): Promise<string> {
  // Priorité aux réglages administrables ; repli sur la variable d'environnement.
  if (isSupabaseConfigured) {
    try { const s = await getPublicSettings(); if (s.whatsapp.phone) return s.whatsapp.phone; } catch { /* repli */ }
  }
  return process.env.WHATSAPP_PHONE ?? "";
}

export default async function ContactPage() {
  const phone = await loadPhone();
  let href: string | null = null;
  try { href = whatsappLink(phone, "Bonjour Conseil-Orientation-Travel, j'aimerais parler à un conseiller."); } catch { href = null; }
  return (
    <>
      <PageHero eyebrow="Contact" title="Parlez à un conseiller" text="Une question sur les destinations, les packs ou votre dossier ? Nous vous répondons." />
      <div className="mx-auto max-w-2xl px-4 pb-16">
        <div className="relative z-10 -mt-6 rounded-3xl bg-white p-6 shadow-[0_24px_50px_-26px_rgba(6,59,112,.45)] ring-1 ring-navy/5 sm:p-8">
          <span aria-hidden className="flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#0D7A50] to-[#16A36A] text-white shadow-lg"><Icon name="chat" className="size-7" /></span>
          <h2 className="mt-4 font-display text-xl font-extrabold">Écrivez-nous sur WhatsApp</h2>
          {href ? (
            <><p className="mt-2 text-sm text-navy/75">Message prérempli, réponse rapide de notre équipe.</p>
            <ButtonLink href={href} external variant="success" size="lg" className="mt-5 w-full sm:w-auto">Écrire sur WhatsApp<Icon name="arrow" className="size-5" /></ButtonLink></>
          ) : (
            <p className="mt-2 text-sm text-navy/75" role="status">Le contact WhatsApp n&apos;est pas encore configuré. En attendant, créez un compte pour échanger avec un conseiller.</p>
          )}
        </div>
        <p className="mt-5 flex gap-3 rounded-2xl bg-[#fff6e0] p-4 text-sm leading-relaxed"><Icon name="lock" className="mt-0.5 size-5 shrink-0 text-[#8a6100]" />N&apos;envoyez jamais passeport, diplômes ou relevés par WhatsApp : ils se déposent dans votre espace sécurisé.</p>
      </div>
    </>
  );
}
