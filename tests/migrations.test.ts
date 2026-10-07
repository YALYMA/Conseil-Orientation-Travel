import { describe, expect, it } from "vitest";
import { freshDb } from "./helpers/pg";

describe("migrations", () => {
  it("s'appliquent sans erreur et créent les tables attendues", async () => {
    const db = await freshDb();
    const { rows } = await db.query<{ tablename: string }>("select tablename from pg_tables where schemaname='public'");
    const names = rows.map((r) => r.tablename);
    for (const t of ["profiles","students","advisors","orders","payments","payment_proofs","documents","document_versions","applications","application_events","messages","audit_logs","service_packs","pack_features"])
      expect(names).toContain(t);
    const rls = await db.query<{ tablename: string }>("select tablename from pg_tables where schemaname='public' and not rowsecurity");
    expect(rls.rows).toEqual([]);
  }, 60000);
});
