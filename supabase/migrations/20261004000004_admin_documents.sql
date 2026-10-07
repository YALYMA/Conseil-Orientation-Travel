-- Opérations d'administration et de documents : toutes journalisées, toutes contrôlées en base.

create or replace function admin_set_role(p_user uuid, p_role text) returns void
language plpgsql security definer set search_path = public as $$
declare old_role text;
begin
  if not is_admin() then raise exception 'Réservé aux administrateurs'; end if;
  if p_role not in ('student','advisor','admin') then raise exception 'Rôle invalide'; end if;
  if p_user = auth.uid() then raise exception 'Vous ne pouvez pas modifier votre propre rôle'; end if;
  select role into old_role from profiles where id = p_user;
  if old_role is null then raise exception 'Utilisateur introuvable'; end if;
  update profiles set role = p_role where id = p_user;
  if p_role = 'advisor' then insert into advisors (id) values (p_user) on conflict do nothing; end if;
  insert into audit_logs (actor_id, action, resource, resource_id, metadata)
  values (auth.uid(), 'user.role_changed', 'profiles', p_user, jsonb_build_object('from', old_role, 'to', p_role));
end $$;

create or replace function admin_assign_advisor(p_student uuid, p_advisor uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not is_admin() then raise exception 'Réservé aux administrateurs'; end if;
  if p_advisor is not null and not exists (select 1 from profiles where id = p_advisor and role = 'advisor' and is_active) then
    raise exception 'Conseiller invalide';
  end if;
  update students set advisor_id = p_advisor where id = p_student;
  if not found then raise exception 'Étudiant introuvable'; end if;
  update conversations set advisor_id = p_advisor where student_id = p_student;
  insert into audit_logs (actor_id, action, resource, resource_id, metadata)
  values (auth.uid(), 'student.advisor_assigned', 'students', p_student, jsonb_build_object('advisor', p_advisor));
  if p_advisor is not null then
    perform notify_user(p_advisor, 'student_assigned', 'Nouvel étudiant assigné', null, '/advisor/paiements');
  end if;
end $$;

create or replace function admin_update_setting(p_key text, p_value jsonb) returns void
language plpgsql security definer set search_path = public as $$
declare phone text; url text;
begin
  if not is_admin() then raise exception 'Réservé aux administrateurs'; end if;
  if p_key not in ('wave','whatsapp','contact','stats') then raise exception 'Réglage inconnu'; end if;
  phone := coalesce(p_value->>'phone', '');
  if phone <> '' and phone !~ '^\+?[0-9 ]{8,18}$' then raise exception 'Numéro de téléphone invalide'; end if;
  url := coalesce(p_value->>'payment_url', p_value->>'business_url', '');
  if url <> '' and url !~ '^https://' then raise exception 'Le lien doit commencer par https://'; end if;
  insert into site_settings (key, value, is_public, updated_by) values (p_key, p_value, true, auth.uid())
  on conflict (key) do update set value = excluded.value, updated_at = now(), updated_by = auth.uid();
  -- on journalise la clé modifiée, pas les valeurs
  insert into audit_logs (actor_id, action, resource, metadata) values (auth.uid(), 'setting.updated', 'site_settings', jsonb_build_object('key', p_key));
end $$;

-- Dépôt d'un document (nouveau ou nouvelle version). Le fichier est déjà dans le bucket privé.
create or replace function register_document_upload(p_category text, p_name text, p_path text, p_mime text, p_size int, p_document uuid default null)
returns uuid language plpgsql security definer set search_path = public as $$
declare did uuid; ver int; st text; sid uuid;
begin
  if auth.uid() is null or coalesce(current_role_code(), '') <> 'student' then raise exception 'Réservé aux étudiants'; end if;
  if p_path not like auth.uid()::text || '/%' or p_path like '%..%' then raise exception 'Chemin de fichier invalide'; end if;
  if p_mime not in ('application/pdf','image/jpeg','image/png','application/vnd.openxmlformats-officedocument.wordprocessingml.document') then raise exception 'Type de fichier non autorisé'; end if;
  if p_size <= 0 or p_size > 10485760 then raise exception 'Taille de fichier invalide'; end if;
  if p_document is null then
    if coalesce(trim(p_category), '') = '' or coalesce(trim(p_name), '') = '' then raise exception 'Catégorie et nom obligatoires'; end if;
    insert into documents (student_id, category, name, status, created_by) values (auth.uid(), left(p_category, 60), left(p_name, 120), 'uploaded', auth.uid()) returning id into did;
  else
    select id, status into did, st from documents where id = p_document and student_id = auth.uid() for update;
    if did is null then raise exception 'Document introuvable'; end if;
    if st = 'validated' then raise exception 'Un document validé ne peut pas être remplacé'; end if;
  end if;
  select coalesce(max(version), 0) + 1 into ver from document_versions where document_id = did;
  insert into document_versions (document_id, version, storage_path, mime_type, size_bytes, uploaded_by) values (did, ver, p_path, p_mime, p_size, auth.uid());
  update documents set current_version = ver, status = 'uploaded', advisor_comment = null where id = did;
  insert into audit_logs (actor_id, action, resource, resource_id, metadata) values (auth.uid(), 'document.uploaded', 'documents', did, jsonb_build_object('version', ver));
  for sid in select advisor_id from students where id = auth.uid() and advisor_id is not null loop
    perform notify_user(sid, 'document_uploaded', 'Nouveau document à vérifier', left(p_name, 120), '/advisor/documents');
  end loop;
  return did;
end $$;

create or replace function review_document(p_document uuid, p_status text, p_comment text default null) returns void
language plpgsql security definer set search_path = public as $$
declare d documents;
begin
  if current_role_code() not in ('advisor','admin') then raise exception 'Réservé au personnel'; end if;
  select * into d from documents where id = p_document;
  if not found or not can_access_student(d.student_id) then raise exception 'Accès refusé'; end if;
  if p_status not in ('in_review','validated','to_fix','rejected') then raise exception 'Statut invalide'; end if;
  if d.status = 'requested' then raise exception 'Aucun fichier à vérifier'; end if;
  if p_status in ('to_fix','rejected') and coalesce(trim(p_comment), '') = '' then raise exception 'Une raison est obligatoire'; end if;
  update documents set status = p_status, advisor_comment = left(p_comment, 500), reviewed_by = auth.uid(), reviewed_at = now() where id = p_document;
  insert into audit_logs (actor_id, action, resource, resource_id, metadata)
  values (auth.uid(), 'document.' || p_status, 'documents', p_document, jsonb_build_object('from', d.status, 'to', p_status));
  perform notify_user(d.student_id, 'document_' || p_status, case p_status when 'validated' then 'Document validé' when 'to_fix' then 'Document à corriger' when 'rejected' then 'Document rejeté' else 'Document en vérification' end, d.name, '/app/documents');
end $$;

revoke execute on function admin_set_role(uuid, text), admin_assign_advisor(uuid, uuid), admin_update_setting(text, jsonb),
  register_document_upload(text, text, text, text, int, uuid), review_document(uuid, text, text) from public, anon;
grant execute on function admin_set_role(uuid, text), admin_assign_advisor(uuid, uuid), admin_update_setting(text, jsonb),
  register_document_upload(text, text, text, text, int, uuid), review_document(uuid, text, text) to authenticated;

-- Les écritures directes sur documents passent désormais par les fonctions ci-dessus.
drop policy if exists docs_student_insert on documents;
drop policy if exists docs_student_update on documents;
drop policy if exists docs_staff_update on documents;
drop policy if exists docv_insert on document_versions;
