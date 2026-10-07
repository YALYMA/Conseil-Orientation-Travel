import { beforeAll, describe, expect, it } from "vitest";
import type { PGlite } from "@electric-sql/pglite";
import { asUser, freshDb } from "./helpers/pg";
import { TRANSITIONS, ORDER_STATUSES } from "@/lib/payments/workflow";

const A = "00000000-0000-0000-0000-00000000000a";
const B = "00000000-0000-0000-0000-00000000000b";
const ADV1 = "00000000-0000-0000-0000-0000000000d1";
const ADV2 = "00000000-0000-0000-0000-0000000000d2";
const ADM = "00000000-0000-0000-0000-0000000000ad";

let db: PGlite;
const q = (uid: string | null, sql: string) => asUser(db, uid, sql);
const status = async (id: string) => (await db.query<{ status: string }>("select status from orders where id=$1", [id])).rows[0].status;
const pay = async (id: string, stage: string) => (await db.query<{ status: string }>("select status from payments where order_id=$1 and stage=$2", [id, stage])).rows[0].status;

async function newOrder(uid: string, slug = "candidature") {
  const r = await q(uid, `select create_order('${slug}', null) as id`);
  return r.rows[0].id as string;
}

beforeAll(async () => {
  db = await freshDb();
  for (const [id, m] of [[A, "a"], [B, "b"], [ADV1, "adv1"], [ADV2, "adv2"], [ADM, "adm"]]) await db.query("insert into auth.users (id,email) values ($1,$2)", [id, `${m}@example.test`]);
  await db.exec(`select set_config('request.jwt.claim.role','service_role',false);
    update profiles set role='advisor' where id in ('${ADV1}','${ADV2}'); update profiles set role='admin' where id='${ADM}';
    insert into advisors (id) values ('${ADV1}'),('${ADV2}');
    update students set advisor_id='${ADV1}' where id='${A}'; update students set advisor_id='${ADV2}' where id='${B}';
    insert into service_packs (slug,name,price_total) values ('orientation','Orientation',20000),('audit','Audit',40000),('candidature','Candidature',75000),('premium','Premium',120000);`);
});

describe("parité TypeScript ↔ SQL", () => {
  it("la table order_transitions est identique au workflow TS", async () => {
    const ts = new Set<string>();
    for (const from of ORDER_STATUSES) for (const t of TRANSITIONS[from]) for (const a of t.actors) ts.add(`${from}|${t.to}|${a}|${!!t.requiresReason}`);
    const rows = await db.query<{ k: string }>("select from_status||'|'||to_status||'|'||actor||'|'||requires_reason as k from order_transitions");
    expect(new Set(rows.rows.map((r) => r.k))).toEqual(ts);
  });
});

describe("calcul serveur du 50/50", () => {
  it.each([["orientation", 10000, 10000], ["audit", 20000, 20000], ["candidature", 37500, 37500], ["premium", 60000, 60000]])(
    "%s", async (slug, first, balance) => {
      const id = await newOrder(slug === "orientation" ? A : slug === "audit" ? B : slug === "candidature" ? A : B, slug);
      const o = (await db.query<{ first_amount: number; balance_amount: number; status: string }>("select * from orders where id=$1", [id])).rows[0];
      expect([o.first_amount, o.balance_amount]).toEqual([first, balance]);
      expect(o.status).toBe("FIRST_PAYMENT_PENDING");
      const p = await db.query<{ amount: number }>("select amount from payments where order_id=$1 order by stage", [id]);
      expect(p.rows.map((x) => x.amount)).toEqual([balance, first]);
    });
  it("refuse un doublon de commande ouverte pour un même pack", async () => {
    await expect(q(A, "select create_order('candidature', null)")).rejects.toThrow(/déjà en cours/);
  });
  it("refuse un pack inconnu et un non-étudiant", async () => {
    await expect(q(B, "select create_order('nimporte-quoi', null)")).rejects.toThrow();
    await expect(q(ADV1, "select create_order('candidature', null)")).rejects.toThrow(/étudiants/);
    await expect(q(null, "select create_order('candidature', null)")).rejects.toThrow();
  });
});

