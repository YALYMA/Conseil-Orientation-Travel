import { beforeAll, describe, expect, it } from "vitest";
import type { PGlite } from "@electric-sql/pglite";
import { asUser, freshDb } from "./helpers/pg";

const A = "00000000-0000-0000-0000-00000000000a";
const B = "00000000-0000-0000-0000-00000000000b";
const ADV1 = "00000000-0000-0000-0000-0000000000d1";
const ADV2 = "00000000-0000-0000-0000-0000000000d2";
const ADM = "00000000-0000-0000-0000-0000000000ad";
let db: PGlite;
const q = (u: string | null, sql: string) => asUser(db, u, sql);
const PDF = "application/pdf";

beforeAll(async () => {
  db = await freshDb();
  for (const [id, m] of [[A, "a"], [B, "b"], [ADV1, "adv1"], [ADV2, "adv2"], [ADM, "adm"]]) await db.query("insert into auth.users (id,email) values ($1,$2)", [id, `${m}@example.test`]);
  await db.exec(`select set_config('request.jwt.claim.role','service_role',false);
    update profiles set role='advisor' where id in ('${ADV1}','${ADV2}'); update profiles set role='admin' where id='${ADM}';
    insert into advisors (id) values ('${ADV1}'),('${ADV2}');
    update students set advisor_id='${ADV1}' where id='${A}'; update students set advisor_id='${ADV2}' where id='${B}';`);
});

describe("administration", () => {
  it("seul l'admin change un rôle", async () => {
    await expect(q(A, `select admin_set_role('${B}','admin')`)).rejects.toThrow(/administrateurs/);
    await expect(q(ADV1, `select admin_set_role('${B}','admin')`)).rejects.toThrow(/administrateurs/);
    await expect(q(null, `select admin_set_role('${B}','admin')`)).rejects.toThrow();
  });
  it("l'admin ne peut pas se retirer son propre rôle ni définir un rôle inconnu", async () => {
    await expect(q(ADM, `select admin_set_role('${ADM}','student')`)).rejects.toThrow(/propre rôle/);
    await expect(q(ADM, `select admin_set_role('${B}','superuser')`)).rejects.toThrow(/invalide/);
  });
  it("changement de rôle journalisé", async () => {
    await q(ADM, `select admin_set_role('${B}','advisor')`);
    const r = await db.query<{ metadata: Record<string, string> }>("select metadata from audit_logs where action='user.role_changed'");
    expect(r.rows[0].metadata).toEqual({ from: "student", to: "advisor" });
    await q(ADM, `select admin_set_role('${B}','student')`);
  });
  it("assignation : conseiller valide uniquement", async () => {
    await expect(q(ADM, `select admin_assign_advisor('${A}','${B}')`)).rejects.toThrow(/invalide/);
    await q(ADM, `select admin_assign_advisor('${A}','${ADV2}')`);
    expect((await db.query<{ advisor_id: string }>("select advisor_id from students where id=$1", [A])).rows[0].advisor_id).toBe(ADV2);
    await q(ADM, `select admin_assign_advisor('${A}','${ADV1}')`);
  });
  it("réglages : validation du numéro et du lien, accès admin seul", async () => {
    await expect(q(ADV1, `select admin_update_setting('wave','{"phone":"+221770000000"}')`)).rejects.toThrow();
    await expect(q(ADM, `select admin_update_setting('wave','{"phone":"abc"}')`)).rejects.toThrow(/invalide/);
    await expect(q(ADM, `select admin_update_setting('wave','{"payment_url":"http://x.test"}')`)).rejects.toThrow(/https/);
    await expect(q(ADM, `select admin_update_setting('secret','{}')`)).rejects.toThrow(/inconnu/);
    await q(ADM, `select admin_update_setting('wave','{"phone":"+221 77 000 00 00","display_name":"Test"}')`);
    expect((await q(null, "select value from site_settings where key='wave'")).rows).toHaveLength(1);
  });
  it("le journal ne contient pas les valeurs des réglages", async () => {
    const r = await db.query<{ metadata: Record<string, unknown> }>("select metadata from audit_logs where action='setting.updated'");
    for (const x of r.rows) expect(JSON.stringify(x.metadata)).not.toContain("77 000");
  });
});

