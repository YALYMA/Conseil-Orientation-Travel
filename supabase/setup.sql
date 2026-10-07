
-- Conseil-Orientation-Travel — installation complète de la base (8 migrations).
-- FICHIER GÉNÉRÉ par « npm run sql:bundle » : ne pas modifier à la main.
-- À exécuter UNE SEULE FOIS sur un projet Supabase vide, puis supabase/seed.sql.

-- ════════════════════════════════════════════════════════════
-- 20261004000001_schema.sql
-- ════════════════════════════════════════════════════════════
-- Conseil-Orientation-Travel — schéma principal

create or replace function set_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

-- ───────── Identité & rôles ─────────
create table roles (
  code text primary key check (code in ('student','advisor','admin')),
  label text not null
);
insert into roles values ('student','Étudiant'),('advisor','Conseiller'),('admin','Administrateur');

create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'student' references roles(code),
  full_name text,
  phone text,
  avatar_url text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table advisors (
  id uuid primary key references profiles(id) on delete cascade,
  bio text,
  specialties text[] default '{}',
  max_active_students int not null default 40 check (max_active_students > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table students (
  id uuid primary key references profiles(id) on delete cascade,
  advisor_id uuid references advisors(id) on delete set null,
  birth_date date,
  city text,
  current_level text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index students_advisor_idx on students(advisor_id);

-- ───────── Référentiels ─────────
create table countries (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  flag text,
  image_url text,
  summary text,
  description text,
  institution_types text[] default '{}',
  budget_info text,
  visa_info text,
  housing_info text,
  official_links jsonb not null default '[]',   -- [{label,url}]
  faq jsonb not null default '[]',
  is_published boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references profiles(id)
);

create table country_procedures (
  id uuid primary key default gen_random_uuid(),
  country_id uuid not null references countries(id) on delete cascade,
  title text not null,
  body text,
  required_documents text[] default '{}',
  official_url text,
  sort_order int not null default 0,
  last_verified_at date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references profiles(id)
);
create index country_procedures_country_idx on country_procedures(country_id);

create table study_levels (code text primary key, label text not null, sort_order int not null default 0);
create table domains (code text primary key, label text not null, sort_order int not null default 0);

create table institutions (
  id uuid primary key default gen_random_uuid(),
  country_id uuid not null references countries(id),
  name text not null,
  city text,
  type text check (type in ('public_university','private_school','other')),
  official_url text,
  is_demo boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references profiles(id)
);
create index institutions_country_idx on institutions(country_id);

create table programs (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null references institutions(id) on delete cascade,
  name text not null,
  level text references study_levels(code),
  domain text references domains(code),
  duration text,
  requirements text,
  required_documents text[] default '{}',
  deadline date,
  official_url text,
  status text not null default 'draft' check (status in ('draft','published','archived')),
  is_demo boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references profiles(id)
);
create index programs_institution_idx on programs(institution_id);
create index programs_filter_idx on programs(level, domain, status);

-- ───────── Orientation ─────────
create table orientation_questions (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  label text not null,
  kind text not null check (kind in ('single','multi','text','number')),
  options jsonb not null default '[]',
  sort_order int not null default 0,
  is_active boolean not null default true
);
create table orientation_results (
  id uuid primary key default gen_random_uuid(),
  student_id uuid references students(id) on delete cascade,
  session_token text,                     -- test anonyme avant inscription
  summary jsonb not null,
  recommendations jsonb not null default '[]',
  created_at timestamptz not null default now()
);
create index orientation_results_student_idx on orientation_results(student_id);
create table orientation_answers (
  id uuid primary key default gen_random_uuid(),
  result_id uuid not null references orientation_results(id) on delete cascade,
  question_code text not null,
  answer jsonb not null
);
create index orientation_answers_result_idx on orientation_answers(result_id);

-- ───────── Packs ─────────
create table service_packs (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  tagline text,
  description text,
  price_total int not null check (price_total > 0),
  badge text,
  indicative_duration text,
  included_applications int check (included_applications >= 0),
  deliverables text[] default '{}',
  excluded_services text[] not null default '{}',   -- frais universitaires, visa, etc. (configurable par pack)
  faq jsonb not null default '[]',
  is_active boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references profiles(id)
);
create table pack_features (
  id uuid primary key default gen_random_uuid(),
  pack_id uuid not null references service_packs(id) on delete cascade,
  category text not null,
  label text not null,
  value text,                    -- ex. « Selon pack »
  sort_order int not null default 0
);
create index pack_features_pack_idx on pack_features(pack_id);

-- ───────── Commandes & paiements ─────────
create table orders (
  id uuid primary key default gen_random_uuid(),
  reference text unique not null default ('COT-' || upper(substr(replace(gen_random_uuid()::text,'-',''),1,8))),
  student_id uuid not null references students(id),
  pack_id uuid not null references service_packs(id),
  country_id uuid references countries(id),
  status text not null default 'ORDER_CREATED' check (status in (
    'ORDER_CREATED','FIRST_PAYMENT_PENDING','FIRST_PAYMENT_PROOF_SUBMITTED','FIRST_PAYMENT_UNDER_REVIEW',
    'FIRST_PAYMENT_CONFIRMED','SERVICE_ACTIVE','SERVICE_IN_PROGRESS','SERVICE_READY_FOR_FINAL_PAYMENT',
    'BALANCE_PROOF_SUBMITTED','BALANCE_CONFIRMED','COMPLETED','REJECTED','CANCELLED')),
  status_reason text,
  price_total int not null check (price_total > 0),          -- figé à la création, copié depuis service_packs côté serveur
  first_amount int not null check (first_amount > 0),
  balance_amount int not null check (balance_amount > 0),
  constraint orders_split_ok check (first_amount + balance_amount = price_total and first_amount <= balance_amount),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references profiles(id)
);
create index orders_student_idx on orders(student_id);
create index orders_status_idx on orders(status);

create table order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  label text not null,
  unit_price int not null check (unit_price >= 0),
  quantity int not null default 1 check (quantity > 0)
);
create index order_items_order_idx on order_items(order_id);

create table payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  stage text not null check (stage in ('initial','balance')),
  amount int not null check (amount > 0),
  method text not null default 'wave_manual',
  status text not null default 'pending' check (status in ('pending','under_review','confirmed','rejected')),
  rejection_reason text,
  confirmed_by uuid references profiles(id),
  confirmed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (order_id, stage)
);
create index payments_status_idx on payments(status);

create table payment_proofs (
  id uuid primary key default gen_random_uuid(),
  payment_id uuid not null references payments(id) on delete cascade,
  submitted_by uuid not null references profiles(id),
  channel text not null default 'whatsapp' check (channel in ('whatsapp','upload')),
  wave_reference text,
  note text,
  storage_path text,                       -- capture éventuellement déposée sur la plateforme (bucket privé)
  created_at timestamptz not null default now()
);
create index payment_proofs_payment_idx on payment_proofs(payment_id);

-- ───────── Projet & suivi ─────────
create table student_projects (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references students(id) on delete cascade,
  country_id uuid references countries(id),
  level text references study_levels(code),
  domain text references domains(code),
  target_year int,
  career_goal text,
  budget_range text,
  preferences jsonb not null default '{}',
  progress int not null default 0 check (progress between 0 and 100),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references profiles(id)
);
create unique index student_projects_one_active on student_projects(student_id);

create table project_steps (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references student_projects(id) on delete cascade,
  code text not null,
  label text not null,
  status text not null default 'todo' check (status in ('todo','in_progress','done')),
  sort_order int not null default 0,
  updated_at timestamptz not null default now(),
  unique (project_id, code)
);

-- ───────── Documents ─────────
create table documents (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references students(id) on delete cascade,
  category text not null,
  name text not null,
  status text not null default 'requested' check (status in ('requested','uploaded','in_review','validated','to_fix','rejected')),
  advisor_comment text,
  current_version int not null default 0,
  reviewed_by uuid references profiles(id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references profiles(id)
);
create index documents_student_idx on documents(student_id);
create index documents_status_idx on documents(status);

create table document_versions (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references documents(id) on delete cascade,
  version int not null,
  storage_path text not null unique,
  mime_type text not null,
  size_bytes int not null check (size_bytes > 0),
  uploaded_by uuid not null references profiles(id),
  created_at timestamptz not null default now(),
  unique (document_id, version)
);

-- ───────── Candidatures ─────────
create table applications (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references students(id) on delete cascade,
  institution_id uuid references institutions(id),
  program_id uuid references programs(id),
  country_id uuid references countries(id),
  academic_year text,
  procedure text,
  status text not null default 'TO_PREPARE' check (status in (
    'TO_PREPARE','DOCUMENTS_PENDING','READY_TO_SUBMIT','SUBMITTED','WAITING','ADDITIONAL_REQUEST','ACCEPTED','REFUSED','WITHDRAWN')),
  submission_date date,
  response_date date,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references profiles(id)
);
create index applications_student_idx on applications(student_id);
create index applications_status_idx on applications(status);

create table application_events (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references applications(id) on delete cascade,
  label text not null,
  status text,
  created_at timestamptz not null default now(),
  created_by uuid references profiles(id)
);
create index application_events_app_idx on application_events(application_id);

-- ───────── Rendez-vous, messages, notifications ─────────
create table appointments (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references students(id) on delete cascade,
  advisor_id uuid references advisors(id),
  starts_at timestamptz not null,
  duration_minutes int not null default 30 check (duration_minutes > 0),
  kind text not null default 'orientation',
  status text not null default 'planned' check (status in ('planned','confirmed','done','cancelled','no_show')),
  meeting_url text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references profiles(id)
);
create index appointments_student_idx on appointments(student_id, starts_at);
create index appointments_advisor_idx on appointments(advisor_id, starts_at);

create table conversations (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references students(id) on delete cascade,
  advisor_id uuid references advisors(id),
  created_at timestamptz not null default now(),
  unique (student_id)
);
create table messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references conversations(id) on delete cascade,
  sender_id uuid not null references profiles(id),
  body text not null check (length(body) between 1 and 4000),
  attachment_path text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);
create index messages_conv_idx on messages(conversation_id, created_at desc);

create table notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  kind text not null,
  title text not null,
  body text,
  link text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);
