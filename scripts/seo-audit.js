/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  AGENT SEO HEBDOMADAIRE — La Capitainerie
 *  Crawle lacapitainerie.com, calcule un score SEO et génère un rapport JSON
 *  compatible avec l'onglet "Rapports" du dashboard.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import fetch  from 'node-fetch';
import * as cheerio from 'cheerio';
import { writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// ─── Configuration ────────────────────────────────────────────────────────────
const BASE_URL = 'https://lacapitainerie.com';

const PAGES_TO_AUDIT = [
  { url: `${BASE_URL}/offres`,                          label: 'Listing Offres'           },
  { url: `${BASE_URL}/offres/poste/capitaine`,          label: 'Poste — Capitaine'        },
  { url: `${BASE_URL}/offres/poste/matelot`,            label: 'Poste — Matelot'          },
  { url: `${BASE_URL}/offres/poste/mecanicien`,         label: 'Poste — Mécanicien'       },
  { url: `${BASE_URL}/offres/poste/chef-mecanicien`,    label: 'Poste — Chef Mécanicien'  },
  { url: `${BASE_URL}/offres/poste/second`,             label: 'Poste — Second'           },
  { url: `${BASE_URL}/offres/secteur/plaisance`,        label: 'Secteur — Plaisance'      },
  { url: `${BASE_URL}/offres/secteur/peche`,            label: 'Secteur — Pêche'          },
  { url: `${BASE_URL}/offres/secteur/commerce`,         label: 'Secteur — Commerce'       },
  { url: `${BASE_URL}/offres/secteur/sport`,            label: 'Secteur — Sport'          },
  { url: `${BASE_URL}/offres/secteur/a-terre`,          label: 'Secteur — À Terre'        },
  { url: `${BASE_URL}/offres/port/marseille`,           label: 'Port — Marseille'         },
  { url: `${BASE_URL}/offres/port/le-havre`,            label: 'Port — Le Havre'          },
  { url: `${BASE_URL}/offres/port/dunkerque`,           label: 'Port — Dunkerque'         },
  { url: `${BASE_URL}/offres/port/brest`,               label: 'Port — Brest'             },
  { url: `${BASE_URL}/offres/diplome/capitaine-200`,    label: 'Diplôme — Capitaine 200'  },
  { url: `${BASE_URL}/offres/diplome/capitaine-500`,    label: 'Diplôme — Capitaine 500'  },
  { url: `${BASE_URL}/offres/diplome/capitaine-3000`,   label: 'Diplôme — Capitaine 3000' },
  { url: `${BASE_URL}/offres/diplome/mecanicien`,       label: 'Diplôme — Mécanicien'     },
  { url: `${BASE_URL}/offres/contrat/cdi`,              label: 'Contrat — CDI'            },
  { url: `${BASE_URL}/offres/contrat/cdd`,              label: 'Contrat — CDD'            },
  { url: `${BASE_URL}/offres/contrat/freelance`,        label: 'Contrat — Freelance'      },
  { url: `${BASE_URL}/armateurs`,                       label: 'Page Armateurs (B2B)'     },
];

// ─── Seuils & pondérations des critères ──────────────────────────────────────
const CRITERIA = {
  titlePresent:    { label: 'Meta Title renseigné',           weight: 3 },
  titleLength:     { label: 'Title ≤ 60 caractères',         weight: 2 },
  descPresent:     { label: 'Meta Description renseignée',   weight: 3 },
  descLength:      { label: 'Description ≤ 155 caractères',  weight: 2 },
  hasCanonical:    { label: 'Balise canonical présente',     weight: 3 },
  robotsIndexable: { label: 'robots: index, follow',         weight: 4 },
  hasH1:           { label: 'H1 présent',                    weight: 2 },
  hasH2:           { label: 'Au moins un H2',                weight: 1 },
  hasSchema:       { label: 'Schema.org présent (JSON-LD)',  weight: 4 },
  hasBreadcrumb:   { label: 'BreadcrumbList présent',        weight: 2 },
  hasOgTags:       { label: 'Open Graph (og:title)',         weight: 2 },
  urlSemantic:     { label: 'URL sémantique (slug lisible)', weight: 3 },
  noNegativeKw:    { label: 'Pas de noindex dans la page',   weight: 3 },
};

const TOTAL_WEIGHT = Object.values(CRITERIA).reduce((s, c) => s + c.weight, 0);

// ─── Helpers ──────────────────────────────────────────────────────────────────
function today() {
  const d = new Date();
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return { label: `${dd}${mm}${yyyy}`, iso: d.toISOString() };
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function fetchPage(url) {
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'LaCapitainerie-SEO-Bot/1.0 (+https://lacapitainerie.com)',
        'Accept-Language': 'fr-FR,fr;q=0.9',
      },
      timeout: 15000,
    });
    const html = await res.text();
    return { html, status: res.status, ok: res.ok };
  } catch (err) {
    return { html: '', status: 0, ok: false, error: err.message };
  }
}

