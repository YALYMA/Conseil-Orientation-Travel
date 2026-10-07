import { beforeAll, describe, expect, it } from "vitest";
import type { PGlite } from "@electric-sql/pglite";
import { asUser, freshDb } from "./helpers/pg";
import { APPLICATION_STATUSES, APPLICATION_TRANSITIONS } from "@/lib/applications/transitions";

const A = "00000000-0000-0000-0000-00000000000a";
const B = "00000000-0000-0000-0000-00000000000b";
const ADV1 = "00000000-0000-0000-0000-0000000000d1";
const ADV2 = "00000000-0000-0000-0000-0000000000d2";
const ADM = "00000000-0000-0000-0000-0000000000ad";
let db: PGlite;
const q = (u: string | null, sql: string) => asUser(db, u, sql);
const future = () => new Date(Date.now() + 86400000).toISOString();

beforeAll(async () => {
  db = await freshDb();
  for (const [id, m] of [[A, "a"], [B, "b"], [ADV1, "adv1"], [ADV2, "adv2"], [ADM, "adm"]]) await db.query("insert into auth.users (id,email) values ($1,$2)", [id, `${m}@example.test`]);
  await db.exec(`select set_config('request.jwt.claim.role','service_role',false);
    update profiles set role='advisor' where id in ('${ADV1}','${ADV2}'); update profiles set role='admin' where id='${ADM}';
    insert into advisors (id) values ('${ADV1}'),('${ADV2}');
    update students set advisor_id='${ADV1}' where id='${A}'; update students set advisor_id='${ADV2}' where id='${B}';
    update conversations set advisor_id='${ADV1}' where student_id='${A}'; update conversations set advisor_id='${ADV2}' where student_id='${B}';`);
});

describe("candidatures", () => {
  let app: string;
  it("parité TypeScript ↔ SQL des transitions", async () => {
    const ts = new Set<string>();
    for (const f of APPLICATION_STATUSES) for (const t of APPLICATION_TRANSITIONS[f]) ts.add(`${f}|${t}`);
    const r = await db.query<{ k: string }>("select from_status||'|'||to_status as k from application_transitions");
    expect(new Set(r.rows.map((x) => x.k))).toEqual(ts);
  });
  it("seul le conseiller assigné (ou admin) crée une candidature", async () => {
    await expect(q(A, `select staff_create_application('${A}','Université Exemple','Master Info',null,'2027')`)).rejects.toThrow(/personnel/);
    await expect(q(ADV2, `select staff_create_application('${A}','Université Exemple','Master Info',null,'2027')`)).rejects.toThrow(/refusé/);
    await expect(q(ADV1, `select staff_create_application('${A}','','Master Info',null,'2027')`)).rejects.toThrow(/obligatoires/);
    app = (await q(ADV1, `select staff_create_application('${A}','Université Exemple (fictive)','Master Info',null,'2027') as id`)).rows[0].id as string;
    expect(app).toBeTruthy();
  });
  it("l'étudiant voit sa candidature mais ne peut pas la modifier", async () => {
    expect((await q(A, "select id from applications")).rows).toHaveLength(1);
    expect((await q(B, "select id from applications")).rows).toHaveLength(0);
    const w = await q(A, `update applications set status='ACCEPTED' where id='${app}' returning id`).catch(() => ({ rows: [] }));
    expect(w.rows).toHaveLength(0);
    await expect(q(A, `select staff_move_application('${app}','SUBMITTED')`)).rejects.toThrow(/personnel/);
  });
  it("transitions : pas de saut, dates renseignées, historique", async () => {
    await expect(q(ADV1, `select staff_move_application('${app}','SUBMITTED')`)).rejects.toThrow(/interdite/);
    await q(ADV1, `select staff_move_application('${app}','READY_TO_SUBMIT','Dossier validé')`);
    await q(ADV1, `select staff_move_application('${app}','SUBMITTED')`);
    await q(ADV1, `select staff_move_application('${app}','WAITING','En attente de réponse')`);
    await q(ADV1, `select staff_move_application('${app}','ACCEPTED')`);
    const r = await db.query<{ status: string; submission_date: string | null; response_date: string | null }>("select status, submission_date, response_date from applications where id=$1", [app]);
    expect(r.rows[0].status).toBe("ACCEPTED");
    expect(r.rows[0].submission_date).toBeTruthy();
    expect(r.rows[0].response_date).toBeTruthy();
    const ev = await q(A, `select label from application_events where application_id='${app}' order by created_at, id`);
    expect(ev.rows.length).toBe(5);
    await expect(q(ADV1, `select staff_move_application('${app}','WITHDRAWN')`)).rejects.toThrow(/interdite/);
  });
  it("l'étudiant d'un autre ne voit pas l'historique", async () => {
    expect((await q(B, "select * from application_events")).rows).toHaveLength(0);
  });
});

