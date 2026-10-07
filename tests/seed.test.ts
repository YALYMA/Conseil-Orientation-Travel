import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { freshDb } from "./helpers/pg";
import { splitPayment } from "@/lib/payments/split";

describe("seed", () => {
  it("se charge et respecte le modèle commercial", async () => {
    const db = await freshDb();
    await db.exec(fs.readFileSync(path.resolve(__dirname, "../supabase/seed.sql"), "utf8"));
    const packs = await db.query<{ slug: string; price_total: number; excluded_services: string[] }>(
      "select slug, price_total, excluded_services from service_packs order by sort_order");
    expect(packs.rows.map((p) => [p.slug, p.price_total])).toEqual([
      ["orientation", 20000], ["audit-correction", 40000], ["candidature", 75000], ["premium", 120000]]);
    for (const p of packs.rows) {
      expect(p.excluded_services).toContain("Frais de visa");
      const s = splitPayment(p.price_total);
      expect(s.first + s.balance).toBe(p.price_total);
    }
    const c = await db.query<{ slug: string }>("select slug from countries order by sort_order");
    expect(c.rows.map((r) => r.slug)).toEqual(["france", "belgique", "luxembourg", "italie", "maroc"]);
    const demo = await db.query<{ n: number }>("select count(*)::int n from institutions where is_demo");
    expect(demo.rows[0].n).toBeGreaterThan(0);
  }, 60000);
});
