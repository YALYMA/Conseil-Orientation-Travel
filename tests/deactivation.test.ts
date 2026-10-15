import { beforeAll, describe, expect, it } from "vitest";
import type { PGlite } from "@electric-sql/pglite";
import { asUser, freshDb } from "./helpers/pg";

const A = "00000000-0000-0000-0000-00000000000a";
const ADV = "00000000-0000-0000-0000-0000000000d1";
const ADM = "00000000-0000-0000-0000-0000000000ad";
let db: PGlite;
const q = (u: string, sql: string) => asUser(db, u, sql);
const setActive = (id: string, v: boolean) => db.exec(`select set_config('request.jwt.claim.role','service_role',false); update profiles set is_active=${v} where id='${id}'`);

beforeAll(async () => {
  db = await freshDb();
  for (const [id, m] of [[A, "a"], [ADV, "adv"], [ADM, "adm"]]) await db.query("insert into auth.users (id,email) values ($1,$2)", [id, `${m}@example.test`]);
  await db.exec(`select set_config('request.jwt.claim.role','service_role',false);
    update profiles set role='advisor' where id='${ADV}'; insert into advisors (id) values ('${ADV}'); update profiles set role='admin' where id='${ADM}';
    update students set advisor_id='${ADV}' where id='${A}';
    insert into service_packs (slug,name,price_total) values ('p','P',40000);
    insert into documents (student_id, category, name, status, current_version) values ('${A}','Passeport','Passeport fictif','uploaded',1);
    insert into storage.objects (bucket_id, name) values ('documents','${A}/fichier.pdf');`);
});

describe("un compte désactivé perd l'accès aux données immédiatement", () => {
  it("référence : tout fonctionne tant que les comptes sont actifs", async () => {
    expect((await q(ADV, "select 1 from documents")).rows).toHaveLength(1);
    expect((await q(ADV, "select 1 from storage.objects where bucket_id='documents'")).rows).toHaveLength(1);
    expect((await q(A, "select 1 from documents")).rows).toHaveLength(1);
  });
  it("conseiller désactivé : plus aucun document ni fichier de ses étudiants", async () => {
    await setActive(ADV, false);
    expect((await q(ADV, "select 1 from documents")).rows).toHaveLength(0);
    expect((await q(ADV, "select 1 from students")).rows).toHaveLength(0);
    expect((await q(ADV, "select 1 from storage.objects where bucket_id='documents'")).rows).toHaveLength(0);
    await expect(q(ADV, `select review_document((select id from documents limit 1), 'validated')`)).rejects.toThrow();
  });
  it("étudiant désactivé : plus d'accès à ses propres données ni de nouvelle commande", async () => {
    await setActive(A, false);
    expect((await q(A, "select 1 from documents")).rows).toHaveLength(0);
    expect((await q(A, "select 1 from storage.objects where bucket_id='documents'")).rows).toHaveLength(0);
    await expect(q(A, "select create_order('p', null)")).rejects.toThrow();
  });
  it("le propre profil reste lisible (pour afficher « compte désactivé »)", async () => {
    expect((await q(A, "select is_active from profiles where id = auth.uid()")).rows[0]).toEqual({ is_active: false });
  });
  it("la réactivation rétablit l'accès", async () => {
    await setActive(ADV, true); await setActive(A, true);
    expect((await q(ADV, "select 1 from documents")).rows).toHaveLength(1);
    expect((await q(ADV, "select 1 from storage.objects where bucket_id='documents'")).rows).toHaveLength(1);
    expect((await q(A, "select 1 from documents")).rows).toHaveLength(1);
  });
  it("un admin désactivé perd ses droits d'administration", async () => {
    await setActive(ADM, false);
    expect((await q(ADM, "select 1 from documents")).rows).toHaveLength(0);
    await expect(q(ADM, `select admin_set_role('${A}','advisor')`)).rejects.toThrow(/administrateurs/);
    await setActive(ADM, true);
  });
});
