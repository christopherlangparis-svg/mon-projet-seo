import { useState } from 'react';
import {
  TrendingUp, Search, Globe, CheckCircle2, XCircle,
  Copy, ClipboardCheck, ChevronDown, ChevronUp,
  BarChart2, Target, Zap, Wand2, Plus, Trash2, Pencil,
} from 'lucide-react';
import { useCopyToClipboard } from '../hooks/useCopyToClipboard.js';
import { useLocalStorage } from '../hooks/useLocalStorage.js';
import { Modal, Field, Input, FormActions, DirtyBanner, IconButton } from './formUI.jsx';

// ─── Données initiales ────────────────────────────────────────────────────────
const INITIAL_COMPETITORS = [
  {
    name: 'La Capitainerie', url: 'lacapitainerie.com',
    colorClass: 'bg-[#1B263B]', borderClass: 'border-[#1B263B]', barClass: 'bg-[#1B263B]',
    isUs: true,
    criteria: {
      https: true, slugsDescriptifs: false, motCleUrl: false, canonicalCoherente: false,
      donneesStructurees: true, metaTitleOptimise: true, metaDescOptimise: true, maillageInterne: false,
    },
  },
  {
    name: 'Clicandsea.fr', url: 'clicandsea.fr',
    colorClass: 'bg-blue-600', borderClass: 'border-blue-600', barClass: 'bg-blue-600',
    isUs: false,
    criteria: {
      https: true, slugsDescriptifs: true, motCleUrl: true, canonicalCoherente: true,
      donneesStructurees: true, metaTitleOptimise: true, metaDescOptimise: true, maillageInterne: true,
    },
  },
  {
    name: 'Oceandrive-jobs', url: 'oceandrive-jobs.com',
    colorClass: 'bg-emerald-600', borderClass: 'border-emerald-600', barClass: 'bg-emerald-600',
    isUs: false,
    criteria: {
      https: true, slugsDescriptifs: true, motCleUrl: true, canonicalCoherente: true,
      donneesStructurees: false, metaTitleOptimise: true, metaDescOptimise: false, maillageInterne: true,
    },
  },
];

const CRITERIA_LABELS = {
  https:               { label: 'HTTPS sécurisé',               weight: 1 },
  slugsDescriptifs:    { label: "Slugs d'URL descriptifs",       weight: 2 },
  motCleUrl:           { label: "Mot-clé métier dans l'URL",     weight: 2 },
  canonicalCoherente:  { label: 'Canonical cohérente',           weight: 3 },
  donneesStructurees:  { label: 'Données structurées (JSON-LD)', weight: 2 },
  metaTitleOptimise:   { label: 'Meta Title optimisé',           weight: 1 },
  metaDescOptimise:    { label: 'Meta Description optimisée',    weight: 1 },
  maillageInterne:     { label: 'Maillage interne par secteur',  weight: 2 },
};

// Palette de couleurs disponibles pour les nouveaux concurrents
const COLOR_PALETTE = [
  { colorClass: 'bg-purple-600',  borderClass: 'border-purple-600',  barClass: 'bg-purple-600' },
  { colorClass: 'bg-rose-600',    borderClass: 'border-rose-600',    barClass: 'bg-rose-600' },
  { colorClass: 'bg-orange-500',  borderClass: 'border-orange-500',  barClass: 'bg-orange-500' },
  { colorClass: 'bg-teal-600',    borderClass: 'border-teal-600',    barClass: 'bg-teal-600' },
  { colorClass: 'bg-indigo-600',  borderClass: 'border-indigo-600',  barClass: 'bg-indigo-600' },
];

function getNextColor(competitors) {
  const used = competitors.filter(c => !c.isUs).length;
  return COLOR_PALETTE[used % COLOR_PALETTE.length];
}

function computeScore(criteria) {
  let total = 0, max = 0;
  Object.entries(criteria).forEach(([key, val]) => {
    const w = CRITERIA_LABELS[key]?.weight ?? 1;
    max += w; if (val) total += w;
  });
  return Math.round((total / max) * 100);
}