create index notifications_user_idx on notifications(user_id, read_at, created_at desc);

-- ───────── Contenus ─────────
create table blog_posts (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  image_url text,
  excerpt text,
  content text not null default '',
  author_id uuid references profiles(id),
  category text,
  status text not null default 'draft' check (status in ('draft','published')),
  published_at timestamptz,
  seo_title text,
  seo_description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references profiles(id)
);
create index blog_posts_status_idx on blog_posts(status, published_at desc);
create table faqs (
  id uuid primary key default gen_random_uuid(),
  question text not null,
  answer text not null,
  category text,
  sort_order int not null default 0,
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table testimonials (
  id uuid primary key default gen_random_uuid(),
  author_name text not null,
  context text,
  quote text not null,
  rating int check (rating between 1 and 5),
  is_demo boolean not null default false,
  is_published boolean not null default false,
  created_at timestamptz not null default now()
);
create table site_settings (
  key text primary key,
  value jsonb not null,
  is_public boolean not null default false,
  updated_at timestamptz not null default now(),
  updated_by uuid references profiles(id)
);

-- ───────── Audit & sécurité ─────────
create table audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references profiles(id) on delete set null,
  action text not null,
  resource text not null,
  resource_id uuid,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);
create index audit_logs_resource_idx on audit_logs(resource, resource_id);
create index audit_logs_actor_idx on audit_logs(actor_id, created_at desc);

