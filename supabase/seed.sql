-- Seed : contenus de départ + données de DÉMONSTRATION FICTIVES (is_demo = true).
-- Aucune donnée personnelle réelle. Les procédures officielles ne sont PAS pré-remplies :
-- elles sont à saisir par l'administrateur avec un lien officiel (official_url).

insert into study_levels (code, label, sort_order) values
 ('bac','Bac',1),('licence','Licence',2),('master','Master',3),('doctorat','Doctorat',4),('pro','Formation professionnelle',5),('autre','Autre',6);

insert into domains (code, label, sort_order) values
 ('informatique','Informatique',1),('gestion','Gestion',2),('finance','Finance',3),('droit','Droit',4),('sante','Santé',5),
 ('ingenierie','Ingénierie',6),('commerce','Commerce',7),('communication','Communication',8),('sciences','Sciences',9),('arts','Arts',10),('autre','Autre',11);

insert into countries (slug, name, flag, summary, description, institution_types, sort_order) values
 ('france','France','🇫🇷','Universités publiques, écoles privées et possibilités d''études.','Contenu à compléter par l''administrateur à partir des sources officielles.',array['Université publique','École privée'],1),
 ('belgique','Belgique','🇧🇪','Universités et établissements d''enseignement supérieur.','Contenu à compléter par l''administrateur à partir des sources officielles.',array['Université','Haute école'],2),
 ('luxembourg','Luxembourg','🇱🇺','Universités et formations internationales.','Contenu à compléter par l''administrateur à partir des sources officielles.',array['Université'],3),
 ('italie','Italie','🇮🇹','Universités et établissements d''enseignement supérieur.','Contenu à compléter par l''administrateur à partir des sources officielles.',array['Université','Accademia'],4),
 ('maroc','Maroc','🇲🇦','Universités, écoles et formations adaptées aux étudiants internationaux.','Contenu à compléter par l''administrateur à partir des sources officielles.',array['Université publique','École privée'],5);

-- Services non inclus : liste par défaut, modifiable pack par pack depuis l'administration
insert into service_packs (slug,name,tagline,description,price_total,badge,indicative_duration,included_applications,deliverables,excluded_services,sort_order)
select v.slug, v.name, v.tagline, v.description, v.price_total, v.badge, v.dur, v.apps, v.deliv,
       array['Frais universitaires','Frais administratifs officiels','Frais de visa','Traduction payante','Légalisation','Certification','Billet d''avion','Logement','Assurance'],
       v.ord
from (values
 ('orientation','Orientation','Clarifier votre projet','Analyse de votre profil et plan d''action personnalisé.',20000,null,'1 à 2 semaines',null::int,array['Plan d''action personnalisé','Liste de formations recommandées'],1),
 ('audit-correction','Audit & Correction','Fiabiliser votre dossier','Analyse et correction de vos documents de candidature.',40000,null,'2 à 3 semaines',null::int,array['CV corrigé','Lettres corrigées','Rapport de vérification'],2),
 ('candidature','Candidature','Préparer et suivre vos candidatures','Accompagnement de l''orientation jusqu''au dépôt et au suivi.',75000,'Populaire','4 à 8 semaines',3,array['Dossier complet','Candidatures préparées','Préparation à l''entretien'],3),
 ('premium','Premium','Accompagnement complet','Conseiller dédié et stratégie de candidature complète.',120000,'Accompagnement complet','2 à 4 mois',5,array['Stratégie de candidature','Dossier complet','Simulation d''entretien'],4)
) as v(slug,name,tagline,description,price_total,badge,dur,apps,deliv,ord);

