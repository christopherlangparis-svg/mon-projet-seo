/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  AGENT SEO HEBDOMADAIRE — La Capitainerie
 *  Critères alignés sur l'analyse manuelle du 27/03/2026
 *  Score = fidèle à ce qu'un expert SEO mesurerait manuellement
 * ─────────────────────────────────────────────────────────────────────────────
 */

import fetch  from 'node-fetch';
import * as cheerio from 'cheerio';
import { writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const BASE_URL = 'https://lacapitainerie.com';

// ─── Pages de silos à auditer ─────────────────────────────────────────────────
const SILO_PAGES = [
  { url: `${BASE_URL}/offres`,                          label: 'Listing Offres',           type: 'listing'  },
  { url: `${BASE_URL}/offres/poste/capitaine`,          label: 'Poste — Capitaine',        type: 'silo'     },
  { url: `${BASE_URL}/offres/poste/matelot`,            label: 'Poste — Matelot',          type: 'silo'     },
  { url: `${BASE_URL}/offres/poste/mecanicien`,         label: 'Poste — Mécanicien',       type: 'silo'     },
  { url: `${BASE_URL}/offres/poste/chef-mecanicien`,    label: 'Poste — Chef Mécanicien',  type: 'silo'     },
  { url: `${BASE_URL}/offres/poste/second`,             label: 'Poste — Second',           type: 'silo'     },
  { url: `${BASE_URL}/offres/secteur/plaisance`,        label: 'Secteur — Plaisance',      type: 'silo'     },
  { url: `${BASE_URL}/offres/secteur/peche`,            label: 'Secteur — Pêche',          type: 'silo'     },
  { url: `${BASE_URL}/offres/secteur/commerce`,         label: 'Secteur — Commerce',       type: 'silo'     },
  { url: `${BASE_URL}/offres/secteur/sport`,            label: 'Secteur — Sport',          type: 'silo'     },
  { url: `${BASE_URL}/offres/secteur/a-terre`,          label: 'Secteur — À Terre',        type: 'silo'     },
  { url: `${BASE_URL}/offres/port/marseille`,           label: 'Port — Marseille',         type: 'silo'     },
  { url: `${BASE_URL}/offres/port/le-havre`,            label: 'Port — Le Havre',          type: 'silo'     },
  { url: `${BASE_URL}/offres/port/dunkerque`,           label: 'Port — Dunkerque',         type: 'silo'     },
  { url: `${BASE_URL}/offres/port/brest`,               label: 'Port — Brest',             type: 'silo'     },
  { url: `${BASE_URL}/offres/diplome/capitaine-200`,    label: 'Diplôme — Capitaine 200',  type: 'silo'     },
  { url: `${BASE_URL}/offres/diplome/capitaine-500`,    label: 'Diplôme — Capitaine 500',  type: 'silo'     },
  { url: `${BASE_URL}/offres/diplome/capitaine-3000`,   label: 'Diplôme — Capitaine 3000', type: 'silo'     },
  { url: `${BASE_URL}/offres/diplome/mecanicien`,       label: 'Diplôme — Mécanicien',     type: 'silo'     },
  { url: `${BASE_URL}/offres/contrat/cdi`,              label: 'Contrat — CDI',            type: 'silo'     },
  { url: `${BASE_URL}/offres/contrat/cdd`,              label: 'Contrat — CDD',            type: 'silo'     },
  { url: `${BASE_URL}/offres/contrat/freelance`,        label: 'Contrat — Freelance',      type: 'silo'     },
  { url: `${BASE_URL}/armateurs`,                       label: 'Page Armateurs (B2B)',     type: 'b2b'      },
];

// ─── Mots-clés différenciants attendus dans les meta-descriptions ─────────────
const DIFFERENTIANTS = ['stcw','embarquement','postulez','brevet','enim','qualifié','inscription','marin','offres','clic'];

// ─── Patterns de liens internes croisés entre silos ───────────────────────────
const INTERNAL_LINK_PATTERNS = [
  '/offres/poste/', '/offres/secteur/',
  '/offres/port/', '/offres/diplome/', '/offres/contrat/',
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function today() {
  const d  = new Date();
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  return { label: `${dd}${mm}${d.getFullYear()}`, iso: d.toISOString() };
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function fetchPage(url) {
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'LaCapitainerie-SEO-Bot/2.0', 'Accept-Language': 'fr-FR' },
      timeout: 15000,
    });
    return { html: await res.text(), status: res.status, ok: res.ok };
  } catch (e) {
    return { html: '', status: 0, ok: false };
  }
}

