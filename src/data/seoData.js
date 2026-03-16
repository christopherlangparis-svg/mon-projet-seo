// ─── DONNÉES CENTRALISÉES DE L'APPLICATION SEO ───────────────────────────────
// Toutes les données métier sont ici. Modifiez ce fichier pour mettre à jour
// le contenu sans toucher aux composants.

export const STAT_CARDS = [
  {
    title: 'Visibilité Actuelle',
    value: '< 10%',
    description: 'Champ lexical maritime couvert.',
    colorClass: 'bg-red-500',
    iconName: 'Search',
  },
  {
    title: 'Positionnement',
    value: 'Invisible',
    description: 'Pages derrière login non-indexées.',
    colorClass: 'bg-amber-500',
    iconName: 'AlertCircle',
  },
  {
    title: 'Opportunité',
    value: 'Silos Métiers',
    description: 'Capter la longue traîne inexploitée.',
    colorClass: 'bg-emerald-500',
    iconName: 'Target',
  },
];

export const COMPETITORS = [
  {
    name: 'Clicandsea.fr',
    tag: 'Volume',
    tagStyle: 'bg-slate-200 text-slate-600',
    description: 'Omniprésence géographique. Des milliers de pages indexées sur chaque métier.',
    highlighted: false,
  },
  {
    name: 'Oceandrive-jobs.com',
    tag: 'Niche',
    tagStyle: 'bg-[#E09F3E]/20 text-[#E09F3E]',
    description: 'Expertise Yachting. Termes techniques précis qui rassurent les armateurs.',
    highlighted: true,
  },
];

export const SILOS = [
  {
    title: 'Silos Secteurs',
    colorClass: 'border-[#E09F3E]',
    iconName: 'Ship',
    items: ['Yachting de Luxe', 'Offshore / Oil & Gas', 'Marine Marchande', 'Secteur Portuaire'],
  },
  {
    title: 'Silos Métiers',
    colorClass: 'border-[#1B263B]',
    iconName: 'Compass',
    items: ['Capitaines & Officiers', 'Chefs Mécaniciens', 'Matelots & Pont', 'Hôtellerie / Stewards'],
  },
  {
    title: 'Silos Contenus',
    colorClass: 'border-emerald-500',
    iconName: 'FileText',
    items: ['Actualités Maritimes', 'Guide des Brevets', 'Réglementation ENIM', 'FAQ Recrutement'],
  },
];

export const META_PAGES = [
  {
    page: 'Accueil',
    title: 'Recrutement Maritime & Emploi Marin | La Capitainerie',
    description: 'La 1ère plateforme de recrutement maritime pour marins et armateurs. Trouvez des embarquements en quelques clics.',
  },
  {
    page: 'Yachting',
    title: 'Emploi Yachting & Grande Plaisance | La Capitainerie',
    description: 'Trouvez votre prochain embarquement en Yachting de luxe. Missions pour Capitaines, Stewards et Matelots.',
  },
  {
    page: 'Offshore',
    title: 'Emploi Maritime Offshore & Oil and Gas | La Capitainerie',
    description: 'Recrutement spécialisé offshore : missions en Oil & Gas et énergies marines pour officiers qualifiés.',
  },
  {
    page: 'Métier: Capitaine',
    title: 'Recrutement Capitaine 200, 500, 3000 | La Capitainerie',
    description: "Accédez aux profils et offres d'emploi pour capitaines tous brevets. Expertise, sécurité et vérification STCW.",
  },
];

export const TECH_CHECKLIST = [
  {
    title: 'URLs Canoniques',
    description: 'Structure : lacapitainerie.com/emploi/[metier]-[secteur]',
  },
  {
    title: 'Vitesse (Core Web Vitals)',
    description: 'LCP < 2.5s pour ne pas être pénalisé sur mobile.',
  },
  {
    title: 'Indexation Publique',
    description: 'Sortir les fiches métiers du "noindex" pour Google.',
  },
  {
    title: 'Alt Tags Images',
    description: 'Chaque photo de bateau doit avoir un attribut alt descriptif.',
  },
];

export const ROADMAP_STEPS = [
  {
    month: 'Mois 1',
    title: 'Fondations Figma',
    description: 'Validation des structures de pages silos et du maillage interne dans les maquettes.',
  },
  {
    month: 'Mois 2',
    title: 'Production Contenu',
    description: 'Rédaction des introductions secteurs et fiches métiers optimisées.',
  },
  {
    month: 'Mois 3',
    title: 'Déploiement Tech',
    description: 'Activation des URLs publiques et des données structurées Google Jobs.',
  },
];

