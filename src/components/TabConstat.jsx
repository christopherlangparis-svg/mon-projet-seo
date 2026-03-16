import { AlertCircle, Users } from 'lucide-react';
import { StatCard } from './ui.jsx';
import { STAT_CARDS, COMPETITORS } from '../data/seoData.js';

export function TabConstat() {
  return (
    <div className="grid gap-8">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {STAT_CARDS.map((card) => (
          <StatCard key={card.title} {...card} />
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Fossé sémantique */}
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
          <h2 className="text-xl font-bold mb-6 flex items-center gap-2 text-[#1B263B]">
            <AlertCircle className="text-red-500" size={24} />
            Analyse du «&nbsp;Fossé Sémantique&nbsp;»
          </h2>
          <div className="space-y-4 text-slate-600">
            <p>
              La structure actuelle du site est une impasse pour Google. Sans pages de contenu
              publiques, votre autorité sur le recrutement maritime reste nulle malgré votre
              avance technologique.
            </p>
            <div className="p-4 bg-red-50 rounded-xl border border-red-100">
              <h4 className="font-bold text-red-700 text-sm mb-2 uppercase">Points Critiques :</h4>
              <ul className="space-y-2 text-sm text-red-600">
                <li className="italic">• Aucun mot-clé métier indexable.</li>
                <li className="italic">• Absence totale de maillage interne par secteur.</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Benchmarks */}
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
          <h2 className="text-xl font-bold mb-6 flex items-center gap-2 text-[#1B263B]">
            <Users size={24} />
            Benchmarks Concurrents
          </h2>
          <div className="space-y-4">
            {COMPETITORS.map((c) => (
              <div key={c.name} className="p-4 rounded-xl border border-slate-100 bg-slate-50">
                <div className="flex justify-between items-center mb-1">
                  <span className={`font-bold ${c.highlighted ? 'text-[#E09F3E]' : ''}`}>
                    {c.name}
                  </span>
                  <span className={`text-[10px] px-2 py-0.5 rounded uppercase font-bold ${c.tagStyle}`}>
                    {c.tag}
                  </span>
                </div>
                <p className="text-xs text-slate-500">{c.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
