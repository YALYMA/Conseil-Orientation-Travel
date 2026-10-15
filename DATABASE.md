# Base de données

Migrations (ordre) :
1. `…01_schema.sql` — 38 tables, contraintes (ex. `first_amount + balance_amount = price_total`), index, triggers `updated_at`.
2. `…02_security.sql` — fonctions `is_admin`, `can_access_student`, RLS sur toutes les tables, gardes anti-élévation de privilège, bucket privé `documents`.
3. `…03_payment_workflow.sql` — `order_transitions` (générée depuis `src/lib/payments/workflow.ts`), `create_order`, `submit_payment_proof`, `student_cancel_order`, `staff_transition`.
4. `…04_admin_documents.sql` — `admin_set_role`, `admin_assign_advisor`, `admin_update_setting`, `register_document_upload`, `review_document`.
5. `…05_applications_messages.sql` — `application_transitions` (générée depuis `src/lib/applications/transitions.ts`), `staff_create_application`, `staff_move_application`, rendez-vous (`staff_create_appointment`, `student_respond_appointment`, `staff_set_appointment_status`), messagerie (`send_message`, `mark_conversation_read`). Écritures directes supprimées.
6. `…06_project.sql` — `save_project` (historisé : noms des champs modifiés dans `audit_logs`), `staff_set_step` (visa, départ). Écritures directes supprimées sur `student_projects` / `project_steps`.
7. `…07_content_admin.sql` — `admin_save_pack` (prix validé, fonctionnalités remplacées, changement de prix journalisé), `admin_save_country`, `admin_save_procedure` / `admin_delete_procedure`, `admin_save_faq` / `admin_delete_faq`. Liens officiels : https uniquement. Politiques d'écriture directe supprimées sur `service_packs`, `pack_features`, `countries`, `country_procedures`, `faqs`.
8. `…08_abuse_audit.sql` — `rate_limit_hit` (réservée à `service_role`), `log_document_access` (consultations par le personnel).
9. `…09_hardening.sql` — suppression des écritures directes : stockage (dépôt et suppression réservés au serveur), réglages, notifications (`mark_notifications_read`), profils (`update_my_profile`), suppression de document (`delete_document`) ; contraintes de format (téléphone, longueurs) ; droits d'exécution resserrés ; `search_path = public, pg_temp`.
10. `…10_role_audit.sql` — déclencheur d'audit des changements de rôle et d'activation (tous chemins) ; **un compte désactivé perd l'accès** aux données et aux fichiers (`can_access_student`, lecture du stockage).

Principe : les écritures sensibles (commandes, paiements, rôles, réglages, documents) passent **uniquement** par des fonctions `SECURITY DEFINER` qui vérifient le rôle, l'assignation et la transition, et écrivent dans `audit_logs`. Aucune politique d'écriture directe n'existe sur `orders`, `payments`, `payment_proofs`, `audit_logs`, `documents`, `document_versions`.

Tables : profiles, roles, advisors, students, countries, country_procedures, study_levels, domains, institutions, programs, orientation_questions/answers/results, service_packs, pack_features, orders, order_items, order_transitions, payments, payment_proofs, student_projects, project_steps, documents, document_versions, applications, application_events, appointments, conversations, messages, notifications, blog_posts, faqs, testimonials, site_settings, audit_logs, rate_limits.

Tables créées mais pas encore utilisées par l'interface : institutions, programs, orientation_*, blog_posts, testimonials.

Régénérer la table des transitions après modification du workflow TS : voir le commentaire en tête de la migration 3 ; le test `payment-flow.test.ts` échoue si les deux divergent.

**Prix et commandes** : `orders.price_total/first_amount/balance_amount` sont copiés à la création ; modifier un pack n'affecte que les commandes futures (test `content-admin.test.ts`).