describe("documents", () => {
  let doc: string;
  it("l'étudiant dépose dans son propre dossier uniquement", async () => {
    await expect(q(A, `select register_document_upload('Passeport','Passeport fictif','${B}/x.pdf','${PDF}',1000)`)).rejects.toThrow(/Chemin/);
    await expect(q(A, `select register_document_upload('Passeport','x','${A}/../${B}/x.pdf','${PDF}',1000)`)).rejects.toThrow(/Chemin/);
    const r = await q(A, `select register_document_upload('Passeport','Passeport fictif','${A}/v1.pdf','${PDF}',1000) as id`);
    doc = r.rows[0].id as string;
    expect((await db.query<{ status: string }>("select status from documents where id=$1", [doc])).rows[0].status).toBe("uploaded");
  });
  it("refuse type interdit, fichier vide ou trop gros, non-étudiant", async () => {
    await expect(q(A, `select register_document_upload('x','y','${A}/a.exe','application/x-msdownload',10)`)).rejects.toThrow(/non autorisé/);
    await expect(q(A, `select register_document_upload('x','y','${A}/a.pdf','${PDF}',0)`)).rejects.toThrow(/Taille/);
    await expect(q(A, `select register_document_upload('x','y','${A}/a.pdf','${PDF}',20000000)`)).rejects.toThrow(/Taille/);
    await expect(q(ADV1, `select register_document_upload('x','y','${ADV1}/a.pdf','${PDF}',10)`)).rejects.toThrow(/étudiants/);
  });
  it("le conseiller assigné est notifié", async () => {
    expect((await q(ADV1, "select kind from notifications where kind='document_uploaded'")).rows).toHaveLength(1);
    expect((await q(ADV2, "select kind from notifications where kind='document_uploaded'")).rows).toHaveLength(0);
  });
  it("un étudiant ne peut pas se valider lui-même ni écrire directement", async () => {
    await expect(q(A, `select review_document('${doc}','validated')`)).rejects.toThrow(/personnel/);
    const r = await q(A, `update documents set status='validated' where id='${doc}' returning id`).catch(() => ({ rows: [] }));
    expect(r.rows).toHaveLength(0);
  });
  it("un conseiller non assigné ne peut pas relire le document", async () => {
    await expect(q(ADV2, `select review_document('${doc}','validated')`)).rejects.toThrow(/refusé/);
    expect((await q(ADV2, `select * from document_versions`)).rows).toHaveLength(0);
  });
  it("correction : commentaire obligatoire, puis nouvelle version", async () => {
    await expect(q(ADV1, `select review_document('${doc}','to_fix')`)).rejects.toThrow(/raison/);
    await q(ADV1, `select review_document('${doc}','to_fix','Scan illisible')`);
    expect((await q(A, "select kind from notifications where kind='document_to_fix'")).rows).toHaveLength(1);
    await q(A, `select register_document_upload('','','${A}/v2.pdf','${PDF}',2000,'${doc}')`);
    const r = await db.query<{ current_version: number; status: string; advisor_comment: string | null }>("select current_version,status,advisor_comment from documents where id=$1", [doc]);
    expect(r.rows[0]).toEqual({ current_version: 2, status: "uploaded", advisor_comment: null });
    expect((await q(A, "select version from document_versions order by version")).rows.map((x) => x.version)).toEqual([1, 2]);
  });
  it("un document validé ne peut plus être remplacé", async () => {
    await q(ADV1, `select review_document('${doc}','validated')`);
    await expect(q(A, `select register_document_upload('','','${A}/v3.pdf','${PDF}',2000,'${doc}')`)).rejects.toThrow(/validé/);
  });
  it("un étudiant ne peut pas remplacer le document d'un autre", async () => {
    await expect(q(B, `select register_document_upload('','','${B}/z.pdf','${PDF}',100,'${doc}')`)).rejects.toThrow(/introuvable/);
  });
  it("audit des dépôts et revues, sans nom de fichier", async () => {
    const r = await db.query<{ action: string; metadata: Record<string, unknown> }>("select action, metadata from audit_logs where resource='documents'");
    expect(r.rows.map((x) => x.action)).toEqual(expect.arrayContaining(["document.uploaded", "document.to_fix", "document.validated"]));
    expect(JSON.stringify(r.rows)).not.toMatch(/\.pdf|Passeport/);
  });
});