// Détecte les liens vers des fiches individuelles avec ID court (non-sémantique)
function findNonSemanticOfferLinks($) {
  const found = [];
  $('a[href]').each((_, el) => {
    const href = $(el).attr('href') || '';
    if (/\/offres\/[a-zA-Z0-9]{4,8}$/.test(href) &&
        !/\/offres\/(poste|secteur|port|diplome|contrat)/.test(href)) {
      found.push(href);
    }
  });
  return [...new Set(found)].slice(0, 3);
}

// Vérifie si la meta-description contient au moins un argument différenciant
function isDescDifferentiante(desc) {
  const lower = desc.toLowerCase();
  return DIFFERENTIANTS.some(kw => lower.includes(kw));
}

// Compte les liens croisés vers d'autres silos (maillage interne)
function countCrossLinks($, currentUrl) {
  const found = new Set();
  $('a[href]').each((_, el) => {
    const href = $(el).attr('href') || '';
    INTERNAL_LINK_PATTERNS.forEach(p => {
      if (href.includes(p) && !currentUrl.includes(href)) found.add(href);
    });
  });
  return found.size;
}

// Extrait le nombre d'offres visibles
function extractOfferCount($) {
  const match = $('body').text().match(/(\d+)\s*offres?/i);
  return match ? parseInt(match[1], 10) : null;
}

