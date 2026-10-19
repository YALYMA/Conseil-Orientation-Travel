import { beforeAll, describe, expect, it } from "vitest";
import type { PGlite } from "@electric-sql/pglite";
import { asUser, freshDb } from "./helpers/pg";

const A = "00000000-0000-0000-0000-00000000000a";
const B = "00000000-0000-0000-0000-00000000000b";
const ADV1 = "00000000-0000-0000-0000-0000000000d1";
const ADV2 = "00000000-0000-0000-0000-0000000000d2";
let db: PGlite;
const q = (u: string | null, sql: string) => asUser(db, u, sql);
const save = (u: string, sid: string, extra = "'master'") => q(u, `select save_project('${sid}', null, 'licence', 'informatique', 2027, 'Devenir ingénieur', ${extra === "'master'" ? "'2 à 4.000.000 FCFA'" : extra})`);

beforeAll(async () => {
  db = await freshDb();
  await db.exec(`insert into study_levels values ('licence','Licence',1); insert into domains values ('informatique','Informatique',1);`);
  for (const [id, m] of [[A, "a"], [B, "b"], [ADV1, "adv1"], [ADV2, "adv2"]]) await db.query("insert into auth.users (id,email) values ($1,$2)", [id, `${m}@example.test`]);
  await db.exec(`select set_config('request.jwt.claim.role','service_role',false);
    update profiles set role='advisor' where id in ('${ADV1}','${ADV2}'); insert into advisors (id) values ('${ADV1}'),('${ADV2}');
    update students set advisor_id='${ADV1}' where id='${A}'; update students set advisor_id='${ADV2}' where id='${B}';`);
});

describe("projet de l'étudiant", () => {
  it("l'étudiant crée son projet ; visa et départ sont initialisés", async () => {
    await save(A, A);
    const s = await db.query<{ code: string; status: string }>("select code,status from project_steps order by code");
    expect(s.rows).toEqual([{ code: "depart", status: "todo" }, { code: "visa", status: "todo" }]);
  });
  it("il ne peut pas écrire le projet d'un autre ni écrire en direct", async () => {
    await expect(save(A, B)).rejects.toThrow(/refusé/);
    const r = await q(A, `update student_projects set progress=100 where student_id='${A}' returning id`).catch(() => ({ rows: [] }));
    expect(r.rows).toHaveLength(0);
  });
  it("le conseiller assigné modifie, pas un autre ; année invalide refusée", async () => {
    await q(ADV1, `select save_project('${A}', null, 'licence', 'informatique', 2028, 'Devenir ingénieur', '2 à 4.000.000 FCFA')`);
    await expect(q(ADV2, `select save_project('${A}', null, 'licence', 'informatique', 2028, 'x', 'y')`)).rejects.toThrow(/refusé/);
    await expect(q(ADV1, `select save_project('${A}', null, 'licence', 'informatique', 1999, 'x', 'y')`)).rejects.toThrow(/Année/);
  });
  it("l'historique liste les champs modifiés, sans leurs valeurs", async () => {
    const r = await db.query<{ metadata: { fields: string[] } }>("select metadata from audit_logs where action='project.updated' order by created_at");
    expect(r.rows[0].metadata.fields).toEqual(["création"]);
    expect(r.rows[1].metadata.fields).toEqual(["année"]);
    expect(JSON.stringify(r.rows)).not.toMatch(/ingénieur|FCFA|2028/);
  });
  it("une sauvegarde sans changement n'ajoute pas d'historique", async () => {
    const before = (await db.query("select 1 from audit_logs where action='project.updated'")).rows.length;
    await q(ADV1, `select save_project('${A}', null, 'licence', 'informatique', 2028, 'Devenir ingénieur', '2 à 4.000.000 FCFA')`);
    expect((await db.query("select 1 from audit_logs where action='project.updated'")).rows.length).toBe(before);
  });
  it("seul le personnel assigné fait avancer visa/départ", async () => {
    await expect(q(A, `select staff_set_step('${A}','visa','done')`)).rejects.toThrow(/personnel/);
    await expect(q(ADV2, `select staff_set_step('${A}','visa','done')`)).rejects.toThrow(/refusé/);
    await expect(q(ADV1, `select staff_set_step('${A}','entretien','done')`)).rejects.toThrow(/invalide/);
    await q(ADV1, `select staff_set_step('${A}','visa','in_progress')`);
    expect((await db.query<{ status: string }>("select status from project_steps where code='visa'")).rows[0].status).toBe("in_progress");
  });
  it("étape sur un projet inexistant refusée", async () => {
    await expect(q(ADV2, `select staff_set_step('${B}','visa','done')`)).rejects.toThrow(/pas encore défini/);
  });
  it("un étudiant ne voit pas le projet d'un autre", async () => {
    await save(B, B);
    expect((await q(A, "select student_id from student_projects")).rows.map((r) => r.student_id)).toEqual([A]);
    expect((await q(A, "select code from project_steps")).rows).toHaveLength(2);
  });
});
