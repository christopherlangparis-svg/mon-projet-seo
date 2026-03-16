import { useState } from 'react';
import {
  TrendingUp, Search, Globe, CheckCircle2, XCircle,
  Copy, ClipboardCheck, ChevronDown, ChevronUp,
  BarChart2, Target, Zap, Wand2,
} from 'lucide-react';
import { useCopyToClipboard } from '../hooks/useCopyToClipboard.js';

const COMPETITORS_DATA = [
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
      {[['URL', strategy.url, 'text-emerald-400 font-mono text-xs'], ['Title', strategy.title, 'text-blue-300 font-mono text-xs'], ['Description', strategy.description, 'text-slate-300 text-xs leading-relaxed']].map(([lbl, val, cls]) => (
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

export function TabVeille() {
  const [urlInput, setUrlInput]     = useState('');
  const [analysis, setAnalysis]     = useState(null);
  const [expandedKw, setExpandedKw] = useState(null);
  const [filter, setFilter]         = useState('toutes');
  const { copied, copy }            = useCopyToClipboard();

  const handleAnalyze = () => { if (urlInput.trim()) setAnalysis(analyzeCompetitorUrl(urlInput.trim())); };
  const filteredKw = filter === 'toutes' ? KEYWORD_GAPS : KEYWORD_GAPS.filter(k => k.priority === filter);
  const gaps        = KEYWORD_GAPS.filter(k => !k.us).length;
  const exclusive   = KEYWORD_GAPS.filter(k => !k.clicandsea && !k.oceandrive).length;
  const ourScore    = computeScore(COMPETITORS_DATA[0].criteria);

  return (
    <div className="grid gap-8">

      {/* KPI */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: 'Mots-clés non couverts',  value: gaps,       icon: Target,   color: 'bg-red-500',    desc: 'Opportunités identifiées vs concurrents' },
          { label: 'Opportunités exclusives', value: exclusive,   icon: Zap,      color: 'bg-[#E09F3E]', desc: 'Ni Clicandsea ni Oceandrive ne les ciblent' },
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
        <div className="p-6 border-b border-slate-100 flex items-center gap-3">
          <div className="p-2 bg-[#1B263B] rounded-lg"><BarChart2 size={18} className="text-[#E09F3E]" /></div>
          <div>
            <h2 className="text-lg font-bold text-[#1B263B]">Radar SEO Concurrentiel</h2>
            <p className="text-xs text-slate-500">Comparaison sur 8 critères pondérés.</p>
          </div>
        </div>
        <div className="p-6">
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            {COMPETITORS_DATA.map(c => (
              <div key={c.name} className={`p-5 rounded-2xl border-2 ${c.borderClass} ${c.isUs ? 'bg-slate-50' : 'bg-white'}`}>
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
          <div className="overflow-x-auto rounded-xl border border-slate-100">
            <table className="w-full text-left">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="px-5 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Critère</th>
                  {COMPETITORS_DATA.map(c => (
                    <th key={c.name} className="px-5 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-center">{c.name}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {Object.entries(CRITERIA_LABELS).map(([key, { label, weight }]) => (
                  <tr key={key} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-3 text-sm text-slate-700 font-medium">
                      {label} <span className="text-[10px] text-slate-300">×{weight}</span>
                    </td>
                    {COMPETITORS_DATA.map(c => (
                      <td key={c.name} className="px-5 py-3 text-center"><StatusIcon ok={c.criteria[key]} /></td>
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
            <button onClick={handleAnalyze} className="bg-[#1B263B] text-white px-5 py-3 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-[#25324d] transition-all shrink-0">
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
                <StrategyBlock strategy={analysis.strategy} onCopy={() => copy(`URL: ${analysis.strategy.url}\nTitle: ${analysis.strategy.title}\nDescription: ${analysis.strategy.description}`)} copied={copied} />
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
                <div className="flex items-center gap-4 px-6 py-4 hover:bg-slate-50 cursor-pointer transition-colors group" onClick={() => setExpandedKw(isOpen ? null : i)}>
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
                      <StrategyBlock strategy={strategy} onCopy={() => copy(`URL: ${strategy.url}\nTitle: ${strategy.title}\nDescription: ${strategy.description}`)} copied={copied} />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

    </div>
  );
}