describe("parcours complet de paiement", () => {
  let id: string;
  beforeAll(async () => { id = await newOrder(B, "orientation").catch(async () => (await db.query<{ id: string }>("select id from orders where student_id=$1 and status='FIRST_PAYMENT_PENDING' limit 1", [B])).rows[0].id); });

  it("une preuve n'est PAS un paiement validé", async () => {
    await q(B, `select submit_payment_proof('${id}', 'WAVE-123', 'capture envoyée')`);
    expect(await status(id)).toBe("FIRST_PAYMENT_PROOF_SUBMITTED");
    expect(await pay(id, "initial")).not.toBe("confirmed");
  });
  it("l'étudiant ne peut pas faire avancer sa commande", async () => {
    await expect(q(B, `select staff_transition('${id}','FIRST_PAYMENT_CONFIRMED')`)).rejects.toThrow(/personnel/);
    await expect(q(B, `select internal_transition('${id}','FIRST_PAYMENT_CONFIRMED','admin',null)`)).rejects.toThrow();
  });
  it("un conseiller non assigné ne peut pas valider", async () => {
    await expect(q(ADV1, `select staff_transition('${id}','FIRST_PAYMENT_UNDER_REVIEW')`)).rejects.toThrow(/refusé/);
  });
  it("saut d'étape refusé", async () => {
    await expect(q(ADV2, `select staff_transition('${id}','FIRST_PAYMENT_CONFIRMED')`)).rejects.toThrow(/interdite/);
  });
  it("rejet : raison obligatoire, puis nouvelle tentative possible", async () => {
    await q(ADV2, `select staff_transition('${id}','FIRST_PAYMENT_UNDER_REVIEW')`);
    expect(await pay(id, "initial")).toBe("under_review");
    await expect(q(ADV2, `select staff_transition('${id}','REJECTED')`)).rejects.toThrow(/raison/);
    await q(ADV2, `select staff_transition('${id}','REJECTED','Montant reçu incorrect')`);
    expect(await status(id)).toBe("REJECTED");
    expect(await pay(id, "initial")).toBe("rejected");
    await q(ADM, `select staff_transition('${id}','FIRST_PAYMENT_PENDING')`);
    expect(await pay(id, "initial")).toBe("pending");
    await q(B, `select submit_payment_proof('${id}')`);
    await q(ADV2, `select staff_transition('${id}','FIRST_PAYMENT_UNDER_REVIEW')`);
  });
  it("validation du 1er paiement → service actif", async () => {
    await q(ADV2, `select staff_transition('${id}','FIRST_PAYMENT_CONFIRMED')`);
    expect(await status(id)).toBe("SERVICE_ACTIVE");
    expect(await pay(id, "initial")).toBe("confirmed");
    expect(await pay(id, "balance")).toBe("pending");
  });
  it("le solde ne peut pas être payé avant la finalisation", async () => {
    await expect(q(B, `select submit_payment_proof('${id}')`)).rejects.toThrow(/Aucun paiement attendu/);
  });
  it("finalisation → solde dû → preuve → validation → terminé", async () => {
    await q(ADV2, `select staff_transition('${id}','SERVICE_IN_PROGRESS')`);
    await q(ADV2, `select staff_transition('${id}','SERVICE_READY_FOR_FINAL_PAYMENT')`);
    const n = await q(B, "select kind from notifications where kind='balance_due'");
    expect(n.rows).toHaveLength(1);
    await q(B, `select submit_payment_proof('${id}', 'WAVE-999')`);
    expect(await status(id)).toBe("BALANCE_PROOF_SUBMITTED");
    await q(ADV2, `select staff_transition('${id}','BALANCE_CONFIRMED')`);
    expect(await status(id)).toBe("COMPLETED");
    expect(await pay(id, "balance")).toBe("confirmed");
  });
  it("COMPLETED est terminal", async () => {
    await expect(q(ADM, `select staff_transition('${id}','CANCELLED','test')`)).rejects.toThrow(/interdite/);
  });
  it("audit : chaque changement est journalisé, sans donnée sensible", async () => {
    const r = await db.query<{ action: string; metadata: Record<string, unknown> }>("select action, metadata from audit_logs where resource_id=$1", [id]);
    expect(r.rows.length).toBeGreaterThanOrEqual(10);
    expect(r.rows.map((x) => x.action)).toContain("order.first_payment_confirmed");
    for (const x of r.rows) expect(Object.keys(x.metadata).sort()).toEqual(["actor", "from", "to"]);
  });
  it("les montants restent inchangés de bout en bout", async () => {
    const o = (await db.query<{ price_total: number }>("select price_total from orders where id=$1", [id])).rows[0];
    expect(o.price_total).toBe(20000);
  });
});

describe("annulation et isolation", () => {
  it("l'étudiant annule avec raison avant paiement ; pas la commande d'un autre", async () => {
    const id = await newOrder(A, "premium");
    await expect(q(B, `select student_cancel_order('${id}','x')`)).rejects.toThrow(/introuvable/);
    await expect(q(A, `select student_cancel_order('${id}','')`)).rejects.toThrow(/raison/);
    await q(A, `select student_cancel_order('${id}','Changement de projet')`);
    expect(await status(id)).toBe("CANCELLED");
  });
  it("l'étudiant ne peut pas annuler après activation du service", async () => {
    const id = await newOrder(A, "audit");
    await q(A, `select submit_payment_proof('${id}')`);
    await q(ADV1, `select staff_transition('${id}','FIRST_PAYMENT_UNDER_REVIEW')`);
    await q(ADV1, `select staff_transition('${id}','FIRST_PAYMENT_CONFIRMED')`);
    await expect(q(A, `select student_cancel_order('${id}','je veux annuler')`)).rejects.toThrow(/interdite/);
  });
});
