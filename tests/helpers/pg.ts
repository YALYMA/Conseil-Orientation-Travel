import { PGlite } from "@electric-sql/pglite";
import fs from "node:fs";
import path from "node:path";

const STUBS = `
create schema if not exists auth;
create table auth.users (id uuid primary key default gen_random_uuid(), email text, raw_user_meta_data jsonb default '{}');
create or replace function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
create or replace function auth.role() returns text language sql stable as $$ select coalesce(nullif(current_setting('request.jwt.claim.role', true), ''), 'anon') $$;
create schema if not exists storage;
create table storage.buckets (id text primary key, name text, public boolean, file_size_limit bigint, allowed_mime_types text[]);
create table storage.objects (id uuid primary key default gen_random_uuid(), bucket_id text, name text, owner uuid);
alter table storage.objects enable row level security; -- activée nativement sur Supabase
create or replace function storage.foldername(name text) returns text[] language sql immutable as $$ select string_to_array(name, '/') $$;
do $$ begin create role anon nologin; exception when duplicate_object then null; end $$;
do $$ begin create role authenticated nologin; exception when duplicate_object then null; end $$;
do $$ begin create role service_role nologin; exception when duplicate_object then null; end $$;
`;

/** Base vide avec uniquement les stubs Supabase (auth, storage, rôles). */
export async function stubbedDb() {
  const db = new PGlite();
  await db.exec(STUBS);
  return db;
}

export async function freshDb() {
  const db = await stubbedDb();
  const dir = path.resolve(__dirname, "../../supabase/migrations");
  for (const f of fs.readdirSync(dir).filter((f) => f.endsWith(".sql")).sort()) {
    await db.exec(fs.readFileSync(path.join(dir, f), "utf8"));
  }
  await db.exec("grant usage on schema public, auth, storage to authenticated, anon; grant all on all tables in schema public, storage to authenticated, anon; grant execute on all functions in schema public, auth, storage to authenticated, anon; revoke execute on function internal_transition(uuid, text, text, text), notify_user(uuid, text, text, text, text) from authenticated, anon, public; revoke execute on function create_order(text, uuid), submit_payment_proof(uuid, text, text), student_cancel_order(uuid, text), staff_transition(uuid, text, text) from anon, public; revoke execute on function admin_set_role(uuid, text), admin_assign_advisor(uuid, uuid), admin_update_setting(text, jsonb), register_document_upload(text, text, text, text, int, uuid), review_document(uuid, text, text), staff_create_application(uuid, text, text, uuid, text, text, uuid), staff_move_application(uuid, text, text), staff_create_appointment(uuid, timestamptz, int, text, text, text), student_respond_appointment(uuid, text), staff_set_appointment_status(uuid, text), send_message(uuid, text), mark_conversation_read(uuid) from anon, public; revoke execute on function save_project(uuid, uuid, text, text, int, text, text), staff_set_step(uuid, text, text) from anon, public; revoke execute on function rate_limit_hit(text, int, int) from authenticated, anon, public; revoke execute on function log_document_access(uuid) from anon, public;");
  return db;
}

/** Exécute du SQL en simulant un utilisateur connecté (rôle Postgres `authenticated` => la RLS s'applique). */
export async function asUser<T>(db: PGlite, uid: string | null, sql: string) {
  await db.exec(`select set_config('request.jwt.claim.sub', '${uid ?? ""}', false); select set_config('request.jwt.claim.role', '${uid ? "authenticated" : "anon"}', false); set role ${uid ? "authenticated" : "anon"};`);
  try {
    return await db.query<T & Record<string, unknown>>(sql);
  } finally {
    await db.exec("reset role");
  }
}
