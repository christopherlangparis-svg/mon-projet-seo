import {
  Search, AlertCircle, Target, Ship, Compass, FileText,
  CheckCircle2, ChevronRight,
} from 'lucide-react';

// Map de nom → composant icône (évite les imports dynamiques complexes)
const ICON_MAP = { Search, AlertCircle, Target, Ship, Compass, FileText, CheckCircle2 };

export function Icon({ name, ...props }) {
  const Component = ICON_MAP[name];
  if (!Component) return null;
  return <Component {...props} />;
}

// ─── StatCard ─────────────────────────────────────────────────────────────────
export function StatCard({ title, value, description, iconName, colorClass }) {
  return (
    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col gap-2">
      <div className="flex justify-between items-start">
        <div className={`p-2 rounded-lg ${colorClass}`}>
          <Icon name={iconName} size={24} className="text-white" />
        </div>
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Analyse</span>
      </div>
      <h3 className="text-slate-500 text-sm font-medium mt-2">{title}</h3>
      <p className="text-2xl font-bold text-slate-900">{value}</p>
      <p className="text-sm text-slate-500">{description}</p>
    </div>
  );
}

// ─── SiloCard ─────────────────────────────────────────────────────────────────
export function SiloCard({ title, colorClass, iconName, items }) {
  return (
    <div className={`bg-white p-6 rounded-2xl shadow-sm border-t-4 ${colorClass} transition-all hover:-translate-y-1`}>
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-slate-50 rounded-lg text-slate-600">
          <Icon name={iconName} size={20} />
        </div>
        <h3 className="font-bold text-lg">{title}</h3>
      </div>
      <div className="space-y-3">
        {items.map((item) => (
          <div
            key={item}
            className="p-3 bg-slate-50 rounded-xl text-sm font-medium border border-slate-100 flex justify-between items-center group cursor-pointer hover:bg-white hover:border-[#1B263B] transition-all"
          >
            {item}
            <ChevronRight size={14} className="text-slate-300 group-hover:text-[#1B263B]" />
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Badge ────────────────────────────────────────────────────────────────────
export function Badge({ label, className = '' }) {
  return (
    <span className={`text-[10px] px-2 py-0.5 rounded uppercase font-bold ${className}`}>
      {label}
    </span>
  );
}

// ─── CharCounter ──────────────────────────────────────────────────────────────
export function CharCounter({ current, max }) {
  const isOver = current > max;
  return (
    <span className={`text-[10px] font-bold tabular-nums ${isOver ? 'text-red-500' : 'text-emerald-500'}`}>
      {current} / {max} car.
    </span>
  );
}

// ─── SerpHealthCheck ──────────────────────────────────────────────────────────
// Génère des conseils dynamiques basés sur les valeurs réelles
export function SerpHealthCheck({ title, titleMax, desc, descMax }) {
  const tips = [];

  if (title.length > titleMax) {
    tips.push(`Le titre dépasse ${titleMax} caractères (${title.length} actuellement). Google le tronquera.`);
  } else if (title.length < 30) {
    tips.push('Le titre est trop court. Visez 50–60 caractères pour maximiser l\'espace SERP.');
  }

  if (desc.length > descMax) {
    tips.push(`La description dépasse ${descMax} caractères (${desc.length}). Réduisez-la pour éviter la troncature.`);
  } else if (desc.length < 80) {
    tips.push('La meta-description est trop courte. Enrichissez-la (objectif : 120–155 caractères).');
  }

  if (!/[Dd]écouvrez|[Pp]ostulez|[Tt]rouvez|[Rr]ecrutez|[Rr]ejoin/u.test(desc)) {
    tips.push('Ajoutez un verbe d\'action dans la description (ex: "Découvrez", "Postulez", "Trouvez").');
  }

  if (!title.includes('|') && !title.includes('-')) {
    tips.push('Séparez votre mot-clé principal du nom de marque avec « | » ou « – » dans le titre.');
  }

  const isHealthy = tips.length === 0;

  return (
    <div className={`border p-6 rounded-2xl flex items-start gap-4 ${isHealthy ? 'bg-emerald-50 border-emerald-100' : 'bg-amber-50 border-amber-100'}`}>
      <CheckCircle2
        className={`shrink-0 mt-0.5 ${isHealthy ? 'text-emerald-500' : 'text-amber-500'}`}
        size={22}
      />
      <div>
        <h4 className={`font-bold text-sm ${isHealthy ? 'text-emerald-800' : 'text-amber-800'}`}>
          {isHealthy ? 'Balises optimisées ✓' : `${tips.length} point${tips.length > 1 ? 's' : ''} à corriger`}
        </h4>
        {tips.length > 0 && (
          <ul className="mt-2 space-y-1">
            {tips.map((tip, i) => (
              <li key={i} className="text-xs text-amber-700 flex gap-2">
                <span className="shrink-0 mt-0.5">•</span>
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        )}
        {isHealthy && (
          <p className="text-xs text-emerald-600 mt-1">
            Titre et description sont dans les limites recommandées. Bon travail !
          </p>
        )}
      </div>
    </div>
  );
}
