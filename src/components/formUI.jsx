import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

// ─── Modal ────────────────────────────────────────────────────────────────────
export function Modal({ title, onClose, children, wide = false }) {
  // Ferme sur Escape
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className={`bg-white rounded-2xl shadow-2xl w-full ${wide ? 'max-w-2xl' : 'max-w-lg'} max-h-[90vh] flex flex-col`}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
          <h3 className="font-bold text-slate-900 text-base">{title}</h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
            aria-label="Fermer"
          >
            <X size={18} />
          </button>
        </div>
        {/* Body scrollable */}
        <div className="overflow-y-auto flex-1 px-6 py-5">{children}</div>
      </div>
    </div>
  );
}

// ─── Champ texte labellisé ────────────────────────────────────────────────────
export function Field({ label, hint, children }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between">
        <label className="text-xs font-bold uppercase text-slate-400 tracking-wide">
          {label}
        </label>
        {hint && <span className="text-[10px] text-slate-400">{hint}</span>}
      </div>
      {children}
    </div>
  );
}

// ─── Input standard ───────────────────────────────────────────────────────────
export function Input({ value, onChange, placeholder = '', maxLength, autoFocus = false, ...rest }) {
  const ref = useRef(null);
  useEffect(() => { if (autoFocus && ref.current) ref.current.focus(); }, [autoFocus]);

  const len = typeof value === 'string' ? value.length : 0;

  return (
    <div className="relative">
      <input
        ref={ref}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        maxLength={maxLength}
        className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-[#E09F3E] outline-none transition-all"
        {...rest}
      />
      {maxLength && (
        <span className={`absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold tabular-nums ${len > maxLength * 0.9 ? 'text-red-400' : 'text-slate-300'}`}>
          {len}/{maxLength}
        </span>
      )}
    </div>
  );
}

// ─── Textarea standard ────────────────────────────────────────────────────────
export function Textarea({ value, onChange, placeholder = '', rows = 3, maxLength }) {
  const len = typeof value === 'string' ? value.length : 0;
  return (
    <div className="relative">
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        maxLength={maxLength}
        className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-[#E09F3E] outline-none transition-all resize-none"
      />
      {maxLength && (
        <span className={`absolute right-3 bottom-3 text-[10px] font-bold tabular-nums ${len > maxLength * 0.9 ? 'text-red-400' : 'text-slate-300'}`}>
          {len}/{maxLength}
        </span>
      )}
    </div>
  );
}

// ─── Boutons d'action de formulaire ──────────────────────────────────────────
export function FormActions({ onCancel, onSubmit, submitLabel = 'Enregistrer', danger = false }) {
  return (
    <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 mt-4">
      <button
        type="button"
        onClick={onCancel}
        className="px-5 py-2 rounded-xl text-sm font-bold text-slate-500 hover:bg-slate-100 transition-colors"
      >
        Annuler
      </button>
      <button
        type="button"
        onClick={onSubmit}
        className={`px-6 py-2 rounded-xl text-sm font-bold transition-colors shadow-sm ${
          danger
            ? 'bg-red-500 hover:bg-red-600 text-white'
            : 'bg-[#1B263B] hover:bg-[#25324d] text-white'
        }`}
      >
        {submitLabel}
      </button>
    </div>
  );
}

// ─── Bandeau "données modifiées" avec bouton reset ────────────────────────────
export function DirtyBanner({ onReset }) {
  return (
    <div className="flex items-center justify-between px-4 py-2.5 bg-amber-50 border border-amber-200 rounded-xl text-xs mb-4">
      <span className="text-amber-700 font-medium">
        ✏️ Données modifiées — sauvegardées automatiquement dans votre navigateur.
      </span>
      <button
        onClick={onReset}
        className="ml-4 text-amber-600 hover:text-amber-800 font-bold underline underline-offset-2 transition-colors"
      >
        Réinitialiser
      </button>
    </div>
  );
}

// ─── Bouton icône compact (édition, suppression…) ─────────────────────────────
export function IconButton({ onClick, title, className = '', children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`p-1.5 rounded-lg transition-colors ${className}`}
    >
      {children}
    </button>
  );
}
