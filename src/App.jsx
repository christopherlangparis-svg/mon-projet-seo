import { useState } from 'react';
import { Anchor, BarChart3, Layout, FileText, Code2, Calendar, Eye, ArrowRight, Download, Wrench, Binoculars } from 'lucide-react';
import { TabConstat }  from './components/TabConstat.jsx';
import { TabSilos }    from './components/TabSilos.jsx';
import { TabSerp }     from './components/TabSerp.jsx';
import { TabMeta }     from './components/TabMeta.jsx';
import { TabTech }     from './components/TabTech.jsx';
import { TabRoadmap }  from './components/TabRoadmap.jsx';
import { TabOutils }   from './components/TabOutils.jsx';
import { TabVeille }   from './components/TabVeille.jsx';
import { JSON_LD_TEMPLATE, META_PAGES } from './data/seoData.js';

const TABS = [
  { id: 'constat', label: 'Constat',          icon: BarChart3 },
  { id: 'silos',   label: 'Silos',            icon: Layout },
  { id: 'meta',    label: 'Plan de Marquage', icon: FileText },
  { id: 'serp',    label: 'Simulateur SERP',  icon: Eye },
  { id: 'tech',    label: 'Spéc. Tech',       icon: Code2 },
  { id: 'outils',  label: 'Outils SEO',       icon: Wrench },
  { id: 'veille',  label: 'Veille Concurrentielle', icon: Binoculars, badge: 'NEW' },
  { id: 'roadmap', label: 'Roadmap',          icon: Calendar },
];

function buildExportPayload() {
  return JSON.stringify({ jsonLdTemplate: JSON_LD_TEMPLATE, metaPages: META_PAGES }, null, 2);
}

export default function App() {
  const [activeTab, setActiveTab] = useState('constat');

  const handleExportJson = () => {
    const blob = new Blob([buildExportPayload()], { type: 'application/json' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = 'lacapitainerie-seo-export.json'; a.click();
    URL.revokeObjectURL(url);
  };

  const TAB_COMPONENTS = {
    constat: <TabConstat />,
    silos:   <TabSilos />,
    meta:    <TabMeta />,
    serp:    <TabSerp />,
    tech:    <TabTech />,
    outils:  <TabOutils />,
    veille:  <TabVeille />,
    roadmap: <TabRoadmap />,
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      <header className="bg-[#1B263B] text-white py-5 px-8 flex justify-between items-center sticky top-0 z-50 shadow-lg border-b border-[#E09F3E]/20">
        <div className="flex items-center gap-3">
          <Anchor size={30} className="text-[#E09F3E]" />
          <div>
            <h1 className="text-xl font-bold tracking-tight">LA CAPITAINERIE</h1>
            <p className="text-[10px] uppercase tracking-[0.2em] text-[#E09F3E] font-semibold">Livrable Stratégique SEO 2026</p>
          </div>
        </div>
        <div className="hidden md:flex gap-3">
          <button onClick={() => window.print()} className="bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg text-sm transition-colors border border-white/10 flex items-center gap-2">
            <Download size={15} /> PDF
          </button>
          <button onClick={handleExportJson} className="bg-[#E09F3E] hover:bg-[#D48F2E] px-4 py-2 rounded-lg text-sm font-bold text-[#1B263B] transition-colors shadow-md">
            Extraire le JSON
          </button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <nav aria-label="Sections du rapport" className="flex flex-wrap gap-2 mb-8 bg-white p-1.5 rounded-2xl shadow-sm border border-slate-200">
          {TABS.map(({ id, label, icon: Icon, badge }) => (
            <button key={id} onClick={() => setActiveTab(id)} aria-current={activeTab === id ? 'page' : undefined}
              className={`relative flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${activeTab === id ? 'bg-[#1B263B] text-white shadow-md scale-[1.02]' : 'text-slate-500 hover:bg-slate-50'}`}>
              <Icon size={16} />{label}
              {badge && (
                <span className="absolute -top-1.5 -right-1.5 bg-[#E09F3E] text-[#1B263B] text-[9px] font-black px-1.5 py-0.5 rounded-full uppercase leading-none">{badge}</span>
              )}
            </button>
          ))}
        </nav>
        <div className="space-y-8">{TAB_COMPONENTS[activeTab]}</div>
      </div>

      <footer className="fixed bottom-0 w-full bg-white border-t border-slate-200 py-4 px-8 shadow-2xl z-50 print:hidden">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs text-slate-500 flex items-center gap-2">
            <span className="inline-block w-2 h-2 bg-emerald-500 rounded-full" />
            Statut du plan&nbsp;: <strong className="text-slate-700">Prêt pour exécution</strong>
          </p>
          <div className="flex gap-3">
            <button onClick={() => window.print()} className="px-6 py-2 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors flex items-center gap-2">
              <Download size={15} /> Exporter en PDF
            </button>
            <button onClick={() => setActiveTab('roadmap')} className="bg-[#1B263B] text-white px-8 py-3 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-[#25324d] transition-all shadow-lg">
              Démarrer la Phase 1 <ArrowRight size={18} />
            </button>
          </div>
        </div>
      </footer>
      <div className="h-24" />
    </div>
  );
}
