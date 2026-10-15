-- Audit des changements de rôle / d'activation, QUEL QUE SOIT le chemin (fonction admin, mise à jour directe par un admin,
-- éditeur SQL). Avant : seul admin_set_role journalisait, une mise à jour directe passait sans trace.

create or replace function audit_profile_changes() returns trigger
language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if new.role is distinct from old.role then
    insert into audit_logs (actor_id, action, resource, resource_id, metadata)
    values (auth.uid(), 'user.role_changed', 'profiles', new.id, jsonb_build_object('from', old.role, 'to', new.role));
  end if;
  if new.is_active is distinct from old.is_active then
    insert into audit_logs (actor_id, action, resource, resource_id, metadata)
    values (auth.uid(), 'user.status_changed', 'profiles', new.id, jsonb_build_object('active', new.is_active));
  end if;
  return null;
end $$;
revoke execute on function audit_profile_changes() from public, anon, authenticated;

create trigger trg_profiles_audit after update of role, is_active on profiles for each row execute function audit_profile_changes();

-- admin_set_role ne journalise plus lui-même (le déclencheur s'en charge) : une seule ligne par changement.
create or replace function admin_set_role(p_user uuid, p_role text) returns void
language plpgsql security definer set search_path = public, pg_temp as $$
declare old_role text;
begin
  if not is_admin() then raise exception 'Réservé aux administrateurs'; end if;
  if p_role not in ('student','advisor','admin') then raise exception 'Rôle invalide'; end if;
  if p_user = auth.uid() then raise exception 'Vous ne pouvez pas modifier votre propre rôle'; end if;
  select role into old_role from profiles where id = p_user;
  if old_role is null then raise exception 'Utilisateur introuvable'; end if;
  update profiles set role = p_role where id = p_user;
  if p_role = 'advisor' then insert into advisors (id) values (p_user) on conflict do nothing; end if;
end $$;

-- ─── Un compte désactivé perd immédiatement l'accès aux données (et pas seulement à la prochaine connexion) ───
-- Avant : can_access_student() ne vérifiait pas is_active. Un conseiller désactivé gardait la lecture de tous les dossiers
-- de ses étudiants (et les liens signés de leurs pièces d'identité) tant que son jeton de session restait valide.
-- current_role_code() renvoie NULL pour un profil inactif.
create or replace function can_access_student(sid uuid) returns boolean
language sql stable security definer set search_path = public, pg_temp as $$
  select auth.uid() is not null and current_role_code() is not null and (
    auth.uid() = sid
    or is_admin()
    or exists (select 1 from students s where s.id = sid and s.advisor_id = auth.uid())
  )
$$;

-- Stockage : même règle pour la lecture des fichiers (le chemin commence par l'identifiant de l'étudiant).
drop policy if exists storage_docs_select on storage.objects;
create policy storage_docs_select on storage.objects for select to authenticated
  using (bucket_id = 'documents' and current_role_code() is not null and (
    (storage.foldername(name))[1] = auth.uid()::text
    or is_admin()
    or exists (select 1 from students s where s.id::text = (storage.foldername(name))[1] and s.advisor_id = auth.uid())
  ));
