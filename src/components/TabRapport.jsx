import { useState, useRef, useEffect, useCallback } from 'react';
import {
  BookOpen, Plus, Trash2, Eye, Download, Upload,
  Calendar, X, AlertCircle, RefreshCw,
  CheckCircle2, Clock, TrendingUp, Anchor, Github, Wifi, WifiOff,
} from 'lucide-react';
import { useLocalStorage } from '../hooks/useLocalStorage.js';
import { Modal, Field, Input, Textarea, FormActions } from './formUI.jsx';

// ─── Configuration GitHub ─────────────────────────────────────────────────────
const GITHUB_OWNER  = 'christopherlangparis-svg';
const GITHUB_REPO   = 'mon-projet-seo';
const GITHUB_BRANCH = 'main';
const GITHUB_FOLDER = 'rapports';
const GITHUB_API    = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${GITHUB_FOLDER}?ref=${GITHUB_BRANCH}`;

// ─── Hook de synchronisation GitHub ──────────────────────────────────────────
function useGithubSync(localRapports, setRapports) {
  const [syncStatus, setSyncStatus] = useState('idle'); // idle | loading | success | error
  const [lastSync, setLastSync]     = useState(null);

  const sync = useCallback(async () => {
    setSyncStatus('loading');
    try {
      // 1. Lister les fichiers du dossier /rapports/
      const listRes = await fetch(GITHUB_API, {
        headers: { 'Accept': 'application/vnd.github.v3+json' },
      });
      if (!listRes.ok) throw new Error(`GitHub API: ${listRes.status}`);
      const files = await listRes.json();

      // 2. Filtrer les JSON (ignorer .gitkeep)
      const jsonFiles = files.filter(f => f.name.endsWith('.json'));

      // 3. IDs déjà présents localement
      const localIds = new Set(localRapports.map(r => String(r.id)));

      // 4. Télécharger uniquement les nouveaux fichiers
      const newRapports = [];
      for (const file of jsonFiles) {
        // Identifier par nom de fichier pour éviter les doublons
        const alreadyPresent = localRapports.some(
          r => r._githubFile === file.name
        );
        if (alreadyPresent) continue;

        const rawRes = await fetch(file.download_url);
        if (!rawRes.ok) continue;
        const data = await rawRes.json();

        // Marquer l'origine GitHub pour éviter les doublons futurs
        newRapports.push({ ...data, _githubFile: file.name });
      }

      if (newRapports.length > 0) {
        setRapports(prev => {
          // Fusion : nouveaux en tête, dédoublonnage par _githubFile
          const existingFiles = new Set(prev.map(r => r._githubFile).filter(Boolean));
          const toAdd = newRapports.filter(r => !existingFiles.has(r._githubFile));
          return [...toAdd, ...prev].sort(
            (a, b) => new Date(b.date) - new Date(a.date)
          );
        });
      }

      setSyncStatus('success');
      setLastSync(new Date());
    } catch (err) {
      console.error('Sync GitHub échouée :', err);
      setSyncStatus('error');
    }
  }, [localRapports, setRapports]);

  // Sync automatique au montage du composant
  useEffect(() => { sync(); }, []); // eslint-disable-line

  return { syncStatus, lastSync, sync };
}

// ─── Constantes ───────────────────────────────────────────────────────────────
const CATEGORIES = ['Audit complet', 'Suivi mensuel', 'Analyse concurrents', 'Recommandations', 'Autre'];

const PRIORITY_STYLES = {
  haute:   { label: 'Haute',   bg: 'bg-red-50',    text: 'text-red-700',    border: 'border-red-200',    dot: 'bg-red-500'   },
  moyenne: { label: 'Moyenne', bg: 'bg-amber-50',  text: 'text-amber-700',  border: 'border-amber-200',  dot: 'bg-amber-500' },
  basse:   { label: 'Basse',   bg: 'bg-blue-50',   text: 'text-blue-700',   border: 'border-blue-200',   dot: 'bg-blue-500'  },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatDate(iso) {
  return new Date(iso).toLocaleDateString('fr-FR', {
    day: 'numeric', month: 'long', year: 'numeric',
  });
}

function scoreColor(s) {
  if (s >= 75) return 'text-emerald-600';
  if (s >= 50) return 'text-amber-500';
  return 'text-red-500';
}

function scoreBg(s) {
  if (s >= 75) return 'bg-emerald-500';
  if (s >= 50) return 'bg-amber-400';
  return 'bg-red-500';
}

// ─── Badge catégorie ──────────────────────────────────────────────────────────
function CategoryBadge({ cat }) {
  const colors = {
    'Audit complet':       'bg-[#1B263B] text-white',
    'Suivi mensuel':       'bg-blue-100 text-blue-700',
    'Analyse concurrents': 'bg-purple-100 text-purple-700',
    'Recommandations':     'bg-emerald-100 text-emerald-700',
    'Autre':               'bg-slate-100 text-slate-600',
  };
  return (
    <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${colors[cat] ?? colors['Autre']}`}>
      {cat}
    </span>
  );
}

