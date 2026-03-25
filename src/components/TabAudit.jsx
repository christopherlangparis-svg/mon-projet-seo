import { useState } from 'react';
import {
  ClipboardList, Play, Clock, GitCompare, CheckCircle2, XCircle,
  AlertTriangle, ChevronDown, ChevronUp, Trash2, TrendingUp,
  TrendingDown, Minus, Globe, Plus,
} from 'lucide-react';
import { useLocalStorage } from '../hooks/useLocalStorage.js';
import { Modal, Field, Input, FormActions, IconButton } from './formUI.jsx';

// ─── Critères d'audit ─────────────────────────────────────────────────────────
const AUDIT_CRITERIA = [
  // Auto-détectables
  { id: 'https',            label: 'HTTPS sécurisé',                  category: 'Technique',  weight: 2,  auto: true },
  { id: 'urlSlug',          label: "Slug d'URL descriptif",           category: 'Technique',  weight: 2,  auto: true },
  { id: 'motCleUrl',        label: "Mot-clé maritime dans l'URL",     category: 'Technique',  weight: 2,  auto: true },
  { id: 'hasCanonical',     label: 'Balise canonical présente',       category: 'Balises',    weight: 3,  auto: true },
  { id: 'titlePresent',     label: 'Meta Title renseigné',            category: 'Balises',    weight: 2,  auto: true },
  { id: 'descPresent',      label: 'Meta Description renseignée',     category: 'Balises',    weight: 2,  auto: true },
  { id: 'titleLength',      label: 'Title dans les limites (< 60)',   category: 'Balises',    weight: 1,  auto: true },
  { id: 'descLength',       label: 'Description dans les limites (< 155)', category: 'Balises', weight: 1, auto: true },
  // Manuels
  { id: 'lcpOk',            label: 'LCP < 2.5s (Core Web Vitals)',   category: 'Performance', weight: 3,  auto: false },
  { id: 'clsOk',            label: 'CLS < 0.1 (Core Web Vitals)',    category: 'Performance', weight: 2,  auto: false },
  { id: 'fidOk',            label: 'FID / INP < 200ms',              category: 'Performance', weight: 2,  auto: false },
  { id: 'backlinksDomaine', label: 'Backlinks domaines référents',    category: 'Autorité',   weight: 2,  auto: false },
  { id: 'positionKw1',      label: 'Top 10 sur mot-clé principal',   category: 'Positions',   weight: 3,  auto: false },
  { id: 'positionKw2',      label: 'Top 30 sur mots-clés secondaires', category: 'Positions', weight: 2,  auto: false },
  { id: 'indexable',        label: 'Pages métiers indexables (noindex absent)', category: 'Technique', weight: 3, auto: false },
  { id: 'jsonLd',           label: 'Données structurées JSON-LD',    category: 'Balises',    weight: 2,  auto: false },
];

const CATEGORIES = ['Technique', 'Balises', 'Performance', 'Autorité', 'Positions'];

const MARITIME_KW = [
  'marin','maritime','emploi','recrutement','embarquement','yachting',
  'offshore','capitaine','mecanicien','matelot','officier','navire',
  'bateau','peche','fishing','skipper','crew','sailor',
];

// ─── Auto-détection depuis URL ────────────────────────────────────────────────
function autoDetect(rawUrl) {
  const results = {};
  let url;
  try {
    url = new URL(rawUrl.startsWith('http') ? rawUrl : 'https://' + rawUrl);
  } catch {
    return null;
  }

  const path     = url.pathname.toLowerCase();
  const hostname = url.hostname.toLowerCase();
  const segments = path.split('/').filter(Boolean);

  results.https        = url.protocol === 'https:';
  results.urlSlug      = segments.some(s => s.length > 8 && s.includes('-'));
  results.motCleUrl    = MARITIME_KW.some(kw => path.includes(kw) || hostname.includes(kw));
  // Canonical, title, description — on ne peut pas les lire sans fetch
  // On les met à null pour indiquer "inconnu" → l'utilisateur complète
  results.hasCanonical = null;
  results.titlePresent = null;
  results.descPresent  = null;
  results.titleLength  = null;
  results.descLength   = null;

  return results;
}

