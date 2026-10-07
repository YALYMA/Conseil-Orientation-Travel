import type { Metadata } from "next";
import { Accordion } from "@/components/ui/Accordion";
import { getFaqs } from "@/lib/content/public";

export const metadata: Metadata = { title: "Questions fréquentes", description: "Tarifs, paiement en deux étapes, suivi de dossier : les réponses à vos questions.", alternates: { canonical: "/faq" } };

export const revalidate = 60;

export default async function FaqPage() {
  const FAQS = await getFaqs();
  const ld = { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: FAQS.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })) };
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="font-display text-3xl font-extrabold">Questions fréquentes</h1>
      <div className="mt-8"><Accordion items={FAQS} /></div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld).replace(/</g, "\\u003c") }} />
    </div>
  );
}
