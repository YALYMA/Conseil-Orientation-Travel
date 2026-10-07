-- Projet de l'étudiant (historisé) et étapes manuelles Visa / Départ.
-- L'entretien est déduit des rendez-vous ; le reste de la progression est calculé depuis les données réelles.

create or replace function save_project(p_student uuid, p_country uuid, p_level text, p_domain text, p_year int, p_goal text, p_budget text)
returns void language plpgsql security definer set search_path = public as $$
declare cur student_projects; changed text[] := '{}'; pid uuid;
begin
  if auth.uid() is null or not can_access_student(p_student) then raise exception 'Accès refusé'; end if;
  if p_year is not null and (p_year < 2026 or p_year > 2035) then raise exception 'Année invalide'; end if;
  select * into cur from student_projects where student_id = p_student;
  if not found then
    insert into student_projects (student_id, country_id, level, domain, target_year, career_goal, budget_range, created_by)
    values (p_student, p_country, p_level, p_domain, p_year, left(p_goal, 500), left(p_budget, 80), auth.uid()) returning id into pid;
    insert into project_steps (project_id, code, label, sort_order) values (pid, 'visa', 'Visa', 8), (pid, 'depart', 'Départ', 9);
    changed := array['création'];
  else
    if cur.country_id is distinct from p_country then changed := array_append(changed, 'pays'::text); end if;
    if cur.level is distinct from p_level then changed := array_append(changed, 'niveau'::text); end if;
    if cur.domain is distinct from p_domain then changed := array_append(changed, 'domaine'::text); end if;
    if cur.target_year is distinct from p_year then changed := array_append(changed, 'année'::text); end if;
    if cur.career_goal is distinct from left(p_goal, 500) then changed := array_append(changed, 'objectif'::text); end if;
    if cur.budget_range is distinct from left(p_budget, 80) then changed := array_append(changed, 'budget'::text); end if;
    update student_projects set country_id = p_country, level = p_level, domain = p_domain, target_year = p_year,
      career_goal = left(p_goal, 500), budget_range = left(p_budget, 80) where student_id = p_student;
  end if;
  -- historique : noms des champs modifiés uniquement (pas leurs valeurs)
  if array_length(changed, 1) > 0 then
    insert into audit_logs (actor_id, action, resource, resource_id, metadata)
    values (auth.uid(), 'project.updated', 'student_projects', p_student, jsonb_build_object('fields', to_jsonb(changed)));
  end if;
end $$;

create or replace function staff_set_step(p_student uuid, p_code text, p_status text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if current_role_code() not in ('advisor','admin') then raise exception 'Réservé au personnel'; end if;
  if not can_access_student(p_student) then raise exception 'Accès refusé'; end if;
  if p_code not in ('visa','depart') or p_status not in ('todo','in_progress','done') then raise exception 'Étape invalide'; end if;
  update project_steps set status = p_status, updated_at = now()
  where code = p_code and project_id = (select id from student_projects where student_id = p_student);
  if not found then raise exception 'Le projet de l''étudiant n''est pas encore défini'; end if;
  insert into audit_logs (actor_id, action, resource, resource_id, metadata)
  values (auth.uid(), 'project.step_changed', 'student_projects', p_student, jsonb_build_object('step', p_code, 'to', p_status));
end $$;

revoke execute on function save_project(uuid, uuid, text, text, int, text, text), staff_set_step(uuid, text, text) from public, anon;
grant execute on function save_project(uuid, uuid, text, text, int, text, text), staff_set_step(uuid, text, text) to authenticated;

-- Plus d'écriture directe : tout passe par les fonctions ci-dessus (donc journalisé).
drop policy if exists projects_rw on student_projects;
drop policy if exists steps_rw on project_steps;
create policy projects_read on student_projects for select using (can_access_student(student_id));
create policy steps_read on project_steps for select
  using (exists (select 1 from student_projects p where p.id = project_id and can_access_student(p.student_id)));
