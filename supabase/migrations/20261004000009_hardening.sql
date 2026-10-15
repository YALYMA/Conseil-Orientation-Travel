-- Durcissement issu de l'audit de sécurité : on supprime les écritures directes qui contournaient les règles métier.

-- ─── 1. Stockage : plus aucune écriture/suppression directe par les clients ────────────────────────────
-- Seul le serveur (clé de service, après validation) dépose et supprime. Un étudiant ne peut donc plus
-- contourner la validation des fichiers, ni effacer le fichier d'un document déjà validé.
drop policy if exists storage_docs_insert on storage.objects;
drop policy if exists storage_docs_delete on storage.objects;
drop policy if exists storage_docs_select on storage.objects;
-- Lecture : comparaison de texte (pas de conversion en uuid : un nom inattendu ne fait plus échouer la requête).
create policy storage_docs_select on storage.objects for select to authenticated
  using (bucket_id = 'documents' and (
    (storage.foldername(name))[1] = auth.uid()::text
    or is_admin()
    or exists (select 1 from students s where s.id::text = (storage.foldername(name))[1] and s.advisor_id = auth.uid())
  ));

-- ─── 2. Réglages (numéro Wave, WhatsApp…) : écriture UNIQUEMENT via admin_update_setting (validation + audit) ──
drop policy if exists settings_admin on site_settings;

-- ─── 3. Documents : suppression via fonction (audit + chemins renvoyés pour nettoyer le stockage) ───────
drop policy if exists docs_delete on documents;
create or replace function delete_document(p_document uuid) returns text[]
language plpgsql security definer set search_path = public, pg_temp as $$
declare d documents; paths text[];
begin
  if auth.uid() is null then raise exception 'Connexion requise'; end if;
  select * into d from documents where id = p_document;
  -- même message pour « absent » et « pas à vous » : pas d'énumération
  if not found or not (d.student_id = auth.uid() or is_admin()) then raise exception 'Document introuvable'; end if;
  if d.status = 'validated' and not is_admin() then raise exception 'Un document validé ne peut pas être supprimé'; end if;
  select coalesce(array_agg(storage_path), '{}') into paths from document_versions where document_id = p_document;
  delete from documents where id = p_document;
  insert into audit_logs (actor_id, action, resource, resource_id, metadata)
  values (auth.uid(), 'document.deleted', 'documents', p_document, jsonb_build_object('versions', coalesce(array_length(paths, 1), 0), 'by_admin', d.student_id <> auth.uid()));
  return paths;
end $$;

-- ─── 4. Notifications : on ne peut que marquer comme lu (pas modifier titre / lien) ──────────────────────
drop policy if exists notif_update on notifications;
create or replace function mark_notifications_read(p_ids uuid[] default null) returns int
language plpgsql security definer set search_path = public, pg_temp as $$
declare n int;
begin
  if auth.uid() is null then raise exception 'Connexion requise'; end if;
  update notifications set read_at = now() where user_id = auth.uid() and read_at is null and (p_ids is null or id = any(p_ids));
  get diagnostics n = row_count;
  return n;
end $$;

-- ─── 5. Profils : mise à jour validée ; contraintes de format et de longueur ────────────────────────────
drop policy if exists profiles_update_self on profiles;
create policy profiles_update_admin on profiles for update using (is_admin()) with check (is_admin());
alter table profiles add constraint profiles_name_len check (full_name is null or length(full_name) <= 120);
alter table profiles add constraint profiles_phone_fmt check (phone is null or phone ~ '^\+?[0-9 ]{8,18}$');
alter table students add constraint students_city_len check (city is null or length(city) <= 80);
alter table students add constraint students_level_len check (current_level is null or length(current_level) <= 40);

create or replace function update_my_profile(p_name text, p_phone text) returns void
language plpgsql security definer set search_path = public, pg_temp as $$
declare nm text := trim(coalesce(p_name, '')); ph text := trim(coalesce(p_phone, ''));
begin
  if auth.uid() is null then raise exception 'Connexion requise'; end if;
  if length(nm) not between 2 and 120 then raise exception 'Nom invalide'; end if;
  if ph !~ '^\+?[0-9 ]{8,18}$' then raise exception 'Numéro de téléphone invalide'; end if;
  update profiles set full_name = nm, phone = ph where id = auth.uid();
end $$;

-- L'inscription peut se faire directement via l'API Supabase (clé publique) : on assainit au lieu d'échouer.
create or replace function handle_new_user() returns trigger
language plpgsql security definer set search_path = public, pg_temp as $$
declare nm text := nullif(left(trim(coalesce(new.raw_user_meta_data->>'full_name', '')), 120), '');
        ph text := new.raw_user_meta_data->>'phone';
begin
  if ph is null or ph !~ '^\+?[0-9 ]{8,18}$' then ph := null; end if;
  insert into profiles (id, role, full_name, phone) values (new.id, 'student', nm, ph);
  insert into students (id) values (new.id);
  insert into conversations (student_id) values (new.id);
  return new;
end $$;

-- ─── 6. Droits d'exécution : fonctions de déclencheur non appelables, nouvelles fonctions réservées aux connectés ──
revoke execute on function handle_new_user(), guard_profile_update(), guard_student_update(), guard_order_update(), set_updated_at() from public, anon, authenticated;
revoke execute on function delete_document(uuid), mark_notifications_read(uuid[]), update_my_profile(text, text) from public, anon;
grant execute on function delete_document(uuid), mark_notifications_read(uuid[]), update_my_profile(text, text) to authenticated;
