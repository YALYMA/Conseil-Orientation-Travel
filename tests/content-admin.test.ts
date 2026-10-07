import { beforeAll, describe, expect, it } from "vitest";
import type { PGlite } from "@electric-sql/pglite";
import { asUser, freshDb } from "./helpers/pg";

const A = "00000000-0000-0000-0000-00000000000a";
const ADV = "00000000-0000-0000-0000-0000000000d1";
const ADM = "00000000-0000-0000-0000-0000000000ad";
let db: PGlite;
const q = (u: string | null, sql: string) => asUser(db, u, sql);
const feats = `'[{"category":"Analyse","label":"Profil"},{"category":"","label":"Suivi"},{"label":"  "}]'::jsonb`;
const savePack = (u: string | null, id: string, slug: string, price: number, extra = "") =>
  q(u, `select admin_save_pack(${id}, '${slug}', 'Pack Test', 't', 'd', ${price}, null, '2 sem', null, array['x'], array['Frais de visa'], ${feats}, true, 1) as id ${extra}`);

beforeAll(async () => {
  db = await freshDb();
  for (const [id, m] of [[A, "a"], [ADV, "adv"], [ADM, "adm"]]) await db.query("insert into auth.users (id,email) values ($1,$2)", [id, `${m}@example.test`]);
  await db.exec(`select set_config('request.jwt.claim.role','service_role',false);
    update profiles set role='advisor' where id='${ADV}'; insert into advisors (id) values ('${ADV}'); update profiles set role='admin' where id='${ADM}';`);
});

describe("packs", () => {
  let id: string;
  it("réservé à l'admin", async () => {
    for (const u of [A, ADV, null]) await expect(savePack(u, "null", "test", 1000)).rejects.toThrow();
  });
  it("valide slug, prix et nom", async () => {
    await expect(savePack(ADM, "null", "Mauvais Slug", 1000)).rejects.toThrow(/slug/);
    await expect(savePack(ADM, "null", "ok-slug", 0)).rejects.toThrow(/Prix/);
    await expect(savePack(ADM, "null", "ok-slug", -5)).rejects.toThrow(/Prix/);
    await expect(savePack(ADM, "null", "ok-slug", 99999999)).rejects.toThrow(/Prix/);
  });
  it("crée un pack avec ses fonctionnalités (vides ignorées, catégorie par défaut)", async () => {
    id = (await savePack(ADM, "null", "test-pack", 75000)).rows[0].id as string;
    const f = await db.query<{ category: string; label: string }>("select category,label from pack_features where pack_id=$1 order by sort_order", [id]);
    expect(f.rows).toEqual([{ category: "Analyse", label: "Profil" }, { category: "Général", label: "Suivi" }]);
  });
  it("un pack inactif est invisible du public mais pas de l'admin", async () => {
    await q(ADM, `select admin_save_pack('${id}', 'test-pack', 'Pack Test', 't', 'd', 75000, null, '2 sem', null, '{}', '{}', '[]'::jsonb, false, 1)`);
    expect((await q(null, "select slug from service_packs where slug='test-pack'")).rows).toHaveLength(0);
    expect((await q(ADM, "select slug from service_packs where slug='test-pack'")).rows).toHaveLength(1);
    await q(ADM, `select admin_save_pack('${id}', 'test-pack', 'Pack Test', 't', 'd', 75000, null, '2 sem', null, '{}', '{}', '[]'::jsonb, true, 1)`);
  });
  it("changer le prix ne modifie PAS une commande existante, mais s'applique aux nouvelles", async () => {
    const oid = (await q(A, "select create_order('test-pack', null) as id")).rows[0].id as string;
    await q(ADM, `select admin_save_pack('${id}', 'test-pack', 'Pack Test', 't', 'd', 100000, null, '2 sem', null, '{}', '{}', '[]'::jsonb, true, 1)`);
    const old = (await db.query<{ price_total: number; first_amount: number }>("select price_total, first_amount from orders where id=$1", [oid])).rows[0];
    expect(old).toEqual({ price_total: 75000, first_amount: 37500 });
    await q(A, `select student_cancel_order('${oid}', 'test')`);
    const neu = (await q(A, "select create_order('test-pack', null) as id")).rows[0].id as string;
    expect((await db.query<{ price_total: number; first_amount: number }>("select price_total, first_amount from orders where id=$1", [neu])).rows[0]).toEqual({ price_total: 100000, first_amount: 50000 });
  });
  it("le changement de prix est journalisé (ancien → nouveau)", async () => {
    const r = await db.query<{ metadata: Record<string, unknown> }>("select metadata from audit_logs where action='pack.updated' and metadata ? 'price_changed'");
    expect(r.rows[0].metadata).toEqual({ price_changed: true, from: 75000, to: 100000 });
  });
  it("écriture directe impossible pour un admin (hors fonctions)", async () => {
    const r = await q(ADM, `update service_packs set price_total=1 where id='${id}' returning id`).catch(() => ({ rows: [] }));
    expect(r.rows).toHaveLength(0);
  });
});