describe("rendez-vous", () => {
  let ap: string;
  it("création : futur, durée et lien validés", async () => {
    await expect(q(ADV1, `select staff_create_appointment('${A}','2020-01-01T10:00:00Z',30,'orientation')`)).rejects.toThrow(/futur/);
    await expect(q(ADV1, `select staff_create_appointment('${A}','${future()}',5,'orientation')`)).rejects.toThrow(/Durée/);
    await expect(q(ADV1, `select staff_create_appointment('${A}','${future()}',30,'orientation','http://x.test')`)).rejects.toThrow(/https/);
    await expect(q(ADV2, `select staff_create_appointment('${A}','${future()}',30,'orientation')`)).rejects.toThrow(/refusé/);
    await expect(q(A, `select staff_create_appointment('${A}','${future()}',30,'orientation')`)).rejects.toThrow(/personnel/);
    ap = (await q(ADV1, `select staff_create_appointment('${A}','${future()}',45,'orientation','https://meet.example.test/x') as id`)).rows[0].id as string;
    expect((await q(A, "select kind from notifications where kind='appointment'")).rows).toHaveLength(1);
  });
  it("l'étudiant confirme/annule le sien uniquement", async () => {
    await expect(q(B, `select student_respond_appointment('${ap}','confirmed')`)).rejects.toThrow(/introuvable/);
    await expect(q(A, `select student_respond_appointment('${ap}','done')`)).rejects.toThrow(/invalide/);
    await q(A, `select student_respond_appointment('${ap}','confirmed')`);
    expect((await db.query<{ status: string }>("select status from appointments where id=$1", [ap])).rows[0].status).toBe("confirmed");
    expect((await q(B, "select * from appointments")).rows).toHaveLength(0);
  });
  it("« terminé » impossible avant l'heure du rendez-vous", async () => {
    await expect(q(ADV1, `select staff_set_appointment_status('${ap}','done')`)).rejects.toThrow(/pas encore eu lieu/);
    await db.exec(`update appointments set starts_at = now() - interval '1 hour' where id='${ap}'`);
    await q(ADV1, `select staff_set_appointment_status('${ap}','done')`);
  });
});

describe("messagerie", () => {
  let conv: string;
  beforeAll(async () => { conv = (await q(A, "select id from conversations")).rows[0].id as string; });
  it("l'étudiant voit uniquement sa conversation", async () => {
    expect((await q(A, "select id from conversations")).rows).toHaveLength(1);
    expect((await q(ADV2, `select id from conversations where id='${conv}'`)).rows).toHaveLength(0);
  });
  it("envoi : accès contrôlé, longueur contrôlée, pas d'écriture directe", async () => {
    await expect(q(B, `select send_message('${conv}','Salut')`)).rejects.toThrow(/refusé/);
    await expect(q(ADV2, `select send_message('${conv}','Salut')`)).rejects.toThrow(/refusé/);
    await expect(q(A, `select send_message('${conv}','   ')`)).rejects.toThrow(/vide/);
    await expect(q(A, `select send_message('${conv}','${"x".repeat(4001)}')`)).rejects.toThrow(/trop long/);
    await expect(q(A, `insert into messages (conversation_id, sender_id, body) values ('${conv}','${A}','direct')`)).rejects.toThrow();
  });
  it("échange étudiant ↔ conseiller avec notifications croisées", async () => {
    await q(A, `select send_message('${conv}','Bonjour, où en est mon dossier ?')`);
    expect((await q(ADV1, "select kind from notifications where kind='message'")).rows).toHaveLength(1);
    await q(ADV1, `select send_message('${conv}','Votre dossier est en cours.')`);
    expect((await q(A, "select kind from notifications where kind='message'")).rows).toHaveLength(1);
    expect((await q(A, `select id from messages where conversation_id='${conv}'`)).rows).toHaveLength(2);
    expect((await q(B, "select id from messages")).rows).toHaveLength(0);
  });
  it("lu/non lu : on ne marque lus que les messages de l'autre", async () => {
    await q(A, `select mark_conversation_read('${conv}')`);
    const r = await db.query<{ sender_id: string; read_at: string | null }>("select sender_id, read_at from messages order by created_at, id");
    expect(r.rows.find((m) => m.sender_id === ADV1)!.read_at).toBeTruthy();
    expect(r.rows.find((m) => m.sender_id === A)!.read_at).toBeNull();
    await expect(q(B, `select mark_conversation_read('${conv}')`)).rejects.toThrow(/refusé/);
  });
});
