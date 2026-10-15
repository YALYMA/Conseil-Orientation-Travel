import { beforeAll, describe, expect, it } from "vitest";
import type { PGlite } from "@electric-sql/pglite";
import { asUser, freshDb, stubbedDb } from "./helpers/pg";
import { buildBundle } from "../scripts/bundle-sql.mjs";

const A = "00000000-0000-0000-0000-00000000000a";
const B = "00000000-0000-0000-0000-00000000000b";
const ADV = "00000000-0000-0000-0000-0000000000d1";
const ADM = "00000000-0000-0000-0000-0000000000ad";
let db: PGlite;
const q = (u: string | null, sql: string) => asUser(db, u, sql);

beforeAll(async () => {
  db = await freshDb();
  for (const [id, m] of [[A, "a"], [B, "b"], [ADV, "adv"], [ADM, "adm"]]) await db.query("insert into auth.users (id,email) values ($1,$2)", [id, `${m}@example.test`]);
  await db.exec(`select set_config('request.jwt.claim.role','service_role',false);
    update profiles set role='advisor' where id='${ADV}'; insert into advisors (id) values ('${ADV}'); update profiles set role='admin' where id='${ADM}';
    update students set advisor_id='${ADV}' where id='${A}';`);
});

describe("stockage : aucune écriture directe", () => {
  it("un étudiant ne peut ni déposer ni supprimer un objet", async () => {
    await expect(q(A, `insert into storage.objects (bucket_id,name) values ('documents','${A}/x.pdf')`)).rejects.toThrow();
    await db.query("insert into storage.objects (bucket_id,name) values ('documents',$1)", [`${A}/valide.pdf`]);
    const del = await q(A, `delete from storage.objects where name='${A}/valide.pdf' returning id`).catch(() => ({ rows: [] }));
    expect(del.rows).toHaveLength(0);
    expect((await db.query("select 1 from storage.objects where name=$1", [`${A}/valide.pdf`])).rows).toHaveLength(1);
  });
  it("même un admin ne supprime pas par l'API publique (le serveur utilise la clé de service)", async () => {
    const del = await q(ADM, `delete from storage.objects where name='${A}/valide.pdf' returning id`).catch(() => ({ rows: [] }));
    expect(del.rows).toHaveLength(0);
  });
  it("un nom de fichier inattendu dans un autre bucket ne casse pas la lecture", async () => {
    await db.query("insert into storage.objects (bucket_id,name) values ('autre','logo.png')");
    await expect(q(A, "select name from storage.objects")).resolves.toBeTruthy();
  });
  it("lecture : propriétaire, conseiller assigné, admin ; pas un autre étudiant", async () => {
    const n = async (u: string) => (await q(u, `select 1 from storage.objects where name like '${A}/%'`)).rows.length;
    expect([await n(A), await n(ADV), await n(ADM), await n(B)]).toEqual([1, 1, 1, 0]);
  });
});

describe("réglages de paiement", () => {
  it("l'écriture directe est impossible, même pour un admin ; la fonction auditée fonctionne", async () => {
    await q(ADM, `select admin_update_setting('wave','{"phone":"+221 77 000 00 00"}')`);
    const direct = await q(ADM, `update site_settings set value='{"phone":"+221 70 666 66 66"}' where key='wave' returning key`).catch(() => ({ rows: [] }));
    expect(direct.rows).toHaveLength(0);
    expect((await db.query<{ value: { phone: string } }>("select value from site_settings where key='wave'")).rows[0].value.phone).toBe("+221 77 000 00 00");
    expect((await db.query("select 1 from audit_logs where action='setting.updated'")).rows.length).toBeGreaterThan(0);
  });
});

describe("suppression de document", () => {
  let doc: string, valid: string;
  beforeAll(async () => {
    doc = (await q(A, `select register_document_upload('CV','Mon CV','${A}/v1.pdf','application/pdf',1000) as id`)).rows[0].id as string;
    await q(A, `select register_document_upload('','','${A}/v2.pdf','application/pdf',1200,'${doc}')`);
    valid = (await q(A, `select register_document_upload('Passeport','Passeport fictif','${A}/p.pdf','application/pdf',1000) as id`)).rows[0].id as string;
    await q(ADV, `select review_document('${valid}','validated')`);
  });
  it("suppression directe par SQL impossible (plus de politique DELETE)", async () => {
    const r = await q(A, `delete from documents where id='${doc}' returning id`).catch(() => ({ rows: [] }));
    expect(r.rows).toHaveLength(0);
  });
  it("un étudiant ne supprime ni le document d'un autre ni un document validé", async () => {
    await expect(q(B, `select delete_document('${doc}')`)).rejects.toThrow(/introuvable/);
    await expect(q(A, `select delete_document('${valid}')`)).rejects.toThrow(/validé/);
    await expect(q(ADV, `select delete_document('${doc}')`)).rejects.toThrow(/introuvable/);
    await expect(q(null, `select delete_document('${doc}')`)).rejects.toThrow();
  });
  it("renvoie les chemins à effacer du stockage, supprime les versions et journalise", async () => {
    const r = await q(A, `select delete_document('${doc}') as p`);
    expect((r.rows[0].p as string[]).sort()).toEqual([`${A}/v1.pdf`, `${A}/v2.pdf`]);
    expect((await db.query("select 1 from document_versions where document_id=$1", [doc])).rows).toHaveLength(0);
    const log = (await db.query<{ metadata: Record<string, unknown> }>("select metadata from audit_logs where action='document.deleted'")).rows[0].metadata;
    expect(log).toEqual({ versions: 2, by_admin: false });
  });
  it("l'admin peut supprimer un document validé (effacement à la demande)", async () => {
    const r = await q(ADM, `select delete_document('${valid}') as p`);
    expect(r.rows[0].p).toEqual([`${A}/p.pdf`]);
  });
});

