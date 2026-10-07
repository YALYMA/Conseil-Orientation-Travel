import { beforeAll, describe, expect, it } from "vitest";
import type { PGlite } from "@electric-sql/pglite";
import { asUser, freshDb } from "./helpers/pg";

const A = "00000000-0000-0000-0000-00000000000a";
const B = "00000000-0000-0000-0000-00000000000b";
const ADV1 = "00000000-0000-0000-0000-0000000000d1";
const ADV2 = "00000000-0000-0000-0000-0000000000d2";
let db: PGlite;
const q = (u: string | null, sql: string) => asUser(db, u, sql);
const hit = async (b: string, limit: number, win = 60) => (await db.query<{ ok: boolean }>("select rate_limit_hit($1,$2,$3) as ok", [b, limit, win])).rows[0].ok;

beforeAll(async () => {
  db = await freshDb();
  for (const [id, m] of [[A, "a"], [B, "b"], [ADV1, "adv1"], [ADV2, "adv2"]]) await db.query("insert into auth.users (id,email) values ($1,$2)", [id, `${m}@example.test`]);
  await db.exec(`select set_config('request.jwt.claim.role','service_role',false);
    update profiles set role='advisor' where id in ('${ADV1}','${ADV2}'); insert into advisors (id) values ('${ADV1}'),('${ADV2}');
    update students set advisor_id='${ADV1}' where id='${A}'; update students set advisor_id='${ADV2}' where id='${B}';`);
});

describe("limitation anti-abus", () => {
  it("autorise jusqu'à la limite puis refuse", async () => {
    const r = [await hit("t1", 3), await hit("t1", 3), await hit("t1", 3), await hit("t1", 3), await hit("t1", 3)];
    expect(r).toEqual([true, true, true, false, false]);
  });
  it("les compteurs sont indépendants par clé", async () => {
    expect(await hit("autre", 1)).toBe(true);
    expect(await hit("autre", 1)).toBe(false);
    expect(await hit("encore-une-autre", 1)).toBe(true);
  });
  it("une nouvelle fenêtre remet le compteur à zéro", async () => {
    await db.query("insert into rate_limits (bucket, window_start, hits) values ('vieux', now() - interval '3 hours', 99)");
    expect(await hit("vieux", 2, 60)).toBe(true);
  });
  it("refuse des paramètres invalides", async () => {
    await expect(db.query("select rate_limit_hit('x', 0, 60)")).rejects.toThrow(/invalides/);
    await expect(db.query("select rate_limit_hit('x', 5, 0)")).rejects.toThrow(/invalides/);
    await expect(db.query("select rate_limit_hit($1, 5, 60)", ["x".repeat(201)])).rejects.toThrow(/invalides/);
  });
  it("aucun client (anonyme ou connecté) ne peut appeler la fonction", async () => {
    await expect(q(null, "select rate_limit_hit('x', 5, 60)")).rejects.toThrow();
    await expect(q(A, "select rate_limit_hit('x', 5, 60)")).rejects.toThrow();
  });
  it("la table n'est lisible par aucun client", async () => {
    expect((await q(A, "select * from rate_limits")).rows).toHaveLength(0);
    expect((await q(null, "select * from rate_limits")).rows).toHaveLength(0);
  });
});

describe("journal des consultations de documents", () => {
  let doc: string;
  beforeAll(async () => {
    doc = (await db.query<{ id: string }>("insert into documents (student_id, category, name, status, current_version) values ($1,'Passeport','Passeport fictif','uploaded',1) returning id", [A])).rows[0].id;
  });
  const count = async () => (await db.query("select 1 from audit_logs where action='document.accessed'")).rows.length;
  it("la consultation par le conseiller assigné est tracée", async () => {
    await q(ADV1, `select log_document_access('${doc}')`);
    expect(await count()).toBe(1);
    const m = (await db.query<{ metadata: Record<string, string> }>("select metadata from audit_logs where action='document.accessed'")).rows[0].metadata;
    expect(m).toEqual({ role: "advisor" });
  });
  it("la consultation par le propriétaire n'est pas tracée", async () => {
    await q(A, `select log_document_access('${doc}')`);
    expect(await count()).toBe(1);
  });
  it("un conseiller non assigné ou un autre étudiant est refusé, sans trace", async () => {
    await expect(q(ADV2, `select log_document_access('${doc}')`)).rejects.toThrow(/refusé/);
    await expect(q(B, `select log_document_access('${doc}')`)).rejects.toThrow(/refusé/);
    await expect(q(null, `select log_document_access('${doc}')`)).rejects.toThrow();
    expect(await count()).toBe(1);
  });
});