const KEYWORD_GAPS = [
  { keyword: 'emploi capitaine 200',         clicandsea: true,  oceandrive: false, us: false, priority: 'haute' },
  { keyword: 'recrutement marin offshore',   clicandsea: true,  oceandrive: true,  us: false, priority: 'haute' },
  { keyword: 'emploi yachting france',       clicandsea: true,  oceandrive: true,  us: false, priority: 'haute' },
  { keyword: 'chef mécanicien naval CDD',    clicandsea: false, oceandrive: false, us: false, priority: 'haute' },
  { keyword: 'matelot transport passagers',  clicandsea: true,  oceandrive: false, us: false, priority: 'moyenne' },
  { keyword: 'officier quart machine',       clicandsea: false, oceandrive: true,  us: false, priority: 'moyenne' },
  { keyword: 'recrutement marine marchande', clicandsea: true,  oceandrive: false, us: false, priority: 'moyenne' },
  { keyword: 'embarquement plaisance pro',   clicandsea: false, oceandrive: true,  us: false, priority: 'moyenne' },
  { keyword: 'brevet STCW emploi',           clicandsea: true,  oceandrive: true,  us: false, priority: 'haute' },
  { keyword: 'mission convoyage voilier',    clicandsea: false, oceandrive: false, us: false, priority: 'basse' },
];

function toSlug(str) {
  return str.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-').replace(/-+/g, '-');
}

function generateStrategy(keyword) {
  const slug = toSlug(keyword);
  const titled = keyword.replace(/\b\w/g, c => c.toUpperCase());
  return {
    url: `/offres/${slug}`,
    title: `${titled} | La Capitainerie`,
    description: `Trouvez les meilleures offres de ${keyword} sur La Capitainerie. Postulez en quelques clics, profil vérifié STCW.`,
  };
}

function analyzeCompetitorUrl(rawUrl) {
  let url;
  try { url = new URL(rawUrl.startsWith('http') ? rawUrl : 'https://' + rawUrl); }
  catch { return null; }
  const path = url.pathname;
  const segments = path.split('/').filter(Boolean);
  const maritimeKw = ['emploi','job','recrutement','offre','mission','capitaine','matelot',
    'mecanicien','officier','marin','yachting','offshore','maritime','embarquement'];
  const detectedKw = maritimeKw.filter(kw => path.toLowerCase().includes(kw) || url.hostname.includes(kw));
  const hasDescriptiveSlug = segments.some(s => s.length > 8 && s.includes('-'));
  const depth = segments.length;
  const strategy = generateStrategy(detectedKw.length > 0 ? detectedKw.slice(0, 2).join(' ') : 'recrutement maritime');
  return { url, segments, detectedKw, hasDescriptiveSlug, depth, strategy };
}

// ─── Composants UI ────────────────────────────────────────────────────────────
function StatusIcon({ ok, size = 16 }) {
  return ok
    ? <CheckCircle2 size={size} className="text-emerald-500" />
    : <XCircle      size={size} className="text-red-400" />;
}

function PriorityBadge({ priority }) {
  const s = { haute: 'bg-red-100 text-red-700', moyenne: 'bg-amber-100 text-amber-700', basse: 'bg-slate-100 text-slate-500' };
  return <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${s[priority]}`}>{priority}</span>;
}

function ScoreBar({ score, barClass }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-500 ${barClass}`} style={{ width: `${score}%` }} />
      </div>
      <span className="text-sm font-black tabular-nums w-10 text-right">{score}%</span>
    </div>
  );
}

function StrategyBlock({ strategy, onCopy, copied }) {
  return (
    <div className="bg-slate-900 rounded-xl p-4 space-y-3">
      <p className="text-[10px] text-[#E09F3E] uppercase font-bold">⚡ Stratégie recommandée pour La Capitainerie</p>
      {[['URL', strategy.url, 'text-emerald-400 font-mono text-xs'],
        ['Title', strategy.title, 'text-blue-300 font-mono text-xs'],
        ['Description', strategy.description, 'text-slate-300 text-xs leading-relaxed']
      ].map(([lbl, val, cls]) => (
        <div key={lbl} className="border-t border-white/10 pt-2 first:border-0 first:pt-0">
          <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">{lbl}</p>
          <p className={cls}>{val}</p>
        </div>
      ))}
      <button onClick={onCopy} className="flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-white transition-colors pt-1">
        {copied ? <><ClipboardCheck size={13} className="text-emerald-400" /> Copié !</> : <><Copy size={13} /> Copier cette stratégie</>}
      </button>
    </div>
  );
}

// ─── Modale ajout / édition concurrent ───────────────────────────────────────
const EMPTY_CRITERIA = Object.fromEntries(Object.keys(CRITERIA_LABELS).map(k => [k, false]));

// ─── Critères détectables automatiquement depuis l'URL ────────────────────────
const AUTO_DETECTABLE = ['https', 'slugsDescriptifs', 'motCleUrl'];

