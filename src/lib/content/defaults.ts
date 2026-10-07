/**
 * Contenu public de repli, utilisé UNIQUEMENT quand Supabase n'est pas configuré (dev / prévisualisation).
 * En production, les packs, pays et FAQ viennent de la base (tables administrables).
 * Aligné sur supabase/seed.sql.
 */
export const EXCLUDED_DEFAULT = [
  "Frais universitaires", "Frais administratifs officiels", "Frais de visa", "Traduction payante",
  "Légalisation", "Certification", "Billet d'avion", "Logement", "Assurance",
];

export interface PackView {
  slug: string; name: string; tagline: string; price: number; badge?: string;
  duration: string; applications?: number; features: string[]; excluded: string[];
}

export const PACKS: PackView[] = [
  { slug: "orientation", name: "Orientation", tagline: "Clarifier votre projet", price: 20000, duration: "1 à 2 semaines", excluded: EXCLUDED_DEFAULT,
    features: ["Analyse du profil et du parcours académique", "Analyse du projet", "Choix du domaine et du niveau", "Recommandations de formations", "Entretien individuel", "Plan d'action personnalisé"] },
  { slug: "audit-correction", name: "Audit & Correction", tagline: "Fiabiliser votre dossier", price: 40000, duration: "2 à 3 semaines", excluded: EXCLUDED_DEFAULT,
    features: ["Analyse du dossier et du parcours", "Vérification du CV, des relevés et des diplômes", "Correction du CV et des lettres", "Cohérence entre projet et formation", "Vérification avant dépôt", "Suivi dans l'espace étudiant"] },
  { slug: "candidature", name: "Candidature", tagline: "Préparer et suivre vos candidatures", price: 75000, badge: "Populaire", duration: "4 à 8 semaines", applications: 3, excluded: EXCLUDED_DEFAULT,
    features: ["Analyse du profil, académique et professionnelle", "Choix du domaine, du niveau, du pays et des formations", "Préparation du dossier, CV et lettres", "Accompagnement au dépôt et suivi", "Préparation à l'entretien (questions, simulation)", "Espace étudiant, messages et notifications"] },
  { slug: "premium", name: "Premium", tagline: "Accompagnement complet", price: 120000, badge: "Accompagnement complet", duration: "2 à 4 mois", applications: 5, excluded: EXCLUDED_DEFAULT,
    features: ["Conseiller dédié et analyse approfondie", "Stratégie de candidature et choix des formations", "CV, lettres de motivation, vérification complète", "Candidatures et préparation à l'entretien", "Simulation d'entretien", "Suivi personnalisé et assistance administrative selon le périmètre du service"] },
];

export const COUNTRIES = [
  { slug: "france", name: "France", flag: "🇫🇷", summary: "Universités publiques, écoles privées et possibilités d'études." },
  { slug: "belgique", name: "Belgique", flag: "🇧🇪", summary: "Universités et établissements d'enseignement supérieur." },
  { slug: "luxembourg", name: "Luxembourg", flag: "🇱🇺", summary: "Universités et formations internationales." },
  { slug: "italie", name: "Italie", flag: "🇮🇹", summary: "Universités et établissements d'enseignement supérieur." },
  { slug: "maroc", name: "Maroc", flag: "🇲🇦", summary: "Universités, écoles et formations adaptées aux étudiants internationaux." },
];

export const FAQS = [
  { q: "Combien coûte l'accompagnement ?", a: "Cela dépend du pack choisi. Les prix sont affichés sur la page de chaque pack." },
  { q: "Comment fonctionne le paiement ?", a: "50 % au démarrage et 50 % à la finalisation des prestations prévues dans votre pack." },
  { q: "Est-ce que l'admission est garantie ?", a: "Non. Nous vous accompagnons dans la préparation et le suivi de votre candidature ; la décision finale appartient aux établissements et aux autorités compétentes." },
  { q: "Comment suivre mon dossier ?", a: "Depuis votre espace étudiant : progression, documents, candidatures et messages." },
  { q: "Comment envoyer mon paiement ?", a: "Via Wave, puis envoi de la preuve sur WhatsApp. Notre équipe valide manuellement votre paiement." },
];

export const HOW_IT_WORKS = [
  { title: "Évaluez votre profil", text: "Répondez au test d'orientation gratuit." },
  { title: "Choisissez votre destination", text: "France, Belgique, Luxembourg, Italie ou Maroc." },
  { title: "Choisissez votre pack", text: "Du simple conseil à l'accompagnement complet." },
  { title: "Payez 50 % pour commencer", text: "Via Wave, puis envoyez la preuve sur WhatsApp." },
  { title: "Travaillez avec votre conseiller", text: "Documents, candidatures et messages dans votre espace." },
  { title: "Réglez le solde à la finalisation des prestations", text: "Le solde est dû une fois les prestations du pack terminées ; il ne dépend pas de la décision d'un établissement." },
];