create table rate_limits (
  bucket text not null,
  window_start timestamptz not null,
  hits int not null default 1,
  primary key (bucket, window_start)
);

-- updated_at automatique
do $$ declare t text; begin
  for t in select table_name from information_schema.columns
    where table_schema='public' and column_name='updated_at'
      and table_name not in ('site_settings','project_steps') loop
    execute format('create trigger %I before update on %I for each row execute function set_updated_at()', 'trg_'||t||'_upd', t);
  end loop;
end $$;

-- ════════════════════════════════════════════════════════════
-- 20261004000002_security.sql
-- ════════════════════════════════════════════════════════════
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

-- ════════════════════════════════════════════════════════════
-- 20261004000003_payment_workflow.sql
-- ════════════════════════════════════════════════════════════
-- Workflow commande / paiement appliqué EN BASE (autorité). Les montants ne viennent jamais du client.
-- La table order_transitions est générée depuis src/lib/payments/workflow.ts ; un test vérifie la parité.

create table order_transitions (
  from_status text not null,
  to_status text not null,
  actor text not null check (actor in ('student','advisor','admin','system')),
  requires_reason boolean not null default false,
  primary key (from_status, to_status, actor)
);
alter table order_transitions enable row level security;
create policy order_transitions_read on order_transitions for select using (true);

