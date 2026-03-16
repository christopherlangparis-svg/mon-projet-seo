import { useState } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { useLocalStorage } from '../hooks/useLocalStorage.js';
import { ROADMAP_STEPS, RACI_ROLES } from '../data/seoData.js';
import { Modal, Field, Input, Textarea, FormActions, DirtyBanner, IconButton } from './formUI.jsx';

const RACI_LABELS = [
  { key: 'responsible', letter: 'R', title: 'Responsable',  activeColor: 'bg-[#1B263B] text-white' },
  { key: 'accountable', letter: 'A', title: 'Approbateur',  activeColor: 'bg-[#E09F3E] text-white' },
  { key: 'consulted',   letter: 'C', title: 'Consulté',     activeColor: 'bg-blue-500 text-white' },
  { key: 'informed',    letter: 'I', title: 'Informé',      activeColor: 'bg-slate-500 text-white' },
];

// ─── Formulaire étape roadmap ──────────────────────────────────────────────────
function StepForm({ initial, modalTitle, onClose, onSave, saveLabel }) {
  const [form, setForm] = useState({ ...initial });
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const canSave = form.month.trim() && form.title.trim();

  return (
    <Modal title={modalTitle} onClose={onClose}>
      <div className="space-y-4">
        <Field label="Période"><Input value={form.month} onChange={(v) => set('month', v)} placeholder="Ex: Mois 4" autoFocus maxLength={20} /></Field>
        <Field label="Titre de l'étape"><Input value={form.title} onChange={(v) => set('title', v)} placeholder="Ex: Audit des performances" maxLength={60} /></Field>
        <Field label="Description"><Textarea value={form.description} onChange={(v) => set('description', v)} rows={3} placeholder="Détails de l'étape…" maxLength={300} /></Field>
      </div>
      <FormActions onCancel={onClose} onSubmit={() => { if (canSave) { onSave(form); onClose(); } }} submitLabel={saveLabel} />
    </Modal>
  );
}

// ─── Formulaire rôle RACI ─────────────────────────────────────────────────────
function RaciForm({ initial, modalTitle, onClose, onSave, saveLabel }) {
  const [form, setForm] = useState({ ...initial });
  const toggle = (key) => setForm((f) => ({ ...f, [key]: !f[key] }));

  return (
    <Modal title={modalTitle} onClose={onClose}>
      <div className="space-y-5">
        <Field label="Nom du rôle">
          <Input value={form.role} onChange={(v) => setForm((f) => ({ ...f, role: v }))} autoFocus maxLength={30} placeholder="Ex: Chef de projet" />
        </Field>
        <Field label="Responsabilités">
          <div className="grid grid-cols-2 gap-3">
            {RACI_LABELS.map(({ key, letter, title, activeColor }) => (
              <button key={key} type="button" onClick={() => toggle(key)}
                className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-sm font-medium ${form[key] ? `border-transparent ${activeColor}` : 'border-slate-200 bg-slate-50 text-slate-500 hover:bg-slate-100'}`}>
                <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black ${form[key] ? 'bg-white/20' : 'bg-slate-200 text-slate-600'}`}>{letter}</span>
                {title}
              </button>
            ))}
          </div>
        </Field>
      </div>
      <FormActions onCancel={onClose} onSubmit={() => { if (form.role.trim()) { onSave(form); onClose(); } }} submitLabel={saveLabel} />
    </Modal>
  );
}