const MARITIME_KEYWORDS = [
  'marin', 'maritime', 'emploi', 'recrutement', 'embarquement', 'yachting',
  'offshore', 'capitaine', 'mecanicien', 'matelot', 'officier', 'navire',
  'bateau', 'ship', 'crew', 'sailor', 'boat', 'peche', 'fishing',
];

function autoDetectCriteria(rawUrl) {
  if (!rawUrl.trim()) return { ...EMPTY_CRITERIA };

  let url;
  try {
    url = new URL(rawUrl.startsWith('http') ? rawUrl : 'https://' + rawUrl);
  } catch {
    return { ...EMPTY_CRITERIA };
  }

  const fullUrl   = url.href.toLowerCase();
  const hostname  = url.hostname.toLowerCase();
  const path      = url.pathname.toLowerCase();
  const segments  = path.split('/').filter(Boolean);

  // HTTPS — détecté depuis le protocole
  const https = url.protocol === 'https:';

  // Slugs descriptifs — au moins un segment avec tirets et longueur > 8
  const slugsDescriptifs = segments.some(s => s.length > 8 && s.includes('-'));

  // Mot-clé maritime — dans le domaine ou le chemin
  const motCleUrl = MARITIME_KEYWORDS.some(kw =>
    hostname.includes(kw) || path.includes(kw)
  );

  return {
    ...EMPTY_CRITERIA,
    https,
    slugsDescriptifs,
    motCleUrl,
  };
}