insert into pack_features (pack_id, category, label, sort_order)
select p.id, f.category, f.label, f.ord from service_packs p join (values
 ('orientation','Analyse','Analyse du profil',1),('orientation','Analyse','Analyse académique',2),('orientation','Analyse','Analyse du projet',3),
 ('orientation','Orientation','Choix du domaine et du niveau',4),('orientation','Orientation','Recommandations de formations',5),
 ('orientation','Suivi','Entretien individuel',6),('orientation','Suivi','Plan d''action personnalisé',7),
 ('audit-correction','Analyse','Analyse du dossier et du parcours',1),('audit-correction','Analyse','Vérification CV, relevés, diplômes',2),
 ('audit-correction','Correction','Correction du CV et des lettres',3),('audit-correction','Correction','Cohérence entre projet et formation',4),
 ('audit-correction','Candidature','Vérification avant dépôt',5),('audit-correction','Candidature','Assistance au dépôt selon la procédure',6),
 ('audit-correction','Suivi','Espace étudiant et commentaires du conseiller',7),
 ('candidature','Analyse','Analyse du profil, académique et professionnelle',1),('candidature','Orientation','Choix du domaine, du niveau, du pays et des formations',2),
 ('candidature','Dossier','Préparation du dossier, CV, lettres de motivation',3),('candidature','Candidature','Préparation, vérification, accompagnement au dépôt et suivi',4),
 ('candidature','Entretien','Préparation, questions fréquentes, simulation',5),('candidature','Suivi','Espace étudiant, progression, messages, notifications',6),
 ('premium','Accompagnement','Conseiller dédié et analyse approfondie',1),('premium','Accompagnement','Stratégie de candidature et choix des formations',2),
 ('premium','Dossier','CV, lettres de motivation, vérification complète',3),('premium','Candidature','Candidatures',4),
 ('premium','Entretien','Préparation et simulation d''entretien',5),('premium','Suivi','Suivi personnalisé',6),
 ('premium','Administratif','Assistance administrative complémentaire selon le périmètre du service',7)
) as f(slug,category,label,ord) on f.slug = p.slug;

insert into faqs (question, answer, sort_order) values
 ('Combien coûte l''accompagnement ?','Cela dépend du pack choisi. Les prix sont affichés sur la page de chaque pack.',1),
 ('Comment fonctionne le paiement ?','50 % au démarrage et 50 % à la finalisation des prestations prévues dans votre pack.',2),
 ('Est-ce que l''admission est garantie ?','Non. Nous vous accompagnons dans la préparation et le suivi de votre candidature ; la décision finale appartient aux établissements et aux autorités compétentes.',3),
 ('Comment suivre mon dossier ?','Depuis votre espace étudiant : progression, documents, candidatures et messages.',4),
 ('Comment envoyer mon paiement ?','Via Wave, puis envoi de la preuve sur WhatsApp. Notre équipe valide manuellement votre paiement.',5);

insert into orientation_questions (code,label,kind,options,sort_order) values
 ('level','Niveau actuel','single','["Bac","Licence","Master","Doctorat","Autre"]',1),
 ('domain','Domaine souhaité','single','["Informatique","Gestion","Finance","Droit","Santé","Ingénierie","Commerce","Communication","Sciences","Arts","Autre"]',2),
 ('destination','Destination','single','["France","Belgique","Luxembourg","Italie","Maroc","Je ne sais pas encore"]',3),
 ('budget','Budget annuel estimé','single','["Moins de 2.000.000 FCFA","2 à 4.000.000 FCFA","4 à 6.000.000 FCFA","Plus de 6.000.000 FCFA","Je ne sais pas"]',4),
 ('languages','Langues','multi','["Français","Anglais","Italien","Autre"]',5),
 ('goal','Objectif','single','["Licence","Master","Doctorat","Formation professionnelle"]',6),
 ('year','Année souhaitée','number','[]',7),
 ('institution','Type d''établissement','single','["Université publique","École privée","Peu importe"]',8),
 ('project','Projet professionnel','text','[]',9);

-- Réglages : valeurs vides tant que l'admin n'a pas saisi les vraies coordonnées
insert into site_settings (key, value, is_public) values
 ('wave', '{"display_name":"Conseil-Orientation-Travel","phone":"","payment_url":"","instructions":"Payez via Wave puis envoyez votre preuve de paiement sur WhatsApp."}', true),
 ('whatsapp', '{"phone":"","business_url":""}', true),
 ('contact', '{"email":"","address":"Sénégal"}', true),
 ('stats', '{"show_students_count":false}', true);

-- Témoignage d'EXEMPLE : non publié, clairement marqué fictif
insert into testimonials (author_name, context, quote, rating, is_demo, is_published) values
 ('Étudiante fictive','Exemple de témoignage','Texte d''exemple à remplacer par un vrai témoignage avec autorisation.',5,true,false);

-- Établissement et formation FICTIFS (démo)
insert into institutions (country_id, name, city, type, is_demo)
select id, 'Université Exemple (fictive)', 'Ville Exemple', 'public_university', true from countries where slug='france';
insert into programs (institution_id, name, level, domain, duration, requirements, status, is_demo)
select id, 'Master Informatique — exemple fictif', 'master', 'informatique', '2 ans', 'Données fictives de démonstration', 'published', true from institutions where is_demo limit 1;
