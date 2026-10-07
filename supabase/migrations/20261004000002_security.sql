-- Fonctions d'aide (SECURITY DEFINER pour éviter la récursion RLS)
create or replace function current_role_code() returns text
language sql stable security definer set search_path = public as $$
  select role from profiles where id = auth.uid() and is_active
$$;

create or replace function is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce(current_role_code() = 'admin', false)
$$;

create or replace function is_staff() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce(current_role_code() in ('advisor','admin'), false)
$$;

-- Vrai si l'utilisateur courant est l'étudiant, son conseiller assigné, ou un admin
create or replace function can_access_student(sid uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select auth.uid() is not null and (
    auth.uid() = sid
    or is_admin()
    or exists (select 1 from students s where s.id = sid and s.advisor_id = auth.uid())
  )
$$;

-- Création automatique du profil à l'inscription : TOUJOURS étudiant (le rôle ne vient jamais des métadonnées client)
create or replace function handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into profiles (id, role, full_name, phone)
  values (new.id, 'student', new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'phone');
  insert into students (id) values (new.id);
  insert into conversations (student_id) values (new.id);
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function handle_new_user();

-- Empêche l'élévation de privilège : seul un admin peut changer role / is_active
create or replace function guard_profile_update() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if (new.role is distinct from old.role or new.is_active is distinct from old.is_active)
     and not (auth.role() = 'service_role' or is_admin()) then
    raise exception 'Modification du rôle non autorisée';
  end if;
  return new;
end $$;
create trigger trg_profiles_guard before update on profiles for each row execute function guard_profile_update();

-- Empêche l'étudiant de se réassigner un conseiller
create or replace function guard_student_update() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.advisor_id is distinct from old.advisor_id and not (auth.role() = 'service_role' or is_admin()) then
    raise exception 'Assignation réservée aux administrateurs';
  end if;
  return new;
end $$;
create trigger trg_students_guard before update on students for each row execute function guard_student_update();

-- Les montants d'une commande sont immuables côté client
create or replace function guard_order_update() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if (new.price_total, new.first_amount, new.balance_amount, new.pack_id, new.student_id)
     is distinct from (old.price_total, old.first_amount, old.balance_amount, old.pack_id, old.student_id)
     and not (auth.role() = 'service_role' or is_admin()) then
    raise exception 'Montants non modifiables';
  end if;
  return new;
end $$;
create trigger trg_orders_guard before update on orders for each row execute function guard_order_update();

-- ───────── RLS : activation sur toutes les tables ─────────
do $$ declare t text; begin
  for t in select tablename from pg_tables where schemaname='public' loop
    execute format('alter table %I enable row level security', t);
  end loop;
end $$;

-- Contenus publics (lecture anonyme des éléments publiés ; écriture admin)
create policy roles_read on roles for select using (true);
create policy countries_read on countries for select using (is_published or is_admin());
create policy countries_admin on countries for all using (is_admin()) with check (is_admin());
create policy procedures_read on country_procedures for select using (true);
create policy procedures_admin on country_procedures for all using (is_admin()) with check (is_admin());
create policy levels_read on study_levels for select using (true);
create policy levels_admin on study_levels for all using (is_admin()) with check (is_admin());
create policy domains_read on domains for select using (true);
create policy domains_admin on domains for all using (is_admin()) with check (is_admin());
create policy institutions_read on institutions for select using (true);
create policy institutions_admin on institutions for all using (is_admin()) with check (is_admin());
create policy programs_read on programs for select using (status = 'published' or is_staff());
create policy programs_admin on programs for all using (is_admin()) with check (is_admin());
create policy packs_read on service_packs for select using (is_active or is_admin());
create policy packs_admin on service_packs for all using (is_admin()) with check (is_admin());
create policy features_read on pack_features for select using (true);
create policy features_admin on pack_features for all using (is_admin()) with check (is_admin());
create policy questions_read on orientation_questions for select using (is_active or is_admin());
create policy questions_admin on orientation_questions for all using (is_admin()) with check (is_admin());
create policy blog_read on blog_posts for select using (status = 'published' or is_admin());
create policy blog_admin on blog_posts for all using (is_admin()) with check (is_admin());
create policy faqs_read on faqs for select using (is_published or is_admin());
create policy faqs_admin on faqs for all using (is_admin()) with check (is_admin());
create policy testimonials_read on testimonials for select using (is_published or is_admin());
create policy testimonials_admin on testimonials for all using (is_admin()) with check (is_admin());
create policy settings_read on site_settings for select using (is_public or is_admin());
create policy settings_admin on site_settings for all using (is_admin()) with check (is_admin());

-- Profils
create policy profiles_self on profiles for select using (id = auth.uid() or is_admin() or can_access_student(id));
create policy profiles_update_self on profiles for update using (id = auth.uid() or is_admin()) with check (id = auth.uid() or is_admin());
create policy profiles_admin_insert on profiles for insert with check (is_admin());
create policy advisors_read on advisors for select using (id = auth.uid() or is_admin() or exists (select 1 from students s where s.id = auth.uid() and s.advisor_id = advisors.id));
create policy advisors_admin on advisors for all using (is_admin()) with check (is_admin());
create policy students_read on students for select using (can_access_student(id));
create policy students_update on students for update using (can_access_student(id)) with check (can_access_student(id));

-- Données étudiant : propriétaire OU conseiller assigné OU admin
create policy projects_rw on student_projects for all using (can_access_student(student_id)) with check (can_access_student(student_id));
create policy steps_rw on project_steps for all
  using (exists (select 1 from student_projects p where p.id = project_id and can_access_student(p.student_id)))
  with check (exists (select 1 from student_projects p where p.id = project_id and can_access_student(p.student_id)));
create policy apps_read on applications for select using (can_access_student(student_id));
create policy apps_staff_write on applications for all using (is_staff() and can_access_student(student_id)) with check (is_staff() and can_access_student(student_id));
create policy app_events_read on application_events for select
  using (exists (select 1 from applications a where a.id = application_id and can_access_student(a.student_id)));
create policy app_events_staff on application_events for insert
  with check (is_staff() and exists (select 1 from applications a where a.id = application_id and can_access_student(a.student_id)));
create policy appts_read on appointments for select using (can_access_student(student_id));
create policy appts_staff on appointments for all using (is_staff() and can_access_student(student_id)) with check (is_staff() and can_access_student(student_id));
create policy orient_results_rw on orientation_results for select using (student_id is not null and can_access_student(student_id));
create policy orient_answers_read on orientation_answers for select
  using (exists (select 1 from orientation_results r where r.id = result_id and r.student_id is not null and can_access_student(r.student_id)));

-- Documents : lecture propriétaire/conseiller/admin ; un étudiant ne valide jamais lui-même
create policy docs_read on documents for select using (can_access_student(student_id));
create policy docs_student_insert on documents for insert with check (student_id = auth.uid() and status in ('requested','uploaded'));
create policy docs_staff_update on documents for update using (is_staff() and can_access_student(student_id)) with check (is_staff() and can_access_student(student_id));
create policy docs_student_update on documents for update using (student_id = auth.uid() and status in ('requested','to_fix','rejected','uploaded'))
  with check (student_id = auth.uid() and status in ('requested','uploaded'));
create policy docs_delete on documents for delete using ((student_id = auth.uid() and status in ('requested','uploaded','to_fix','rejected')) or is_admin());
create policy docv_read on document_versions for select
  using (exists (select 1 from documents d where d.id = document_id and can_access_student(d.student_id)));
create policy docv_insert on document_versions for insert
  with check (uploaded_by = auth.uid() and exists (select 1 from documents d where d.id = document_id and can_access_student(d.student_id)));

-- Commandes & paiements : lecture ; AUCUNE écriture directe côté client (passe par le serveur / service role)
create policy orders_read on orders for select using (can_access_student(student_id));
create policy order_items_read on order_items for select using (exists (select 1 from orders o where o.id = order_id and can_access_student(o.student_id)));
create policy payments_read on payments for select using (exists (select 1 from orders o where o.id = order_id and can_access_student(o.student_id)));
create policy proofs_read on payment_proofs for select using (exists (select 1 from payments p join orders o on o.id = p.order_id where p.id = payment_id and can_access_student(o.student_id)));

-- Messagerie
create policy conv_read on conversations for select using (can_access_student(student_id));
create policy msgs_read on messages for select using (exists (select 1 from conversations c where c.id = conversation_id and can_access_student(c.student_id)));
create policy msgs_insert on messages for insert with check (sender_id = auth.uid() and exists (select 1 from conversations c where c.id = conversation_id and can_access_student(c.student_id)));
create policy msgs_mark_read on messages for update using (sender_id <> auth.uid() and exists (select 1 from conversations c where c.id = conversation_id and can_access_student(c.student_id)));

-- Notifications : strictement personnelles
create policy notif_read on notifications for select using (user_id = auth.uid());
create policy notif_update on notifications for update using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Audit : lecture admin uniquement ; écriture via service role (serveur) uniquement
create policy audit_read on audit_logs for select using (is_admin());
-- rate_limits : aucune policy → accessible uniquement par le service role

-- ───────── Stockage privé ─────────
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('documents', 'documents', false, 10485760,
  array['application/pdf','image/jpeg','image/png','application/vnd.openxmlformats-officedocument.wordprocessingml.document'])
on conflict (id) do update set public = false;

-- Chemin attendu : {student_id}/{fichier}. Le propriétaire dépose ; lecture : propriétaire / conseiller assigné / admin.
create policy storage_docs_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'documents' and (storage.foldername(name))[1] = auth.uid()::text);
create policy storage_docs_select on storage.objects for select to authenticated
  using (bucket_id = 'documents' and can_access_student(((storage.foldername(name))[1])::uuid));
create policy storage_docs_delete on storage.objects for delete to authenticated
  using (bucket_id = 'documents' and (((storage.foldername(name))[1] = auth.uid()::text) or is_admin()));