// ─── ScoreRing ────────────────────────────────────────────────────────────────
function ScoreRing({ score }) {
  const r = 26, circ = 2 * Math.PI * r;
  const dash = circ * (score / 100);
  return (
    <div className="relative w-16 h-16 flex items-center justify-center">
      <svg className="absolute inset-0 -rotate-90" viewBox="0 0 64 64">
        <circle cx="32" cy="32" r={r} fill="none" stroke="#E2E8F0" strokeWidth="5" />
        <circle cx="32" cy="32" r={r} fill="none"
          stroke={score >= 75 ? '#10B981' : score >= 50 ? '#F59E0B' : '#EF4444'}
          strokeWidth="5" strokeLinecap="round"
          strokeDasharray={`${dash} ${circ}`} />
      </svg>
      <span className={`text-sm font-black ${scoreColor(score)}`}>{score}%</span>
    </div>
  );
}

// ─── Formulaire ajout rapport ─────────────────────────────────────────────────
function RapportForm({ onClose, onSave }) {
  const [form, setForm] = useState({
    titre: '',
    categorie: 'Audit complet',
    score: '',
    resume: '',
    points_forts: '',
    points_faibles: '',
    actions: [{ label: '', priorite: 'haute' }],
    url_analysee: '',
    auteur: '',
  });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const addAction = () =>
    setForm(f => ({ ...f, actions: [...f.actions, { label: '', priorite: 'haute' }] }));

  const updateAction = (i, key, val) =>
    setForm(f => ({ ...f, actions: f.actions.map((a, idx) => idx === i ? { ...a, [key]: val } : a) }));

  const removeAction = (i) =>
    setForm(f => ({ ...f, actions: f.actions.filter((_, idx) => idx !== i) }));

  const canSave = form.titre.trim() && form.resume.trim();

  const handleSave = () => {
    if (!canSave) return;
    onSave({
      id: Date.now(),
      date: new Date().toISOString(),
      titre: form.titre.trim(),
      categorie: form.categorie,
      score: form.score ? Math.min(100, Math.max(0, Number(form.score))) : null,
      resume: form.resume.trim(),
      points_forts: form.points_forts.trim(),
      points_faibles: form.points_faibles.trim(),
      actions: form.actions.filter(a => a.label.trim()),
      url_analysee: form.url_analysee.trim(),
      auteur: form.auteur.trim(),
    });
    onClose();
  };

  return (
    <Modal title="Nouveau rapport SEO" onClose={onClose} wide>
      <div className="space-y-5">

        {/* Titre + catégorie */}
        <div className="grid grid-cols-2 gap-4">
          <Field label="Titre du rapport">
            <Input value={form.titre} onChange={v => set('titre', v)} placeholder="Ex: Audit SEO – Mars 2026" autoFocus maxLength={80} />
          </Field>
          <Field label="Catégorie">
            <select
              value={form.categorie}
              onChange={e => set('categorie', e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-[#E09F3E] outline-none"
            >
              {CATEGORIES.map(c => <option key={c}>{c}</option>)}
            </select>
          </Field>
        </div>

        {/* URL + Score + Auteur */}
        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-2">
            <Field label="URL analysée">
              <Input value={form.url_analysee} onChange={v => set('url_analysee', v)} placeholder="https://lacapitainerie.com/…" />
            </Field>
          </div>
          <Field label="Score global (0–100)">
            <Input value={form.score} onChange={v => set('score', v)} placeholder="Ex: 72" />
          </Field>
        </div>

        <Field label="Auteur / Analyste">
          <Input value={form.auteur} onChange={v => set('auteur', v)} placeholder="Ex: Expert SEO" maxLength={40} />
        </Field>

        {/* Résumé */}
        <Field label="Résumé exécutif">
          <Textarea value={form.resume} onChange={v => set('resume', v)} rows={3} placeholder="Synthèse de l'analyse, contexte, enjeux principaux…" maxLength={600} />
        </Field>

        {/* Points forts / faibles */}
        <div className="grid grid-cols-2 gap-4">
          <Field label="✅ Points forts">
            <Textarea value={form.points_forts} onChange={v => set('points_forts', v)} rows={3} placeholder="Un point fort par ligne…" maxLength={400} />
          </Field>
          <Field label="⚠️ Points faibles">
            <Textarea value={form.points_faibles} onChange={v => set('points_faibles', v)} rows={3} placeholder="Un point faible par ligne…" maxLength={400} />
          </Field>
        </div>

        {/* Actions */}
        <Field label="Actions recommandées">
          <div className="space-y-2">
            {form.actions.map((action, i) => (
              <div key={i} className="flex gap-2 items-center">
                <input
                  type="text"
                  value={action.label}
                  onChange={e => updateAction(i, 'label', e.target.value)}
                  placeholder={`Action ${i + 1}…`}
                  className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-[#E09F3E] outline-none"
                />
                <select
                  value={action.priorite}
                  onChange={e => updateAction(i, 'priorite', e.target.value)}
                  className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#E09F3E]"
                >
                  <option value="haute">🔴 Haute</option>
                  <option value="moyenne">🟡 Moyenne</option>
                  <option value="basse">🔵 Basse</option>
                </select>
                {form.actions.length > 1 && (
                  <button onClick={() => removeAction(i)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                    <X size={14} />
                  </button>
                )}
              </div>
            ))}
            <button
              onClick={addAction}
              className="flex items-center gap-2 text-xs font-bold text-[#1B263B] hover:text-[#E09F3E] transition-colors mt-1"
            >
              <Plus size={13} /> Ajouter une action
            </button>
          </div>
        </Field>

      </div>
      <FormActions onCancel={onClose} onSubmit={handleSave} submitLabel="Enregistrer le rapport" />
    </Modal>
  );
}

// ─── Vue détail d'un rapport ──────────────────────────────────────────────────
function RapportDetail({ rapport, onClose }) {
  const forts   = rapport.points_forts?.split('\n').filter(Boolean) ?? [];
  const faibles = rapport.points_faibles?.split('\n').filter(Boolean) ?? [];

  const handleExport = () => {
    const blob = new Blob([JSON.stringify(rapport, null, 2)], { type: 'application/json' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url;
    a.download = `rapport-seo-${rapport.id}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Modal title={rapport.titre} onClose={onClose} wide>
      <div className="space-y-6">

        {/* Header méta */}
        <div className="flex items-start justify-between gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
          <div className="space-y-1.5">
            <CategoryBadge cat={rapport.categorie} />
            <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-1">
              <Calendar size={12} /> {formatDate(rapport.date)}
              {rapport.auteur && <><span className="mx-1">·</span><span>{rapport.auteur}</span></>}
            </p>
            {rapport.url_analysee && (
              <p className="text-xs font-mono text-slate-400">{rapport.url_analysee}</p>
            )}
          </div>
          {rapport.score !== null && <ScoreRing score={rapport.score} />}
        </div>

        {/* Résumé */}
        {rapport.resume && (
          <div>
            <p className="text-xs font-bold uppercase text-slate-400 tracking-wider mb-2">Résumé exécutif</p>
            <p className="text-sm text-slate-700 leading-relaxed">{rapport.resume}</p>
          </div>
        )}

        {/* Points forts / faibles */}
        {(forts.length > 0 || faibles.length > 0) && (
          <div className="grid grid-cols-2 gap-4">
            {forts.length > 0 && (
              <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100">
                <p className="text-xs font-bold text-emerald-700 uppercase tracking-wider mb-3">✅ Points forts</p>
                <ul className="space-y-2">
                  {forts.map((f, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-emerald-800">
                      <CheckCircle2 size={13} className="mt-0.5 shrink-0 text-emerald-500" />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {faibles.length > 0 && (
              <div className="p-4 bg-red-50 rounded-xl border border-red-100">
                <p className="text-xs font-bold text-red-700 uppercase tracking-wider mb-3">⚠️ Points faibles</p>
                <ul className="space-y-2">
                  {faibles.map((f, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-red-800">
                      <AlertCircle size={13} className="mt-0.5 shrink-0 text-red-400" />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        {rapport.actions?.length > 0 && (
          <div>
            <p className="text-xs font-bold uppercase text-slate-400 tracking-wider mb-3">Actions recommandées</p>
            <div className="space-y-2">
              {rapport.actions.map((a, i) => {
                const s = PRIORITY_STYLES[a.priorite] ?? PRIORITY_STYLES.basse;
                return (
                  <div key={i} className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${s.bg} ${s.border}`}>
                    <span className={`w-2 h-2 rounded-full shrink-0 ${s.dot}`} />
                    <span className={`text-sm font-medium flex-1 ${s.text}`}>{a.label}</span>
                    <span className={`text-[10px] font-bold uppercase tracking-wider ${s.text}`}>{s.label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Export */}
        <div className="pt-2 flex justify-end">
          <button
            onClick={handleExport}
            className="flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-[#1B263B] transition-colors"
          >
            <Download size={13} /> Exporter en JSON
          </button>
        </div>

      </div>
      <div className="pt-4 border-t border-slate-100 mt-2">
        <button onClick={onClose} className="w-full py-2.5 rounded-xl text-sm font-bold text-slate-500 hover:bg-slate-100 transition-colors">
          Fermer
        </button>
      </div>
    </Modal>
  );
}

// ─── Carte rapport ────────────────────────────────────────────────────────────
function RapportCard({ rapport, onView, onDelete }) {
  const forts   = rapport.points_forts?.split('\n').filter(Boolean) ?? [];
  const faibles = rapport.points_faibles?.split('\n').filter(Boolean) ?? [];

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all group overflow-hidden">
      {/* Barre de score en haut */}
      {rapport.score !== null && (
        <div className="h-1.5 w-full bg-slate-100">
          <div className={`h-full ${scoreBg(rapport.score)} transition-all`} style={{ width: `${rapport.score}%` }} />
        </div>
      )}

      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <CategoryBadge cat={rapport.categorie} />
              {rapport.score !== null && (
                <span className={`text-xs font-black ${scoreColor(rapport.score)}`}>{rapport.score}%</span>
              )}
            </div>
            <h3 className="font-bold text-[#1B263B] text-base leading-snug truncate">{rapport.titre}</h3>
            <p className="text-xs text-slate-400 mt-1 flex items-center gap-1.5">
              <Calendar size={11} />
              {formatDate(rapport.date)}
              {rapport.auteur && <><span>·</span> {rapport.auteur}</>}
            </p>
          </div>
        </div>

        {/* Résumé */}
        {rapport.resume && (
          <p className="text-sm text-slate-500 leading-relaxed line-clamp-2 mb-4">{rapport.resume}</p>
        )}

        {/* Stats rapides */}
        <div className="flex gap-3 mb-5">
          {forts.length > 0 && (
            <div className="flex items-center gap-1.5 text-xs text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-100">
              <CheckCircle2 size={11} /> {forts.length} point{forts.length > 1 ? 's' : ''} fort{forts.length > 1 ? 's' : ''}
            </div>
          )}
          {faibles.length > 0 && (
            <div className="flex items-center gap-1.5 text-xs text-red-500 bg-red-50 px-2.5 py-1 rounded-lg border border-red-100">
              <AlertCircle size={11} /> {faibles.length} point{faibles.length > 1 ? 's' : ''} faible{faibles.length > 1 ? 's' : ''}
            </div>
          )}
          {rapport.actions?.length > 0 && (
            <div className="flex items-center gap-1.5 text-xs text-slate-500 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200">
              <Clock size={11} /> {rapport.actions.length} action{rapport.actions.length > 1 ? 's' : ''}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={() => onView(rapport)}
            className="flex-1 flex items-center justify-center gap-2 bg-[#1B263B] text-white px-4 py-2.5 rounded-xl text-sm font-bold hover:bg-[#25324d] transition-colors"
          >
            <Eye size={14} /> Consulter
          </button>
          <button
            onClick={() => onDelete(rapport.id)}
            className="p-2.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors border border-slate-200"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Bannière de synchronisation GitHub ──────────────────────────────────────
function SyncBanner({ status, lastSync, onSync }) {
  const fmt = (d) => d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

  const states = {
    idle:    { icon: <Github size={14} />,    text: 'Synchroniser avec GitHub',  cls: 'bg-slate-50 text-slate-500 border-slate-200 hover:border-[#1B263B] hover:text-[#1B263B]' },
    loading: { icon: <RefreshCw size={14} className="animate-spin" />, text: 'Synchronisation…', cls: 'bg-blue-50 text-blue-600 border-blue-200 cursor-wait' },
    success: { icon: <Wifi size={14} />,      text: lastSync ? `Sync OK — ${fmt(lastSync)}` : 'Synchronisé', cls: 'bg-emerald-50 text-emerald-600 border-emerald-200' },
    error:   { icon: <WifiOff size={14} />,   text: 'Sync échouée — réessayer', cls: 'bg-red-50 text-red-500 border-red-200 hover:bg-red-100' },
  };

  const s = states[status] ?? states.idle;

  return (
    <button
      onClick={status !== 'loading' ? onSync : undefined}
      className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold border transition-all ${s.cls}`}
    >
      {s.icon}
      {s.text}
    </button>
  );
}

// ─── État vide ────────────────────────────────────────────────────────────────
function EmptyState({ onAdd }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="w-16 h-16 bg-[#1B263B] rounded-2xl flex items-center justify-center mb-5 shadow-lg">
        <Anchor size={28} className="text-[#E09F3E]" />
      </div>
      <h3 className="text-lg font-bold text-[#1B263B] mb-2">Aucun rapport archivé</h3>
      <p className="text-sm text-slate-500 max-w-xs mb-6 leading-relaxed">
        Créez votre premier rapport pour commencer à suivre l'évolution du référencement de La Capitainerie.
      </p>
      <button
        onClick={onAdd}
        className="flex items-center gap-2 bg-[#1B263B] text-white px-6 py-3 rounded-xl text-sm font-bold hover:bg-[#25324d] transition-colors shadow-md"
      >
        <Plus size={15} /> Créer un rapport
      </button>
    </div>
  );
}

// ─── Composant principal ──────────────────────────────────────────────────────
export function TabRapport() {
  const [rapports, setRapports] = useLocalStorage('seo_rapports', []);
  const [showForm, setShowForm]       = useState(false);
  const [viewRapport, setViewRapport] = useState(null);
  const [deleteId, setDeleteId]       = useState(null);
  const [filterCat, setFilterCat]     = useState('Tous');
  const fileInputRef = useRef(null);

  // ── Sync GitHub automatique ──
  const { syncStatus, lastSync, sync } = useGithubSync(rapports, setRapports);

  const saveRapport   = (r)  => setRapports(prev => [r, ...prev]);
  const deleteRapport = (id) => { setRapports(prev => prev.filter(r => r.id !== id)); setDeleteId(null); };

  // Import JSON
  const handleImport = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target.result);
        const rapport = { ...data, id: Date.now(), date: data.date ?? new Date().toISOString() };
        setRapports(prev => [rapport, ...prev]);
      } catch { /* ignore parse errors */ }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const cats = ['Tous', ...CATEGORIES];
  const filtered = filterCat === 'Tous'
    ? rapports
    : rapports.filter(r => r.categorie === filterCat);

  // Stats
  const avgScore = rapports.filter(r => r.score !== null).length
    ? Math.round(rapports.filter(r => r.score !== null).reduce((s, r) => s + r.score, 0) / rapports.filter(r => r.score !== null).length)
    : null;

  const lastScore  = rapports[0]?.score ?? null;
  const prevScore  = rapports[1]?.score ?? null;
  const scoreDelta = lastScore !== null && prevScore !== null ? lastScore - prevScore : null;

  return (
    <div className="grid gap-8">

      {/* ── En-tête + stats ── */}
      <div className="bg-[#1B263B] text-white p-8 rounded-3xl relative overflow-hidden shadow-xl">
        <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-[#E09F3E]/10 blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
        <div className="relative z-10 flex flex-wrap items-start justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <BookOpen size={18} className="text-[#E09F3E]" />
              <span className="text-xs font-bold uppercase tracking-widest text-[#E09F3E]">Archive</span>
            </div>
            <h2 className="text-2xl font-bold mb-1">Rapports SEO</h2>
            <p className="text-slate-400 text-sm max-w-md">
              Centralisez et consultez tous vos rapports d'analyse SEO. Chaque rapport est sauvegardé dans votre navigateur.
            </p>
          </div>

          {/* KPIs */}
          <div className="flex gap-4 flex-wrap">
            <div className="bg-white/10 rounded-xl px-5 py-3 text-center border border-white/10">
              <p className="text-2xl font-black text-white">{rapports.length}</p>
              <p className="text-xs text-slate-400 mt-0.5">Rapport{rapports.length !== 1 ? 's' : ''}</p>
            </div>
            {avgScore !== null && (
              <div className="bg-white/10 rounded-xl px-5 py-3 text-center border border-white/10">
                <p className={`text-2xl font-black ${scoreColor(avgScore)}`}>{avgScore}%</p>
                <p className="text-xs text-slate-400 mt-0.5">Score moyen</p>
              </div>
            )}
            {scoreDelta !== null && (
              <div className="bg-white/10 rounded-xl px-5 py-3 text-center border border-white/10">
                <p className={`text-2xl font-black flex items-center gap-1 ${scoreDelta >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  <TrendingUp size={18} />
                  {scoreDelta >= 0 ? '+' : ''}{scoreDelta}
                </p>
                <p className="text-xs text-slate-400 mt-0.5">Évolution</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Barre d'actions + filtres ── */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        {/* Filtres catégories */}
        <div className="flex gap-2 flex-wrap">
          {cats.map(c => (
            <button key={c} onClick={() => setFilterCat(c)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                filterCat === c
                  ? 'bg-[#1B263B] text-white shadow-sm'
                  : 'bg-white text-slate-500 border border-slate-200 hover:border-[#1B263B] hover:text-[#1B263B]'
              }`}
            >
              {c}
              {c !== 'Tous' && (
                <span className="ml-1.5 opacity-60">
                  {rapports.filter(r => r.categorie === c).length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Boutons action */}
        <div className="flex gap-2">
          <SyncBanner status={syncStatus} lastSync={lastSync} onSync={sync} />
          <input ref={fileInputRef} type="file" accept=".json" className="hidden" onChange={handleImport} />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 bg-white border border-slate-200 text-slate-600 px-4 py-2.5 rounded-xl text-sm font-bold hover:border-[#1B263B] hover:text-[#1B263B] transition-colors"
          >
            <Upload size={14} /> Importer
          </button>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 bg-[#E09F3E] hover:bg-[#D48F2E] text-[#1B263B] px-5 py-2.5 rounded-xl text-sm font-bold transition-colors shadow-md"
          >
            <Plus size={15} /> Nouveau rapport
          </button>
        </div>
      </div>

      {/* ── Grille rapports ── */}
      {filtered.length === 0 ? (
        <EmptyState onAdd={() => setShowForm(true)} />
      ) : (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filtered.map(r => (
            <RapportCard
              key={r.id}
              rapport={r}
              onView={setViewRapport}
              onDelete={setDeleteId}
            />
          ))}
        </div>
      )}

      {/* ── Modales ── */}
      {showForm && (
        <RapportForm onClose={() => setShowForm(false)} onSave={saveRapport} />
      )}

      {viewRapport && (
        <RapportDetail rapport={viewRapport} onClose={() => setViewRapport(null)} />
      )}

      {deleteId !== null && (
        <Modal title="Supprimer ce rapport ?" onClose={() => setDeleteId(null)}>
          <p className="text-sm text-slate-600">Cette action est irréversible. Le rapport sera définitivement supprimé de votre navigateur.</p>
          <FormActions
            onCancel={() => setDeleteId(null)}
            onSubmit={() => deleteRapport(deleteId)}
            submitLabel="Supprimer"
            danger
          />
        </Modal>
      )}

    </div>
  );
}
