import { Code2, FileText, CheckCircle2, ClipboardCheck, Anchor } from 'lucide-react';
import { useCopyToClipboard } from '../hooks/useCopyToClipboard.js';
import { TECH_CHECKLIST, JSON_LD_TEMPLATE } from '../data/seoData.js';

const JSON_LD_STRING = JSON.stringify(JSON_LD_TEMPLATE, null, 2);

export function TabTech() {
  const { copied, copy } = useCopyToClipboard();

  return (
    <div className="grid md:grid-cols-2 gap-8">
      {/* JSON-LD */}
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Code2 className="text-[#E09F3E]" />
            Google Jobs (JSON-LD)
          </h2>
          <span className="bg-slate-900 text-white text-[10px] font-bold px-2 py-1 rounded">
            DYNAMIQUE
          </span>
        </div>

        <div className="bg-slate-900 rounded-2xl p-6 font-mono text-[11px] leading-relaxed text-emerald-400 overflow-x-auto shadow-inner">
          <pre>{JSON_LD_STRING}</pre>
        </div>

        <button
          onClick={() => copy(JSON_LD_STRING)}
          className="w-full mt-6 bg-slate-100 hover:bg-slate-200 py-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2"
        >
          {copied ? (
            <>
              <ClipboardCheck size={16} className="text-emerald-500" />
              <span className="text-emerald-600">Copié dans le presse-papiers !</span>
            </>
          ) : (
            <>
              <FileText size={16} />
              Copier le modèle complet
            </>
          )}
        </button>
      </div>

      {/* Guide d'implémentation */}
      <div className="bg-[#1B263B] p-8 rounded-2xl text-white shadow-xl relative overflow-hidden">
        <h2 className="text-xl font-bold mb-8">Guide d'implémentation Dév</h2>
        <div className="space-y-6 relative z-10">
          {TECH_CHECKLIST.map((item) => (
            <div key={item.title} className="flex gap-4">
              <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center shrink-0">
                <CheckCircle2 size={16} className="text-[#E09F3E]" />
              </div>
              <div>
                <h4 className="text-sm font-bold">{item.title}</h4>
                <p className="text-xs text-slate-400 mt-1">{item.description}</p>
              </div>
            </div>
          ))}
        </div>
        <Anchor className="absolute -right-20 -top-20 text-white/5 w-80 h-80" />
      </div>
    </div>
  );
}
