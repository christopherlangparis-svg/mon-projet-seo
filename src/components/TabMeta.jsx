import { useState } from 'react';
import { Plus, Pencil, Trash2, ExternalLink } from 'lucide-react';
import { useLocalStorage } from '../hooks/useLocalStorage.js';
import { META_PAGES, TITLE_MAX, DESC_MAX } from '../data/seoData.js';
import { Modal, Field, Input, Textarea, FormActions, DirtyBanner, IconButton } from './formUI.jsx';

const EMPTY_PAGE = { page: '', title: '', description: '' };

function MetaForm({ initial, modalTitle, onClose, onSave, saveLabel }) {
  const [form, setForm] = useState({ ...initial });
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const titleOk  = form.title.length > 0  && form.title.length  <= TITLE_MAX;
  const descOk   = form.description.length > 0 && form.description.length <= DESC_MAX;
  const canSave  = form.page.trim() && titleOk && descOk;

  return (
    <Modal title={modalTitle} onClose={onClose} wide>
      <div className="space-y-5">
        <Field label="Nom de la page / URL">
          <Input value={form.page} onChange={(v) => set('page', v)} placeholder="Ex: Page Capitaine" autoFocus />
        </Field>

        <Field label="Meta Title" hint={`${form.title.length} / ${TITLE_MAX} car.`}>
          <Input
            value={form.title}
            onChange={(v) => set('title', v)}
            maxLength={TITLE_MAX + 10}
            placeholder="Recrutement Maritime | La Capitainerie"
          />
          {form.title.length > TITLE_MAX && (
            <p className="text-xs text-red-500 mt-1">⚠ Titre trop long, Google le tronquera.</p>
          )}
        </Field>

        <Field label="Meta Description" hint={`${form.description.length} / ${DESC_MAX} car.`}>
          <Textarea
            value={form.description}
            onChange={(v) => set('description', v)}
            maxLength={DESC_MAX + 20}
            rows={3}
            placeholder="Découvrez nos offres d'emploi maritime…"
          />
          {form.description.length > DESC_MAX && (
            <p className="text-xs text-red-500 mt-1">⚠ Description trop longue, Google la tronquera.</p>
          )}
        </Field>

        {/* Aperçu SERP miniature */}
        {(form.title || form.description) && (
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
            <p className="text-[10px] text-slate-400 uppercase font-bold mb-2">Aperçu SERP</p>
            <p className="text-xs text-slate-400">https://www.lacapitainerie.com › {form.page.toLowerCase().replace(/\s+/g, '-') || '…'}</p>
            <p className={`text-blue-700 font-medium text-sm mt-0.5 leading-snug ${form.title.length > TITLE_MAX ? 'text-red-600' : ''}`}>
              {form.title || '—'}
            </p>
            <p className={`text-slate-500 text-xs mt-0.5 leading-relaxed ${form.description.length > DESC_MAX ? 'text-amber-600' : ''}`}>
              {form.description || '—'}
            </p>
          </div>
        )}
      </div>
      <FormActions onCancel={onClose} onSubmit={() => { if (canSave) { onSave(form); onClose(); } }} submitLabel={saveLabel} />
    </Modal>
  );
}

// ─── Indicateur de santé d'une balise ─────────────────────────────────────────
function HealthDot({ len, max }) {
  if (len === 0)         return <span className="w-2 h-2 rounded-full bg-slate-300 inline-block" title="Vide" />;
  if (len > max)         return <span className="w-2 h-2 rounded-full bg-red-500 inline-block" title="Trop long" />;
  if (len < max * 0.5)   return <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" title="Court" />;
  return                        <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" title="OK" />;
}

