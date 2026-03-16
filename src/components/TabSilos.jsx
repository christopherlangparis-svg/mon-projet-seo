import { useState } from 'react';
import { Anchor, Plus, Pencil, Trash2, GripVertical, ChevronRight } from 'lucide-react';
import { useLocalStorage } from '../hooks/useLocalStorage.js';
import { SILOS } from '../data/seoData.js';
import { Modal, Field, Input, FormActions, DirtyBanner, IconButton } from './formUI.jsx';
import { Icon } from './ui.jsx';

const COLOR_OPTIONS = [
  { label: 'Or',     value: 'border-[#E09F3E]',   preview: 'bg-[#E09F3E]' },
  { label: 'Marine', value: 'border-[#1B263B]',   preview: 'bg-[#1B263B]' },
  { label: 'Vert',   value: 'border-emerald-500', preview: 'bg-emerald-500' },
  { label: 'Bleu',   value: 'border-blue-500',    preview: 'bg-blue-500' },
  { label: 'Rouge',  value: 'border-red-500',      preview: 'bg-red-500' },
];

const ICON_OPTIONS = ['Ship', 'Compass', 'FileText', 'Anchor', 'Search', 'Target'];

function ColorPicker({ value, onChange }) {
  return (
    <div className="flex gap-2 flex-wrap">
      {COLOR_OPTIONS.map((c) => (
        <button key={c.value} type="button" onClick={() => onChange(c.value)}
          className={`flex items-center gap-2 px-3 py-2 rounded-xl border-2 text-xs font-bold transition-all ${value === c.value ? 'border-[#1B263B] bg-slate-100' : 'border-transparent bg-slate-50 hover:bg-slate-100'}`}>
          <span className={`w-3 h-3 rounded-full ${c.preview}`} />{c.label}
        </button>
      ))}
    </div>
  );
}

function IconPicker({ value, onChange }) {
  return (
    <div className="flex gap-2 flex-wrap">
      {ICON_OPTIONS.map((name) => (
        <button key={name} type="button" onClick={() => onChange(name)}
          className={`p-2.5 rounded-xl border-2 transition-all ${value === name ? 'border-[#1B263B] bg-slate-100' : 'border-transparent bg-slate-50 hover:bg-slate-100'}`}
          title={name}>
          <Icon name={name} size={18} className="text-slate-600" />
        </button>
      ))}
    </div>
  );
}

