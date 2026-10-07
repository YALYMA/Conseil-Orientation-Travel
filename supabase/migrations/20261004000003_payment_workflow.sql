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
