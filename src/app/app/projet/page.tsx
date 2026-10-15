import type { Metadata } from "next";
import { requireRole } from "@/lib/auth/session";
import { getOverview } from "@/lib/data/overview";
import { ProjectForm } from "@/components/student/ProjectForm";
import { Card } from "@/components/ui/Card";
import { ErrorState } from "@/components/ui/EmptyState";
import { Flash } from "@/components/staff/Flash";

export const metadata: Metadata = { title: "Mon projet", robots: { index: false } };

async function load(id: string) { try { return await getOverview(id); } catch { return null; } }

export default async function ProjectPage({ searchParams }: { searchParams: Promise<{ ok?: string; erreur?: string }> }) {
  const me = await requireRole(["student"]);
  const { ok, erreur } = await searchParams;
  const o = await load(me.id);
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="font-display text-2xl font-extrabold">Mon projet</h1>
      <p className="text-sm text-navy/75">Ces informations aident votre conseiller à vous orienter. Il peut les ajuster avec vous ; chaque modification est historisée.</p>
      <Flash ok={ok} erreur={erreur} />
      {!o && <ErrorState message="Impossible de charger votre projet." />}
      {o && <Card><ProjectForm project={o.project} /></Card>}
    </div>
  );
}