// ─── Audit d'une page ─────────────────────────────────────────────────────────
function auditPage(url, label, html, status) {
  const $ = cheerio.load(html);

  const title      = $('title').first().text().trim();
  const metaDesc   = $('meta[name="description"]').attr('content') ?? '';
  const canonical  = $('link[rel="canonical"]').attr('href') ?? '';
  const robots     = $('meta[name="robots"]').attr('content') ?? '';
  const h1         = $('h1').first().text().trim();
  const h2Count    = $('h2').length;
  const ogTitle    = $('meta[property="og:title"]').attr('content') ?? '';
  const bodyText   = $('body').text();

  // Détection Schema.org
  const schemas = [];
  $('script[type="application/ld+json"]').each((_, el) => {
    try {
      const parsed = JSON.parse($(el).html());
      const types = Array.isArray(parsed)
        ? parsed.map(p => p['@type']).filter(Boolean)
        : [parsed['@type']].filter(Boolean);
      schemas.push(...types);
    } catch {}
  });

  const hasSchema     = schemas.length > 0;
  const hasBreadcrumb = schemas.includes('BreadcrumbList');
  const hasJobPosting = schemas.includes('JobPosting');

  // URL sémantique = pas d'ID court random (ex: koHnWq)
  const urlPath = new URL(url).pathname;
  const segments = urlPath.split('/').filter(Boolean);
  const lastSeg  = segments[segments.length - 1] ?? '';
  const isRandomId = /^[a-zA-Z0-9]{5,8}$/.test(lastSeg) && !lastSeg.includes('-');
  const urlSemantic = !isRandomId;

  // Évaluation des critères
  const passed = {
    titlePresent:    title.length > 0,
    titleLength:     title.length > 0 && title.length <= 60,
    descPresent:     metaDesc.length > 0,
    descLength:      metaDesc.length > 0 && metaDesc.length <= 155,
    hasCanonical:    canonical.length > 0,
    robotsIndexable: !robots.includes('noindex') && status === 200,
    hasH1:           h1.length > 0,
    hasH2:           h2Count > 0,
    hasSchema,
    hasBreadcrumb,
    hasOgTags:       ogTitle.length > 0,
    urlSemantic,
    noNegativeKw:    !bodyText.toLowerCase().includes('noindex'),
  };

  // Score pondéré
  let earnedWeight = 0;
  Object.entries(passed).forEach(([key, ok]) => {
    if (ok && CRITERIA[key]) earnedWeight += CRITERIA[key].weight;
  });
  const score = Math.round((earnedWeight / TOTAL_WEIGHT) * 100);

  // Points faibles détectés
  const issues = [];
  if (!passed.titlePresent)    issues.push('❌ Title manquant');
  if (!passed.titleLength)     issues.push(`⚠️ Title trop long (${title.length} car.)`);
  if (!passed.descPresent)     issues.push('❌ Meta description manquante');
  if (!passed.descLength)      issues.push(`⚠️ Meta description trop longue (${metaDesc.length} car.)`);
  if (!passed.hasCanonical)    issues.push('❌ Canonical absente');
  if (!passed.robotsIndexable) issues.push('🚫 Page non-indexable ou en erreur');
  if (!passed.hasH1)           issues.push('❌ H1 manquant');
  if (!passed.hasH2)           issues.push('⚠️ Aucun H2 détecté');
  if (!passed.hasSchema)       issues.push('❌ Aucun Schema.org');
  if (!passed.hasBreadcrumb)   issues.push('⚠️ BreadcrumbList absent');
  if (!passed.hasOgTags)       issues.push('⚠️ Open Graph absent');
  if (!passed.urlSemantic)     issues.push('⚠️ URL non-sémantique (ID court)');

  return {
    url,
    label,
    status,
    score,
    title,
    titleLength: title.length,
    metaDesc,
    metaDescLength: metaDesc.length,
    canonical,
    robots,
    h1,
    h2Count,
    schemas,
    hasJobPosting,
    ogTitle,
    passed,
    issues,
  };
}

