import { beforeAll, describe, expect, it } from "vitest";
import type { PGlite } from "@electric-sql/pglite";
import { asUser, freshDb } from "./helpers/pg";

const A = "00000000-0000-0000-0000-00000000000a"; // étudiant A (fictif)
const B = "00000000-0000-0000-0000-00000000000b"; // étudiant B (fictif)
const ADV1 = "00000000-0000-0000-0000-0000000000d1"; // conseiller assigné à A
const ADV2 = "00000000-0000-0000-0000-0000000000d2"; // autre conseiller
const ADM = "00000000-0000-0000-0000-0000000000ad";

let db: PGlite;
let orderA: string;
let paymentA: string;

beforeAll(async () => {
  db = await freshDb();
  for (const [id, mail] of [[A,"a"],[B,"b"],[ADV1,"adv1"],[ADV2,"adv2"],[ADM,"adm"]]) {
    await db.query("insert into auth.users (id, email) values ($1, $2)", [id, `${mail}@example.test`]);
  }
  // promotions faites « côté serveur » (service role)
  await db.exec(`select set_config('request.jwt.claim.role','service_role',false);
    update profiles set role='advisor' where id in ('${ADV1}','${ADV2}');
    update profiles set role='admin' where id='${ADM}';
    insert into advisors (id) values ('${ADV1}'),('${ADV2}');
    update students set advisor_id='${ADV1}' where id='${A}';
    update students set advisor_id='${ADV2}' where id='${B}';`);
  const pack = await db.query<{ id: string }>(
    "insert into service_packs (slug,name,price_total) values ('candidature','Candidature',75000) returning id");
  const o = await db.query<{ id: string }>(
    "insert into orders (student_id,pack_id,price_total,first_amount,balance_amount) values ($1,$2,75000,37500,37500) returning id",
    [A, pack.rows[0].id]);
  orderA = o.rows[0].id;
  const p = await db.query<{ id: string }>(
    "insert into payments (order_id,stage,amount) values ($1,'initial',37500) returning id", [orderA]);
  paymentA = p.rows[0].id;
  await db.query("insert into documents (student_id,category,name,status) values ($1,'passeport','Passeport fictif','uploaded'),($2,'passeport','Passeport fictif B','uploaded')", [A, B]);
});

describe("RLS — documents", () => {
  it("un étudiant ne voit que ses documents", async () => {
    const r = await asUser(db, A, "select student_id from documents");
    expect(r.rows.map((x) => x.student_id)).toEqual([A]);
  });
  it("un étudiant ne voit jamais les documents d'un autre", async () => {
    const r = await asUser(db, B, `select * from documents where student_id='${A}'`);
    expect(r.rows).toHaveLength(0);
  });
  it("le conseiller assigné voit son étudiant, pas les autres", async () => {
    const r = await asUser(db, ADV1, "select student_id from documents");
    expect(r.rows.map((x) => x.student_id)).toEqual([A]);
  });
  it("un autre conseiller ne voit pas ce dossier", async () => {
    const r = await asUser(db, ADV2, `select * from documents where student_id='${A}'`);
    expect(r.rows).toHaveLength(0);
  });
  it("l'admin voit tout", async () => {
    const r = await asUser(db, ADM, "select * from documents");
    expect(r.rows).toHaveLength(2);
  });
  it("un anonyme ne voit rien", async () => {
    const r = await asUser(db, null, "select * from documents");
    expect(r.rows).toHaveLength(0);
  });
  it("un étudiant ne peut pas valider son propre document", async () => {
    const r = await asUser(db, A, `update documents set status='validated' where student_id='${A}' returning id`).catch(() => ({ rows: [] }));
    expect(r.rows).toHaveLength(0);
  });
  it("le conseiller assigné peut valider (via review_document)", async () => {
    const d = await db.query<{ id: string }>("select id from documents where student_id=$1", [A]);
    await asUser(db, ADV1, `select review_document('${d.rows[0].id}', 'validated')`);
    const r = await db.query<{ status: string }>("select status from documents where id=$1", [d.rows[0].id]);
    expect(r.rows[0].status).toBe("validated");
  });
  it("un conseiller non assigné ne peut pas valider", async () => {
    const d = await db.query<{ id: string }>("select id from documents where student_id=$1", [B]);
    await expect(asUser(db, ADV1, `select review_document('${d.rows[0].id}', 'validated')`)).rejects.toThrow(/refusé/);
  });
});

