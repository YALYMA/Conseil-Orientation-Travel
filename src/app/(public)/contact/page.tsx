import type { Metadata } from "next";
import { ButtonLink } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
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
    <div className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="font-display text-3xl font-extrabold">Contact</h1>
      <Card className="mt-8">
        <h2 className="font-display text-lg font-bold">Parler à un conseiller</h2>
        {href ? (
          <><p className="mt-2 text-sm text-navy/75">Écrivez-nous sur WhatsApp : message prérempli, réponse rapide.</p>
          <ButtonLink href={href} external variant="success" className="mt-4">Écrire sur WhatsApp</ButtonLink></>
        ) : (
          <p className="mt-2 text-sm text-navy/75" role="status">Le contact WhatsApp n&apos;est pas encore configuré. En attendant, créez un compte pour échanger avec un conseiller.</p>
        )}
      </Card>
      <p className="mt-6 text-sm text-navy/60">N&apos;envoyez jamais passeport, diplômes ou relevés par WhatsApp : ils se déposent dans votre espace sécurisé.</p>
    </div>
  );
}
