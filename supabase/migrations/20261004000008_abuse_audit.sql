-- Limitation anti-abus (fenêtre fixe) et journal des consultations de documents.

-- Réservée au rôle service (appelée uniquement depuis le serveur Next.js) : un client ne peut pas
-- l'appeler pour remplir la table ou épuiser le quota d'un tiers.
create or replace function rate_limit_hit(p_bucket text, p_limit int, p_window_seconds int)
returns boolean language plpgsql security definer set search_path = public, pg_temp as $$
declare w timestamptz; n int;
begin
  if p_bucket is null or length(p_bucket) > 200 or p_limit < 1 or p_window_seconds < 1 or p_window_seconds > 86400 then
    raise exception 'Paramètres de limitation invalides';
  end if;
  w := to_timestamp(floor(extract(epoch from now()) / p_window_seconds) * p_window_seconds);
  insert into rate_limits (bucket, window_start, hits) values (p_bucket, w, 1)
  on conflict (bucket, window_start) do update set hits = rate_limits.hits + 1
  returning hits into n;
  if random() < 0.02 then delete from rate_limits where window_start < now() - interval '2 days'; end if;
  return n <= p_limit;
end $$;
revoke execute on function rate_limit_hit(text, int, int) from public, anon, authenticated;
grant execute on function rate_limit_hit(text, int, int) to service_role;

-- Consultation d'un document par le personnel : tracée (la consultation par le propriétaire ne l'est pas).
create or replace function log_document_access(p_document uuid) returns void
language plpgsql security definer set search_path = public, pg_temp as $$
declare d documents;
begin
  select * into d from documents where id = p_document;
  if not found or not can_access_student(d.student_id) then raise exception 'Accès refusé'; end if;
  if auth.uid() = d.student_id then return; end if;
  insert into audit_logs (actor_id, action, resource, resource_id, metadata)
  values (auth.uid(), 'document.accessed', 'documents', p_document, jsonb_build_object('role', current_role_code()));
end $$;
revoke execute on function log_document_access(uuid) from public, anon;
grant execute on function log_document_access(uuid) to authenticated;
