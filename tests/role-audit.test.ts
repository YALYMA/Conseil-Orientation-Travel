import { beforeAll, describe, expect, it } from "vitest";
import type { PGlite } from "@electric-sql/pglite";
import { asUser, freshDb } from "./helpers/pg";

const A = "00000000-0000-0000-0000-00000000000a";
const B = "00000000-0000-0000-0000-00000000000b";
const ADM = "00000000-0000-0000-0000-0000000000ad";
let db: PGlite;
const logs = async (action: string) => (await db.query<{ actor_id: string | null; metadata: Record<string, unknown> }>("select actor_id, metadata from audit_logs where action=$1 order by created_at", [action])).rows;

beforeAll(async () => {
  db = await freshDb();
  for (const [id, m] of [[A, "a"], [B, "b"], [ADM, "adm"]]) await db.query("insert into auth.users (id,email) values ($1,$2)", [id, `${m}@example.test`]);
  await db.exec(`select set_config('request.jwt.claim.role','service_role',false); update profiles set role='admin' where id='${ADM}';`);
});

describe("audit des changements de rôle", () => {
  it("la promotion faite en SQL (service) est tracée, acteur inconnu", async () => {
    const r = await logs("user.role_changed");
    expect(r).toHaveLength(1);
    expect(r[0]).toEqual({ actor_id: null, metadata: { from: "student", to: "admin" } });
  });
  it("admin_set_role : exactement UNE ligne par changement", async () => {
    await asUser(db, ADM, `select admin_set_role('${A}','advisor')`);
    const r = (await logs("user.role_changed")).filter((x) => x.actor_id === ADM);
    expect(r).toEqual([{ actor_id: ADM, metadata: { from: "student", to: "advisor" } }]);
  });
  it("une mise à jour DIRECTE par un admin est désormais tracée aussi", async () => {
    await asUser(db, ADM, `update profiles set role='advisor' where id='${B}'`);
    const r = (await logs("user.role_changed")).filter((x) => x.actor_id === ADM);
    expect(r).toHaveLength(2);
    expect(r[1].metadata).toEqual({ from: "student", to: "advisor" });
  });
  it("désactivation / réactivation tracées, sans autre donnée", async () => {
    await asUser(db, ADM, `update profiles set is_active=false where id='${B}'`);
    await asUser(db, ADM, `update profiles set is_active=true where id='${B}'`);
    expect((await logs("user.status_changed")).map((x) => x.metadata)).toEqual([{ active: false }, { active: true }]);
  });
  it("une mise à jour sans changement de rôle n'écrit rien", async () => {
    const before = (await logs("user.role_changed")).length;
    await asUser(db, ADM, `update profiles set role='advisor' where id='${B}'`);
    expect((await logs("user.role_changed")).length).toBe(before);
  });
  it("la fonction de déclencheur n'est appelable par aucun client", async () => {
    await expect(asUser(db, ADM, "select audit_profile_changes()")).rejects.toThrow();
  });
});