export function TabMeta() {
  const [pages, setPages, resetPages] = useLocalStorage('seo_meta_pages', META_PAGES);
  const [editingIdx, setEditingIdx]   = useState(null);
  const [showAdd, setShowAdd]         = useState(false);
  const [deleteIdx, setDeleteIdx]     = useState(null);

  const isDirty = JSON.stringify(pages) !== JSON.stringify(META_PAGES);

  return (
    <div className="space-y-4">
      {isDirty && <DirtyBanner onReset={resetPages} />}

      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
        {/* En-tête */}
        <div className="p-8 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold">Référentiel des Balises</h2>
            <p className="text-sm text-slate-500 mt-1">Plan de marquage complet — {pages.length} page{pages.length > 1 ? 's' : ''} renseignée{pages.length > 1 ? 's' : ''}.</p>
          </div>
          <button onClick={() => setShowAdd(true)}
            className="flex items-center gap-2 bg-[#1B263B] text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-[#25324d] transition-colors shadow-sm">
            <Plus size={16} /> Ajouter une page
          </button>
        </div>

        {/* Légende */}
        <div className="px-8 py-3 bg-slate-50 border-b border-slate-100 flex items-center gap-4 text-[10px] text-slate-500 font-medium">
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" /> Optimal</span>
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-400 inline-block" /> Court</span>
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-red-500 inline-block" /> Trop long</span>
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-slate-300 inline-block" /> Vide</span>
        </div>

        {/* Tableau */}
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="border-b border-slate-100">
              <tr className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">
                <th className="px-8 py-4">Page / URL</th>
                <th className="px-8 py-4">Meta-Title <span className="font-normal text-slate-300">(max {TITLE_MAX})</span></th>
                <th className="px-8 py-4">Meta-Description <span className="font-normal text-slate-300">(max {DESC_MAX})</span></th>
                <th className="px-8 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {pages.map((row, i) => (
                <tr key={i} className="hover:bg-slate-50 transition-colors group">
                  <td className="px-8 py-5 font-bold text-[#1B263B] text-sm whitespace-nowrap">
                    <span className="flex items-center gap-2">
                      <ExternalLink size={12} className="text-slate-300" />
                      {row.page}
                    </span>
                  </td>
                  <td className="px-8 py-5 max-w-xs">
                    <div className="flex items-start gap-2">
                      <HealthDot len={row.title.length} max={TITLE_MAX} />
                      <span className="text-xs text-blue-700 font-mono italic leading-relaxed">{row.title}</span>
                    </div>
                    <span className="text-[10px] text-slate-400 mt-1 block">{row.title.length} car.</span>
                  </td>
                  <td className="px-8 py-5 max-w-sm">
                    <div className="flex items-start gap-2">
                      <HealthDot len={row.description.length} max={DESC_MAX} />
                      <span className="text-xs text-slate-500 leading-relaxed">{row.description}</span>
                    </div>
                    <span className="text-[10px] text-slate-400 mt-1 block">{row.description.length} car.</span>
                  </td>
                  <td className="px-8 py-5">
                    <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <IconButton onClick={() => setEditingIdx(i)} title="Modifier" className="text-slate-400 hover:text-[#1B263B] hover:bg-slate-100"><Pencil size={14} /></IconButton>
                      <IconButton onClick={() => setDeleteIdx(i)} title="Supprimer" className="text-slate-400 hover:text-red-500 hover:bg-red-50"><Trash2 size={14} /></IconButton>
                    </div>
                  </td>
                </tr>
              ))}
              {pages.length === 0 && (
                <tr>
                  <td colSpan={4} className="text-center py-12 text-slate-400 text-sm italic">
                    Aucune page renseignée — cliquez sur "Ajouter une page".
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Modales ── */}
      {editingIdx !== null && (
        <MetaForm modalTitle={`Modifier — ${pages[editingIdx].page}`} initial={pages[editingIdx]}
          onClose={() => setEditingIdx(null)}
          onSave={(u) => setPages((p) => p.map((r, i) => i === editingIdx ? u : r))}
          saveLabel="Enregistrer" />
      )}
      {showAdd && (
        <MetaForm modalTitle="Nouvelle page" initial={EMPTY_PAGE}
          onClose={() => setShowAdd(false)}
          onSave={(n) => setPages((p) => [...p, n])}
          saveLabel="Ajouter la page" />
      )}
      {deleteIdx !== null && (
        <Modal title="Supprimer cette entrée ?" onClose={() => setDeleteIdx(null)}>
          <p className="text-sm text-slate-600">Vous allez supprimer la page <strong>"{pages[deleteIdx]?.page}"</strong>. Réversible via "Réinitialiser".</p>
          <FormActions onCancel={() => setDeleteIdx(null)}
            onSubmit={() => { setPages((p) => p.filter((_, i) => i !== deleteIdx)); setDeleteIdx(null); }}
            submitLabel="Supprimer" danger />
        </Modal>
      )}
    </div>
  );
}