insert into order_transitions values
  ('ORDER_CREATED','FIRST_PAYMENT_PENDING','system',false),
  ('ORDER_CREATED','FIRST_PAYMENT_PENDING','student',false),
  ('ORDER_CREATED','CANCELLED','student',true),
  ('ORDER_CREATED','CANCELLED','admin',true),
  ('FIRST_PAYMENT_PENDING','FIRST_PAYMENT_PROOF_SUBMITTED','student',false),
  ('FIRST_PAYMENT_PENDING','CANCELLED','student',true),
  ('FIRST_PAYMENT_PENDING','CANCELLED','admin',true),
  ('FIRST_PAYMENT_PROOF_SUBMITTED','FIRST_PAYMENT_UNDER_REVIEW','advisor',false),
  ('FIRST_PAYMENT_PROOF_SUBMITTED','FIRST_PAYMENT_UNDER_REVIEW','admin',false),
  ('FIRST_PAYMENT_UNDER_REVIEW','FIRST_PAYMENT_CONFIRMED','advisor',false),
  ('FIRST_PAYMENT_UNDER_REVIEW','FIRST_PAYMENT_CONFIRMED','admin',false),
  ('FIRST_PAYMENT_UNDER_REVIEW','REJECTED','advisor',true),
  ('FIRST_PAYMENT_UNDER_REVIEW','REJECTED','admin',true),
  ('FIRST_PAYMENT_CONFIRMED','SERVICE_ACTIVE','system',false),
  ('FIRST_PAYMENT_CONFIRMED','SERVICE_ACTIVE','advisor',false),
  ('FIRST_PAYMENT_CONFIRMED','SERVICE_ACTIVE','admin',false),
  ('SERVICE_ACTIVE','SERVICE_IN_PROGRESS','advisor',false),
  ('SERVICE_ACTIVE','SERVICE_IN_PROGRESS','admin',false),
  ('SERVICE_ACTIVE','CANCELLED','admin',true),
  ('SERVICE_IN_PROGRESS','SERVICE_READY_FOR_FINAL_PAYMENT','advisor',false),
  ('SERVICE_IN_PROGRESS','SERVICE_READY_FOR_FINAL_PAYMENT','admin',false),
  ('SERVICE_IN_PROGRESS','CANCELLED','admin',true),
  ('SERVICE_READY_FOR_FINAL_PAYMENT','BALANCE_PROOF_SUBMITTED','student',false),
  ('BALANCE_PROOF_SUBMITTED','BALANCE_CONFIRMED','advisor',false),
  ('BALANCE_PROOF_SUBMITTED','BALANCE_CONFIRMED','admin',false),
  ('BALANCE_PROOF_SUBMITTED','SERVICE_READY_FOR_FINAL_PAYMENT','advisor',true),
  ('BALANCE_PROOF_SUBMITTED','SERVICE_READY_FOR_FINAL_PAYMENT','admin',true),
  ('BALANCE_CONFIRMED','COMPLETED','system',false),
  ('BALANCE_CONFIRMED','COMPLETED','advisor',false),
  ('BALANCE_CONFIRMED','COMPLETED','admin',false),
  ('REJECTED','FIRST_PAYMENT_PENDING','advisor',false),
  ('REJECTED','FIRST_PAYMENT_PENDING','admin',false);

