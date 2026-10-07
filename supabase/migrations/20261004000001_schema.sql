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
