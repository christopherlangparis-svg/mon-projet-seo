import { useState } from 'react';
import {
  Plus, Trash2, Pencil, Search, Target,
  TrendingUp, TrendingDown, Minus, Globe, Tag,
  AlertTriangle, CheckCircle2, XCircle, Wand2, Copy, ClipboardCheck,
} from 'lucide-react';
import { useLocalStorage } from '../hooks/useLocalStorage.js';
import { useCopyToClipboard } from '../hooks/useCopyToClipboard.js';
import { Modal, Field, Input, FormActions, DirtyBanner, IconButton } from './formUI.jsx';

// ─── Données initiales ────────────────────────────────────────────────────────

const DEFAULT_COMPETITORS = [
  {
    id: 1, name: 'La Capitainerie', domain: 'lacapitainerie.com', isSelf: true, color: '#1B263B',
    notes: 'Notre site',
    scores: { urlStructure: 3, keywordsInUrl: 2, metaOptimization: 7, structuredData: 9, https: 10, mobileSpeed: 6, internalLinking: 3 },
  },
  {
    id: 2, name: 'Clicandsea', domain: 'clicandsea.fr', isSelf: false, color: '#E09F3E',
    notes: 'Leader volume — des milliers de pages indexées',
    scores: { urlStructure: 8, keywordsInUrl: 9, metaOptimization: 7, structuredData: 6, https: 10, mobileSpeed: 7, internalLinking: 9 },
  },
  {
    id: 3, name: 'Oceandrive Jobs', domain: 'oceandrive-jobs.com', isSelf: false, color: '#2196F3',
    notes: 'Niche Yachting — termes techniques précis',
    scores: { urlStructure: 7, keywordsInUrl: 8, metaOptimization: 8, structuredData: 5, https: 10, mobileSpeed: 6, internalLinking: 6 },
  },
];

const SCORE_CRITERIA = [
  { key: 'urlStructure',     label: "Structure d'URL",      weight: 2 },
  { key: 'keywordsInUrl',    label: "Mots-clés dans l'URL", weight: 2 },
  { key: 'metaOptimization', label: 'Balises Meta',          weight: 2 },
  { key: 'structuredData',   label: 'Données structurées',   weight: 2 },
  { key: 'https',            label: 'HTTPS',                 weight: 1 },
  { key: 'mobileSpeed',      label: 'Vitesse Mobile',        weight: 2 },
  { key: 'internalLinking',  label: 'Maillage interne',      weight: 2 },
];

const DEFAULT_KEYWORDS = [
  { kw: 'emploi capitaine bateau',         volume: 'Moyen',  clicandsea: true,  oceandrive: false, us: false },
  { kw: 'recrutement marin professionnel', volume: 'Moyen',  clicandsea: true,  oceandrive: true,  us: false },
  { kw: 'offre emploi yachting',           volume: 'Elevé',  clicandsea: true,  oceandrive: true,  us: false },
  { kw: 'emploi offshore marin',           volume: 'Moyen',  clicandsea: true,  oceandrive: false, us: false },
  { kw: 'capitaine 200 CDD',               volume: 'Faible', clicandsea: false, oceandrive: false, us: false },
  { kw: 'mecanicien naval emploi',         volume: 'Faible', clicandsea: true,  oceandrive: false, us: false },
  { kw: 'embarquement matelot',            volume: 'Faible', clicandsea: false, oceandrive: false, us: false },
  { kw: 'plateforme recrutement maritime', volume: 'Faible', clicandsea: false, oceandrive: false, us: false },
  { kw: 'steward yachting luxe',           volume: 'Moyen',  clicandsea: false, oceandrive: true,  us: false },
  { kw: 'emploi marine marchande france',  volume: 'Elevé',  clicandsea: true,  oceandrive: false, us: false },
];

