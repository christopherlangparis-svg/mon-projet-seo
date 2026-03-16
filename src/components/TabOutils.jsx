import { useState, useCallback } from 'react';
import {
  Link2, Wand2, Search, CheckCircle2, XCircle, AlertTriangle,
  Copy, ClipboardCheck, RefreshCw, ChevronDown, ChevronRight,
  ArrowRight, Globe, Tag,
} from 'lucide-react';
import { useCopyToClipboard } from '../hooks/useCopyToClipboard.js';

// ─── Données métier pour le générateur de slugs ───────────────────────────────
const METIERS = [
  'capitaine', 'second-capitaine', 'mecanicien', 'chef-mecanicien',
  'officier-quart', 'matelot', 'bosco', 'cuisinier', 'hotesse',
  'steward', 'patron-peche', 'electricien-naval',
];

const SECTEURS = [
  'yachting', 'offshore', 'marine-marchande', 'peche', 'transport-passagers',
  'travaux-maritimes', 'portuaire', 'plaisance-professionnelle',
];

const VILLES = [
  'marseille', 'toulon', 'antibes', 'nice', 'brest', 'lorient',
  'nantes', 'bordeaux', 'la-rochelle', 'monaco', 'ajaccio',
];

const TYPES_CONTRAT = ['cdd', 'cdi', 'freelance', 'saisonnier'];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function toSlug(str) {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')   // retire les accents
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

function buildSlug({ metier, secteur, ville, contrat, annee }) {
  const parts = [metier, secteur, contrat, ville, annee].filter(Boolean);
  return '/offres/' + parts.map(toSlug).join('-');
}

function buildTitle({ metier, secteur, ville, contrat }) {
  const m = metier.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  const s = secteur.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  const v = ville.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  const c = contrat.toUpperCase();
  return `${m} ${c} ${s} — ${v} | La Capitainerie`;
}

// ─── Analyse d'URL ────────────────────────────────────────────────────────────
function analyzeUrl(rawUrl) {
  const checks = [];
  let url;

  try {
    url = new URL(rawUrl.startsWith('http') ? rawUrl : 'https://' + rawUrl);
  } catch {
    return [{ label: 'URL invalide', status: 'error', detail: 'Impossible de parser cette URL.' }];
  }

  // HTTPS
  checks.push({
    label: 'HTTPS',
    status: url.protocol === 'https:' ? 'ok' : 'error',
    detail: url.protocol === 'https:' ? 'Protocole sécurisé.' : 'L\'URL n\'est pas en HTTPS — pénalité de classement potentielle.',
  });

  // Longueur
  const pathLen = url.pathname.length;
  checks.push({
    label: 'Longueur de l\'URL',
    status: pathLen <= 75 ? 'ok' : pathLen <= 115 ? 'warn' : 'error',
    detail: `${pathLen} caractères dans le chemin. Recommandé : < 75.`,
  });

  // Paramètres UTM non canonical
  const hasUtm = [...url.searchParams.keys()].some((k) => k.startsWith('utm_'));
  checks.push({
    label: 'Paramètres UTM',
    status: hasUtm ? 'warn' : 'ok',
    detail: hasUtm
      ? 'UTM détectés. Assurez-vous qu\'une balise canonical est bien définie pour cette URL.'
      : 'Aucun paramètre de tracking dans l\'URL.',
  });

  // Segments lisibles
  const segments = url.pathname.split('/').filter(Boolean);
  const hasOpaque = segments.some((s) => /^[a-z0-9]{5,8}$/i.test(s) && !/[aeiou]{1}/i.test(s));
  checks.push({
    label: 'Lisibilité des segments',
    status: hasOpaque ? 'error' : 'ok',
    detail: hasOpaque
      ? `Segment opaque détecté (ex: "${segments.find((s) => /^[a-z0-9]{5,8}$/i.test(s) && !/[aeiou]{1}/i.test(s))}"). Remplacez par un slug descriptif.`
      : 'Les segments de chemin semblent lisibles et descriptifs.',
  });

  // Mots-clés métier dans l'URL
  const maritimeKeywords = ['offre', 'emploi', 'marin', 'maritime', 'embarquement', 'recrutement', 'capitaine', 'mecanicien', 'matelot'];
  const pathLower = url.pathname.toLowerCase();
  const hasKeyword = maritimeKeywords.some((kw) => pathLower.includes(kw));
  checks.push({
    label: 'Mot-clé métier dans l\'URL',
    status: hasKeyword ? 'ok' : 'warn',
    detail: hasKeyword
      ? 'Un mot-clé métier maritime est présent dans le chemin.'
      : 'Aucun mot-clé métier détecté. Ajoutez un terme comme "emploi", "offre" ou le nom du métier.',
  });

  // Trailing slash cohérence
  const hasTrailingSlash = url.pathname !== '/' && url.pathname.endsWith('/');
  checks.push({
    label: 'Trailing slash',
    status: hasTrailingSlash ? 'warn' : 'ok',
    detail: hasTrailingSlash
      ? 'URL avec "/" final — assurez-vous que c\'est cohérent sur tout le site.'
      : 'Pas de slash final. Cohérence correcte.',
  });

  return checks;
}

// ─── Audit Canonical ──────────────────────────────────────────────────────────
function auditCanonical({ servedDomain, canonicalDomain, canonicalPath }) {
  const issues = [];

  if (!servedDomain || !canonicalDomain) return issues;

  const served = servedDomain.replace(/^https?:\/\//, '').replace(/\/$/, '').toLowerCase();
  const canonical = canonicalDomain.replace(/^https?:\/\//, '').replace(/\/$/, '').toLowerCase();

  if (served !== canonical) {
    issues.push({
      severity: 'critical',
      label: 'Incohérence inter-domaines',
      detail: `La page est servie depuis "${served}" mais la canonical pointe vers "${canonical}". Google peut ignorer cette canonical, laissant les deux domaines en compétition.`,
      fix: `Unifiez sur un seul domaine. Mettez en place une redirection 301 depuis "${served}" vers "${canonical}" ou inversement.`,
    });
  } else {
    issues.push({
      severity: 'ok',
      label: 'Domaine canonical cohérent',
      detail: `Domaine servi et canonical correspondent : "${served}".`,
    });
  }

  if (canonicalPath) {
    const hasUtm = canonicalPath.includes('utm_');
    if (hasUtm) {
      issues.push({
        severity: 'critical',
        label: 'UTM dans la canonical',
        detail: 'La balise canonical contient des paramètres UTM — elle pointe vers une URL trackée, pas propre.',
        fix: 'La canonical doit pointer vers l\'URL propre sans paramètres de tracking.',
      });
    }

    const hasOpaque = /\/[a-zA-Z0-9]{4,8}$/.test(canonicalPath.split('?')[0]);
    if (hasOpaque) {
      issues.push({
        severity: 'warning',
        label: 'Slug opaque détecté',
        detail: `L'URL canonique se termine par un identifiant non descriptif. Exemple actuel : "${canonicalPath}".`,
        fix: 'Adoptez des slugs descriptifs : /offres/capitaine-200-cdd-lorient-2026',
      });
    }

    if (!hasUtm && !hasOpaque) {
      issues.push({
        severity: 'ok',
        label: 'Chemin canonical propre',
        detail: 'Le chemin ne contient pas de paramètres de tracking ni de segments opaques.',
      });
    }
  }

  return issues;
};

// ─── Icône de statut ──────────────────────────────────────────────────────────
function StatusIcon({ status, size = 18 }) {
  if (status === 'ok')    return <CheckCircle2  size={size} className="text-emerald-500 shrink-0" />;
  if (status === 'warn')  return <AlertTriangle size={size} className="text-amber-500 shrink-0" />;
  return                         <XCircle       size={size} className="text-red-500 shrink-0" />;
}

function SeverityIcon({ severity, size = 18 }) {
  if (severity === 'ok')       return <CheckCircle2  size={size} className="text-emerald-500 shrink-0" />;
  if (severity === 'warning')  return <AlertTriangle size={size} className="text-amber-500 shrink-0" />;
  return                              <XCircle       size={size} className="text-red-500 shrink-0" />;
}

// ─── Composant principal ──────────────────────────────────────────────────────
export function TabOutils() {
  // ── Générateur de slugs ──
  const [slug, setSlug] = useState({ metier: 'capitaine', secteur: 'yachting', ville: 'antibes', contrat: 'cdd', annee: '2026', custom: '' });
  const [useCustom, setUseCustom] = useState(false);
  const { copied: slugCopied, copy: copySlug } = useCopyToClipboard();

  const generatedSlug = useCustom && slug.custom
    ? '/offres/' + toSlug(slug.custom)
    : buildSlug(slug);

  const generatedTitle = useCustom && slug.custom
    ? toSlug(slug.custom).replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) + ' | La Capitainerie'
    : buildTitle(slug);

  // ── Analyseur d'URL ──
  const [urlInput, setUrlInput] = useState('https://marin.lacapitainerie.com/offres/vAioTa');
  const [urlResults, setUrlResults] = useState(null);

  const handleAnalyzeUrl = () => setUrlResults(analyzeUrl(urlInput));

  // ── Audit Canonical ──
  const [canon, setCanon] = useState({
    servedDomain: 'marin.lacapitainerie.com',
    canonicalDomain: 'sailors.capitainerie.com',
    canonicalPath: '/offres/vAioTa',
  });
  const [canonResults, setCanonResults] = useState(null);

  const handleAuditCanon = () => setCanonResults(auditCanonical(canon));

  return (
    <div className="grid gap-8">

      {/* ─── 1. Générateur de slugs ────────────────────────────────────────── */}
      <section className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center gap-3">
          <div className="p-2 bg-[#1B263B] rounded-lg">
            <Wand2 size={18} className="text-[#E09F3E]" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-[#1B263B]">Générateur de slugs SEO</h2>
            <p className="text-xs text-slate-500">
              Crée des URLs descriptives conformes à la structure recommandée dans l'audit.
            </p>
          </div>
        </div>

        <div className="p-6 grid md:grid-cols-2 gap-8">
          {/* Contrôles */}
          <div className="space-y-4">
            {/* Toggle saisie libre / sélecteurs */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setUseCustom(false)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${!useCustom ? 'bg-[#1B263B] text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
              >
                Sélecteurs guidés
              </button>
              <button
                onClick={() => setUseCustom(true)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${useCustom ? 'bg-[#1B263B] text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
              >
                Saisie libre
              </button>
            </div>

            {useCustom ? (
              <div>
                <label className="text-xs font-bold uppercase text-slate-400 block mb-2">
                  Texte libre → slug automatique
                </label>
                <input
                  type="text"
                  placeholder="ex: Patron Mécanicien CDD Lorient 2026"
                  value={slug.custom}
                  onChange={(e) => setSlug((s) => ({ ...s, custom: e.target.value }))}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-[#E09F3E] outline-none"
                />
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Métier', key: 'metier', options: METIERS },
                  { label: 'Secteur', key: 'secteur', options: SECTEURS },
                  { label: 'Ville', key: 'ville', options: VILLES },
                  { label: 'Contrat', key: 'contrat', options: TYPES_CONTRAT },
                ].map(({ label, key, options }) => (
                  <div key={key}>
                    <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">
                      {label}
                    </label>
                    <div className="relative">
                      <select
                        value={slug[key]}
                        onChange={(e) => setSlug((s) => ({ ...s, [key]: e.target.value }))}
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm appearance-none focus:ring-2 focus:ring-[#E09F3E] outline-none pr-8"
                      >
                        {options.map((o) => (
                          <option key={o} value={o}>{o}</option>
                        ))}
                      </select>
                      <ChevronDown size={14} className="absolute right-2.5 top-3 text-slate-400 pointer-events-none" />
                    </div>
                  </div>
                ))}
                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">
                    Année
                  </label>
                  <input
                    type="text"
                    value={slug.annee}
                    onChange={(e) => setSlug((s) => ({ ...s, annee: e.target.value }))}
                    maxLength={4}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-[#E09F3E] outline-none"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Résultat */}
          <div className="space-y-4">
            <div className="bg-slate-900 rounded-xl p-5 space-y-3">
              <div>
                <p className="text-[10px] text-slate-500 uppercase font-bold mb-1 flex items-center gap-1">
                  <Link2 size={11} /> URL générée
                </p>
                <p className="text-emerald-400 font-mono text-sm break-all">{generatedSlug}</p>
              </div>
              <div className="border-t border-white/10 pt-3">
                <p className="text-[10px] text-slate-500 uppercase font-bold mb-1 flex items-center gap-1">
                  <Tag size={11} /> Meta Title suggéré
                </p>
                <p className="text-blue-300 font-mono text-xs break-all">{generatedTitle}</p>
                <p className={`text-[10px] mt-1 font-bold ${generatedTitle.length > 60 ? 'text-red-400' : 'text-slate-500'}`}>
                  {generatedTitle.length} / 60 car.
                </p>
              </div>
            </div>

            <button
              onClick={() => copySlug(`URL: ${generatedSlug}\nMeta Title: ${generatedTitle}`)}
              className="w-full py-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 bg-[#1B263B] text-white hover:bg-[#25324d]"
            >
              {slugCopied ? (
                <><ClipboardCheck size={15} className="text-emerald-400" /> Copié !</>
              ) : (
                <><Copy size={15} /> Copier l'URL et le titre</>
              )}
            </button>
          </div>
        </div>
      </section>

      {/* ─── 2. Analyseur d'URL ────────────────────────────────────────────── */}
      <section className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center gap-3">
          <div className="p-2 bg-[#1B263B] rounded-lg">
            <Search size={18} className="text-[#E09F3E]" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-[#1B263B]">Analyseur d'URL</h2>
            <p className="text-xs text-slate-500">
              Diagnostique instantanément les problèmes SEO d'une URL : HTTPS, longueur, slugs, mots-clés.
            </p>
          </div>
        </div>

        <div className="p-6 space-y-4">
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Globe size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="url"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="https://marin.lacapitainerie.com/offres/vAioTa"
                className="w-full pl-9 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-[#E09F3E] outline-none font-mono"
              />
            </div>
            <button
              onClick={handleAnalyzeUrl}
              className="bg-[#1B263B] text-white px-5 py-3 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-[#25324d] transition-all shrink-0"
            >
              <Search size={15} /> Analyser
            </button>
          </div>

          {urlResults && (
            <div className="space-y-2 pt-2">
              {urlResults.map((check, i) => (
                <div
                  key={i}
                  className={`flex items-start gap-3 p-4 rounded-xl border text-sm ${
                    check.status === 'ok'
                      ? 'bg-emerald-50 border-emerald-100'
                      : check.status === 'warn'
                      ? 'bg-amber-50 border-amber-100'
                      : 'bg-red-50 border-red-100'
                  }`}
                >
                  <StatusIcon status={check.status} />
                  <div>
                    <p className="font-bold text-slate-800">{check.label}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{check.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ─── 3. Audit Canonical ────────────────────────────────────────────── */}
      <section className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center gap-3">
          <div className="p-2 bg-[#1B263B] rounded-lg">
            <Link2 size={18} className="text-[#E09F3E]" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-[#1B263B]">Audit Canonical</h2>
            <p className="text-xs text-slate-500">
              Détecte les incohérences entre le domaine servi et la balise canonical — problème #1 identifié dans l'audit.
            </p>
          </div>
        </div>

        <div className="p-6 space-y-6">
          <div className="grid md:grid-cols-3 gap-4">
            {[
              { label: 'Domaine servi (URL dans le navigateur)', key: 'servedDomain', placeholder: 'marin.lacapitainerie.com' },
              { label: 'Domaine dans la balise <link rel="canonical">', key: 'canonicalDomain', placeholder: 'sailors.capitainerie.com' },
              { label: 'Chemin de la canonical', key: 'canonicalPath', placeholder: '/offres/vAioTa' },
            ].map(({ label, key, placeholder }) => (
              <div key={key}>
                <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1.5">
                  {label}
                </label>
                <input
                  type="text"
                  value={canon[key]}
                  onChange={(e) => setCanon((c) => ({ ...c, [key]: e.target.value }))}
                  placeholder={placeholder}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono focus:ring-2 focus:ring-[#E09F3E] outline-none"
                />
              </div>
            ))}
          </div>

          <button
            onClick={handleAuditCanon}
            className="bg-[#1B263B] text-white px-6 py-3 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-[#25324d] transition-all"
          >
            <RefreshCw size={15} /> Lancer l'audit canonical
          </button>

          {canonResults && (
            <div className="space-y-3">
              {canonResults.map((issue, i) => (
                <div
                  key={i}
                  className={`p-5 rounded-xl border ${
                    issue.severity === 'ok'
                      ? 'bg-emerald-50 border-emerald-100'
                      : issue.severity === 'warning'
                      ? 'bg-amber-50 border-amber-100'
                      : 'bg-red-50 border-red-100'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <SeverityIcon severity={issue.severity} />
                    <div className="flex-1">
                      <p className="font-bold text-slate-800 text-sm">{issue.label}</p>
                      <p className="text-xs text-slate-600 mt-1">{issue.detail}</p>
                      {issue.fix && (
                        <div className="mt-3 flex items-start gap-2 bg-white/60 rounded-lg p-3 border border-current/10">
                          <ArrowRight size={14} className="text-slate-400 shrink-0 mt-0.5" />
                          <p className="text-xs font-medium text-slate-700">
                            <span className="font-bold">Correction :</span> {issue.fix}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {/* Score global */}
              {(() => {
                const errors = canonResults.filter((r) => r.severity === 'critical').length;
                const warns  = canonResults.filter((r) => r.severity === 'warning').length;
                const score  = errors === 0 && warns === 0 ? 'Excellent' : errors > 0 ? 'Critique' : 'À corriger';
                const color  = errors === 0 && warns === 0 ? 'emerald' : errors > 0 ? 'red' : 'amber';
                return (
                  <div className={`flex items-center justify-between p-4 rounded-xl bg-${color}-100 border border-${color}-200`}>
                    <span className={`text-sm font-bold text-${color}-800`}>Score canonical global</span>
                    <span className={`text-sm font-black text-${color}-700 uppercase tracking-wide`}>{score}</span>
                  </div>
                );
              })()}
            </div>
          )}
        </div>
      </section>

    </div>
  );
}
