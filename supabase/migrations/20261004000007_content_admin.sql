-- Contenus administrables (packs, pays, procédures, FAQ). Toute écriture est journalisée.
-- Modifier un prix n'affecte jamais les commandes existantes : leurs montants sont figés à la création.

create or replace function admin_save_pack(
  p_id uuid, p_slug text, p_name text, p_tagline text, p_description text, p_price int, p_badge text, p_duration text,
  p_apps int, p_deliverables text[], p_excluded text[], p_features jsonb, p_active boolean, p_sort int)
returns uuid language plpgsql security definer set search_path = public, pg_temp as $$
declare pid uuid; old_price int; meta jsonb := '{}';
begin
  if not is_admin() then raise exception 'Réservé aux administrateurs'; end if;
  if p_slug !~ '^[a-z0-9-]{2,60}$' then raise exception 'Identifiant (slug) invalide'; end if;
  if coalesce(trim(p_name), '') = '' then raise exception 'Nom obligatoire'; end if;
  if p_price is null or p_price <= 0 or p_price > 10000000 then raise exception 'Prix invalide'; end if;
  if p_apps is not null and p_apps < 0 then raise exception 'Nombre de candidatures invalide'; end if;
  if jsonb_typeof(coalesce(p_features, '[]'::jsonb)) <> 'array' or jsonb_array_length(coalesce(p_features, '[]'::jsonb)) > 60 then raise exception 'Fonctionnalités invalides'; end if;
  if p_id is null then
    insert into service_packs (slug, name, tagline, description, price_total, badge, indicative_duration, included_applications, deliverables, excluded_services, is_active, sort_order, created_by)
    values (p_slug, left(p_name, 80), left(p_tagline, 160), left(p_description, 1000), p_price, nullif(left(p_badge, 40), ''), left(p_duration, 60), p_apps,
            coalesce(p_deliverables, '{}'), coalesce(p_excluded, '{}'), coalesce(p_active, true), coalesce(p_sort, 0), auth.uid())
    returning id into pid;
    meta := jsonb_build_object('price', p_price);
  else
    select price_total into old_price from service_packs where id = p_id for update;
    if not found then raise exception 'Pack introuvable'; end if;
    update service_packs set slug = p_slug, name = left(p_name, 80), tagline = left(p_tagline, 160), description = left(p_description, 1000), price_total = p_price,
      badge = nullif(left(p_badge, 40), ''), indicative_duration = left(p_duration, 60), included_applications = p_apps, deliverables = coalesce(p_deliverables, '{}'),
      excluded_services = coalesce(p_excluded, '{}'), is_active = coalesce(p_active, true), sort_order = coalesce(p_sort, 0)
    where id = p_id;
    pid := p_id;
    if old_price <> p_price then meta := jsonb_build_object('price_changed', true, 'from', old_price, 'to', p_price); end if;
  end if;
  delete from pack_features where pack_id = pid;
  insert into pack_features (pack_id, category, label, sort_order)
  select pid, left(coalesce(nullif(trim(f->>'category'), ''), 'Général'), 60), left(trim(f->>'label'), 200), ord::int
  from jsonb_array_elements(coalesce(p_features, '[]'::jsonb)) with ordinality as t(f, ord)
  where coalesce(trim(f->>'label'), '') <> '';
  insert into audit_logs (actor_id, action, resource, resource_id, metadata)
  values (auth.uid(), case when p_id is null then 'pack.created' else 'pack.updated' end, 'service_packs', pid, meta);
  return pid;
end $$;

create or replace function admin_save_country(
  p_id uuid, p_slug text, p_name text, p_flag text, p_summary text, p_description text, p_types text[],
  p_budget text, p_visa text, p_housing text, p_links jsonb, p_published boolean, p_sort int)
returns uuid language plpgsql security definer set search_path = public, pg_temp as $$
declare cid uuid; l jsonb;
begin
  if not is_admin() then raise exception 'Réservé aux administrateurs'; end if;
  if p_slug !~ '^[a-z0-9-]{2,60}$' then raise exception 'Identifiant (slug) invalide'; end if;
  if coalesce(trim(p_name), '') = '' then raise exception 'Nom obligatoire'; end if;
  if jsonb_typeof(coalesce(p_links, '[]'::jsonb)) <> 'array' then raise exception 'Liens invalides'; end if;
  for l in select * from jsonb_array_elements(coalesce(p_links, '[]'::jsonb)) loop
    if coalesce(l->>'url', '') !~ '^https://[^ ]+$' then raise exception 'Lien officiel invalide (https:// obligatoire)'; end if;
  end loop;
  if p_id is null then
    insert into countries (slug, name, flag, summary, description, institution_types, budget_info, visa_info, housing_info, official_links, is_published, sort_order, created_by)
    values (p_slug, left(p_name, 80), left(p_flag, 8), left(p_summary, 300), left(p_description, 4000), coalesce(p_types, '{}'), left(p_budget, 4000), left(p_visa, 4000), left(p_housing, 4000),
            coalesce(p_links, '[]'::jsonb), coalesce(p_published, true), coalesce(p_sort, 0), auth.uid()) returning id into cid;
  else
    update countries set slug = p_slug, name = left(p_name, 80), flag = left(p_flag, 8), summary = left(p_summary, 300), description = left(p_description, 4000),
      institution_types = coalesce(p_types, '{}'), budget_info = left(p_budget, 4000), visa_info = left(p_visa, 4000), housing_info = left(p_housing, 4000),
      official_links = coalesce(p_links, '[]'::jsonb), is_published = coalesce(p_published, true), sort_order = coalesce(p_sort, 0)
    where id = p_id returning id into cid;
    if cid is null then raise exception 'Pays introuvable'; end if;
  end if;
  insert into audit_logs (actor_id, action, resource, resource_id, metadata)
  values (auth.uid(), case when p_id is null then 'country.created' else 'country.updated' end, 'countries', cid, '{}');
  return cid;
