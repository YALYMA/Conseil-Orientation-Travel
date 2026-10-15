-- Candidatures, rendez-vous, messagerie : écritures uniquement via fonctions contrôlées.
alter table applications add column institution_name text, add column program_name text;

create table application_transitions (
  from_status text not null, to_status text not null, primary key (from_status, to_status)
);
alter table application_transitions enable row level security;
create policy application_transitions_read on application_transitions for select using (true);
insert into application_transitions values
  ('TO_PREPARE','DOCUMENTS_PENDING'),
  ('TO_PREPARE','READY_TO_SUBMIT'),
  ('TO_PREPARE','WITHDRAWN'),
  ('DOCUMENTS_PENDING','READY_TO_SUBMIT'),
  ('DOCUMENTS_PENDING','TO_PREPARE'),
  ('DOCUMENTS_PENDING','WITHDRAWN'),
  ('READY_TO_SUBMIT','SUBMITTED'),
  ('READY_TO_SUBMIT','DOCUMENTS_PENDING'),
  ('READY_TO_SUBMIT','WITHDRAWN'),
  ('SUBMITTED','WAITING'),
  ('SUBMITTED','ADDITIONAL_REQUEST'),
  ('SUBMITTED','ACCEPTED'),
  ('SUBMITTED','REFUSED'),
  ('SUBMITTED','WITHDRAWN'),
  ('WAITING','ADDITIONAL_REQUEST'),
  ('WAITING','ACCEPTED'),
  ('WAITING','REFUSED'),
  ('WAITING','WITHDRAWN'),
  ('ADDITIONAL_REQUEST','WAITING'),
  ('ADDITIONAL_REQUEST','SUBMITTED'),
  ('ADDITIONAL_REQUEST','WITHDRAWN');

create or replace function staff_create_application(p_student uuid, p_institution_name text, p_program_name text, p_country uuid,
  p_year text, p_procedure text default null, p_program uuid default null) returns uuid
language plpgsql security definer set search_path = public, pg_temp as $$
declare aid uuid;
begin
  if current_role_code() not in ('advisor','admin') then raise exception 'Réservé au personnel'; end if;
  if not can_access_student(p_student) then raise exception 'Accès refusé'; end if;
  if coalesce(trim(p_institution_name), '') = '' or coalesce(trim(p_program_name), '') = '' then raise exception 'Établissement et formation obligatoires'; end if;
  insert into applications (student_id, institution_name, program_name, country_id, academic_year, procedure, program_id, created_by)
  values (p_student, left(p_institution_name, 150), left(p_program_name, 150), p_country, left(p_year, 20), left(p_procedure, 200), p_program, auth.uid())
  returning id into aid;
  insert into application_events (application_id, label, status, created_by) values (aid, 'Candidature créée', 'TO_PREPARE', auth.uid());
  insert into audit_logs (actor_id, action, resource, resource_id, metadata) values (auth.uid(), 'application.created', 'applications', aid, '{}');
  return aid;
end $$;

create or replace function staff_move_application(p_app uuid, p_to text, p_note text default null) returns void
language plpgsql security definer set search_path = public, pg_temp as $$
declare a applications;
begin
  if current_role_code() not in ('advisor','admin') then raise exception 'Réservé au personnel'; end if;
  select * into a from applications where id = p_app for update;
  if not found or not can_access_student(a.student_id) then raise exception 'Accès refusé'; end if;
  if not exists (select 1 from application_transitions where from_status = a.status and to_status = p_to) then
    raise exception 'Transition interdite : % -> %', a.status, p_to;
  end if;
  update applications set status = p_to,
    submission_date = case when p_to = 'SUBMITTED' then current_date else submission_date end,
    response_date = case when p_to in ('ACCEPTED','REFUSED') then current_date else response_date end
  where id = p_app;
  insert into application_events (application_id, label, status, created_by) values (p_app, coalesce(nullif(trim(p_note), ''), p_to), p_to, auth.uid());
  insert into audit_logs (actor_id, action, resource, resource_id, metadata)
  values (auth.uid(), 'application.' || lower(p_to), 'applications', p_app, jsonb_build_object('from', a.status, 'to', p_to));
  perform notify_user(a.student_id, 'application_update', 'Candidature mise à jour', coalesce(a.institution_name, 'Votre candidature'), '/app/candidatures');
end $$;