// ─── Score ────────────────────────────────────────────────────────────────────
function computeAuditScore(criteria) {
  let total = 0, max = 0;
  AUDIT_CRITERIA.forEach(({ id, weight }) => {
    const val = criteria[id];
    if (val === null || val === undefined) return; // non renseigné = ignoré
    max += weight;
    if (val) total += weight;
  });
  if (max === 0) return 0;
  return Math.round((total / max) * 100);
}

function scoreColor(score) {
  if (score >= 80) return 'text-emerald-600';
  if (score >= 50) return 'text-amber-500';
  return 'text-red-500';
}

function scoreBg(score) {
  if (score >= 80) return 'bg-emerald-500';
  if (score >= 50) return 'bg-amber-500';
  return 'bg-red-500';
}

function scoreLabel(score) {
  if (score >= 80) return 'Bon';
  if (score >= 60) return 'Moyen';
  if (score >= 40) return 'Faible';
  return 'Critique';
}

// ─── Composants UI ────────────────────────────────────────────────────────────
function StatusIcon({ value, size = 16 }) {
  if (value === true)  return <CheckCircle2  size={size} className="text-emerald-500 shrink-0" />;
  if (value === false) return <XCircle       size={size} className="text-red-400 shrink-0" />;
  return                      <AlertTriangle size={size} className="text-slate-300 shrink-0" />;
}

function ScoreRing({ score }) {
  const color = scoreColor(score);
  const bg    = scoreBg(score);
  return (
    <div className="flex flex-col items-center gap-1">
      <div className={`w-20 h-20 rounded-full border-8 ${score >= 80 ? 'border-emerald-400' : score >= 50 ? 'border-amber-400' : 'border-red-400'} flex items-center justify-center bg-white shadow-inner`}>
        <span className={`text-2xl font-black ${color}`}>{score}</span>
      </div>
      <span className={`text-xs font-bold ${color}`}>{scoreLabel(score)}</span>
    </div>
  );
}

function DeltaIcon({ delta }) {
  if (delta > 0)  return <TrendingUp   size={14} className="text-emerald-500" />;
  if (delta < 0)  return <TrendingDown size={14} className="text-red-500" />;
  return                  <Minus        size={14} className="text-slate-400" />;
}

// ─── Toggle critère ───────────────────────────────────────────────────────────
function CriteriaToggle({ criterion, value, onChange }) {
  const isAuto = criterion.auto && value !== null && value !== undefined;
  const states = [true, false, null]; // cycle : oui → non → inconnu
  const current = value === true ? 0 : value === false ? 1 : 2;
  const next = states[(current + 1) % 3];

  return (
    <button
      type="button"
      onClick={() => onChange(next)}
      className={`flex items-center justify-between p-3 rounded-xl border-2 text-sm font-medium transition-all w-full ${
        value === true
          ? 'border-emerald-300 bg-emerald-50 text-emerald-800'
          : value === false
          ? 'border-red-200 bg-red-50 text-red-700'
          : 'border-slate-200 bg-slate-50 text-slate-400 hover:bg-slate-100'
      }`}
    >
      <span className="flex items-center gap-2 text-left">
        <StatusIcon value={value} size={15} />
        {criterion.label}
        {isAuto && (
          <span className="text-[9px] font-bold bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded-full uppercase">Auto</span>
        )}
      </span>
      <span className="text-[10px] text-slate-400 shrink-0 ml-2">×{criterion.weight}</span>
    </button>
  );
}