function CompetitorForm({ initial, modalTitle, onClose, onSave, saveLabel }) {
  const isEdit = !!initial;
  const [name, setName]         = useState(initial?.name ?? '');
  const [url, setUrl]           = useState(initial?.url ?? '');
  const [criteria, setCriteria] = useState(initial?.criteria ?? { ...EMPTY_CRITERIA });
  const [analyzed, setAnalyzed] = useState(false);

  const toggle = (key) => setCriteria(c => ({ ...c, [key]: !c[key] }));
  const canSave = name.trim() && url.trim();

  // Analyse automatique dès que l'URL change (seulement en mode ajout)
  const handleUrlChange = (val) => {
    setUrl(val);
    if (!isEdit && val.trim().length > 5) {
      const detected = autoDetectCriteria(val);
      setCriteria(prev => ({
        ...prev,
        // On écrase uniquement les critères auto-détectables
        ...Object.fromEntries(AUTO_DETECTABLE.map(k => [k, detected[k]])),
      }));
      setAnalyzed(true);
    }
  };

  return (
    <Modal title={modalTitle} onClose={onClose} wide>
      <div className="space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <Field label="Nom du site">
            <Input value={name} onChange={setName} placeholder="Ex: MarinJob.fr" autoFocus maxLength={30} />
          </Field>
          <Field label="URL du site">
            <Input
              value={url}
              onChange={handleUrlChange}
              placeholder="https://www.marinjob.fr"
              maxLength={80}
            />
          </Field>
        </div>

        {/* Bandeau d'analyse automatique */}
        {analyzed && !isEdit && (
          <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-100 rounded-xl text-xs text-blue-700">
            <span className="shrink-0 mt-0.5">🔍</span>
            <span>
              <strong>Analyse automatique effectuée</strong> sur HTTPS, slugs et mots-clés.
              Les 5 critères restants nécessitent une vérification manuelle de votre part.
            </span>
          </div>
        )}

        <Field label="Évaluation des critères SEO">
          <div className="grid grid-cols-1 gap-2">
            {Object.entries(CRITERIA_LABELS).map(([key, { label, weight }]) => {
              const isAuto = AUTO_DETECTABLE.includes(key) && analyzed && !isEdit;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => toggle(key)}
                  className={`flex items-center justify-between p-3 rounded-xl border-2 text-sm font-medium transition-all ${
                    criteria[key]
                      ? 'border-emerald-300 bg-emerald-50 text-emerald-800'
                      : 'border-slate-200 bg-slate-50 text-slate-500 hover:bg-slate-100'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <StatusIcon ok={criteria[key]} size={15} />
                    {label}
                    {isAuto && (
                      <span className="text-[9px] font-bold bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded-full uppercase">
                        Auto
                      </span>
                    )}
                  </span>
                  <span className="text-[10px] text-slate-400 font-normal shrink-0">×{weight}</span>
                </button>
              );
            })}
          </div>

          {/* Score en temps réel */}
          <div className="mt-4 p-3 bg-slate-100 rounded-xl flex items-center justify-between">
            <span className="text-xs font-bold text-slate-600">Score calculé</span>
            <span className="text-lg font-black text-[#1B263B]">{computeScore(criteria)}%</span>
          </div>
        </Field>
      </div>

      <FormActions
        onCancel={onClose}
        onSubmit={() => { if (canSave) { onSave({ name: name.trim(), url: url.trim(), criteria }); onClose(); } }}
        submitLabel={saveLabel}
      />
    </Modal>
  );
}

// ─── Composant principal ──────────────────────────────────────────────────────
export function TabVeille() {
  const [competitors, setCompetitors, resetCompetitors] = useLocalStorage('seo_competitors', INITIAL_COMPETITORS);
  const [urlInput, setUrlInput]     = useState('');
  const [analysis, setAnalysis]     = useState(null);
  const [expandedKw, setExpandedKw] = useState(null);
  const [filter, setFilter]         = useState('toutes');
  const { copied, copy }            = useCopyToClipboard();

  // États modales
  const [showAdd, setShowAdd]       = useState(false);
  const [editingIdx, setEditingIdx] = useState(null);
  const [deleteIdx, setDeleteIdx]   = useState(null);

  const isDirty = JSON.stringify(competitors) !== JSON.stringify(INITIAL_COMPETITORS);

  const handleAnalyze = () => { if (urlInput.trim()) setAnalysis(analyzeCompetitorUrl(urlInput.trim())); };
  const filteredKw = filter === 'toutes' ? KEYWORD_GAPS : KEYWORD_GAPS.filter(k => k.priority === filter);

  const addCompetitor = ({ name, url, criteria }) => {
    const colors = getNextColor(competitors);
    setCompetitors(prev => [...prev, { name, url, criteria, isUs: false, ...colors }]);
  };

  const saveCompetitor = (idx, { name, url, criteria }) => {
    setCompetitors(prev => prev.map((c, i) =>
      i === idx ? { ...c, name, url, criteria } : c
    ));
  };

  const deleteCompetitor = (idx) => {
    setCompetitors(prev => prev.filter((_, i) => i !== idx));
    setDeleteIdx(null);
  };

  const gaps      = KEYWORD_GAPS.filter(k => !k.us).length;
  const exclusive = KEYWORD_GAPS.filter(k => !k.clicandsea && !k.oceandrive).length;
  const ourScore  = computeScore(competitors.find(c => c.isUs)?.criteria ?? {});

  return (
    <div className="grid gap-8">

      {/* KPI */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: 'Mots-clés non couverts',  value: gaps,        icon: Target,    color: 'bg-red-500',    desc: 'Opportunités identifiées vs concurrents' },
          { label: 'Opportunités exclusives', value: exclusive,    icon: Zap,       color: 'bg-[#E09F3E]', desc: 'Ni Clicandsea ni Oceandrive ne les ciblent' },
          { label: 'Score SEO actuel',        value: `${ourScore}%`, icon: BarChart2, color: 'bg-[#1B263B]', desc: 'vs 100% théorique atteignable' },
        ].map(({ label, value, icon: Icon, color, desc }) => (
          <div key={label} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col gap-2">
            <div className="flex justify-between items-start">
              <div className={`p-2 rounded-lg ${color}`}><Icon size={20} className="text-white" /></div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Veille</span>
            </div>
            <p className="text-slate-500 text-sm font-medium mt-2">{label}</p>
            <p className="text-3xl font-black text-slate-900">{value}</p>
            <p className="text-xs text-slate-400">{desc}</p>
          </div>
        ))}
      </div>

      {/* Radar */}
      <section className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#1B263B] rounded-lg"><BarChart2 size={18} className="text-[#E09F3E]" /></div>
            <div>
              <h2 className="text-lg font-bold text-[#1B263B]">Radar SEO Concurrentiel</h2>
              <p className="text-xs text-slate-500">Comparaison sur 8 critères pondérés — {competitors.length} site{competitors.length > 1 ? 's' : ''} analysé{competitors.length > 1 ? 's' : ''}.</p>
            </div>
          </div>
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-2 bg-[#1B263B] text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-[#25324d] transition-colors"
          >
            <Plus size={14} /> Ajouter un concurrent
          </button>
        </div>

        {isDirty && <div className="px-6 pt-4"><DirtyBanner onReset={resetCompetitors} /></div>}

        <div className="p-6">
          {/* Cartes de score */}
          <div className="flex flex-wrap gap-4 mb-8">
            {competitors.map((c, idx) => (
              <div key={idx} className={`flex-1 min-w-[180px] p-5 rounded-2xl border-2 ${c.borderClass} ${c.isUs ? 'bg-slate-50' : 'bg-white'} relative group`}>
                {/* Actions (pas sur "nous") */}
                {!c.isUs && (
                  <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <IconButton
                      onClick={() => setEditingIdx(idx)}
                      title="Modifier"
                      className="bg-white border border-slate-200 text-slate-400 hover:text-[#1B263B] hover:border-[#1B263B] shadow-sm"
                    >
                      <Pencil size={12} />
                    </IconButton>
                    <IconButton
                      onClick={() => setDeleteIdx(idx)}
                      title="Supprimer"
                      className="bg-white border border-slate-200 text-slate-400 hover:text-red-500 hover:border-red-300 shadow-sm"
                    >
                      <Trash2 size={12} />
                    </IconButton>
                  </div>
                )}
                <div className="flex items-center gap-2 mb-3">
                  <div className={`w-3 h-3 rounded-full ${c.colorClass}`} />
                  <span className="font-bold text-sm">{c.name}</span>
                  {c.isUs && <span className="text-[10px] bg-[#1B263B] text-white px-2 py-0.5 rounded-full font-bold">VOUS</span>}
                </div>
                <p className="text-xs text-slate-400 mb-3">{c.url}</p>
                <ScoreBar score={computeScore(c.criteria)} barClass={c.barClass} />
              </div>
            ))}
          </div>

          {/* Tableau comparatif */}
          <div className="overflow-x-auto rounded-xl border border-slate-100">
            <table className="w-full text-left">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="px-5 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Critère</th>
                  {competitors.map((c, idx) => (
                    <th key={idx} className="px-5 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-center whitespace-nowrap">
                      {c.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {Object.entries(CRITERIA_LABELS).map(([key, { label, weight }]) => (
                  <tr key={key} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-3 text-sm text-slate-700 font-medium">
                      {label} <span className="text-[10px] text-slate-300">×{weight}</span>
                    </td>
                    {competitors.map((c, idx) => (
                      <td key={idx} className="px-5 py-3 text-center">
                        <StatusIcon ok={c.criteria[key]} />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Analyseur URL */}
      <section className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center gap-3">
          <div className="p-2 bg-[#1B263B] rounded-lg"><Search size={18} className="text-[#E09F3E]" /></div>
          <div>
            <h2 className="text-lg font-bold text-[#1B263B]">Analyseur d'URL Concurrente</h2>
            <p className="text-xs text-slate-500">Collez l'URL d'un concurrent — l'outil génère une contre-stratégie pour La Capitainerie.</p>
          </div>
        </div>
        <div className="p-6 space-y-5">
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Globe size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input type="url" value={urlInput} onChange={e => setUrlInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleAnalyze(); }}
                placeholder="https://www.clicandsea.fr/emploi/capitaine-200-yachting"
                className="w-full pl-9 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-[#E09F3E] outline-none font-mono" />
            </div>
            <button onClick={handleAnalyze}
              className="bg-[#1B263B] text-white px-5 py-3 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-[#25324d] transition-all shrink-0">
              <Search size={15} /> Analyser
            </button>
          </div>

          {analysis && (
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-slate-700 flex items-center gap-2"><TrendingUp size={15} className="text-slate-400" /> Analyse de la page concurrente</h3>
                <div className={`flex items-start gap-3 p-4 rounded-xl border text-sm ${analysis.hasDescriptiveSlug ? 'bg-red-50 border-red-100' : 'bg-emerald-50 border-emerald-100'}`}>
                  <StatusIcon ok={analysis.hasDescriptiveSlug} />
                  <div>
                    <p className="font-bold text-slate-800">Slugs descriptifs</p>
                    <p className="text-xs text-slate-500 mt-0.5">{analysis.hasDescriptiveSlug ? 'URL bien structurée — point fort concurrent.' : 'URL peu optimisée — opportunité pour vous.'}</p>
                  </div>
                </div>
                <div className="p-4 rounded-xl border border-slate-100 bg-slate-50 space-y-2">
                  <p className="text-xs font-bold text-slate-500 uppercase">Mots-clés détectés</p>
                  {analysis.detectedKw.length > 0
                    ? <div className="flex flex-wrap gap-1.5">{analysis.detectedKw.map(kw => <span key={kw} className="px-2.5 py-1 bg-blue-100 text-blue-700 text-xs font-bold rounded-lg">{kw}</span>)}</div>
                    : <p className="text-xs text-slate-400 italic">Aucun mot-clé maritime détecté.</p>}
                </div>
                <div className="p-4 rounded-xl border border-slate-100 bg-slate-50">
                  <p className="text-xs font-bold text-slate-500 uppercase mb-2">Structure URL</p>
                  <div className="flex flex-wrap gap-1.5">
                    {analysis.segments.map((s, i) => <span key={i} className="px-2 py-1 bg-white border border-slate-200 text-slate-600 text-xs font-mono rounded">/{s}</span>)}
                  </div>
                  <p className="text-[10px] text-slate-400 mt-2">Profondeur : {analysis.depth} niveau{analysis.depth > 1 ? 'x' : ''}</p>
                </div>
              </div>
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-[#1B263B] flex items-center gap-2"><Wand2 size={15} className="text-[#E09F3E]" /> Contre-stratégie La Capitainerie</h3>
                <StrategyBlock strategy={analysis.strategy}
                  onCopy={() => copy(`URL: ${analysis.strategy.url}\nTitle: ${analysis.strategy.title}\nDescription: ${analysis.strategy.description}`)}
                  copied={copied} />
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Gap Sémantique */}
      <section className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#1B263B] rounded-lg"><Target size={18} className="text-[#E09F3E]" /></div>
            <div>
              <h2 className="text-lg font-bold text-[#1B263B]">Gap Sémantique</h2>
              <p className="text-xs text-slate-500">Mots-clés stratégiques à conquérir. Cliquez sur une ligne pour voir la stratégie.</p>
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            {['toutes', 'haute', 'moyenne', 'basse'].map(p => (
              <button key={p} onClick={() => setFilter(p)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all capitalize ${filter === p ? 'bg-[#1B263B] text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>
                {p}
              </button>
            ))}
          </div>
        </div>

        <div className="divide-y divide-slate-50">
          {filteredKw.map((kw, i) => {
            const strategy = generateStrategy(kw.keyword);
            const isOpen = expandedKw === i;
            return (
              <div key={i}>
                <div className="flex items-center gap-4 px-6 py-4 hover:bg-slate-50 cursor-pointer transition-colors group"
                  onClick={() => setExpandedKw(isOpen ? null : i)}>
                  <div className="flex-1 flex items-center gap-3">
                    <span className="font-bold text-sm text-slate-800">{kw.keyword}</span>
                    <PriorityBadge priority={kw.priority} />
                  </div>
                  <div className="hidden md:flex items-center gap-6">
                    {[['Clicandsea', kw.clicandsea], ['Oceandrive', kw.oceandrive], ['La Capitainerie', kw.us]].map(([label, covered]) => (
                      <div key={label} className="flex flex-col items-center gap-1">
                        <span className="text-[9px] text-slate-400 uppercase font-bold">{label}</span>
                        <StatusIcon ok={covered} size={15} />
                      </div>
                    ))}
                  </div>
                  <div className="text-slate-300 group-hover:text-slate-500 transition-colors">
                    {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </div>
                </div>
                {isOpen && (
                  <div className="px-6 pb-5 bg-slate-50 border-t border-slate-100">
                    <div className="mt-4">
                      <StrategyBlock strategy={strategy}
                        onCopy={() => copy(`URL: ${strategy.url}\nTitle: ${strategy.title}\nDescription: ${strategy.description}`)}
                        copied={copied} />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* ── Modales ── */}
      {showAdd && (
        <CompetitorForm
          modalTitle="Ajouter un concurrent"
          onClose={() => setShowAdd(false)}
          onSave={addCompetitor}
          saveLabel="Ajouter"
        />
      )}
      {editingIdx !== null && (
        <CompetitorForm
          modalTitle={`Modifier — ${competitors[editingIdx]?.name}`}
          initial={competitors[editingIdx]}
          onClose={() => setEditingIdx(null)}
          onSave={(data) => saveCompetitor(editingIdx, data)}
          saveLabel="Enregistrer"
        />
      )}
      {deleteIdx !== null && (
        <Modal title="Supprimer ce concurrent ?" onClose={() => setDeleteIdx(null)}>
          <p className="text-sm text-slate-600">
            Vous allez supprimer <strong>"{competitors[deleteIdx]?.name}"</strong> du radar. Réversible via "Réinitialiser".
          </p>
          <FormActions
            onCancel={() => setDeleteIdx(null)}
            onSubmit={() => deleteCompetitor(deleteIdx)}
            submitLabel="Supprimer"
            danger
          />
        </Modal>
      )}
    </div>
  );
}
