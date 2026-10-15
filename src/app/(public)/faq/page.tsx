import type { Metadata } from "next";
import { Accordion } from "@/components/ui/Accordion";
import { PageHero } from "@/components/public/PageHero";
import { CtaBand } from "@/components/public/CtaBand";
import { getFaqs } from "@/lib/content/public";

export const metadata: Metadata = { title: "Questions fréquentes", description: "Tarifs, paiement en deux étapes, suivi de dossier : les réponses à vos questions.", alternates: { canonical: "/faq" } };

export const revalidate = 60;

export default async function FaqPage() {
  const FAQS = await getFaqs();
  const ld = { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: FAQS.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })) };
  return (
    <>
      <PageHero eyebrow="Aide" title="Questions fréquentes" text="Tarifs, paiement en deux étapes, suivi de dossier : les réponses à vos questions." />
      <div className="mx-auto max-w-3xl px-4 pb-16">
        <div className="relative z-10 -mt-6"><Accordion items={FAQS} /></div>
        <div className="mt-12"><CtaBand title="Une autre question ?" text="Un conseiller peut vous répondre directement." href="/contact" cta="Contacter un conseiller" /></div>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld).replace(/</g, "\\u003c") }} />
      </div>
    </>
  );
}