// ─── Extraction du nb d'offres depuis une page de listing ─────────────────────
function extractOfferCount(html) {
  const $ = cheerio.load(html);
  // Cherche un pattern "XX offres" dans le texte
  const text = $('body').text();
  const match = text.match(/(\d+)\s*offres?/i);
  return match ? parseInt(match[1], 10) : null;
}

// ─── Construction du rapport global ──────────────────────────────────────────
function buildReport(date, pageResults, offerCounts) {
  const scores   = pageResults.map(p => p.score);
  const avgScore = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);

  // Pages avec problèmes
  const pagesWithIssues = pageResults
    .filter(p => p.issues.length > 0)
    .sort((a, b) => a.score - b.score);

  // Pages bien optimisées
  const pagesOk = pageResults.filter(p => p.issues.length === 0);

  // Points forts globaux
  const pointsForts = [];
  const pctIndexable = Math.round(pageResults.filter(p => p.passed.robotsIndexable).length / pageResults.length * 100);
  const pctSchema    = Math.round(pageResults.filter(p => p.passed.hasSchema).length / pageResults.length * 100);
  const pctCanonical = Math.round(pageResults.filter(p => p.passed.hasCanonical).length / pageResults.length * 100);

  if (pctIndexable === 100) pointsForts.push(`100% des pages auditées sont indexables`);
  if (pctSchema >= 80)      pointsForts.push(`${pctSchema}% des pages ont un Schema.org valide`);
  if (pctCanonical >= 90)   pointsForts.push(`${pctCanonical}% des pages ont une balise canonical`);
  if (pagesOk.length > 0)   pointsForts.push(`${pagesOk.length} page(s) sans aucun problème détecté`);

  // Offres
  const totalOffres = offerCounts.listing ?? 0;
  if (totalOffres > 0) pointsForts.push(`${totalOffres}+ offres d'emploi indexables publiquement`);

  // Points faibles globaux
  const pointsFaibles = [];
  const pagesNoDesc  = pageResults.filter(p => !p.passed.descPresent);
  const pagesNoH2    = pageResults.filter(p => !p.passed.hasH2);
  const pagesNoOg    = pageResults.filter(p => !p.passed.hasOgTags);
  const pagesNoBC    = pageResults.filter(p => !p.passed.hasBreadcrumb);
  const pagesNoSem   = pageResults.filter(p => !p.passed.urlSemantic);

  if (pagesNoDesc.length > 0)  pointsFaibles.push(`${pagesNoDesc.length} page(s) sans meta-description optimisée`);
  if (pagesNoH2.length > 0)    pointsFaibles.push(`${pagesNoH2.length} page(s) sans H2 (structure de contenu faible)`);
  if (pagesNoOg.length > 0)    pointsFaibles.push(`${pagesNoOg.length} page(s) sans Open Graph`);
  if (pagesNoBC.length > 0)    pointsFaibles.push(`${pagesNoBC.length} page(s) sans BreadcrumbList`);
  if (pagesNoSem.length > 0)   pointsFaibles.push(`${pagesNoSem.length} URL(s) non-sémantique(s) détectée(s)`);

  // Top issues → actions prioritaires
  const actions = [];

  // Issues critiques (score < 50)
  pagesWithIssues
    .filter(p => p.score < 50)
    .slice(0, 3)
    .forEach(p => {
      actions.push({
        label: `Corriger "${p.label}" — score ${p.score}% : ${p.issues[0]}`,
        priorite: 'haute',
      });
    });

  // Issues moyennes
  pagesWithIssues
    .filter(p => p.score >= 50 && p.score < 75)
    .slice(0, 4)
    .forEach(p => {
      actions.push({
        label: `Optimiser "${p.label}" — score ${p.score}% : ${p.issues.join(', ')}`,
        priorite: 'moyenne',
      });
    });

  // Recommandation offres
  if (totalOffres > 0) {
    actions.push({
      label: `Surveiller la fraîcheur : ${totalOffres} offres en ligne — vérifier les offres expirées`,
      priorite: 'basse',
    });
  }

  // Résumé
  const resume = [
    `Audit automatique du ${date.label.slice(0,2)}/${date.label.slice(2,4)}/${date.label.slice(4)} — ${pageResults.length} pages crawlées.`,
    `Score SEO global : ${avgScore}/100.`,
    totalOffres ? `${totalOffres} offres actives détectées.` : '',
    pagesWithIssues.length > 0
      ? `${pagesWithIssues.length} page(s) avec des problèmes détectés.`
      : 'Aucun problème majeur détecté.',
    `Pages bien optimisées : ${pagesOk.length}/${pageResults.length}.`,
  ].filter(Boolean).join(' ');

  return {
    id: Date.now(),
    date: date.iso,
    titre: `Rapport SEO Hebdomadaire [${date.label}]`,
    categorie: 'Suivi mensuel',
    score: avgScore,
    url_analysee: BASE_URL,
    auteur: 'SEO Bot 🤖 (GitHub Actions)',
    resume,
    points_forts: pointsForts.join('\n'),
    points_faibles: pointsFaibles.join('\n'),
    actions,
    // Données brutes pour analyses futures
    _meta: {
      pages_auditees: pageResults.length,
      pages_sans_probleme: pagesOk.length,
      offres_total: totalOffres,
      offres_par_categorie: offerCounts,
      detail_pages: pageResults.map(p => ({
        url:    p.url,
        label:  p.label,
        score:  p.score,
        status: p.status,
        issues: p.issues,
        title:  p.title,
        titleLength: p.titleLength,
        metaDescLength: p.metaDescLength,
        schemas: p.schemas,
        h1: p.h1,
      })),
    },
  };
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  const date = today();
  console.log(`\n🚀 Audit SEO La Capitainerie — ${date.label}`);
  console.log(`   ${PAGES_TO_AUDIT.length} pages à crawler\n`);

  const pageResults  = [];
  const offerCounts  = {};

  for (const page of PAGES_TO_AUDIT) {
    process.stdout.write(`   ⏳ ${page.label.padEnd(35)}`);
    const { html, status, ok } = await fetchPage(page.url);

    if (!ok || !html) {
      console.log(`❌ Erreur HTTP ${status}`);
      pageResults.push({
        url: page.url, label: page.label, status,
        score: 0, issues: [`Erreur HTTP ${status}`],
        title: '', metaDesc: '', passed: {}, schemas: [],
      });
    } else {
      const result = auditPage(page.url, page.label, html, status);
      pageResults.push(result);
      console.log(`✅ Score: ${result.score}%  |  Issues: ${result.issues.length}`);

      // Compter les offres sur les pages de listing principales
      if (page.url.includes('/offres/poste/') || page.url === `${BASE_URL}/offres`) {
        const count = extractOfferCount(html);
        if (count !== null) {
          const key = page.url === `${BASE_URL}/offres` ? 'listing' : page.label.replace('Poste — ', '').toLowerCase();
          offerCounts[key] = count;
        }
      }
    }

    // Pause polie entre les requêtes (évite le rate-limiting)
    await sleep(800);
  }

  // Génération du rapport
  console.log('\n📊 Génération du rapport...');
  const rapport = buildReport(date, pageResults, offerCounts);

  // Écriture du fichier
  const outDir  = join(__dirname, '..', 'rapports');
  mkdirSync(outDir, { recursive: true });
  const filename = `rapport-seo-${date.label}.json`;
  const outPath  = join(outDir, filename);
  writeFileSync(outPath, JSON.stringify(rapport, null, 2), 'utf8');

  console.log(`\n✅ Rapport généré : rapports/${filename}`);
  console.log(`   Score global   : ${rapport.score}/100`);
  console.log(`   Points forts   : ${rapport.points_forts.split('\n').length}`);
  console.log(`   Points faibles : ${rapport.points_faibles.split('\n').length}`);
  console.log(`   Actions        : ${rapport.actions.length}`);
  console.log('\n🎉 Audit terminé !\n');
}

main().catch(err => {
  console.error('❌ Erreur critique :', err);
  process.exit(1);
});
