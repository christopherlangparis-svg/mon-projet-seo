import { useState, useEffect } from 'react'; // Suppression de "import React" car on ne s'en sert pas directement
import { 
  Anchor, BarChart3, Layout, FileText, Code2, Calendar, Users, 
  ChevronRight, ExternalLink, Search, Target, CheckCircle2,
  AlertCircle, Ship, Compass, ArrowRight, Monitor, Smartphone, Eye
} from 'lucide-react';

const App = () => {
  const [activeTab, setActiveTab] = useState('constat');
  
  // State pour le simulateur SERP
  const [serpTitle, setSerpTitle] = useState('Recrutement Maritime & Emploi Marin | La Capitainerie');
  const [serpDesc, setSerpDesc] = useState('Plateforme n°1 de recrutement maritime en France. Trouvez des embarquements ou recrutez des marins qualifiés (STCW) en quelques clics. Inscription gratuite.');
  const [previewMode, setPreviewMode] = useState('desktop');

  const tabs = [
    { id: 'constat', label: 'Constat & Concurrence', icon: <BarChart3 size={18} /> },
    { id: 'silos', label: 'Architecture Silos', icon: <Layout size={18} /> },
    { id: 'meta', label: 'Plan de Marquage', icon: <FileText size={18} /> },
    { id: 'serp', label: 'Simulateur SERP', icon: <Eye size={18} /> },
    { id: 'tech', label: 'Spécifications Tech', icon: <Code2 size={18} /> },
    { id: 'roadmap', label: 'Roadmap & RACI', icon: <Calendar size={18} /> },
  ];

  const StatCard = ({ title, value, description, icon: Icon, color }) => (
    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col gap-2">
      <div className="flex justify-between items-start">
        <div className={`p-2 rounded-lg ${color}`}>
          <Icon size={24} className="text-white" />
        </div>
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Analyse</span>
      </div>
      <h3 className="text-slate-500 text-sm font-medium mt-2">{title}</h3>
      <p className="text-2xl font-bold text-slate-900">{value}</p>
      <p className="text-sm text-slate-500">{description}</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      {/* Header */}
      <header className="bg-[#1B263B] text-white py-6 px-8 flex justify-between items-center sticky top-0 z-50 shadow-lg border-b border-[#E09F3E]/20">
        <div className="flex items-center gap-3">
          <Anchor size={32} className="text-[#E09F3E]" />
          <div>
            <h1 className="text-xl font-bold tracking-tight">LA CAPITAINERIE</h1>
            <p className="text-[10px] uppercase tracking-[0.2em] text-[#E09F3E] font-semibold">Livrable Stratégique SEO 2026</p>
          </div>
        </div>
        <div className="hidden md:flex gap-4">
          <button className="bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg text-sm transition-colors border border-white/10">
            Documentation
          </button>
          <button className="bg-[#E09F3E] hover:bg-[#D48F2E] px-4 py-2 rounded-lg text-sm font-bold text-[#1B263B] transition-colors shadow-md">
            Extraire le JSON
          </button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Navigation Tabs */}
        <div className="flex flex-wrap gap-2 mb-8 bg-white p-1 rounded-2xl shadow-sm border border-slate-200 overflow-x-auto whitespace-nowrap">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                activeTab === tab.id 
                ? 'bg-[#1B263B] text-white shadow-md transform scale-[1.02]' 
                : 'text-slate-500 hover:bg-slate-50'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="space-y-8">
          
          {/* Tab: Constat Initial */}
          {activeTab === 'constat' && (
            <div className="grid gap-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard 
                  title="Visibilité Actuelle" 
                  value="< 10%" 
                  description="Champ lexical maritime couvert."
                  icon={Search}
                  color="bg-red-500"
                />
                <StatCard 
                  title="Positionnement" 
                  value="Invisible" 
                  description="Pages derrière login non-indexées."
                  icon={AlertCircle}
                  color="bg-amber-500"
                />
                <StatCard 
                  title="Opportunité" 
                  value="Silos Métiers" 
                  description="Capter la longue traîne inexploitée."
                  icon={Target}
                  color="bg-emerald-500"
                />
              </div>

              <div className="grid md:grid-cols-2 gap-8">
                <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
                  <h2 className="text-xl font-bold mb-6 flex items-center gap-2 text-[#1B263B]">
                    <AlertCircle className="text-red-500" size={24} />
                    Analyse du "Fossé Sémantique"
                  </h2>
                  <div className="space-y-4 text-slate-600">
                    <p>
                      La structure actuelle du site est une impasse pour Google. Sans pages de contenu publiques, votre autorité sur le recrutement maritime reste nulle malgré votre avance technologique.
                    </p>
                    <div className="p-4 bg-red-50 rounded-xl border border-red-100">
                      <h4 className="font-bold text-red-700 text-sm mb-2 uppercase">Points Critiques :</h4>
                      <ul className="space-y-2 text-sm text-red-600">
                        <li className="flex items-center gap-2 italic">• Aucun mot-clé métier indexable.</li>
                        <li className="flex items-center gap-2 italic">• Absence totale de maillage interne par secteur.</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
                  <h2 className="text-xl font-bold mb-6 flex items-center gap-2 text-[#1B263B]">
                    <Users size={24} />
                    Benchmarks Concurrents
                  </h2>
                  <div className="space-y-4">
                    <div className="p-4 rounded-xl border border-slate-100 bg-slate-50">
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-bold">Clicandsea.fr</span>
                        <span className="text-[10px] bg-slate-200 px-2 py-0.5 rounded uppercase">Volume</span>
                      </div>
                      <p className="text-xs text-slate-500">Omniprésence géographique. Des milliers de pages indexées sur chaque métier.</p>
                    </div>
                    <div className="p-4 rounded-xl border border-slate-100 bg-slate-50">
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-bold text-[#E09F3E]">Oceandrive-jobs.com</span>
                        <span className="text-[10px] bg-[#E09F3E]/20 text-[#E09F3E] px-2 py-0.5 rounded uppercase">Niche</span>
                      </div>
                      <p className="text-xs text-slate-500">Expertise Yachting. Termes techniques précis qui rassurent les armateurs.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab: Silos */}
          {activeTab === 'silos' && (
            <div className="grid gap-8">
              <div className="bg-[#1B263B] text-white p-10 rounded-3xl relative overflow-hidden shadow-2xl">
                <div className="relative z-10">
                  <h2 className="text-3xl font-bold mb-4">Architecture en Silos Sémantiques</h2>
                  <p className="text-slate-300 max-w-2xl text-lg">
                    Nous structurons vos contenus en "compartiments" étanches. Cette méthode signale à Google que chaque section du site est une autorité dans son domaine spécifique.
                  </p>
                </div>
                <Anchor className="absolute -right-10 -bottom-10 text-white/5 w-64 h-64 rotate-12" />
              </div>

              <div className="grid md:grid-cols-3 gap-6">
                {[
                  { title: 'Silos Secteurs', items: ['Yachting de Luxe', 'Offshore / Oil & Gas', 'Marine Marchande', 'Secteur Portuaire'], icon: <Ship />, color: 'border-[#E09F3E]' },
                  { title: 'Silos Métiers', items: ['Capitaines & Officiers', 'Chefs Mécaniciens', 'Matelots & Pont', 'Hôtellerie / Stewards'], icon: <Compass />, color: 'border-[#1B263B]' },
                  { title: 'Silos Contenus', items: ['Actualités Maritimes', 'Guide des Brevets', 'Réglementation ENIM', 'FAQ Recrutement'], icon: <FileText />, color: 'border-emerald-500' }
                ].map((silo, idx) => (
                  <div key={idx} className={`bg-white p-6 rounded-2xl shadow-sm border-t-4 ${silo.color} transition-all hover:translate-y-[-4px]`}>
                    <div className="flex items-center gap-3 mb-6">
                       <div className="p-2 bg-slate-50 rounded-lg text-slate-600">
                          {silo.icon}
                       </div>
                       <h3 className="font-bold text-lg">{silo.title}</h3>
                    </div>
                    <div className="space-y-3">
                      {silo.items.map(item => (
                        <div key={item} className="p-3 bg-slate-50 rounded-xl text-sm font-medium border border-slate-100 flex justify-between items-center group cursor-pointer hover:bg-white hover:border-[#1B263B] transition-all">
                          {item}
                          <ChevronRight size={14} className="text-slate-300 group-hover:text-[#1B263B]" />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tab: Simulateur SERP */}
          {activeTab === 'serp' && (
            <div className="grid lg:grid-cols-2 gap-8 items-start">
              {/* Controls */}
              <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
                <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                  <Monitor size={20} className="text-[#1B263B]" />
                  Éditeur de balises
                </h2>
                <div className="space-y-6">
                  <div>
                    <div className="flex justify-between items-end mb-2">
                      <label className="text-xs font-bold uppercase text-slate-400">Meta Title</label>
                      <span className={`text-[10px] font-bold ${serpTitle.length > 60 ? 'text-red-500' : 'text-emerald-500'}`}>
                        {serpTitle.length} / 60 car.
                      </span>
                    </div>
                    <input 
                      type="text" 
                      value={serpTitle}
                      onChange={(e) => setSerpTitle(e.target.value)}
                      className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-[#E09F3E] outline-none transition-all"
                    />
                  </div>
                  <div>
                    <div className="flex justify-between items-end mb-2">
                      <label className="text-xs font-bold uppercase text-slate-400">Meta Description</label>
                      <span className={`text-[10px] font-bold ${serpDesc.length > 155 ? 'text-red-500' : 'text-emerald-500'}`}>
                        {serpDesc.length} / 155 car.
                      </span>
                    </div>
                    <textarea 
                      rows="4"
                      value={serpDesc}
                      onChange={(e) => setSerpDesc(e.target.value)}
                      className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-[#E09F3E] outline-none transition-all resize-none"
                    />
                  </div>
                  <div className="pt-4 border-t border-slate-100">
                    <label className="text-xs font-bold uppercase text-slate-400 mb-3 block">Mode d'aperçu</label>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => setPreviewMode('desktop')}
                        className={`flex-1 py-3 rounded-xl flex items-center justify-center gap-2 text-xs font-bold transition-all ${previewMode === 'desktop' ? 'bg-[#1B263B] text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                      >
                        <Monitor size={16} /> Bureau
                      </button>
                      <button 
                        onClick={() => setPreviewMode('mobile')}
                        className={`flex-1 py-3 rounded-xl flex items-center justify-center gap-2 text-xs font-bold transition-all ${previewMode === 'mobile' ? 'bg-[#1B263B] text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                      >
                        <Smartphone size={16} /> Mobile
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Preview */}
              <div className="space-y-6 sticky top-24">
                <div className="bg-white p-10 rounded-2xl shadow-sm border border-slate-200 min-h-[400px] flex items-center justify-center">
                  <div className={`${previewMode === 'mobile' ? 'w-[360px]' : 'w-full'} transition-all duration-300`}>
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-7 h-7 bg-slate-100 rounded-full flex items-center justify-center text-[10px] font-bold text-slate-400">LC</div>
                        <div className="flex flex-col">
                          <span className="text-xs font-medium text-slate-800">La Capitainerie</span>
                          <span className="text-[10px] text-slate-400">https://www.lacapitainerie.com</span>
                        </div>
                      </div>
                      <h3 className={`text-blue-700 font-medium leading-tight hover:underline cursor-pointer ${previewMode === 'mobile' ? 'text-lg' : 'text-xl'}`}>
                        {serpTitle || 'Titre de la page...'}
                      </h3>
                      <p className={`text-slate-600 leading-normal mt-1 ${previewMode === 'mobile' ? 'text-xs line-clamp-3' : 'text-sm'}`}>
                        {serpDesc || 'Veuillez saisir une meta-description pour simuler le rendu dans les résultats de recherche Google...'}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="bg-emerald-50 border border-emerald-100 p-6 rounded-2xl flex items-start gap-4">
                  <CheckCircle2 className="text-emerald-500 shrink-0" size={24} />
                  <div>
                    <h4 className="font-bold text-emerald-800 text-sm">SEO Health Check</h4>
                    <p className="text-xs text-emerald-600 mt-1">
                      Votre balise Title est optimisée. Pensez à inclure un verbe d'action dans la Meta Description (ex: "Découvrez", "Postulez").
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab: Plan de Marquage */}
          {activeTab === 'meta' && (
            <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
               <div className="p-8 border-b border-slate-100">
                <h2 className="text-xl font-bold">Référentiel des Balises</h2>
                <p className="text-sm text-slate-500 mt-1">Plan de marquage complet pour l'ensemble du sitemap.</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 border-b border-slate-100">
                    <tr className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">
                      <th className="px-8 py-4">Page / URL</th>
                      <th className="px-8 py-4">Meta-Title</th>
                      <th className="px-8 py-4">Meta-Description</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {[
                      { p: 'Accueil', t: 'Recrutement Maritime & Emploi Marin | La Capitainerie', d: 'La 1ère plateforme de recrutement maritime pour marins et armateurs. Trouvez des embarquements en quelques clics.' },
                      { p: 'Yachting', t: 'Emploi Yachting & Grande Plaisance | La Capitainerie', d: 'Trouvez votre prochain embarquement en Yachting de luxe. Missions pour Capitaines, Stewards et Matelots.' },
                      { p: 'Offshore', t: 'Emploi Maritime Offshore & Oil and Gas | La Capitainerie', d: 'Recrutement spécialisé offshore : missions en Oil & Gas et énergies marines pour officiers qualifiés.' },
                      { p: 'Métier: Capitaine', t: 'Recrutement Capitaine 200, 500, 3000 | La Capitainerie', d: 'Accédez aux profils et offres d\'emploi pour capitaines tous brevets. Expertise, sécurité et vérification STCW.' },
                    ].map((row, i) => (
                      <tr key={i} className="hover:bg-slate-50 transition-colors">
                        <td className="px-8 py-6 font-bold text-[#1B263B] text-sm">{row.p}</td>
                        <td className="px-8 py-6 text-xs text-blue-700 font-mono italic">{row.t}</td>
                        <td className="px-8 py-6 text-xs text-slate-500 leading-relaxed max-w-md">{row.d}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Tab: Technique */}
          {activeTab === 'tech' && (
            <div className="grid md:grid-cols-2 gap-8">
              <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
                <div className="flex justify-between items-center mb-6">
                   <h2 className="text-xl font-bold flex items-center gap-2">
                    <Code2 className="text-[#E09F3E]" />
                    Google Jobs (JSON-LD)
                  </h2>
                  <span className="bg-slate-900 text-white text-[10px] font-bold px-2 py-1 rounded">DYNAMIQUE</span>
                </div>
                <div className="bg-slate-900 rounded-2xl p-6 font-mono text-[11px] leading-relaxed text-emerald-400 overflow-x-auto shadow-inner">
{`{
  "@context": "https://schema.org/",
  "@type": "JobPosting",
  "title": "Capitaine 200 - Yachting",
  "hiringOrganization": {
    "@type": "Organization",
    "name": "La Capitainerie"
  },
  "jobLocation": {
    "@type": "Place",
    "address": { "addressLocality": "Antibes", "addressCountry": "FR" }
  },
  "baseSalary": {
    "@type": "MonetaryAmount",
    "currency": "EUR",
    "value": { "@type": "QuantitativeValue", "value": 4500, "unitText": "MONTH" }
  }
}`}
                </div>
                <button className="w-full mt-6 bg-slate-100 hover:bg-slate-200 py-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2">
                  <FileText size={16} /> Copier le modèle complet
                </button>
              </div>

              <div className="bg-[#1B263B] p-8 rounded-2xl text-white shadow-xl relative overflow-hidden">
                <h2 className="text-xl font-bold mb-8">Guide d'implémentation Dév</h2>
                <div className="space-y-6 relative z-10">
                  {[
                    { t: 'URLs Canoniques', d: 'Structure : lacapitainerie.com/emploi/[metier]-[secteur]' },
                    { t: 'Vitesse (Core Web Vitals)', d: 'LCP < 2.5s pour ne pas être pénalisé sur mobile.' },
                    { t: 'Indexation Publique', d: 'Sortir les fiches métiers du "noindex" pour Google.' },
                    { t: 'Alt Tags Images', d: 'Chaque photo de bateau doit avoir un attribut alt descriptif.' }
                  ].map((item, i) => (
                    <div key={i} className="flex gap-4">
                      <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center shrink-0">
                        <CheckCircle2 size={16} className="text-[#E09F3E]" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold">{item.t}</h4>
                        <p className="text-xs text-slate-400 mt-1">{item.d}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <Anchor className="absolute -right-20 -top-20 text-white/5 w-80 h-80" />
              </div>
            </div>
          )}

          {/* Tab: Roadmap */}
          {activeTab === 'roadmap' && (
             <div className="grid md:grid-cols-3 gap-8">
               <div className="md:col-span-2 bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
                  <h2 className="text-xl font-bold mb-10">Feuille de Route 2026</h2>
                  <div className="space-y-12 ml-4 border-l-2 border-slate-100">
                    {[
                      { m: 'Mois 1', t: 'Fondations Figma', d: 'Validation des structures de pages silos et du maillage interne dans les maquettes.' },
                      { m: 'Mois 2', t: 'Production Contenu', d: 'Rédaction des introductions secteurs et fiches métiers optimisées.' },
                      { m: 'Mois 3', t: 'Déploiement Tech', d: 'Activation des URLs publiques et des données structurées Google Jobs.' }
                    ].map((step, i) => (
                      <div key={i} className="relative pl-8">
                        <div className="absolute -left-[9px] top-1 w-4 h-4 bg-[#E09F3E] rounded-full border-4 border-white"></div>
                        <span className="text-[10px] font-bold text-[#E09F3E] uppercase tracking-widest">{step.m}</span>
                        <h3 className="font-bold text-lg mt-1">{step.t}</h3>
                        <p className="text-sm text-slate-500 mt-2">{step.d}</p>
                      </div>
                    ))}
                  </div>
               </div>
               
               <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
                 <h2 className="text-xl font-bold mb-6">Matrice RACI</h2>
                 <div className="space-y-4">
                    {['CEO', 'Expert SEO', 'Développeur', 'Rédacteur'].map(role => (
                      <div key={role} className="flex justify-between items-center p-4 bg-slate-50 rounded-xl border border-slate-100">
                        <span className="font-bold text-sm">{role}</span>
                        <div className="flex gap-2">
                          <span className="text-[10px] bg-[#1B263B] text-white px-2 py-1 rounded font-bold">R</span>
                          <span className="text-[10px] bg-slate-200 text-slate-600 px-2 py-1 rounded font-bold">A</span>
                        </div>
                      </div>
                    ))}
                 </div>
               </div>
             </div>
          )}

        </div>
      </div>

      {/* Sticky Bottom Actions */}
      <div className="fixed bottom-0 w-full bg-white border-t border-slate-200 py-4 px-8 shadow-2xl z-50">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs text-slate-500">
            <span className="inline-block w-2 h-2 bg-emerald-500 rounded-full mr-2"></span>
            Statut du plan : **Prêt pour exécution**
          </p>
          <div className="flex gap-3">
            <button className="px-6 py-2 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors">Exporter en PDF</button>
            <button className="bg-[#1B263B] text-white px-8 py-3 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-[#25324d] transition-all shadow-lg">
              Démarrer la Phase 1 <ArrowRight size={18} />
            </button>
          </div>
        </div>
      </div>
      <div className="h-24"></div>
    </div>
  );
};

export default App;