describe("pays et procédures", () => {
  let cid: string, pid: string;
  const country = (links: string) => q(ADM, `select admin_save_country(null, 'france-test', 'France', '🇫🇷', 's', 'd', array['Université'], 'b', 'v', 'h', '${links}'::jsonb, true, 1) as id`);
  it("refuse les liens officiels non https", async () => {
    await expect(country('[{"label":"x","url":"http://example.org"}]')).rejects.toThrow(/https/);
    await expect(country('[{"label":"x","url":"javascript:alert(1)"}]')).rejects.toThrow(/https/);
    await expect(country('[{"label":"x"}]')).rejects.toThrow(/https/);
  });
  it("crée un pays avec liens officiels ; réservé à l'admin", async () => {
    await expect(q(ADV, `select admin_save_country(null, 'x-pays', 'X', '', '', '', '{}', '', '', '', '[]'::jsonb, true, 1)`)).rejects.toThrow(/administrateurs/);
    cid = (await country('[{"label":"Site officiel","url":"https://example.org/etudes"}]')).rows[0].id as string;
    expect((await q(null, "select official_links from countries where slug='france-test'")).rows).toHaveLength(1);
  });
  it("un pays non publié n'est pas visible du public", async () => {
    await q(ADM, `select admin_save_country('${cid}', 'france-test', 'France', '🇫🇷', 's', 'd', '{}', '', '', '', '[]'::jsonb, false, 1)`);
    expect((await q(null, "select 1 from countries where slug='france-test'")).rows).toHaveLength(0);
  });
  it("procédure : lien https, pays existant, suppression journalisée", async () => {
    await expect(q(ADM, `select admin_save_procedure(null, '${cid}', 'Étape 1', 'texte', array['CV'], 'http://x.org', null, 1)`)).rejects.toThrow(/https/);
    await expect(q(ADM, `select admin_save_procedure(null, '${A}', 'Étape 1', 't', '{}', '', null, 1)`)).rejects.toThrow(/Pays introuvable/);
    pid = (await q(ADM, `select admin_save_procedure(null, '${cid}', 'Étape 1', 'texte', array['CV','Passeport'], 'https://example.org/p', '2026-10-01', 1) as id`)).rows[0].id as string;
    await q(ADM, `select admin_delete_procedure('${pid}')`);
    await expect(q(ADM, `select admin_delete_procedure('${pid}')`)).rejects.toThrow(/introuvable/);
    expect((await db.query("select 1 from audit_logs where action='procedure.deleted'")).rows).toHaveLength(1);
  });
});

describe("FAQ", () => {
  it("CRUD admin, lecture publique des seules questions publiées", async () => {
    await expect(q(ADV, `select admin_save_faq(null, 'Q ?', 'R', 1, true)`)).rejects.toThrow(/administrateurs/);
    await expect(q(ADM, `select admin_save_faq(null, '  ', 'R', 1, true)`)).rejects.toThrow(/obligatoires/);
    const pub = (await q(ADM, `select admin_save_faq(null, 'Publiée ?', 'Oui', 1, true) as id`)).rows[0].id as string;
    await q(ADM, `select admin_save_faq(null, 'Brouillon ?', 'Non', 2, false)`);
    expect((await q(null, "select question from faqs")).rows.map((r) => r.question)).toEqual(["Publiée ?"]);
    await q(ADM, `select admin_delete_faq('${pub}')`);
    expect((await q(null, "select 1 from faqs")).rows).toHaveLength(0);
  });
});