function ItemList({ items, onChange }) {
  const [newItem, setNewItem] = useState('');

  const add = () => {
    const t = newItem.trim();
    if (!t) return;
    onChange([...items, t]);
    setNewItem('');
  };

  const remove = (idx) => onChange(items.filter((_, i) => i !== idx));

  const move = (idx, dir) => {
    const arr = [...items];
    const t = idx + dir;
    if (t < 0 || t >= arr.length) return;
    [arr[idx], arr[t]] = [arr[t], arr[idx]];
    onChange(arr);
  };

  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        {items.map((item, idx) => (
          <div key={idx} className="flex items-center gap-2 group">
            <GripVertical size={14} className="text-slate-300 shrink-0" />
            <span className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm">{item}</span>
            <button type="button" onClick={() => move(idx, -1)} className="text-slate-300 hover:text-slate-600 px-1 opacity-0 group-hover:opacity-100 transition-opacity" title="Monter">↑</button>
            <button type="button" onClick={() => move(idx, 1)} className="text-slate-300 hover:text-slate-600 px-1 opacity-0 group-hover:opacity-100 transition-opacity" title="Descendre">↓</button>
            <IconButton onClick={() => remove(idx)} className="text-red-300 hover:text-red-600 hover:bg-red-50"><Trash2 size={14} /></IconButton>
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <input type="text" value={newItem} onChange={(e) => setNewItem(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') add(); }}
          placeholder="Nouvel élément…"
          className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-[#E09F3E] outline-none" />
        <button type="button" onClick={add} className="p-2.5 bg-[#1B263B] text-white rounded-xl hover:bg-[#25324d] transition-colors"><Plus size={16} /></button>
      </div>
    </div>
  );
}

function SiloForm({ initial, title, onClose, onSave, saveLabel }) {
  const [form, setForm] = useState({ ...initial });
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  return (
    <Modal title={title} onClose={onClose} wide>
      <div className="space-y-5">
        <Field label="Titre du silo"><Input value={form.title} onChange={(v) => set('title', v)} maxLength={40} autoFocus placeholder="Ex: Silos Zones Géographiques" /></Field>
        <Field label="Couleur de bordure"><ColorPicker value={form.colorClass} onChange={(v) => set('colorClass', v)} /></Field>
        <Field label="Icône"><IconPicker value={form.iconName} onChange={(v) => set('iconName', v)} /></Field>
        <Field label={`Éléments (${form.items.length})`}><ItemList items={form.items} onChange={(v) => set('items', v)} /></Field>
      </div>
      <FormActions onCancel={onClose} onSubmit={() => { if (form.title.trim()) { onSave(form); onClose(); } }} submitLabel={saveLabel} />
    </Modal>
  );
}

export function TabSilos() {
  const [silos, setSilos, resetSilos] = useLocalStorage('seo_silos', SILOS);
  const [editingIdx, setEditingIdx] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [deleteIdx, setDeleteIdx] = useState(null);

  const isDirty = JSON.stringify(silos) !== JSON.stringify(SILOS);
  const saveSilo = (idx, updated) => setSilos((p) => p.map((s, i) => i === idx ? updated : s));

  return (
    <div className="grid gap-6">
      {isDirty && <DirtyBanner onReset={resetSilos} />}

      <div className="bg-[#1B263B] text-white p-10 rounded-3xl relative overflow-hidden shadow-2xl">
        <div className="relative z-10">
          <h2 className="text-3xl font-bold mb-4">Architecture en Silos Sémantiques</h2>
          <p className="text-slate-300 max-w-2xl text-lg">Structurez vos contenus en compartiments étanches. Modifiez, réorganisez et ajoutez des silos directement ici.</p>
        </div>
        <Anchor className="absolute -right-10 -bottom-10 text-white/5 w-64 h-64 rotate-12" />
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {silos.map((silo, idx) => (
          <div key={idx} className={`bg-white p-6 rounded-2xl shadow-sm border-t-4 ${silo.colorClass} relative group`}>
            <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <IconButton onClick={() => setEditingIdx(idx)} title="Modifier" className="bg-white border border-slate-200 text-slate-400 hover:text-[#1B263B] hover:border-[#1B263B] shadow-sm"><Pencil size={13} /></IconButton>
              <IconButton onClick={() => setDeleteIdx(idx)} title="Supprimer" className="bg-white border border-slate-200 text-slate-400 hover:text-red-500 hover:border-red-300 shadow-sm"><Trash2 size={13} /></IconButton>
            </div>
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-slate-50 rounded-lg text-slate-600"><Icon name={silo.iconName} size={20} /></div>
              <h3 className="font-bold text-lg">{silo.title}</h3>
            </div>
            <div className="space-y-3">
              {silo.items.length === 0 && <p className="text-xs text-slate-400 italic text-center py-4">Aucun élément — cliquez sur ✏️ pour en ajouter.</p>}
              {silo.items.map((item, i) => (
                <div key={i} className="p-3 bg-slate-50 rounded-xl text-sm font-medium border border-slate-100 flex justify-between items-center">
                  {item}<ChevronRight size={14} className="text-slate-300" />
                </div>
              ))}
            </div>
          </div>
        ))}

        <button onClick={() => setShowAdd(true)} className="border-2 border-dashed border-slate-300 rounded-2xl p-6 flex flex-col items-center justify-center gap-3 text-slate-400 hover:border-[#E09F3E] hover:text-[#E09F3E] transition-all group min-h-[200px]">
          <div className="w-12 h-12 rounded-full border-2 border-dashed border-current flex items-center justify-center group-hover:scale-110 transition-transform"><Plus size={22} /></div>
          <span className="text-sm font-bold">Ajouter un silo</span>
        </button>
      </div>

      {editingIdx !== null && (
        <SiloForm title={`Modifier — ${silos[editingIdx].title}`} initial={silos[editingIdx]}
          onClose={() => setEditingIdx(null)} onSave={(u) => saveSilo(editingIdx, u)} saveLabel="Enregistrer" />
      )}
      {showAdd && (
        <SiloForm title="Nouveau silo" initial={{ title: '', colorClass: 'border-[#E09F3E]', iconName: 'Ship', items: [] }}
          onClose={() => setShowAdd(false)} onSave={(n) => setSilos((p) => [...p, n])} saveLabel="Créer le silo" />
      )}
      {deleteIdx !== null && (
        <Modal title="Supprimer ce silo ?" onClose={() => setDeleteIdx(null)}>
          <p className="text-sm text-slate-600 mb-2">Vous allez supprimer <strong>"{silos[deleteIdx]?.title}"</strong> et tous ses éléments. Réversible via "Réinitialiser".</p>
          <FormActions onCancel={() => setDeleteIdx(null)} onSubmit={() => { setSilos((p) => p.filter((_, i) => i !== deleteIdx)); setDeleteIdx(null); }} submitLabel="Supprimer" danger />
        </Modal>
      )}
    </div>
  );
}