-- Transition interne (non appelable par les clients)
create or replace function internal_transition(p_order uuid, p_to text, p_actor text, p_reason text)
returns void language plpgsql security definer set search_path = public as $$
declare cur text; req boolean;
begin
  select status into cur from orders where id = p_order for update;
  if cur is null then raise exception 'Commande introuvable'; end if;
  select requires_reason into req from order_transitions where from_status = cur and to_status = p_to and actor = p_actor;
  if not found then raise exception 'Transition interdite : % -> % (%)', cur, p_to, p_actor; end if;
  if req and coalesce(trim(p_reason), '') = '' then raise exception 'Une raison est obligatoire'; end if;
  update orders set status = p_to, status_reason = case when req then left(p_reason, 500) else null end where id = p_order;
  insert into audit_logs (actor_id, action, resource, resource_id, metadata)
  values (auth.uid(), 'order.' || lower(p_to), 'orders', p_order, jsonb_build_object('from', cur, 'to', p_to, 'actor', p_actor));
end $$;

create or replace function notify_user(p_user uuid, p_kind text, p_title text, p_body text, p_link text)
returns void language sql security definer set search_path = public as $$
  insert into notifications (user_id, kind, title, body, link) values (p_user, p_kind, p_title, p_body, p_link)
$$;

-- Étudiant : crée une commande. Le prix est lu en base, le 50/50 calculé ici.
create or replace function create_order(p_pack_slug text, p_country_id uuid default null)
returns uuid language plpgsql security definer set search_path = public as $$
declare pack service_packs; first_amt int; oid uuid;
begin
  if auth.uid() is null or coalesce(current_role_code(), '') <> 'student' then raise exception 'Réservé aux étudiants'; end if;
  select * into pack from service_packs where slug = p_pack_slug and is_active;
  if not found then raise exception 'Pack introuvable'; end if;
  if exists (select 1 from orders where student_id = auth.uid() and pack_id = pack.id and status not in ('COMPLETED','CANCELLED','REJECTED')) then
    raise exception 'Une commande est déjà en cours pour ce pack';
  end if;
  first_amt := pack.price_total / 2;
  insert into orders (student_id, pack_id, country_id, price_total, first_amount, balance_amount, created_by)
  values (auth.uid(), pack.id, p_country_id, pack.price_total, first_amt, pack.price_total - first_amt, auth.uid())
  returning id into oid;
  insert into order_items (order_id, label, unit_price) values (oid, 'Pack ' || pack.name, pack.price_total);
  insert into payments (order_id, stage, amount) values (oid, 'initial', first_amt), (oid, 'balance', pack.price_total - first_amt);
  perform internal_transition(oid, 'FIRST_PAYMENT_PENDING', 'system', null);
  return oid;
end $$;

