import { useState } from 'react';
import { Anchor, Eye, EyeOff, CheckCircle2, XCircle, LogIn, Lock, Mail } from 'lucide-react';

// ─── Règles de validation du mot de passe ────────────────────────────────────
const PASSWORD_RULES = [
  {
    id: 'length',
    label: '8 caractères minimum',
    test: (v) => v.length >= 8,
  },
  {
    id: 'letter',
    label: 'Au moins une lettre',
    test: (v) => /[a-zA-Z]/.test(v),
  },
  {
    id: 'digit',
    label: 'Au moins un chiffre',
    test: (v) => /[0-9]/.test(v),
  },
  {
    id: 'special',
    label: 'Au moins un caractère spécial (!@#$%^&*...)',
    test: (v) => /[^a-zA-Z0-9]/.test(v),
  },
];

function RuleIndicator({ rule, value, touched }) {
  const ok = rule.test(value);
  if (!touched && !ok) {
    return (
      <li className="flex items-center gap-2 text-slate-400">
        <span className="w-4 h-4 rounded-full border border-slate-300 flex items-center justify-center shrink-0" />
        <span className="text-xs">{rule.label}</span>
      </li>
    );
  }
  return (
    <li className={`flex items-center gap-2 ${ok ? 'text-emerald-600' : 'text-red-500'}`}>
      {ok
        ? <CheckCircle2 size={16} className="shrink-0" />
        : <XCircle      size={16} className="shrink-0" />}
      <span className="text-xs font-medium">{rule.label}</span>
    </li>
  );
}

export function LoginScreen({ onLogin }) {
  const [email,       setEmail]       = useState('');
  const [password,    setPassword]    = useState('');
  const [showPwd,     setShowPwd]     = useState(false);
  const [pwdTouched,  setPwdTouched]  = useState(false);
  const [error,       setError]       = useState('');
  const [loading,     setLoading]     = useState(false);

  // Identifiants lus depuis les variables d'environnement Vite
  const VALID_EMAIL    = import.meta.env.VITE_APP_EMAIL;
  const VALID_PASSWORD = import.meta.env.VITE_APP_PASSWORD;

  const allRulesPass = PASSWORD_RULES.every((r) => r.test(password));
  const canSubmit    = email.trim() !== '' && allRulesPass;

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Simulation d'un délai réseau (UX)
    setTimeout(() => {
      if (email.trim() === VALID_EMAIL && password === VALID_PASSWORD) {
        // Sauvegarde de la session dans localStorage
        localStorage.setItem('seo_auth', JSON.stringify({ email, ts: Date.now() }));
        onLogin();
      } else {
        setError('Email ou mot de passe incorrect.');
      }
      setLoading(false);
    }, 600);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-[#1B263B] rounded-2xl shadow-xl mb-4">
            <Anchor size={32} className="text-[#E09F3E]" />
          </div>
          <h1 className="text-2xl font-black text-[#1B263B] tracking-tight">LA CAPITAINERIE</h1>
          <p className="text-xs uppercase tracking-[0.2em] text-[#E09F3E] font-bold mt-1">
            Livrable Stratégique SEO 2026
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-8">
          <div className="flex items-center gap-2 mb-6">
            <Lock size={18} className="text-slate-400" />
            <h2 className="text-base font-bold text-slate-700">Accès sécurisé</h2>
          </div>

          <form onSubmit={handleSubmit} noValidate className="space-y-5">

            {/* Email */}
            <div>
              <label className="text-xs font-bold uppercase text-slate-400 tracking-wide block mb-1.5">
                Adresse email
              </label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError(''); }}
                  placeholder="votre@email.com"
                  autoComplete="email"
                  className="w-full pl-9 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-[#E09F3E] outline-none transition-all"
                />
              </div>
            </div>

            {/* Mot de passe */}
            <div>
              <label className="text-xs font-bold uppercase text-slate-400 tracking-wide block mb-1.5">
                Mot de passe
              </label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type={showPwd ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(''); }}
                  onFocus={() => setPwdTouched(true)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className="w-full pl-9 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-[#E09F3E] outline-none transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPwd((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  aria-label={showPwd ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                >
                  {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>

              {/* Règles de validation — apparaissent dès que le champ est touché */}
              {pwdTouched && (
                <ul className="mt-3 space-y-1.5 p-3 bg-slate-50 rounded-xl border border-slate-100">
                  {PASSWORD_RULES.map((rule) => (
                    <RuleIndicator
                      key={rule.id}
                      rule={rule}
                      value={password}
                      touched={pwdTouched}
                    />
                  ))}
                </ul>
              )}
            </div>

            {/* Message d'erreur */}
            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-100 rounded-xl">
                <XCircle size={16} className="text-red-500 shrink-0" />
                <p className="text-xs font-medium text-red-600">{error}</p>
              </div>
            )}

            {/* Bouton */}
            <button
              type="submit"
              disabled={!canSubmit || loading}
              className="w-full py-3 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 shadow-sm
                bg-[#1B263B] text-white hover:bg-[#25324d]
                disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-[#1B263B]"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                  Vérification…
                </span>
              ) : (
                <><LogIn size={16} /> Se connecter</>
              )}
            </button>

          </form>
        </div>

        <p className="text-center text-xs text-slate-400 mt-6">
          Accès réservé — La Capitainerie © 2026
        </p>
      </div>
    </div>
  );
}