describe("notifications et profils", () => {
  it("on ne peut que marquer ses notifications comme lues", async () => {
    await db.exec(`insert into notifications (user_id, kind, title, link) values ('${A}','x','Titre','/app/paiements'), ('${B}','x','Autre','/app/paiements')`);
    const upd = await q(A, `update notifications set title='Piraté', link='https://evil.test' where user_id='${A}' returning id`).catch(() => ({ rows: [] }));
    expect(upd.rows).toHaveLength(0);
    const unreadBefore = (await db.query("select 1 from notifications where user_id=$1 and read_at is null", [A])).rows.length;
    expect(unreadBefore).toBeGreaterThanOrEqual(1);
    expect((await q(A, "select mark_notifications_read() as n")).rows[0].n).toBe(unreadBefore);
    expect((await db.query("select 1 from notifications where user_id=$1 and read_at is null", [A])).rows).toHaveLength(0);
    expect((await db.query("select 1 from notifications where user_id=$1 and read_at is null", [B])).rows).toHaveLength(1);
    expect((await db.query<{ title: string }>("select title from notifications where user_id=$1", [A])).rows[0].title).toBe("Titre");
  });
  it("profil : mise à jour validée uniquement par la fonction", async () => {
    const direct = await q(A, `update profiles set full_name='Direct' where id='${A}' returning id`).catch(() => ({ rows: [] }));
    expect(direct.rows).toHaveLength(0);
    await expect(q(A, `select update_my_profile('A', '+221 77 000 00 00')`)).rejects.toThrow(/Nom/);
    await expect(q(A, `select update_my_profile('Abdoulaye Fall', 'pas un numéro')`)).rejects.toThrow(/téléphone/);
    await q(A, `select update_my_profile('  Abdoulaye Fall  ', '+221 77 000 00 00')`);
    expect((await db.query<{ full_name: string }>("select full_name from profiles where id=$1", [A])).rows[0].full_name).toBe("Abdoulaye Fall");
    await expect(q(null, `select update_my_profile('Nom valide', '+221 77 000 00 00')`)).rejects.toThrow();
  });
  it("contraintes en base : nom et téléphone bornés", async () => {
    await expect(db.query("update profiles set full_name=$1 where id=$2", ["x".repeat(121), A])).rejects.toThrow();
    await expect(db.query("update profiles set phone='<script>' where id=$1", [A])).rejects.toThrow();
    await expect(db.query("update students set city=$1 where id=$2", ["v".repeat(81), A])).rejects.toThrow();
  });
  it("inscription directe via l'API Supabase : métadonnées assainies, jamais d'échec ni de rôle choisi", async () => {
    const id = "00000000-0000-0000-0000-0000000000f1";
    await db.query("insert into auth.users (id,email,raw_user_meta_data) values ($1,'x@example.test',$2)", [id, JSON.stringify({ full_name: "N".repeat(500), phone: "<script>alert(1)</script>", role: "admin" })]);
    const p = (await db.query<{ role: string; full_name: string; phone: string | null }>("select role, full_name, phone from profiles where id=$1", [id])).rows[0];
    expect(p.role).toBe("student");
    expect(p.full_name).toHaveLength(120);
    expect(p.phone).toBeNull();
  });
});

describe("exposition des fonctions SQL (garde-fou permanent)", () => {
  let clean: PGlite;
  beforeAll(async () => { clean = await stubbedDb(); await clean.exec(buildBundle()); }, 60000);
  const callable = async (role: string) =>
    (await clean.query<{ proname: string }>(`select proname from pg_proc p join pg_namespace n on n.oid = p.pronamespace
      where n.nspname='public' and prosecdef and has_function_privilege('${role}', p.oid, 'execute') order by 1`)).rows.map((r) => r.proname);

  it("un visiteur anonyme ne peut exécuter que les 4 fonctions d'aide à la RLS", async () => {
    expect(await callable("anon")).toEqual(["can_access_student", "current_role_code", "is_admin", "is_staff"]);
  });
  it("un utilisateur connecté ne peut pas exécuter les fonctions internes, de déclencheur ou réservées au serveur", async () => {
    const fns = await callable("authenticated");
    for (const forbidden of ["internal_transition", "notify_user", "rate_limit_hit", "handle_new_user", "guard_profile_update", "guard_student_update", "guard_order_update"])
      expect(fns).not.toContain(forbidden);
    for (const needed of ["create_order", "staff_transition", "delete_document", "mark_notifications_read", "update_my_profile", "admin_set_role"]) expect(fns).toContain(needed);
  });
  it("seul le rôle de service peut appeler la limitation anti-abus", async () => {
    expect(await callable("service_role")).toContain("rate_limit_hit");
  });
  it("toute fonction SECURITY DEFINER fixe son search_path avec pg_temp en dernier", async () => {
    const r = await clean.query<{ proname: string; proconfig: string[] | null }>("select proname, proconfig from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and prosecdef");
    expect(r.rows.length).toBeGreaterThan(20);
    for (const f of r.rows) expect(f.proconfig?.join(",") ?? "", f.proname).toContain("search_path=public, pg_temp");
  });
  it("aucune table publique sans RLS, aucune policy « using (true) » d'écriture", async () => {
    expect((await clean.query("select tablename from pg_tables where schemaname='public' and not rowsecurity")).rows).toEqual([]);
    const w = await clean.query<{ policyname: string; qual: string | null }>("select policyname, qual from pg_policies where schemaname='public' and cmd <> 'SELECT'");
    for (const p of w.rows) expect(p.qual?.trim(), p.policyname).not.toBe("true");
  });
});