export const RACI_ROLES = [
  { role: 'CEO', responsible: true, accountable: true, consulted: false, informed: false },
  { role: 'Expert SEO', responsible: true, accountable: false, consulted: true, informed: false },
  { role: 'Développeur', responsible: true, accountable: false, consulted: false, informed: true },
  { role: 'Rédacteur', responsible: true, accountable: false, consulted: false, informed: true },
];

export const JSON_LD_TEMPLATE = {
  '@context': 'https://schema.org/',
  '@type': 'JobPosting',
  title: 'Capitaine 200 - Yachting',
  hiringOrganization: {
    '@type': 'Organization',
    name: 'La Capitainerie',
  },
  jobLocation: {
    '@type': 'Place',
    address: { addressLocality: 'Antibes', addressCountry: 'FR' },
  },
  baseSalary: {
    '@type': 'MonetaryAmount',
    currency: 'EUR',
    value: { '@type': 'QuantitativeValue', value: 4500, unitText: 'MONTH' },
  },
};

export const SERP_DEFAULTS = {
  title: 'Recrutement Maritime & Emploi Marin | La Capitainerie',
  description:
    "Plateforme n°1 de recrutement maritime en France. Trouvez des embarquements ou recrutez des marins qualifiés (STCW) en quelques clics. Inscription gratuite.",
};

export const TITLE_MAX = 60;
export const DESC_MAX = 155;

// ─── DONNÉES VEILLE CONCURRENTIELLE ──────────────────────────────────────────

export const MARITIME_KEYWORDS = [
  { keyword: 'emploi marin',            volume: 'Élevé',  category: 'Général' },
  { keyword: 'recrutement maritime',    volume: 'Élevé',  category: 'Général' },
  { keyword: 'offre embarquement',      volume: 'Moyen',  category: 'Général' },
  { keyword: 'capitaine 200',           volume: 'Moyen',  category: 'Métier' },
  { keyword: 'chef mécanicien naval',   volume: 'Moyen',  category: 'Métier' },
  { keyword: 'matelot pont',            volume: 'Faible', category: 'Métier' },
  { keyword: 'emploi yachting',         volume: 'Élevé',  category: 'Secteur' },
  { keyword: 'job offshore maritime',   volume: 'Élevé',  category: 'Secteur' },
  { keyword: 'marine marchande emploi', volume: 'Élevé',  category: 'Secteur' },
  { keyword: 'steward yacht',           volume: 'Moyen',  category: 'Secteur' },
  { keyword: 'brevet STCW',             volume: 'Faible', category: 'Réglementation' },
  { keyword: 'ENIM marin',              volume: 'Faible', category: 'Réglementation' },
];

export const DEFAULT_COMPETITORS = [
  {
    id: 'clicandsea',
    name: 'Clicandsea.fr',
    url: 'https://www.clicandsea.fr',
    color: '#E53E3E',
    strategy: 'Volume — couverture géographique maximale, milliers de pages indexées.',
    urlPattern: '/offres-emploi/[metier]/[ville]',
    strengths: ['Maillage interne massif', 'Présence locale forte', 'Ancienneté du domaine'],
    keywords: ['emploi marin', 'recrutement maritime', 'capitaine 200', 'emploi yachting', 'marine marchande emploi'],
    scores: { urlStructure: 5, metaTags: 4, mobileSpeed: 3, structuredData: 3, internalLinking: 5 },
  },
  {
    id: 'oceandrive',
    name: 'Oceandrive-jobs.com',
    url: 'https://www.oceandrive-jobs.com',
    color: '#3182CE',
    strategy: 'Niche — expertise Yachting haut de gamme, terminologie technique pointue.',
    urlPattern: '/jobs/[metier]-[secteur]',
    strengths: ['Expertise sectorielle', 'Vocabulaire technique', 'Cible armateurs premium'],
    keywords: ['emploi yachting', 'steward yacht', 'capitaine 200', 'chef mécanicien naval'],
    scores: { urlStructure: 4, metaTags: 4, mobileSpeed: 4, structuredData: 2, internalLinking: 3 },
  },
];

export const SCORING_CRITERIA = [
  { key: 'urlStructure',    label: 'Structure URL',        max: 5 },
  { key: 'metaTags',        label: 'Balises Meta',         max: 5 },
  { key: 'mobileSpeed',     label: 'Vitesse Mobile',       max: 5 },
  { key: 'structuredData',  label: 'Données Structurées',  max: 5 },
  { key: 'internalLinking', label: 'Maillage Interne',     max: 5 },
];

export const MY_SCORES = {
  urlStructure: 2, metaTags: 3, mobileSpeed: 4, structuredData: 5, internalLinking: 1,
};