// ─── Audit d'une page ─────────────────────────────────────────────────────────
function auditPage(page, html, status) {
  const $ = cheerio.load(html);
  const { url, label, type } = page;

  const title     = $('title').first().text().trim();
  const metaDesc  = $('meta[name="description"]').attr('content') ?? '';
  const canonical = $('link[rel="canonical"]').attr('href') ?? '';
  const robots    = $('meta[name="robots"]').attr('content') ?? '';
  const h1        = $('h1').first().text().trim();
  const h2s       = $('h2').map((_, el) => $(el).text().trim()).get();
  const ogTitle   = $('meta[property="og:title"]').attr('content') ?? '';

  const schemas = [];
  $('script[type="application/ld+json"]').each((_, el) => {
    try {
      const p = JSON.parse($(el).html());
      (Array.isArray(p) ? p : [p]).forEach(o => o['@type'] && schemas.push(o['@type']));
    } catch {}
  });

  const imagesTotal  = $('img').length;
  const imagesNoAlt  = $('img:not([alt]), img[alt=""]').length;
  const crossLinks   = countCrossLinks($, url);
  const nonSemUrls   = findNonSemanticOfferLinks($);
  const descOk       = isDescDifferentiante(metaDesc);
  const offerCount   = extractOfferCount($);

  // ══ Évaluation des 7 axes du rapport manuel ══════════════════════════════

  const checks = {
    // 1. Indexabilité
    indexable:    status === 200 && !robots.includes('noindex'),
    // 2. Balises meta
    titlePresent: title.length > 0,
    titleLength:  title.length > 0 && title.length <= 60,
    descPresent:  metaDesc.length > 0,
    descLength:   metaDesc.length > 0 && metaDesc.length <= 155,
    descQuality:  descOk,         // ← différenciant qualitatif
    // 3. Schema.org
    hasSchema:    schemas.length > 0,
    hasBreadcrumb: schemas.includes('BreadcrumbList'),
    hasOgTitle:   ogTitle.length > 0,
    // 4. Structure contenu
    hasH1:        h1.length > 0,
    hasH2:        h2s.length > 0,
    hasH2Desc:    h2s.some(h => h.length > 20),
    // 5. URLs sémantiques (ne pénalise que les fiches offres avec ID court)
    urlSemantic:  nonSemUrls.length === 0,
    // 6. Maillage interne croisé
    crossLinking: type !== 'silo' || crossLinks >= 2,
    // 7. Alt tags
    altTags:      imagesNoAlt === 0,
  };

  // Issues
  const issues = [];
  if (!checks.indexable)    issues.push({ sev: 'critique', msg: `Non-indexable (robots: ${robots || 'absent'}, HTTP ${status})` });
  if (!checks.titlePresent) issues.push({ sev: 'critique', msg: 'Meta title absent' });
  if (!checks.titleLength)  issues.push({ sev: 'warning',  msg: `Meta title trop long (${title.length} car.)` });
  if (!checks.descPresent)  issues.push({ sev: 'critique', msg: 'Meta description absente' });
  if (!checks.descLength)   issues.push({ sev: 'warning',  msg: `Meta description trop longue (${metaDesc.length} car.)` });
  if (checks.descPresent && !checks.descQuality)
    issues.push({ sev: 'warning', msg: 'Meta description générique — pas de mot-clé différenciant (STCW, nb offres, CTA…)' });
  if (!checks.hasSchema)    issues.push({ sev: 'critique', msg: 'Aucun Schema.org (JSON-LD)' });
  if (!checks.hasBreadcrumb)issues.push({ sev: 'warning',  msg: 'BreadcrumbList absent' });
  if (!checks.hasOgTitle)   issues.push({ sev: 'warning',  msg: 'Open Graph (og:title) absent' });
  if (!checks.hasH1)        issues.push({ sev: 'critique', msg: 'H1 absent' });
  if (!checks.hasH2)        issues.push({ sev: 'warning',  msg: 'Aucun H2 — structure de contenu faible' });
  if (!checks.urlSemantic)  issues.push({ sev: 'critique', msg: `${nonSemUrls.length} lien(s) vers fiches non-sémantiques (ex: ${nonSemUrls[0]})` });
  if (!checks.crossLinking) issues.push({ sev: 'warning',  msg: `Maillage interne croisé insuffisant (${crossLinks} lien(s) vers d'autres silos)` });
  if (!checks.altTags)      issues.push({ sev: 'warning',  msg: `${imagesNoAlt}/${imagesTotal} image(s) sans attribut alt` });

  // Score pondéré (identique aux axes du rapport manuel)
  const W = {
    indexable: 15, titlePresent: 4, titleLength: 3,
    descPresent: 4, descLength: 2, descQuality: 7,
    hasSchema: 8, hasBreadcrumb: 5, hasOgTitle: 4,
    hasH1: 5, hasH2: 5, hasH2Desc: 3,
    urlSemantic: 10, crossLinking: 8, altTags: 7,
  };
  const totalW  = Object.values(W).reduce((a, b) => a + b, 0);
  const earnedW = Object.entries(W).reduce((s, [k, w]) => s + (checks[k] ? w : 0), 0);
  const score   = Math.round((earnedW / totalW) * 100);

  return {
    url, label, type, status, score,
    title, titleLength: title.length,
    metaDesc, metaDescLength: metaDesc.length, descQuality: descOk,
    canonical, robots, h1, h2s,
    schemas, ogTitle,
    imagesTotal, imagesNoAlt,
    crossLinks, nonSemUrls, offerCount,
    checks, issues,
  };
}