const EMPTY_COMPETITOR = {
  name: '', domain: '', color: '#E09F3E', notes: '', isSelf: false,
  scores: { urlStructure: 5, keywordsInUrl: 5, metaOptimization: 5, structuredData: 5, https: 10, mobileSpeed: 5, internalLinking: 5 },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function calcScore(scores) {
  let total = 0, max = 0;
  SCORE_CRITERIA.forEach(({ key, weight }) => { total += (scores[key] ?? 5) * weight; max += 10 * weight; });
  return Math.round((total / max) * 100);
}

function toSlug(str) {
  return str.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-').replace(/-+/g, '-');
}

function ScoreBar({ value, color }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${(value / 10) * 100}%`, backgroundColor: color }} />
      </div>
      <span className="text-xs font-bold w-4 tabular-nums text-slate-600">{value}</span>
    </div>
  );
}

function GlobalBadge({ score }) {
  const cls = score >= 70 ? 'bg-emerald-100 text-emerald-700' : score >= 50 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700';
  return <span className={`text-sm font-black px-3 py-1 rounded-full ${cls}`}>{score}/100</span>;
}

function TrendIcon({ us, them }) {
  const d = us - them;
  if (d > 1)  return <TrendingUp   size={14} className="text-emerald-500" />;
  if (d < -1) return <TrendingDown size={14} className="text-red-500" />;
  return             <Minus        size={14} className="text-slate-400" />;
}

function StatusIcon({ status }) {
  if (status === 'ok')   return <CheckCircle2 size={15} className="text-emerald-500 shrink-0" />;
  if (status === 'warn') return <AlertTriangle size={15} className="text-amber-500 shrink-0" />;
  return                        <XCircle      size={15} className="text-red-500 shrink-0" />;
}

// ─── Analyse URL concurrente ──────────────────────────────────────────────────

function analyzeCompetitorUrl(rawUrl) {
  const result = { checks: [], keywords: [], suggestion: null };
  let url;
  try { url = new URL(rawUrl.startsWith('http') ? rawUrl : 'https://' + rawUrl); }
  catch { return { checks: [{ status: 'error', label: 'URL invalide', detail: 'Impossible de parser cette URL.' }], keywords: [], suggestion: null }; }

  const path = url.pathname.toLowerCase();
  const segments = path.split('/').filter(Boolean);

  result.checks.push({ status: url.protocol === 'https:' ? 'ok' : 'error', label: 'HTTPS', detail: url.protocol === 'https:' ? 'Protocole sécurisé' : 'Non sécurisé — pénalité potentielle' });
  result.checks.push({ status: path.length <= 75 ? 'ok' : 'warn', label: 'Longueur URL', detail: `${path.length} caractères dans le chemin` });

  const hasOpaque = segments.some((s) => /^[a-z0-9]{4,8}$/.test(s) && !/[aeiou]/.test(s));
  result.checks.push({ status: hasOpaque ? 'error' : 'ok', label: 'Slugs lisibles', detail: hasOpaque ? 'Identifiant opaque détecté' : 'Segments descriptifs' });

  const maritime = ['emploi','offre','recrutement','capitaine','marin','maritime','mecanicien','matelot','yachting','offshore','bateau','navire','embarquement'];
  const found = maritime.filter((kw) => path.includes(kw));
  result.keywords = found;
  result.checks.push({ status: found.length >= 2 ? 'ok' : found.length === 1 ? 'warn' : 'error', label: 'Mots-clés métier', detail: found.length > 0 ? `Détectés : ${found.join(', ')}` : 'Aucun mot-clé maritime trouvé' });

  if (found.length > 0) {
    const slug = found.slice(0, 3).map(toSlug).join('-');
    result.suggestion = {
      url: `/offres/${slug}`,
      title: `${found.map((k) => k.charAt(0).toUpperCase() + k.slice(1)).join(' ')} | La Capitainerie`,
      description: `Trouvez les meilleures offres de ${found.join(', ')} sur La Capitainerie — plateforme n°1 du recrutement maritime en France.`,
    };
  }
  return result;
}

// ─── Modale concurrent ────────────────────────────────────────────────────────

function CompetitorForm({ initial, modalTitle, onClose, onSave, saveLabel }) {
  const [form, setForm] = useState({ ...initial, scores: { ...initial.scores } });
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const setScore = (k, v) => setForm((f) => ({ ...f, scores: { ...f.scores, [k]: Number(v) } }));

  return (
    <Modal title={modalTitle} onClose={onClose} wide>
      <div className="space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <Field label="Nom"><Input value={form.name} onChange={(v) => set('name', v)} placeholder="Ex: JobsMer.fr" autoFocus /></Field>
          <Field label="Domaine"><Input value={form.domain} onChange={(v) => set('domain', v)} placeholder="jobsmer.fr" /></Field>
        </div>
        <Field label="Notes"><Input value={form.notes} onChange={(v) => set('notes', v)} placeholder="Points forts observés…" /></Field>
        <Field label="Couleur">
          <div className="flex items-center gap-3">
            <input type="color" value={form.color} onChange={(e) => set('color', e.target.value)} className="w-10 h-10 rounded-lg cursor-pointer border border-slate-200" />
            <span className="text-xs text-slate-500">Couleur distinctive dans le radar</span>
          </div>
        </Field>
        <div className="border-t border-slate-100 pt-4">
          <p className="text-xs font-bold uppercase text-slate-400 mb-4">Scores SEO estimés (1 = mauvais · 10 = excellent)</p>
          <div className="space-y-3">
            {SCORE_CRITERIA.map(({ key, label }) => (
              <div key={key} className="flex items-center gap-4">
                <span className="text-xs text-slate-600 w-44 shrink-0">{label}</span>
                <input type="range" min={1} max={10} value={form.scores[key] ?? 5}
                  onChange={(e) => setScore(key, e.target.value)} className="flex-1 accent-[#1B263B]" />
                <span className="text-xs font-bold w-4 tabular-nums">{form.scores[key] ?? 5}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      <FormActions onCancel={onClose}
        onSubmit={() => { if (form.name.trim() && form.domain.trim()) { onSave({ ...form, id: form.id ?? Date.now() }); onClose(); } }}
        submitLabel={saveLabel} />
    </Modal>
  );
}

// ─── Section 1 : Radar ────────────────────────────────────────────────────────

function RadarSection({ competitors, onEdit, onDelete, onAdd }) {
  const self = competitors.find((c) => c.isSelf);
  return (
    <section className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="p-6 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-[#1B263B] rounded-lg"><Target size={18} className="text-[#E09F3E]" /></div>
          <div>
            <h2 className="text-lg font-bold text-[#1B263B]">Radar Concurrentiel</h2>
            <p className="text-xs text-slate-500">Scoring SEO comparatif sur {SCORE_CRITERIA.length} critères. Les flèches indiquent votre position vs chaque concurrent.</p>
          </div>
        </div>
        <button onClick={onAdd} className="flex items-center gap-2 bg-[#1B263B] text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-[#25324d] transition-colors">
          <Plus size={14} /> Ajouter un concurrent
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b border-slate-100">
            <tr>
              <th className="px-6 py-3 text-[10px] uppercase font-bold text-slate-400 tracking-widest">Critère</th>
              {competitors.map((c) => (
                <th key={c.id} className="px-6 py-3 text-[10px] uppercase font-bold tracking-widest" style={{ color: c.color }}>
                  <div className="flex items-center gap-2 group">
                    {c.name}
                    {!c.isSelf && (
                      <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <IconButton onClick={() => onEdit(c)} className="text-slate-300 hover:text-slate-600 hover:bg-slate-100"><Pencil size={11} /></IconButton>
                        <IconButton onClick={() => onDelete(c.id)} className="text-slate-300 hover:text-red-500 hover:bg-red-50"><Trash2 size={11} /></IconButton>
                      </div>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {SCORE_CRITERIA.map(({ key, label }) => (
              <tr key={key} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4 text-xs font-medium text-slate-600 whitespace-nowrap">{label}</td>
                {competitors.map((c) => {
                  const val = c.scores[key] ?? 5;
                  const selfVal = self?.scores[key] ?? 5;
                  return (
                    <td key={c.id} className="px-6 py-4 min-w-[160px]">
                      <div className="flex items-center gap-2">
                        <div className="flex-1"><ScoreBar value={val} color={c.color} /></div>
                        {!c.isSelf && self && <TrendIcon us={selfVal} them={val} />}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
            <tr className="bg-slate-50 font-bold">
              <td className="px-6 py-4 text-xs font-bold text-slate-800 uppercase tracking-wide">Score global</td>
              {competitors.map((c) => (
                <td key={c.id} className="px-6 py-4"><GlobalBadge score={calcScore(c.scores)} /></td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>

      <div className="p-6 border-t border-slate-100 grid grid-cols-1 md:grid-cols-3 gap-4">
        {competitors.map((c) => (
          <div key={c.id} className="p-4 rounded-xl border-l-4" style={{ borderColor: c.color, backgroundColor: `${c.color}10` }}>
            <p className="text-xs font-bold mb-1" style={{ color: c.color }}>{c.name}</p>
            <p className="text-xs text-slate-500">{c.notes || '—'}</p>
            <p className="text-[10px] text-slate-400 mt-1">{c.domain}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

// ─── Section 2 : Analyseur URL ────────────────────────────────────────────────

function UrlAnalyzerSection() {
  const [input, setInput] = useState('');
  const [result, setResult] = useState(null);
  const { copied, copy } = useCopyToClipboard();

  return (
    <section className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="p-6 border-b border-slate-100 flex items-center gap-3">
        <div className="p-2 bg-[#1B263B] rounded-lg"><Search size={18} className="text-[#E09F3E]" /></div>
        <div>
          <h2 className="text-lg font-bold text-[#1B263B]">Analyseur de page concurrente</h2>
          <p className="text-xs text-slate-500">Collez une URL concurrente — l'outil la décortique et génère une contre-stratégie pour La Capitainerie.</p>
        </div>
      </div>

      <div className="p-6 space-y-5">
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Globe size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input type="url" value={input} onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') setResult(analyzeCompetitorUrl(input.trim())); }}
              placeholder="https://www.clicandsea.fr/offre-emploi/capitaine-200..."
              className="w-full pl-9 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-[#E09F3E] outline-none font-mono" />
          </div>
          <button onClick={() => { if (input.trim()) setResult(analyzeCompetitorUrl(input.trim())); }}
            className="bg-[#1B263B] text-white px-5 py-3 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-[#25324d] transition-all shrink-0">
            <Search size={15} /> Analyser
          </button>
        </div>

        {result && (
          <div className="grid md:grid-cols-2 gap-5">
            <div className="space-y-2">
              <p className="text-xs font-bold uppercase text-slate-400 mb-3">Diagnostic de leur URL</p>
              {result.checks.map((c, i) => (
                <div key={i} className={`flex items-start gap-3 p-3 rounded-xl text-sm border ${c.status === 'ok' ? 'bg-emerald-50 border-emerald-100' : c.status === 'warn' ? 'bg-amber-50 border-amber-100' : 'bg-red-50 border-red-100'}`}>
                  <StatusIcon status={c.status} />
                  <div>
                    <span className="font-bold text-slate-800">{c.label}</span>
                    {c.detail && <span className="text-slate-500 ml-2 text-xs">{c.detail}</span>}
                  </div>
                </div>
              ))}
              {result.keywords.length > 0 && (
                <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl mt-2">
                  <p className="text-xs font-bold text-blue-700 mb-2">Mots-clés maritimes détectés :</p>
                  <div className="flex flex-wrap gap-1.5">
                    {result.keywords.map((kw) => (
                      <span key={kw} className="text-[11px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">{kw}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div>
              <p className="text-xs font-bold uppercase text-slate-400 mb-3">Contre-stratégie La Capitainerie</p>
              {result.suggestion ? (
                <div className="bg-slate-900 rounded-xl p-5 space-y-4">
                  <div>
                    <p className="text-[10px] text-slate-500 uppercase font-bold mb-1.5 flex items-center gap-1"><Wand2 size={11} /> URL suggérée</p>
                    <p className="text-emerald-400 font-mono text-sm break-all">{result.suggestion.url}</p>
                  </div>
                  <div className="border-t border-white/10 pt-3">
                    <p className="text-[10px] text-slate-500 uppercase font-bold mb-1.5 flex items-center gap-1"><Tag size={11} /> Meta Title</p>
                    <p className="text-blue-300 font-mono text-xs break-all">{result.suggestion.title}</p>
                  </div>
                  <div className="border-t border-white/10 pt-3">
                    <p className="text-[10px] text-slate-500 uppercase font-bold mb-1.5">Meta Description</p>
                    <p className="text-slate-300 text-xs leading-relaxed">{result.suggestion.description}</p>
                  </div>
                  <button onClick={() => copy(`URL: ${result.suggestion.url}\nTitle: ${result.suggestion.title}\nDescription: ${result.suggestion.description}`)}
                    className="w-full mt-2 py-2.5 bg-white/10 hover:bg-white/20 rounded-xl text-xs font-bold text-white flex items-center justify-center gap-2 transition-all">
                    {copied ? <><ClipboardCheck size={14} className="text-emerald-400" /> Copié !</> : <><Copy size={14} /> Copier la contre-stratégie</>}
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-center h-40 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                  <p className="text-xs text-slate-400 italic text-center px-6">Aucun mot-clé maritime détecté.<br />Essayez une URL de page d'offre d'emploi.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

// ─── Section 3 : Gap sémantique ───────────────────────────────────────────────

const VOLUME_COLOR = { 'Elevé': 'bg-emerald-100 text-emerald-700', 'Moyen': 'bg-amber-100 text-amber-700', 'Faible': 'bg-slate-100 text-slate-500' };

function SemanticGapSection() {
  const [keywords, setKeywords, resetKeywords] = useLocalStorage('seo_keywords_gap', DEFAULT_KEYWORDS);
  const [newKw, setNewKw]   = useState('');
  const [newVol, setNewVol] = useState('Moyen');
  const { copy } = useCopyToClipboard();

  const isDirty   = JSON.stringify(keywords) !== JSON.stringify(DEFAULT_KEYWORDS);
  const gaps      = keywords.filter((k) => !k.us);
  const opps      = gaps.filter((k) => k.volume === 'Elevé' || k.volume === 'Moyen');

  const addKw = () => {
    const t = newKw.trim();
    if (!t) return;
    setKeywords((p) => [...p, { kw: t, volume: newVol, clicandsea: false, oceandrive: false, us: false }]);
    setNewKw('');
  };

  return (
    <section className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="p-6 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-[#1B263B] rounded-lg"><TrendingUp size={18} className="text-[#E09F3E]" /></div>
          <div>
            <h2 className="text-lg font-bold text-[#1B263B]">Gap Sémantique</h2>
            <p className="text-xs text-slate-500">
              <span className="font-bold text-red-500">{gaps.length} mot{gaps.length > 1 ? 's-clés' : '-clé'} non couvert{gaps.length > 1 ? 's' : ''}</span> par La Capitainerie
              · <span className="font-bold text-emerald-600">{opps.length} opportunité{opps.length > 1 ? 's' : ''} prioritaire{opps.length > 1 ? 's' : ''}</span>
            </p>
          </div>
        </div>
        {isDirty && <button onClick={resetKeywords} className="text-xs text-amber-600 hover:text-amber-800 font-bold underline">Réinitialiser</button>}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b border-slate-100">
            <tr className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">
              <th className="px-6 py-3">Mot-clé</th>
              <th className="px-6 py-3">Volume</th>
              <th className="px-6 py-3">Clicandsea</th>
              <th className="px-6 py-3">Oceandrive</th>
              <th className="px-6 py-3">La Capitainerie</th>
              <th className="px-6 py-3">Action</th>
              <th className="px-6 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {keywords.map((row, i) => {
              const isGap = !row.us;
              const slug  = `/offres/${toSlug(row.kw)}`;
              return (
                <tr key={i} className={`transition-colors group ${isGap ? 'hover:bg-red-50/40' : 'hover:bg-emerald-50/40'}`}>
                  <td className="px-6 py-4 text-sm font-medium text-slate-700">{row.kw}</td>
                  <td className="px-6 py-4">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${VOLUME_COLOR[row.volume] ?? 'bg-slate-100 text-slate-500'}`}>{row.volume}</span>
                  </td>
                  <td className="px-6 py-4">
                    {row.clicandsea ? <CheckCircle2 size={16} className="text-emerald-500" /> : <XCircle size={16} className="text-slate-200" />}
                  </td>
                  <td className="px-6 py-4">
                    {row.oceandrive ? <CheckCircle2 size={16} className="text-emerald-500" /> : <XCircle size={16} className="text-slate-200" />}
                  </td>
                  <td className="px-6 py-4">
                    <button onClick={() => setKeywords((p) => p.map((k, j) => j === i ? { ...k, us: !k.us } : k))}
                      title="Cliquez pour basculer le statut" className="hover:scale-110 transition-transform">
                      {row.us ? <CheckCircle2 size={16} className="text-emerald-500" /> : <XCircle size={16} className="text-red-400" />}
                    </button>
                  </td>
                  <td className="px-6 py-4">
                    {isGap && (
                      <button onClick={() => copy(`URL: ${slug}\nTitle: ${row.kw.charAt(0).toUpperCase() + row.kw.slice(1)} | La Capitainerie\nDescription: Découvrez nos offres de ${row.kw} sur La Capitainerie.`)}
                        className="text-[10px] bg-[#1B263B] text-white px-2.5 py-1.5 rounded-lg font-bold hover:bg-[#25324d] transition-colors flex items-center gap-1 whitespace-nowrap">
                        <Wand2 size={11} /> Générer slug
                      </button>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <IconButton onClick={() => setKeywords((p) => p.filter((_, j) => j !== i))}
                      className="text-slate-200 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Trash2 size={13} />
                    </IconButton>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="p-6 border-t border-slate-100">
        <p className="text-xs font-bold uppercase text-slate-400 mb-3">Ajouter un mot-clé à surveiller</p>
        <div className="flex gap-3">
          <input type="text" value={newKw} onChange={(e) => setNewKw(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') addKw(); }}
            placeholder="Ex: emploi bosco méditerranée"
            className="flex-1 px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-[#E09F3E] outline-none" />
          <select value={newVol} onChange={(e) => setNewVol(e.target.value)}
            className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none">
            <option>Elevé</option>
            <option>Moyen</option>
            <option>Faible</option>
          </select>
          <button onClick={addKw} className="p-2.5 bg-[#1B263B] text-white rounded-xl hover:bg-[#25324d] transition-colors">
            <Plus size={16} />
          </button>
        </div>
        <p className="text-[10px] text-slate-400 mt-2">Cliquez sur ✗/✓ dans la colonne "La Capitainerie" pour marquer un mot-clé comme couvert ou non couvert.</p>
      </div>
    </section>
  );
}

// ─── Composant principal ──────────────────────────────────────────────────────

export function TabVeille() {
  const [competitors, setCompetitors, resetCompetitors] = useLocalStorage('seo_competitors', DEFAULT_COMPETITORS);
  const [editingComp, setEditingComp] = useState(null);
  const [showAdd, setShowAdd]         = useState(false);
  const [deleteId, setDeleteId]       = useState(null);

  const isDirty = JSON.stringify(competitors) !== JSON.stringify(DEFAULT_COMPETITORS);

  return (
    <div className="grid gap-8">
      {isDirty && <DirtyBanner onReset={resetCompetitors} />}

      <RadarSection
        competitors={competitors}
        onEdit={(c) => setEditingComp(c)}
        onDelete={(id) => setDeleteId(id)}
        onAdd={() => setShowAdd(true)}
      />

      <UrlAnalyzerSection />

      <SemanticGapSection />

      {editingComp && (
        <CompetitorForm modalTitle={`Modifier — ${editingComp.name}`} initial={editingComp}
          onClose={() => setEditingComp(null)}
          onSave={(u) => setCompetitors((p) => p.map((c) => c.id === u.id ? u : c))}
          saveLabel="Enregistrer" />
      )}
      {showAdd && (
        <CompetitorForm modalTitle="Nouveau concurrent" initial={EMPTY_COMPETITOR}
          onClose={() => setShowAdd(false)}
          onSave={(n) => setCompetitors((p) => [...p, n])}
          saveLabel="Ajouter" />
      )}
      {deleteId !== null && (
        <Modal title="Supprimer ce concurrent ?" onClose={() => setDeleteId(null)}>
          <p className="text-sm text-slate-600 mb-2">
            Supprimer <strong>"{competitors.find((c) => c.id === deleteId)?.name}"</strong> du radar ? Réversible via "Réinitialiser".
          </p>
          <FormActions onCancel={() => setDeleteId(null)}
            onSubmit={() => { setCompetitors((p) => p.filter((c) => c.id !== deleteId)); setDeleteId(null); }}
            submitLabel="Supprimer" danger />
        </Modal>
      )}
    </div>
  );
}
