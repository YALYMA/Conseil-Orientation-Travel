import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Field";
import { formatFcfa } from "@/lib/payments/split";
import { ORDER_LABELS } from "@/lib/payments/labels";
import { staffActionsFor } from "@/lib/payments/staff-actions";
import { staffTransition } from "@/app/advisor/actions";
import type { StaffOrder } from "@/lib/data/staff";

export function OrderRowCard({ order, role }: { order: StaffOrder; role: "advisor" | "admin" }) {
  const actions = staffActionsFor(order.status, role);
  const name = order.students?.profiles?.full_name ?? "Étudiant";
  const proofs = order.payments.flatMap((p) => p.payment_proofs.map((x) => ({ ...x, stage: p.stage }))).sort((a, b) => b.created_at.localeCompare(a.created_at));
  const awaitingAmount = order.status.startsWith("BALANCE") || order.status === "SERVICE_READY_FOR_FINAL_PAYMENT" ? order.balance_amount : order.first_amount;
  return (
    <Card>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div><h2 className="font-semibold">{name}</h2><p className="text-xs text-navy/75">{order.reference} · Pack {order.service_packs?.name}</p></div>
        <Badge tone={order.status === "REJECTED" ? "red" : "blue"}>{ORDER_LABELS[order.status].label}</Badge>
      </div>
      <p className="mt-2 text-sm">Montant attendu à cette étape : <strong>{formatFcfa(awaitingAmount)}</strong> (total {formatFcfa(order.price_total)})</p>
      {proofs[0] && <p className="mt-1 text-xs text-navy/75">Dernière preuve déclarée le {new Date(proofs[0].created_at).toLocaleDateString("fr-FR")}{proofs[0].wave_reference ? ` · réf. ${proofs[0].wave_reference}` : ""}. Vérifiez la capture reçue sur WhatsApp avant de valider.</p>}
      {actions.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {actions.map((a) => (
            <form key={a.to} action={staffTransition} className="flex flex-wrap items-center gap-2">
              <input type="hidden" name="orderId" value={order.id} /><input type="hidden" name="to" value={a.to} />
              {a.needsReason && <Input name="reason" required minLength={3} maxLength={500} placeholder="Motif (visible par l'étudiant)" aria-label={`Motif : ${a.label}`} className="w-64" />}
              <Button type="submit" variant={a.tone === "danger" ? "outline" : a.tone}>{a.label}</Button>
            </form>
          ))}
        </div>
      )}
    </Card>
  );
}