describe("RLS — paiements & commandes", () => {
  it("un étudiant ne voit pas la commande d'un autre", async () => {
    expect((await asUser(db, B, "select * from orders")).rows).toHaveLength(0);
    expect((await asUser(db, A, "select * from orders")).rows).toHaveLength(1);
  });
  it("un étudiant ne peut pas confirmer un paiement", async () => {
    const r = await asUser(db, A, `update payments set status='confirmed' where id='${paymentA}' returning id`).catch(() => ({ rows: [] }));
    expect(r.rows).toHaveLength(0);
    const s = await db.query<{ status: string }>("select status from payments where id=$1", [paymentA]);
    expect(s.rows[0].status).toBe("pending");
  });
  it("un étudiant ne peut pas modifier le montant de sa commande", async () => {
    const r = await asUser(db, A, `update orders set price_total=1000, first_amount=500, balance_amount=500 where id='${orderA}' returning id`).catch(() => ({ rows: [] }));
    expect(r.rows).toHaveLength(0);
    const s = await db.query<{ price_total: number }>("select price_total from orders where id=$1", [orderA]);
    expect(s.rows[0].price_total).toBe(75000);
  });
  it("un étudiant ne peut pas créer de commande/paiement directement", async () => {
    await expect(asUser(db, A, `insert into payments (order_id,stage,amount) values ('${orderA}','balance',1)`)).rejects.toThrow();
  });
  it("les montants incohérents sont refusés par contrainte", async () => {
    await expect(db.query("update orders set first_amount=1 where id=$1", [orderA])).rejects.toThrow();
  });
});

describe("RBAC — élévation de privilège", () => {
  it("un étudiant ne peut pas se promouvoir admin", async () => {
    // Plus de politique d'écriture sur profiles pour un étudiant : la modification n'a aucun effet.
    const upd = await asUser(db, A, `update profiles set role='admin' where id='${A}' returning id`).catch(() => ({ rows: [] }));
    expect(upd.rows).toHaveLength(0);
    const r = await db.query<{ role: string }>("select role from profiles where id=$1", [A]);
    expect(r.rows[0].role).toBe("student");
  });
  it("un étudiant ne peut pas se réassigner un conseiller", async () => {
    await expect(asUser(db, A, `update students set advisor_id='${ADV2}' where id='${A}'`)).rejects.toThrow();
  });
  it("seul l'admin lit les audit logs", async () => {
    await db.exec(`insert into audit_logs (actor_id, action, resource) values ('${ADM}','payment.confirm','payments')`);
    expect((await asUser(db, A, "select * from audit_logs")).rows).toHaveLength(0);
    expect((await asUser(db, ADV1, "select * from audit_logs")).rows).toHaveLength(0);
    const adminLogs = await asUser(db, ADM, "select action from audit_logs");
    expect(adminLogs.rows.map((r) => r.action)).toContain("payment.confirm");
  });
  it("les profils des autres étudiants sont invisibles", async () => {
    const r = await asUser(db, A, "select id from profiles");
    expect(r.rows.map((x) => x.id)).toEqual([A]);
  });
});

describe("Stockage privé", () => {
  it("le bucket documents n'est pas public", async () => {
    const r = await db.query<{ public: boolean }>("select public from storage.buckets where id='documents'");
    expect(r.rows[0].public).toBe(false);
  });
  it("un étudiant ne peut PLUS écrire dans le stockage (dépôt réservé au serveur)", async () => {
    await expect(asUser(db, A, `insert into storage.objects (bucket_id,name) values ('documents','${B}/hack.pdf')`)).rejects.toThrow();
    await expect(asUser(db, A, `insert into storage.objects (bucket_id,name) values ('documents','${A}/ok.pdf')`)).rejects.toThrow();
  });
  it("un fichier du bucket est lisible par son propriétaire et son conseiller", async () => {
    await db.query("insert into storage.objects (bucket_id,name) values ('documents', $1)", [`${A}/ok.pdf`]);
    expect((await asUser(db, A, `select name from storage.objects where bucket_id='documents'`)).rows).toHaveLength(1);
  });
  it("un autre étudiant ne peut pas lire l'objet", async () => {
    expect((await asUser(db, B, `select * from storage.objects where name like '${A}/%'`)).rows).toHaveLength(0);
    expect((await asUser(db, ADV1, `select * from storage.objects where name like '${A}/%'`)).rows).toHaveLength(1);
  });
});
