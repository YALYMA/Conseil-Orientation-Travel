import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { buildBundle } from "../scripts/bundle-sql.mjs";
import { stubbedDb } from "./helpers/pg";

const root = path.resolve(__dirname, "..");

describe("SQL d'installation unique", () => {
  it("supabase/setup.sql est à jour (sinon : npm run sql:bundle)", () => {
    expect(fs.readFileSync(path.join(root, "supabase/setup.sql"), "utf8")).toBe(buildBundle());
  });
  it("s'applique sur une base vide, puis le seed ; RLS partout ; bucket privé ; 4 packs", async () => {
    const db = await stubbedDb();
    await db.exec(buildBundle());
    await db.exec(fs.readFileSync(path.join(root, "supabase/seed.sql"), "utf8"));
    expect((await db.query("select tablename from pg_tables where schemaname='public' and not rowsecurity")).rows).toEqual([]);
    expect((await db.query<{ public: boolean }>("select public from storage.buckets where id='documents'")).rows[0].public).toBe(false);
    expect((await db.query<{ n: number }>("select count(*)::int n from service_packs")).rows[0].n).toBe(4);
    expect((await db.query<{ n: number }>("select count(*)::int n from countries where is_published")).rows[0].n).toBe(5);
  }, 60000);
  it("aucune donnée personnelle réelle dans le seed (numéros, e-mails)", () => {
    const seed = fs.readFileSync(path.join(root, "supabase/seed.sql"), "utf8");
    expect(seed).not.toMatch(/\+?221[ 0-9]{8,}/);
    expect(seed).not.toMatch(/[\w.-]+@(?!example\.test)[\w-]+\.\w+/);
  });
});