create or replace function staff_create_appointment(p_student uuid, p_starts_at timestamptz, p_duration int, p_kind text, p_url text default null, p_notes text default null)
returns uuid language plpgsql security definer set search_path = public, pg_temp as $$
declare aid uuid; adv uuid;
begin
  if current_role_code() not in ('advisor','admin') then raise exception 'Réservé au personnel'; end if;
  if not can_access_student(p_student) then raise exception 'Accès refusé'; end if;
  if p_starts_at < now() then raise exception 'La date doit être dans le futur'; end if;
  if p_duration not between 10 and 180 then raise exception 'Durée invalide'; end if;
  if coalesce(p_url, '') <> '' and p_url !~ '^https://' then raise exception 'Le lien doit commencer par https://'; end if;
  select advisor_id into adv from students where id = p_student;
  if current_role_code() = 'advisor' then adv := auth.uid(); end if;
  insert into appointments (student_id, advisor_id, starts_at, duration_minutes, kind, meeting_url, notes, created_by)
  values (p_student, adv, p_starts_at, p_duration, left(coalesce(nullif(trim(p_kind), ''), 'orientation'), 60), nullif(p_url, ''), left(p_notes, 500), auth.uid()) returning id into aid;
  insert into audit_logs (actor_id, action, resource, resource_id, metadata) values (auth.uid(), 'appointment.created', 'appointments', aid, '{}');
  perform notify_user(p_student, 'appointment', 'Nouveau rendez-vous', to_char(p_starts_at at time zone 'UTC', 'DD/MM/YYYY HH24:MI') || ' (UTC)', '/app/rendez-vous');
  return aid;
end $$;

create or replace function student_respond_appointment(p_id uuid, p_status text) returns void
language plpgsql security definer set search_path = public, pg_temp as $$
declare ap appointments;
begin
  if p_status not in ('confirmed','cancelled') then raise exception 'Statut invalide'; end if;
  select * into ap from appointments where id = p_id and student_id = auth.uid() for update;
  if not found then raise exception 'Rendez-vous introuvable'; end if;
  if ap.status not in ('planned','confirmed') then raise exception 'Ce rendez-vous ne peut plus être modifié'; end if;
  update appointments set status = p_status where id = p_id;
  if ap.advisor_id is not null then perform notify_user(ap.advisor_id, 'appointment', case p_status when 'confirmed' then 'Rendez-vous confirmé' else 'Rendez-vous annulé' end, null, '/advisor/etudiants/' || ap.student_id); end if;
end $$;

create or replace function staff_set_appointment_status(p_id uuid, p_status text) returns void
language plpgsql security definer set search_path = public, pg_temp as $$
declare ap appointments;
begin
  if current_role_code() not in ('advisor','admin') then raise exception 'Réservé au personnel'; end if;
  select * into ap from appointments where id = p_id;
  if not found or not can_access_student(ap.student_id) then raise exception 'Accès refusé'; end if;
  if p_status not in ('confirmed','done','cancelled','no_show') then raise exception 'Statut invalide'; end if;
  if p_status in ('done','no_show') and ap.starts_at > now() then raise exception 'Le rendez-vous n''a pas encore eu lieu'; end if;
  update appointments set status = p_status where id = p_id;
  insert into audit_logs (actor_id, action, resource, resource_id, metadata) values (auth.uid(), 'appointment.' || p_status, 'appointments', p_id, '{}');
end $$;

create or replace function send_message(p_conversation uuid, p_body text) returns uuid
language plpgsql security definer set search_path = public, pg_temp as $$
declare c conversations; mid uuid; body text := trim(coalesce(p_body, ''));
begin
  select * into c from conversations where id = p_conversation;
  if not found or not can_access_student(c.student_id) then raise exception 'Accès refusé'; end if;
  if length(body) not between 1 and 4000 then raise exception 'Message vide ou trop long'; end if;
  insert into messages (conversation_id, sender_id, body) values (p_conversation, auth.uid(), body) returning id into mid;
  if auth.uid() = c.student_id then
    if c.advisor_id is not null then perform notify_user(c.advisor_id, 'message', 'Nouveau message', null, '/advisor/etudiants/' || c.student_id); end if;
  else
    perform notify_user(c.student_id, 'message', 'Nouveau message de votre conseiller', null, '/app/messages');
  end if;
  return mid;
end $$;

create or replace function mark_conversation_read(p_conversation uuid) returns void
language plpgsql security definer set search_path = public, pg_temp as $$
declare c conversations;
begin
  select * into c from conversations where id = p_conversation;
  if not found or not can_access_student(c.student_id) then raise exception 'Accès refusé'; end if;
  update messages set read_at = now() where conversation_id = p_conversation and sender_id <> auth.uid() and read_at is null;
end $$;

drop policy if exists apps_staff_write on applications;
drop policy if exists app_events_staff on application_events;
drop policy if exists appts_staff on appointments;
drop policy if exists msgs_insert on messages;
drop policy if exists msgs_mark_read on messages;

revoke execute on function staff_create_application(uuid, text, text, uuid, text, text, uuid), staff_move_application(uuid, text, text),
  staff_create_appointment(uuid, timestamptz, int, text, text, text), student_respond_appointment(uuid, text),
  staff_set_appointment_status(uuid, text), send_message(uuid, text), mark_conversation_read(uuid) from public, anon;
grant execute on function staff_create_application(uuid, text, text, uuid, text, text, uuid), staff_move_application(uuid, text, text),
  staff_create_appointment(uuid, timestamptz, int, text, text, text), student_respond_appointment(uuid, text),
  staff_set_appointment_status(uuid, text), send_message(uuid, text), mark_conversation_read(uuid) to authenticated;