// ─── Composant principal ──────────────────────────────────────────────────────
export function TabRoadmap() {
  const [steps, setSteps, resetSteps]   = useLocalStorage('seo_roadmap_steps', ROADMAP_STEPS);
  const [racis, setRacis, resetRacis]   = useLocalStorage('seo_raci_roles', RACI_ROLES);

  const [editStepIdx, setEditStepIdx]   = useState(null);
  const [showAddStep, setShowAddStep]   = useState(false);
  const [deleteStepIdx, setDeleteStepIdx] = useState(null);

  const [editRaciIdx, setEditRaciIdx]   = useState(null);
  const [showAddRaci, setShowAddRaci]   = useState(false);
  const [deleteRaciIdx, setDeleteRaciIdx] = useState(null);

  const stepsDirty = JSON.stringify(steps) !== JSON.stringify(ROADMAP_STEPS);
  const raciDirty  = JSON.stringify(racis)  !== JSON.stringify(RACI_ROLES);

  return (
    <div className="grid md:grid-cols-3 gap-8">

      {/* ── Timeline ── */}
      <div className="md:col-span-2 bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-xl font-bold">Feuille de Route 2026</h2>
          <button onClick={() => setShowAddStep(true)}
            className="flex items-center gap-2 bg-[#1B263B] text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-[#25324d] transition-colors">
            <Plus size={14} /> Ajouter une étape
          </button>
        </div>

        {stepsDirty && <DirtyBanner onReset={resetSteps} />}

        {steps.length === 0 && (
          <p className="text-sm text-slate-400 italic text-center py-8">Aucune étape — cliquez sur "Ajouter une étape".</p>
        )}

        <div className="space-y-10 ml-4 border-l-2 border-slate-100">
          {steps.map((step, i) => (
            <div key={i} className="relative pl-8 group">
              <div className="absolute -left-[9px] top-1 w-4 h-4 bg-[#E09F3E] rounded-full border-4 border-white" />
              <span className="text-[10px] font-bold text-[#E09F3E] uppercase tracking-widest">{step.month}</span>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-bold text-lg mt-1">{step.title}</h3>
                  <p className="text-sm text-slate-500 mt-2">{step.description}</p>
                </div>
                <div className="flex gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity pt-1">
                  <IconButton onClick={() => setEditStepIdx(i)} title="Modifier" className="text-slate-400 hover:text-[#1B263B] hover:bg-slate-100"><Pencil size={14} /></IconButton>
                  <IconButton onClick={() => setDeleteStepIdx(i)} title="Supprimer" className="text-slate-400 hover:text-red-500 hover:bg-red-50"><Trash2 size={14} /></IconButton>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── RACI ── */}
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">Matrice RACI</h2>
          <button onClick={() => setShowAddRaci(true)}
            className="flex items-center gap-1 text-xs font-bold text-slate-400 hover:text-[#1B263B] transition-colors">
            <Plus size={14} /> Rôle
          </button>
        </div>

        {raciDirty && <DirtyBanner onReset={resetRacis} />}

        {/* Légende */}
        <div className="flex flex-wrap gap-1 mb-5">
          {RACI_LABELS.map(({ letter, title, activeColor }) => (
            <span key={letter} className={`text-[9px] px-2 py-0.5 rounded font-bold ${activeColor}`}>{letter} = {title}</span>
          ))}
        </div>

        <div className="space-y-3">
          {racis.map(({ role, ...flags }, i) => (
            <div key={i} className="flex justify-between items-center p-4 bg-slate-50 rounded-xl border border-slate-100 group">
              <span className="font-bold text-sm">{role}</span>
              <div className="flex items-center gap-1">
                {RACI_LABELS.map(({ key, letter, activeColor }) => (
                  <span key={key}
                    className={`text-[10px] px-2 py-1 rounded font-bold ${flags[key] ? activeColor : 'bg-slate-200 text-slate-400'}`}
                    title={RACI_LABELS.find((l) => l.key === key)?.title}>
                    {letter}
                  </span>
                ))}
                <div className="flex gap-0.5 ml-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <IconButton onClick={() => setEditRaciIdx(i)} title="Modifier" className="text-slate-400 hover:text-[#1B263B] hover:bg-slate-100"><Pencil size={12} /></IconButton>
                  <IconButton onClick={() => setDeleteRaciIdx(i)} title="Supprimer" className="text-slate-400 hover:text-red-500 hover:bg-red-50"><Trash2 size={12} /></IconButton>
                </div>
              </div>
            </div>
          ))}
          {racis.length === 0 && (
            <p className="text-xs text-slate-400 italic text-center py-4">Aucun rôle défini.</p>
          )}
        </div>
      </div>

      {/* ── Modales Roadmap ── */}
      {editStepIdx !== null && (
        <StepForm modalTitle={`Modifier — ${steps[editStepIdx].title}`} initial={steps[editStepIdx]}
          onClose={() => setEditStepIdx(null)}
          onSave={(u) => setSteps((p) => p.map((s, i) => i === editStepIdx ? u : s))}
          saveLabel="Enregistrer" />
      )}
      {showAddStep && (
        <StepForm modalTitle="Nouvelle étape" initial={{ month: `Mois ${steps.length + 1}`, title: '', description: '' }}
          onClose={() => setShowAddStep(false)}
          onSave={(n) => setSteps((p) => [...p, n])}
          saveLabel="Ajouter l'étape" />
      )}
      {deleteStepIdx !== null && (
        <Modal title="Supprimer cette étape ?" onClose={() => setDeleteStepIdx(null)}>
          <p className="text-sm text-slate-600">Supprimer <strong>"{steps[deleteStepIdx]?.title}"</strong> ? Réversible via "Réinitialiser".</p>
          <FormActions onCancel={() => setDeleteStepIdx(null)}
            onSubmit={() => { setSteps((p) => p.filter((_, i) => i !== deleteStepIdx)); setDeleteStepIdx(null); }}
            submitLabel="Supprimer" danger />
        </Modal>
      )}

      {/* ── Modales RACI ── */}
      {editRaciIdx !== null && (
        <RaciForm modalTitle={`Modifier — ${racis[editRaciIdx].role}`} initial={racis[editRaciIdx]}
          onClose={() => setEditRaciIdx(null)}
          onSave={(u) => setRacis((p) => p.map((r, i) => i === editRaciIdx ? u : r))}
          saveLabel="Enregistrer" />
      )}
      {showAddRaci && (
        <RaciForm modalTitle="Nouveau rôle" initial={{ role: '', responsible: false, accountable: false, consulted: false, informed: false }}
          onClose={() => setShowAddRaci(false)}
          onSave={(n) => setRacis((p) => [...p, n])}
          saveLabel="Ajouter le rôle" />
      )}
      {deleteRaciIdx !== null && (
        <Modal title="Supprimer ce rôle ?" onClose={() => setDeleteRaciIdx(null)}>
          <p className="text-sm text-slate-600">Supprimer <strong>"{racis[deleteRaciIdx]?.role}"</strong> ? Réversible via "Réinitialiser".</p>
          <FormActions onCancel={() => setDeleteRaciIdx(null)}
            onSubmit={() => { setRacis((p) => p.filter((_, i) => i !== deleteRaciIdx)); setDeleteRaciIdx(null); }}
            submitLabel="Supprimer" danger />
        </Modal>
      )}
    </div>
  );
}
