import { useState } from 'react';
import { Monitor, Smartphone } from 'lucide-react';
import { CharCounter, SerpHealthCheck } from './ui.jsx';
import { SERP_DEFAULTS, TITLE_MAX, DESC_MAX } from '../data/seoData.js';

export function TabSerp() {
  const [title, setTitle] = useState(SERP_DEFAULTS.title);
  const [desc, setDesc] = useState(SERP_DEFAULTS.description);
  const [mode, setMode] = useState('desktop');

  return (
    <div className="grid lg:grid-cols-2 gap-8 items-start">
      {/* ─── Éditeur ─── */}
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
        <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
          <Monitor size={20} className="text-[#1B263B]" />
          Éditeur de balises
        </h2>

        <div className="space-y-6">
          {/* Title */}
          <div>
            <div className="flex justify-between items-end mb-2">
              <label className="text-xs font-bold uppercase text-slate-400">Meta Title</label>
              <CharCounter current={title.length} max={TITLE_MAX} />
            </div>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-[#E09F3E] outline-none transition-all"
            />
          </div>

          {/* Description */}
          <div>
            <div className="flex justify-between items-end mb-2">
              <label className="text-xs font-bold uppercase text-slate-400">Meta Description</label>
              <CharCounter current={desc.length} max={DESC_MAX} />
            </div>
            <textarea
              rows={4}
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-[#E09F3E] outline-none transition-all resize-none"
            />
          </div>

          {/* Mode toggle */}
          <div className="pt-4 border-t border-slate-100">
            <label className="text-xs font-bold uppercase text-slate-400 mb-3 block">
              Mode d'aperçu
            </label>
            <div className="flex gap-2">
              {[
                { id: 'desktop', label: 'Bureau', Icon: Monitor },
                { id: 'mobile', label: 'Mobile', Icon: Smartphone },
              ].map(({ id, label, Icon }) => (
                <button
                  key={id}
                  onClick={() => setMode(id)}
                  className={`flex-1 py-3 rounded-xl flex items-center justify-center gap-2 text-xs font-bold transition-all ${
                    mode === id
                      ? 'bg-[#1B263B] text-white'
                      : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                  }`}
                >
                  <Icon size={16} /> {label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ─── Aperçu ─── */}
      <div className="space-y-6 sticky top-24">
        {/* SERP Preview */}
        <div className="bg-white p-10 rounded-2xl shadow-sm border border-slate-200 min-h-[280px] flex items-center justify-center">
          <div
            className={`transition-all duration-300 ${
              mode === 'mobile' ? 'w-[360px]' : 'w-full'
            }`}
          >
            <div className="flex flex-col gap-1">
              {/* Site info */}
              <div className="flex items-center gap-2 mb-1">
                <div className="w-7 h-7 bg-slate-100 rounded-full flex items-center justify-center text-[10px] font-bold text-slate-400">
                  LC
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-medium text-slate-800">La Capitainerie</span>
                  <span className="text-[10px] text-slate-400">https://www.lacapitainerie.com</span>
                </div>
              </div>

              {/* Title */}
              <h3
                className={`text-blue-700 font-medium leading-tight hover:underline cursor-pointer ${
                  mode === 'mobile' ? 'text-lg' : 'text-xl'
                }`}
              >
                {title || 'Titre de la page…'}
              </h3>

              {/* Description */}
              <p
                className={`text-slate-600 leading-normal mt-1 ${
                  mode === 'mobile' ? 'text-xs line-clamp-3' : 'text-sm'
                }`}
              >
                {desc || 'Veuillez saisir une meta-description pour simuler le rendu…'}
              </p>
            </div>
          </div>
        </div>

        {/* Health check dynamique */}
        <SerpHealthCheck
          title={title}
          titleMax={TITLE_MAX}
          desc={desc}
          descMax={DESC_MAX}
        />
      </div>
    </div>
  );
}