-- Étudiant : déclare une preuve (WhatsApp). Ne valide JAMAIS le paiement.
create or replace function submit_payment_proof(p_order uuid, p_wave_ref text default null, p_note text default null)
returns void language plpgsql security definer set search_path = public as $$
declare o orders; stg text; nxt text; pid uuid; sid uuid;
begin
  select * into o from orders where id = p_order;
  if not found or o.student_id is distinct from auth.uid() then raise exception 'Commande introuvable'; end if;
  if o.status = 'FIRST_PAYMENT_PENDING' then stg := 'initial'; nxt := 'FIRST_PAYMENT_PROOF_SUBMITTED';
  elsif o.status = 'SERVICE_READY_FOR_FINAL_PAYMENT' then stg := 'balance'; nxt := 'BALANCE_PROOF_SUBMITTED';
  else raise exception 'Aucun paiement attendu pour le moment'; end if;
  select id into pid from payments where order_id = p_order and stage = stg;
  insert into payment_proofs (payment_id, submitted_by, channel, wave_reference, note)
  values (pid, auth.uid(), 'whatsapp', left(p_wave_ref, 64), left(p_note, 500));
  perform internal_transition(p_order, nxt, 'student', null);
  for sid in
    select coalesce((select advisor_id from students where id = o.student_id), a.id)
    from profiles a where a.role = 'admin' and not exists (select 1 from students where id = o.student_id and advisor_id is not null) union
    select advisor_id from students where id = o.student_id and advisor_id is not null
  loop
    perform notify_user(sid, 'payment_received', 'Preuve de paiement reçue', 'Commande ' || o.reference, '/advisor/paiements');
  end loop;
end $$;

create or replace function student_cancel_order(p_order uuid, p_reason text)
returns void language plpgsql security definer set search_path = public as $$
declare o orders;
begin
  select * into o from orders where id = p_order;
  if not found or o.student_id is distinct from auth.uid() then raise exception 'Commande introuvable'; end if;
  perform internal_transition(p_order, 'CANCELLED', 'student', p_reason);
end $$;

-- Staff : fait avancer une commande (conseiller assigné ou admin). Effets de bord sur les paiements.
create or replace function staff_transition(p_order uuid, p_to text, p_reason text default null)
returns void language plpgsql security definer set search_path = public as $$
declare o orders; r text;
begin
  r := current_role_code();
  if r not in ('advisor','admin') then raise exception 'Réservé au personnel'; end if;
  select * into o from orders where id = p_order;
  if not found or not can_access_student(o.student_id) then raise exception 'Accès refusé'; end if;
  perform internal_transition(p_order, p_to, r, p_reason);

  if p_to = 'FIRST_PAYMENT_UNDER_REVIEW' then
    update payments set status = 'under_review' where order_id = p_order and stage = 'initial';
  elsif p_to = 'FIRST_PAYMENT_CONFIRMED' then
    update payments set status = 'confirmed', confirmed_by = auth.uid(), confirmed_at = now(), rejection_reason = null where order_id = p_order and stage = 'initial';
    perform internal_transition(p_order, 'SERVICE_ACTIVE', 'system', null);
    perform notify_user(o.student_id, 'payment_confirmed', 'Paiement validé', 'Votre accompagnement démarre.', '/app/paiements');
  elsif p_to = 'REJECTED' then
    update payments set status = 'rejected', rejection_reason = left(p_reason, 500) where order_id = p_order and stage = 'initial';
    perform notify_user(o.student_id, 'payment_rejected', 'Paiement non validé', left(p_reason, 200), '/app/paiements');
  elsif p_to = 'FIRST_PAYMENT_PENDING' then
    update payments set status = 'pending' where order_id = p_order and stage = 'initial';
  elsif p_to = 'BALANCE_CONFIRMED' then
    update payments set status = 'confirmed', confirmed_by = auth.uid(), confirmed_at = now(), rejection_reason = null where order_id = p_order and stage = 'balance';
    perform internal_transition(p_order, 'COMPLETED', 'system', null);
    perform notify_user(o.student_id, 'payment_confirmed', 'Solde validé', 'Votre accompagnement est clôturé.', '/app/paiements');
  elsif p_to = 'SERVICE_READY_FOR_FINAL_PAYMENT' then
    if o.status = 'BALANCE_PROOF_SUBMITTED' then
      update payments set status = 'pending', rejection_reason = left(p_reason, 500) where order_id = p_order and stage = 'balance';
      perform notify_user(o.student_id, 'payment_rejected', 'Preuve du solde non validée', left(p_reason, 200), '/app/paiements');
    else
      perform notify_user(o.student_id, 'balance_due', 'Solde disponible', 'Les prestations de votre pack sont finalisées.', '/app/paiements');
    end if;
  end if;