end $$;

create or replace function admin_save_procedure(p_id uuid, p_country uuid, p_title text, p_body text, p_docs text[], p_url text, p_verified date, p_sort int)
returns uuid language plpgsql security definer set search_path = public, pg_temp as $$
declare rid uuid;
begin
  if not is_admin() then raise exception 'Réservé aux administrateurs'; end if;
  if coalesce(trim(p_title), '') = '' then raise exception 'Titre obligatoire'; end if;
  if coalesce(p_url, '') <> '' and p_url !~ '^https://[^ ]+$' then raise exception 'Lien officiel invalide (https:// obligatoire)'; end if;
  if not exists (select 1 from countries where id = p_country) then raise exception 'Pays introuvable'; end if;
  if p_id is null then
    insert into country_procedures (country_id, title, body, required_documents, official_url, last_verified_at, sort_order, created_by)
    values (p_country, left(p_title, 160), left(p_body, 6000), coalesce(p_docs, '{}'), nullif(p_url, ''), p_verified, coalesce(p_sort, 0), auth.uid()) returning id into rid;
  else
    update country_procedures set title = left(p_title, 160), body = left(p_body, 6000), required_documents = coalesce(p_docs, '{}'), official_url = nullif(p_url, ''),
      last_verified_at = p_verified, sort_order = coalesce(p_sort, 0) where id = p_id and country_id = p_country returning id into rid;
    if rid is null then raise exception 'Procédure introuvable'; end if;
  end if;
  insert into audit_logs (actor_id, action, resource, resource_id, metadata) values (auth.uid(), 'procedure.saved', 'country_procedures', rid, '{}');
  return rid;
end $$;

create or replace function admin_delete_procedure(p_id uuid) returns void
language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if not is_admin() then raise exception 'Réservé aux administrateurs'; end if;
  delete from country_procedures where id = p_id;
  if not found then raise exception 'Procédure introuvable'; end if;
  insert into audit_logs (actor_id, action, resource, resource_id, metadata) values (auth.uid(), 'procedure.deleted', 'country_procedures', p_id, '{}');
end $$;

create or replace function admin_save_faq(p_id uuid, p_question text, p_answer text, p_sort int, p_published boolean) returns uuid
language plpgsql security definer set search_path = public, pg_temp as $$
declare fid uuid;
begin
  if not is_admin() then raise exception 'Réservé aux administrateurs'; end if;
  if coalesce(trim(p_question), '') = '' or coalesce(trim(p_answer), '') = '' then raise exception 'Question et réponse obligatoires'; end if;
  if p_id is null then
    insert into faqs (question, answer, sort_order, is_published) values (left(p_question, 300), left(p_answer, 3000), coalesce(p_sort, 0), coalesce(p_published, true)) returning id into fid;
  else
    update faqs set question = left(p_question, 300), answer = left(p_answer, 3000), sort_order = coalesce(p_sort, 0), is_published = coalesce(p_published, true) where id = p_id returning id into fid;
    if fid is null then raise exception 'Question introuvable'; end if;
  end if;
  insert into audit_logs (actor_id, action, resource, resource_id, metadata) values (auth.uid(), 'faq.saved', 'faqs', fid, '{}');
  return fid;
end $$;

create or replace function admin_delete_faq(p_id uuid) returns void
language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if not is_admin() then raise exception 'Réservé aux administrateurs'; end if;
  delete from faqs where id = p_id;
  if not found then raise exception 'Question introuvable'; end if;
  insert into audit_logs (actor_id, action, resource, resource_id, metadata) values (auth.uid(), 'faq.deleted', 'faqs', p_id, '{}');
end $$;

revoke execute on function
  admin_save_pack(uuid, text, text, text, text, int, text, text, int, text[], text[], jsonb, boolean, int),
  admin_save_country(uuid, text, text, text, text, text, text[], text, text, text, jsonb, boolean, int),
  admin_save_procedure(uuid, uuid, text, text, text[], text, date, int), admin_delete_procedure(uuid),
  admin_save_faq(uuid, text, text, int, boolean), admin_delete_faq(uuid) from public, anon;
grant execute on function
  admin_save_pack(uuid, text, text, text, text, int, text, text, int, text[], text[], jsonb, boolean, int),
  admin_save_country(uuid, text, text, text, text, text, text[], text, text, text, jsonb, boolean, int),
  admin_save_procedure(uuid, uuid, text, text, text[], text, date, int), admin_delete_procedure(uuid),
  admin_save_faq(uuid, text, text, int, boolean), admin_delete_faq(uuid) to authenticated;

-- Écritures directes sur le contenu éditorial supprimées : tout passe par les fonctions (donc audité).
drop policy if exists packs_admin on service_packs;
drop policy if exists features_admin on pack_features;
drop policy if exists countries_admin on countries;
drop policy if exists procedures_admin on country_procedures;
drop policy if exists faqs_admin on faqs;