// ─── Formulaire d'audit ───────────────────────────────────────────────────────
function AuditForm({ onClose, onSave }) {
  const [url, setUrl]           = useState('https://lacapitainerie.com');
  const [label, setLabel]       = useState('');
  const [criteria, setCriteria] = useState({});
  const [detected, setDetected] = useState(false);
  const [expandedCat, setExpandedCat] = useState('Technique');

  const handleDetect = () => {
    if (!url.trim()) return;
    const auto = autoDetect(url.trim());
    if (!auto) return;
    setCriteria(prev => ({ ...prev, ...auto }));
    setDetected(true);
  };

  const setCriterion = (id, val) => setCriteria(prev => ({ ...prev, [id]: val }));
  const score = computeAuditScore(criteria);
  const canSave = Object.keys(criteria).length > 0;

  const handleSave = () => {
    const audit = {
      id:       Date.now(),
      date:     new Date().toISOString(),
      label:    label.trim() || `Audit du ${new Date().toLocaleDateString('fr-FR')}`,
      url:      url.trim(),
      criteria,
      score,
    };
    onSave(audit);
    onClose();
  };

  return (
    <Modal title="Nouvel audit SEO" onClose={onClose} wide>
      <div className="space-y-5">

        {/* URL + label */}
        <div className="grid grid-cols-2 gap-4">
          <Field label="URL à auditer">
            <Input value={url} onChange={setUrl} placeholder="https://lacapitainerie.com/offres/..." autoFocus />
          </Field>
          <Field label="Nom de l'audit (optionnel)">
            <Input value={label} onChange={setLabel} placeholder="Ex: Après refonte URLs" maxLength={40} />
          </Field>
        </div>

        {/* Bouton d'analyse auto */}
        <button
          type="button"
          onClick={handleDetect}
          className="flex items-center gap-2 bg-[#1B263B] text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-[#25324d] transition-colors"
        >
          <Play size={15} /> Analyser l'URL automatiquement
        </button>

        {detected && (
          <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-100 rounded-xl text-xs text-blue-700">
            <span className="shrink-0">🔍</span>
            <span>Analyse automatique effectuée sur 3 critères techniques. Complétez les critères restants manuellement puis cliquez sur enregistrer.</span>
          </div>
        )}

        {/* Critères par catégorie */}
        <div className="space-y-3">
          {CATEGORIES.map(cat => {
            const catCriteria = AUDIT_CRITERIA.filter(c => c.category === cat);
            const isOpen = expandedCat === cat;
            const catScore = catCriteria.filter(c => criteria[c.id] === true).length;
            const catTotal = catCriteria.filter(c => criteria[c.id] !== null && criteria[c.id] !== undefined).length;

            return (
              <div key={cat} className="border border-slate-200 rounded-xl overflow-hidden">
                <button
                  type="button"
                  onClick={() => setExpandedCat(isOpen ? null : cat)}
                  className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 hover:bg-slate-100 transition-colors"
                >
                  <span className="font-bold text-sm text-slate-700">{cat}</span>
                  <div className="flex items-center gap-3">
                    {catTotal > 0 && (
                      <span className="text-xs text-slate-500">{catScore}/{catTotal} critères</span>
                    )}
                    {isOpen ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
                  </div>
                </button>
                {isOpen && (
                  <div className="p-3 space-y-2">
                    {catCriteria.map(c => (
                      <CriteriaToggle
                        key={c.id}
                        criterion={c}
                        value={criteria[c.id] ?? null}
                        onChange={val => setCriterion(c.id, val)}
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Score temps réel */}
        <div className="flex items-center justify-between p-4 bg-slate-100 rounded-xl">
          <span className="text-sm font-bold text-slate-600">Score de cet audit</span>
          <div className="flex items-center gap-3">
            <div className={`h-2 w-32 rounded-full bg-slate-200 overflow-hidden`}>
              <div className={`h-full rounded-full ${scoreBg(score)} transition-all`} style={{ width: `${score}%` }} />
            </div>
            <span className={`text-xl font-black ${scoreColor(score)}`}>{score}%</span>
          </div>
        </div>

      </div>

      <FormActions
        onCancel={onClose}
        onSubmit={handleSave}
        submitLabel="Enregistrer l'audit"
      />
    </Modal>
  );
}

// ─── Détail d'un audit ────────────────────────────────────────────────────────
function AuditDetail({ audit, onClose }) {
  const [expandedCat, setExpandedCat] = useState(null);

  return (
    <Modal title={audit.label} onClose={onClose} wide>
      <div className="space-y-4">
        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
          <div>
            <p className="text-xs text-slate-400">{new Date(audit.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
            <p className="text-xs text-slate-500 font-mono mt-0.5">{audit.url}</p>
          </div>
          <ScoreRing score={audit.score} />
        </div>

        {CATEGORIES.map(cat => {
          const catCriteria = AUDIT_CRITERIA.filter(c => c.category === cat);
          const isOpen = expandedCat === cat;
          return (
            <div key={cat} className="border border-slate-200 rounded-xl overflow-hidden">
              <button type="button" onClick={() => setExpandedCat(isOpen ? null : cat)}
                className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 hover:bg-slate-100 transition-colors">
                <span className="font-bold text-sm text-slate-700">{cat}</span>
                {isOpen ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
              </button>
              {isOpen && (
                <div className="p-3 space-y-2">
                  {catCriteria.map(c => (
                    <div key={c.id} className={`flex items-center justify-between p-3 rounded-xl border text-sm ${
                      audit.criteria[c.id] === true ? 'bg-emerald-50 border-emerald-100' :
                      audit.criteria[c.id] === false ? 'bg-red-50 border-red-100' : 'bg-slate-50 border-slate-100'
                    }`}>
                      <span className="flex items-center gap-2">
                        <StatusIcon value={audit.criteria[c.id] ?? null} size={15} />
                        {c.label}
                      </span>
                      <span className="text-[10px] text-slate-400">×{c.weight}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
      <div className="pt-4 border-t border-slate-100 mt-4">
        <button onClick={onClose} className="w-full py-2.5 rounded-xl text-sm font-bold text-slate-500 hover:bg-slate-100 transition-colors">Fermer</button>
      </div>
    </Modal>
  );
}

// ─── Composant principal ──────────────────────────────────────────────────────
export function TabAudit() {
  const [audits, setAudits] = useLocalStorage('seo_audits', []);
  const [showForm, setShowForm]       = useState(false);
  const [detailAudit, setDetailAudit] = useState(null);
  const [compareA, setCompareA]       = useState('');
  const [compareB, setCompareB]       = useState('');
  const [deleteId, setDeleteId]       = useState(null);

  const saveAudit  = (audit) => setAudits(prev => [audit, ...prev]);
  const deleteAudit = (id)   => { setAudits(prev => prev.filter(a => a.id !== id)); setDeleteId(null); };

  // Comparaison
  const auditA = audits.find(a => a.id === Number(compareA));
  const auditB = audits.find(a => a.id === Number(compareB));

  const lastAudit = audits[0];
  const prevAudit = audits[1];
  const scoreDelta = lastAudit && prevAudit ? lastAudit.score - prevAudit.score : null;

  return (
    <div className="grid gap-8">

      {/* ─── KPI ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col gap-2">
          <div className="flex justify-between items-start">
            <div className="p-2 rounded-lg bg-[#1B263B]"><ClipboardList size={20} className="text-[#E09F3E]" /></div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Audit</span>
          </div>
          <p className="text-slate-500 text-sm font-medium mt-2">Audits réalisés</p>
          <p className="text-3xl font-black text-slate-900">{audits.length}</p>
          <p className="text-xs text-slate-400">{audits.length === 0 ? 'Lancez votre premier audit' : `Dernier : ${new Date(audits[0]?.date).toLocaleDateString('fr-FR')}`}</p>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col gap-2">
          <div className="flex justify-between items-start">
            <div className={`p-2 rounded-lg ${lastAudit ? scoreBg(lastAudit.score) : 'bg-slate-300'}`}>
              <TrendingUp size={20} className="text-white" />
            </div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Audit</span>
          </div>
          <p className="text-slate-500 text-sm font-medium mt-2">Score actuel</p>
          <p className={`text-3xl font-black ${lastAudit ? scoreColor(lastAudit.score) : 'text-slate-300'}`}>
            {lastAudit ? `${lastAudit.score}%` : '—'}
          </p>
          <p className="text-xs text-slate-400">{scoreLabel(lastAudit?.score ?? 0)}</p>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col gap-2">
          <div className="flex justify-between items-start">
            <div className={`p-2 rounded-lg ${scoreDelta === null ? 'bg-slate-300' : scoreDelta >= 0 ? 'bg-emerald-500' : 'bg-red-500'}`}>
              {scoreDelta !== null && scoreDelta >= 0 ? <TrendingUp size={20} className="text-white" /> : <TrendingDown size={20} className="text-white" />}
            </div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Audit</span>
          </div>
          <p className="text-slate-500 text-sm font-medium mt-2">Évolution</p>
          <p className={`text-3xl font-black ${scoreDelta === null ? 'text-slate-300' : scoreDelta >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
            {scoreDelta === null ? '—' : `${scoreDelta >= 0 ? '+' : ''}${scoreDelta} pts`}
          </p>
          <p className="text-xs text-slate-400">{audits.length < 2 ? 'Besoin de 2 audits minimum' : 'vs audit précédent'}</p>
        </div>
      </div>

      {/* ─── Lancer un audit ── */}
      <section className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#1B263B] rounded-lg"><Play size={18} className="text-[#E09F3E]" /></div>
            <div>
              <h2 className="text-lg font-bold text-[#1B263B]">Lancer un audit</h2>
              <p className="text-xs text-slate-500">Analyse automatique + complétion manuelle des critères avancés.</p>
            </div>
          </div>
          <button onClick={() => setShowForm(true)}
            className="flex items-center gap-2 bg-[#1B263B] text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-[#25324d] transition-colors shadow-sm">
            <Plus size={15} /> Nouvel audit
          </button>
        </div>

        {audits.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400">
            <ClipboardList size={48} className="mb-4 opacity-30" />
            <p className="font-bold text-slate-500">Aucun audit réalisé</p>
            <p className="text-sm mt-1">Cliquez sur "Nouvel audit" pour commencer.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {audits.map((audit, i) => (
              <div key={audit.id} className="flex items-center gap-4 px-6 py-4 hover:bg-slate-50 transition-colors group">
                <div className="flex flex-col items-center w-14 shrink-0">
                  <span className={`text-2xl font-black ${scoreColor(audit.score)}`}>{audit.score}</span>
                  <span className="text-[10px] text-slate-400">/ 100</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm text-slate-800 truncate">{audit.label}</p>
                  <p className="text-xs text-slate-400 font-mono truncate">{audit.url}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1">
                    <Clock size={11} />
                    {new Date(audit.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                <div className="w-24 shrink-0">
                  <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${scoreBg(audit.score)}`} style={{ width: `${audit.score}%` }} />
                  </div>
                </div>
                {i > 0 && (() => {
                  const prev = audits[i - 1]; // plus récent
                  // On compare le courant avec le suivant dans la liste (plus récent)
                  const delta = prev.score - audit.score;
                  return (
                    <div className="flex items-center gap-1 w-16 shrink-0 justify-end">
                      <DeltaIcon delta={-delta} />
                      <span className={`text-xs font-bold ${-delta > 0 ? 'text-emerald-600' : -delta < 0 ? 'text-red-500' : 'text-slate-400'}`}>
                        {-delta > 0 ? '+' : ''}{-delta}
                      </span>
                    </div>
                  );
                })()}
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                  <IconButton onClick={() => setDetailAudit(audit)} title="Voir le détail"
                    className="text-slate-400 hover:text-[#1B263B] hover:bg-slate-100">
                    <ChevronDown size={15} />
                  </IconButton>
                  <IconButton onClick={() => setDeleteId(audit.id)} title="Supprimer"
                    className="text-slate-400 hover:text-red-500 hover:bg-red-50">
                    <Trash2 size={14} />
                  </IconButton>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ─── Historique / courbe ── */}
      {audits.length >= 2 && (
        <section className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex items-center gap-3">
            <div className="p-2 bg-[#1B263B] rounded-lg"><TrendingUp size={18} className="text-[#E09F3E]" /></div>
            <div>
              <h2 className="text-lg font-bold text-[#1B263B]">Évolution dans le temps</h2>
              <p className="text-xs text-slate-500">{audits.length} audits — du {new Date(audits[audits.length - 1].date).toLocaleDateString('fr-FR')} au {new Date(audits[0].date).toLocaleDateString('fr-FR')}</p>
            </div>
          </div>
          <div className="p-6">
            {/* Graphique en barres simple */}
            <div className="flex items-end gap-3 h-40">
              {[...audits].reverse().map((audit, i) => (
                <div key={audit.id} className="flex-1 flex flex-col items-center gap-1 group cursor-pointer"
                  onClick={() => setDetailAudit(audit)}>
                  <span className={`text-xs font-bold ${scoreColor(audit.score)} opacity-0 group-hover:opacity-100 transition-opacity`}>
                    {audit.score}%
                  </span>
                  <div className="w-full relative" style={{ height: `${Math.max(audit.score, 4)}%`, minHeight: '8px' }}>
                    <div className={`w-full h-full rounded-t-lg ${scoreBg(audit.score)} opacity-80 group-hover:opacity-100 transition-opacity`} />
                  </div>
                  <span className="text-[9px] text-slate-400 text-center truncate w-full px-1">
                    {new Date(audit.date).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })}
                  </span>
                </div>
              ))}
            </div>
            <p className="text-xs text-slate-400 text-center mt-2">Cliquez sur une barre pour voir le détail de l'audit</p>
          </div>
        </section>
      )}

      {/* ─── Comparaison avant/après ── */}
      {audits.length >= 2 && (
        <section className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex items-center gap-3">
            <div className="p-2 bg-[#1B263B] rounded-lg"><GitCompare size={18} className="text-[#E09F3E]" /></div>
            <div>
              <h2 className="text-lg font-bold text-[#1B263B]">Comparaison Avant / Après</h2>
              <p className="text-xs text-slate-500">Sélectionnez deux audits pour voir les critères qui ont évolué.</p>
            </div>
          </div>
          <div className="p-6 space-y-5">

            {/* Sélecteurs */}
            <div className="grid grid-cols-2 gap-4">
              {[['Audit A (référence)', compareA, setCompareA], ['Audit B (comparaison)', compareB, setCompareB]].map(([label, val, setter]) => (
                <div key={label}>
                  <p className="text-xs font-bold uppercase text-slate-400 mb-1.5">{label}</p>
                  <select value={val} onChange={e => setter(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-[#E09F3E] outline-none">
                    <option value="">— Choisir un audit —</option>
                    {audits.map(a => (
                      <option key={a.id} value={a.id}>
                        {a.label} — {a.score}% — {new Date(a.date).toLocaleDateString('fr-FR')}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>

            {/* Résultat comparaison */}
            {auditA && auditB && auditA.id !== auditB.id && (
              <div className="space-y-3">
                {/* Score global */}
                <div className="grid grid-cols-3 gap-4 p-4 bg-slate-50 rounded-xl text-center">
                  <div>
                    <p className="text-xs text-slate-400 mb-1">{auditA.label}</p>
                    <p className={`text-3xl font-black ${scoreColor(auditA.score)}`}>{auditA.score}%</p>
                  </div>
                  <div className="flex flex-col items-center justify-center">
                    {(() => {
                      const delta = auditB.score - auditA.score;
                      return (
                        <>
                          <DeltaIcon delta={delta} />
                          <span className={`text-xl font-black mt-1 ${delta > 0 ? 'text-emerald-600' : delta < 0 ? 'text-red-500' : 'text-slate-400'}`}>
                            {delta > 0 ? '+' : ''}{delta} pts
                          </span>
                        </>
                      );
                    })()}
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 mb-1">{auditB.label}</p>
                    <p className={`text-3xl font-black ${scoreColor(auditB.score)}`}>{auditB.score}%</p>
                  </div>
                </div>

                {/* Détail critère par critère */}
                <div className="space-y-1.5">
                  {AUDIT_CRITERIA.map(c => {
                    const vA = auditA.criteria[c.id];
                    const vB = auditB.criteria[c.id];
                    const changed = vA !== vB;
                    if (!changed && vA === null) return null;
                    return (
                      <div key={c.id} className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm ${
                        changed
                          ? vB === true ? 'bg-emerald-50 border border-emerald-100' : 'bg-red-50 border border-red-100'
                          : 'bg-slate-50'
                      }`}>
                        <StatusIcon value={vA} size={14} />
                        <span className="flex-1 text-slate-700">{c.label}</span>
                        {changed && (
                          <span className={`font-bold text-xs ${vB === true ? 'text-emerald-600' : 'text-red-500'}`}>
                            {vB === true ? '↑ Amélioré' : '↓ Régressé'}
                          </span>
                        )}
                        <StatusIcon value={vB} size={14} />
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* ── Modales ── */}
      {showForm && <AuditForm onClose={() => setShowForm(false)} onSave={saveAudit} />}
      {detailAudit && <AuditDetail audit={detailAudit} onClose={() => setDetailAudit(null)} />}
      {deleteId !== null && (
        <Modal title="Supprimer cet audit ?" onClose={() => setDeleteId(null)}>
          <p className="text-sm text-slate-600">Cette action est irréversible. L'audit sera définitivement supprimé de l'historique.</p>
          <FormActions onCancel={() => setDeleteId(null)} onSubmit={() => deleteAudit(deleteId)} submitLabel="Supprimer" danger />
        </Modal>
      )}
    </div>
  );
}
