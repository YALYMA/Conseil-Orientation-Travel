import { Card } from "@/components/ui/Card";
import { Badge, StatusBadge } from "@/components/ui/Badge";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Input, Field } from "@/components/ui/Field";
import { formatFcfa } from "@/lib/payments/split";
import { buildProofMessage, whatsappLink } from "@/lib/payments/links";
import { ORDER_LABELS, isAwaitingStudentPayment } from "@/lib/payments/labels";
import { declareProof, cancelOrder } from "@/app/app/actions";
import type { OrderRow, Settings } from "@/lib/data/student";

interface Props { order: OrderRow; settings: Settings; student: { fullName: string; phone: string } }

export function PaymentCard({ order, settings, student }: Props) {
  const info = ORDER_LABELS[order.status];
  const initial = order.payments.find((p) => p.stage === "initial");
  const balance = order.payments.find((p) => p.stage === "balance");
  const awaiting = isAwaitingStudentPayment(order.status);
  const stage = order.status === "SERVICE_READY_FOR_FINAL_PAYMENT" ? "balance" : "initial";
  const amount = stage === "initial" ? order.first_amount : order.balance_amount;
  const rejection = (stage === "initial" ? initial : balance)?.rejection_reason;

  const wavePhone = settings.wave.phone?.trim();
  const [first, ...rest] = student.fullName.split(" ");
  let waLink: string | null = null;
  try {
    waLink = whatsappLink(settings.whatsapp.phone ?? "", buildProofMessage({
      firstName: first, lastName: rest.join(" ") || "-", packName: order.service_packs?.name ?? "", country: order.countries?.name ?? "À définir",
      amount, phone: student.phone || "-", stage: stage === "initial" ? "initial" : "balance",
    }));
  } catch { waLink = null; }

  return (
    <Card>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className="font-display text-lg font-bold">Pack {order.service_packs?.name}</h2>
          <p className="text-xs text-navy/75">Commande {order.reference}</p>
        </div>
        <Badge tone={order.status === "REJECTED" || order.status === "CANCELLED" ? "red" : order.status === "COMPLETED" ? "green" : "blue"}>{info.label}</Badge>
      </div>

      <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-3">
        <div><dt className="text-navy/75">Prix total</dt><dd className="text-lg font-bold">{formatFcfa(order.price_total)}</dd></div>
        <div><dt className="text-navy/75">Premier paiement</dt><dd className="font-semibold">{formatFcfa(order.first_amount)}</dd><dd>{initial && <StatusBadge status={initial.status === "confirmed" ? "paid" : initial.status} />}</dd></div>
        <div><dt className="text-navy/75">Solde</dt><dd className="font-semibold">{formatFcfa(order.balance_amount)}</dd><dd>{balance && <StatusBadge status={balance.status === "confirmed" ? "paid" : balance.status === "pending" && order.status !== "SERVICE_READY_FOR_FINAL_PAYMENT" && order.status !== "BALANCE_PROOF_SUBMITTED" ? "upcoming" : balance.status} />}</dd></div>
      </dl>
      <p className="mt-4 rounded-lg bg-brand-soft p-3 text-sm"><strong>Prochaine étape :</strong> {info.next}</p>
      {rejection && <p role="alert" className="mt-3 rounded-lg bg-[#fde8e8] p-3 text-sm text-[#a82b2b]">Motif : {rejection}</p>}
      {order.status === "REJECTED" && order.status_reason && <p role="alert" className="mt-3 rounded-lg bg-[#fde8e8] p-3 text-sm text-[#a82b2b]">Motif : {order.status_reason}</p>}

      {awaiting && (
        <div className="mt-5 space-y-4 border-t border-navy/10 pt-5">
          <h3 className="font-semibold">{stage === "initial" ? "Votre premier paiement" : "Votre solde"} : {formatFcfa(amount)}</h3>
          {order.status === "SERVICE_READY_FOR_FINAL_PAYMENT" && <p className="text-sm text-navy/75">Ce paiement correspond au solde de votre pack, dû à la finalisation des prestations prévues.</p>}
          {wavePhone ? (
            <div className="space-y-2 text-sm">
              <p>Payez via Wave au <strong className="text-base">{wavePhone}</strong>{settings.wave.display_name ? ` (${settings.wave.display_name})` : ""}.</p>
              {settings.wave.payment_url && <ButtonLink href={settings.wave.payment_url} external>Payer avec Wave</ButtonLink>}
            </div>
          ) : (
            <p role="status" className="rounded-lg bg-[#fff4d6] p-3 text-sm">Les coordonnées Wave ne sont pas encore configurées. Contactez votre conseiller avant de payer.</p>
          )}
          {waLink && <ButtonLink href={waLink} external variant="success">Envoyer ma preuve sur WhatsApp</ButtonLink>}
          <form action={declareProof} className="space-y-3 rounded-lg border border-navy/10 p-3">
            <input type="hidden" name="orderId" value={order.id} />
            <Field label="Référence Wave (facultatif)" htmlFor={`ref-${order.id}`}><Input id={`ref-${order.id}`} name="waveRef" maxLength={64} /></Field>
            <Button type="submit" variant="outline">J&apos;ai envoyé ma preuve</Button>
            <p className="text-xs text-navy/75">Votre paiement sera validé manuellement par notre équipe.</p>
          </form>
        </div>
      )}

      {(order.status === "FIRST_PAYMENT_PENDING" || order.status === "ORDER_CREATED") && (
        <details className="mt-4 text-sm">
          <summary className="flex min-h-11 cursor-pointer items-center text-navy/75">Annuler cette commande</summary>
          <form action={cancelOrder} className="mt-2 flex flex-col gap-2 sm:flex-row">
            <input type="hidden" name="orderId" value={order.id} />
            <Input name="reason" required minLength={3} maxLength={300} placeholder="Raison de l'annulation" aria-label="Raison de l'annulation" />
            <Button type="submit" variant="ghost">Confirmer l&apos;annulation</Button>
          </form>
        </details>
      )}
    </Card>
  );
}