// ─── Construction du rapport global ──────────────────────────────────────────
function buildReport(date, results) {
  const avgScore    = Math.round(results.reduce((s, r) => s + r.score, 0) / results.length);
  const totalOffres = results.find(r => r.url.endsWith('/offres'))?.offerCount ?? 0;

  const pct = (fn) => Math.round(results.filter(fn).length / results.length * 100);
  const pctIndexable  = pct(r => r.checks.indexable);
  const pctSchema     = pct(r => r.checks.hasSchema);
  const pctCanonical  = pct(r => r.canonical.length > 0);
  const pctDescQual   = pct(r => r.checks.descQuality);
  const pctAltOk      = pct(r => r.checks.altTags);

  const nbDescGeneric = results.filter(r => r.checks.descPresent && !r.checks.descQuality).length;
  const nbNoSemantic  = results.filter(r => r.nonSemUrls.length > 0).length;
  const nbNoCrossLink = results.filter(r => r.type === 'silo' && !r.checks.crossLinking).length;
  const nbNoH2        = results.filter(r => !r.checks.hasH2).length;
  const nbNoOg        = results.filter(r => !r.checks.hasOgTitle).length;
  const nbNoBC        = results.filter(r => !r.checks.hasBreadcrumb).length;
  const nbAltMissing  = results.filter(r => !r.checks.altTags && r.imagesTotal > 0).length;
  const pagesOk       = results.filter(r => r.issues.length === 0).length;

  // ── Points forts ──
  const pointsForts = [];
  if (totalOffres > 0)      pointsForts.push(`${totalOffres}+ offres d'emploi indexables publiquement`);
  if (pctIndexable === 100) pointsForts.push(`100% des pages auditées sont indexables (robots: index, follow)`);
  if (pctSchema >= 90)      pointsForts.push(`${pctSchema}% des pages ont un Schema.org valide (CollectionPage + BreadcrumbList)`);
  if (pctCanonical >= 90)   pointsForts.push(`${pctCanonical}% des pages ont une balise canonical`);
  if (pagesOk > 0)          pointsForts.push(`${pagesOk} page(s) sans aucun problème détecté`);
  if (pctAltOk === 100)     pointsForts.push(`Alt tags : toutes les images ont un attribut alt`);

  // ── Points faibles ──
  const pointsFaibles = [];
  if (nbNoSemantic > 0)
    pointsFaibles.push(`URLs des fiches offres non-sémantiques (/offres/[ID court]) — aucun signal de pertinence pour Google`);
  if (nbDescGeneric > 0)
    pointsFaibles.push(`${nbDescGeneric} meta-description(s) trop générique(s) — sans argument différenciant (STCW, nb offres, CTA)`);
  if (nbNoCrossLink > 0)
    pointsFaibles.push(`${nbNoCrossLink} silo(s) sans maillage interne croisé — PageRank non distribué entre les pages`);
  if (nbAltMissing > 0)
    pointsFaibles.push(`${nbAltMissing} page(s) avec des images sans attribut alt`);
  if (nbNoH2 > 0)
    pointsFaibles.push(`${nbNoH2} page(s) sans H2 — structure de contenu faible`);
  if (nbNoOg > 0)
    pointsFaibles.push(`${nbNoOg} page(s) sans Open Graph`);
  if (nbNoBC > 0)
    pointsFaibles.push(`${nbNoBC} page(s) sans BreadcrumbList`);
  // Critères qualitatifs non-automatisables (constants jusqu'à résolution)
  pointsFaibles.push(`Aucun contenu éditorial (blog/guides) — longue traîne informationnelle inexploitée`);
  pointsFaibles.push(`Sous-domaines info. et armateur. fragmentent l'autorité de domaine (DR dispersé)`);

  // ── Actions priorisées ──
  const actions = [];
  if (nbNoSemantic > 0)
    actions.push({ label: `Passer les URLs des fiches offres en slugs sémantiques /offres/[poste]-[contrat]-[ville]`, priorite: 'haute' });
  if (nbDescGeneric > 0)
    actions.push({ label: `Réécrire ${nbDescGeneric} meta-description(s) : inclure nb offres, STCW, CTA différenciant`, priorite: 'haute' });
  const b2b = results.find(r => r.type === 'b2b');
  if (b2b && b2b.score < 80)
    actions.push({ label: `Enrichir /armateurs : Schema Organization+Service, H2 B2B ciblés, Open Graph`, priorite: 'haute' });
  actions.push({ label: `Soumettre/vérifier le sitemap XML dans Google Search Console`, priorite: 'haute' });
  if (nbNoCrossLink > 0)
    actions.push({ label: `Ajouter une section "Voir aussi" sur les ${nbNoCrossLink} silos sans maillage croisé`, priorite: 'moyenne' });
  if (nbAltMissing > 0)
    actions.push({ label: `Renseigner les attributs alt manquants sur les images de navires`, priorite: 'moyenne' });
  actions.push({ label: `Auditer Core Web Vitals mobile (LCP < 2.5s, CLS < 0.1, INP < 200ms) via PageSpeed`, priorite: 'moyenne' });
  actions.push({ label: `Migrer info.lacapitainerie.com → /blog/ avec redirections 301 pour concentrer l'autorité`, priorite: 'basse' });
  actions.push({ label: `Lancer la production éditoriale : 4-6 guides/mois (brevets, ENIM, offshore, portage salarial)`, priorite: 'basse' });
  actions.push({ label: `Créer des pages FAQ (FAQPage Schema) par métier pour viser les positions zéro Google`, priorite: 'basse' });
  actions.push({ label: `Stratégie netlinking : partenariats avec écoles navigation, presse maritime, organismes ENIM`, priorite: 'basse' });

  const resume = [
    `Audit automatique du ${date.label.slice(0,2)}/${date.label.slice(2,4)}/${date.label.slice(4)} — ${results.length} pages crawlées.`,
    `Score SEO global : ${avgScore}/100.`,
    totalOffres ? `${totalOffres}+ offres actives indexables.` : '',
    `${pagesOk}/${results.length} pages sans problème.`,
    `Indexabilité : ${pctIndexable}% — Schema.org : ${pctSchema}% — Meta-desc qualitative : ${pctDescQual}%.`,
    nbNoCrossLink > 0 ? `Maillage interne croisé absent sur ${nbNoCrossLink} silo(s).` : '',
    `Contenu éditorial et consolidation sous-domaines restent les axes de progression long-terme.`,
  ].filter(Boolean).join(' ');

  return {
    id:             Date.now(),
    date:           date.iso,
    titre:          `Rapport SEO Hebdomadaire [${date.label}]`,
    categorie:      'Suivi mensuel',
    score:          avgScore,
    url_analysee:   BASE_URL,
    auteur:         'SEO Bot 🤖 (GitHub Actions)',
    resume,
    points_forts:   pointsForts.join('\n'),
    points_faibles: pointsFaibles.join('\n'),
    actions,
    _meta: {
      pages_auditees:      results.length,
      pages_sans_probleme: pagesOk,
      offres_total:        totalOffres,
      scores_par_axe: {
        indexabilite:   `${pctIndexable}%`,
        schema_org:     `${pctSchema}%`,
        meta_desc_qual: `${pctDescQual}%`,
        alt_tags:       `${pctAltOk}%`,
      },
      detail_pages: results.map(r => ({
        url:            r.url,
        label:          r.label,
        score:          r.score,
        status:         r.status,
        issues:         r.issues.map(i => `[${i.sev.toUpperCase()}] ${i.msg}`),
        title:          r.title,
        titleLength:    r.titleLength,
        metaDescLength: r.metaDescLength,
        descQuality:    r.descQuality,
        schemas:        r.schemas,
        h1:             r.h1,
        h2Count:        r.h2s.length,
        crossLinks:     r.crossLinks,
        imagesNoAlt:    r.imagesNoAlt,
        offerCount:     r.offerCount,
      })),
    },
  };
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  const date = today();
  console.log(`\n🚀 Audit SEO La Capitainerie — ${date.label}`);
  console.log(`   Critères alignés sur l'analyse manuelle expert`);
  console.log(`   ${SILO_PAGES.length} pages à crawler\n`);

  const results = [];
  for (const page of SILO_PAGES) {
    process.stdout.write(`   ⏳ ${page.label.padEnd(32)}`);
    const { html, status, ok } = await fetchPage(page.url);
    if (!ok || !html) {
      console.log(`❌ HTTP ${status}`);
      results.push({ ...page, status, score: 0, title: '', metaDesc: '', canonical: '', robots: '',
        h1: '', h2s: [], schemas: [], ogTitle: '', imagesTotal: 0, imagesNoAlt: 0,
        crossLinks: 0, nonSemUrls: [], offerCount: null, descQuality: false,
        checks: {}, issues: [{ sev: 'critique', msg: `HTTP ${status}` }] });
    } else {
      const r = auditPage(page, html, status);
      results.push(r);
      console.log(`✅ ${String(r.score).padStart(3)}%  | Issues: ${r.issues.length}  | Offres: ${r.offerCount ?? '—'}`);
    }
    await sleep(800);
  }

  const rapport  = buildReport(date, results);
  const outDir   = join(__dirname, '..', 'rapports');
  mkdirSync(outDir, { recursive: true });
  const filename = `rapport-seo-${date.label}.json`;
  writeFileSync(join(outDir, filename), JSON.stringify(rapport, null, 2), 'utf8');

  console.log(`\n✅ rapports/${filename}`);
  console.log(`   Score : ${rapport.score}/100 | Points forts : ${rapport.points_forts.split('\n').length} | Actions : ${rapport.actions.length}`);
  console.log('\n🎉 Terminé !\n');
}

main().catch(err => { console.error('❌', err); process.exit(1); });