end $$;

-- Verrouillage des fonctions : internes inaccessibles, publiques réservées aux utilisateurs connectés
revoke execute on function internal_transition(uuid, text, text, text) from public, anon, authenticated;
revoke execute on function notify_user(uuid, text, text, text, text) from public, anon, authenticated;
revoke execute on function create_order(text, uuid), submit_payment_proof(uuid, text, text),
  student_cancel_order(uuid, text), staff_transition(uuid, text, text) from public, anon;
grant execute on function create_order(text, uuid), submit_payment_proof(uuid, text, text),
  student_cancel_order(uuid, text), staff_transition(uuid, text, text) to authenticated;

-- ════════════════════════════════════════════════════════════
-- 20261004000004_admin_documents.sql
-- ════════════════════════════════════════════════════════════
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

-- ════════════════════════════════════════════════════════════
-- 20261004000005_applications_messages.sql
-- ════════════════════════════════════════════════════════════
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
language plpgsql security definer set search_path = public as $$
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
language plpgsql security definer set search_path = public as $$
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
returns uuid language plpgsql security definer set search_path = public as $$
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
language plpgsql security definer set search_path = public as $$
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
language plpgsql security definer set search_path = public as $$
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
language plpgsql security definer set search_path = public as $$
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
language plpgsql security definer set search_path = public as $$
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

-- ════════════════════════════════════════════════════════════
-- 20261004000006_project.sql
-- ════════════════════════════════════════════════════════════
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

-- ════════════════════════════════════════════════════════════
-- 20261004000007_content_admin.sql
-- ════════════════════════════════════════════════════════════
-- Contenus administrables (packs, pays, procédures, FAQ). Toute écriture est journalisée.
-- Modifier un prix n'affecte jamais les commandes existantes : leurs montants sont figés à la création.

create or replace function admin_save_pack(
  p_id uuid, p_slug text, p_name text, p_tagline text, p_description text, p_price int, p_badge text, p_duration text,
  p_apps int, p_deliverables text[], p_excluded text[], p_features jsonb, p_active boolean, p_sort int)
returns uuid language plpgsql security definer set search_path = public as $$
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
returns uuid language plpgsql security definer set search_path = public as $$
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
returns uuid language plpgsql security definer set search_path = public as $$
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
language plpgsql security definer set search_path = public as $$
begin
  if not is_admin() then raise exception 'Réservé aux administrateurs'; end if;
  delete from country_procedures where id = p_id;
  if not found then raise exception 'Procédure introuvable'; end if;
  insert into audit_logs (actor_id, action, resource, resource_id, metadata) values (auth.uid(), 'procedure.deleted', 'country_procedures', p_id, '{}');
end $$;

create or replace function admin_save_faq(p_id uuid, p_question text, p_answer text, p_sort int, p_published boolean) returns uuid
language plpgsql security definer set search_path = public as $$
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
language plpgsql security definer set search_path = public as $$
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

-- ════════════════════════════════════════════════════════════
-- 20261004000008_abuse_audit.sql
-- ════════════════════════════════════════════════════════════
-- Limitation anti-abus (fenêtre fixe) et journal des consultations de documents.

-- Réservée au rôle service (appelée uniquement depuis le serveur Next.js) : un client ne peut pas
-- l'appeler pour remplir la table ou épuiser le quota d'un tiers.
create or replace function rate_limit_hit(p_bucket text, p_limit int, p_window_seconds int)
returns boolean language plpgsql security definer set search_path = public as $$
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
language plpgsql security definer set search_path = public as $$
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
