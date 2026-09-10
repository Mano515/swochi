/* ══════════════════════════════════════════════════
   Modèle des filtres de découverte
   État, persistance, construction des requêtes TMDB.
   L'interface vit dans PanneauFiltres.js.
══════════════════════════════════════════════════ */

import palmares from "./data/palmares.json";

const TMDB = "https://api.themoviedb.org/3";

export const ANNEE_MIN = 1920;
export const ANNEE_MAX = new Date().getFullYear();

/* Sentinelle haute de la durée : au-delà, on ne borne plus.
   Un film de 3h30 ne doit pas disparaître parce que le curseur
   est resté au maximum. */
export const DUREE_MAX = 240;

export const NOTE_MAX = 9;

/* ── Tris ─────────────────────────────────────────
   Le tri par note exige un plancher de votes élevé :
   sans lui TMDB remonte des fiches à 10/10 avec trois
   votes, et le classement ne veut plus rien dire.
──────────────────────────────────────────────────── */
export const TRIS = [
  { valeur: "popularity.desc",           label: "Populaires" },
  { valeur: "vote_average.desc",         label: "Mieux notés" },
  { valeur: "primary_release_date.desc", label: "Récents" },
  { valeur: "revenue.desc",              label: "Gros succès" },
];

export const PRIX = [
  { valeur: "oscars", label: "Oscar du meilleur film", court: "Oscars",     nb: palmares.oscars.length },
  { valeur: "cannes", label: "Palme d'or",             court: "Palme d'or", nb: palmares.cannes.length },
];

/* ── Pays ─────────────────────────────────────────
   Sélection de pays réellement représentés dans le
   catalogue. La liste complète de TMDB (250 entrées)
   serait illisible au pouce.
──────────────────────────────────────────────────── */
export const PAYS = [
  { code: "FR", nom: "France",           drapeau: "🇫🇷" },
  { code: "US", nom: "États-Unis",       drapeau: "🇺🇸" },
  { code: "GB", nom: "Royaume-Uni",      drapeau: "🇬🇧" },
  { code: "JP", nom: "Japon",            drapeau: "🇯🇵" },
  { code: "KR", nom: "Corée du Sud",     drapeau: "🇰🇷" },
  { code: "IT", nom: "Italie",           drapeau: "🇮🇹" },
  { code: "ES", nom: "Espagne",          drapeau: "🇪🇸" },
  { code: "DE", nom: "Allemagne",        drapeau: "🇩🇪" },
  { code: "IN", nom: "Inde",             drapeau: "🇮🇳" },
  { code: "CN", nom: "Chine",            drapeau: "🇨🇳" },
  { code: "HK", nom: "Hong Kong",        drapeau: "🇭🇰" },
  { code: "TW", nom: "Taïwan",           drapeau: "🇹🇼" },
  { code: "CA", nom: "Canada",           drapeau: "🇨🇦" },
  { code: "BE", nom: "Belgique",         drapeau: "🇧🇪" },
  { code: "CH", nom: "Suisse",           drapeau: "🇨🇭" },
  { code: "AU", nom: "Australie",        drapeau: "🇦🇺" },
  { code: "NZ", nom: "Nouvelle-Zélande", drapeau: "🇳🇿" },
  { code: "IE", nom: "Irlande",          drapeau: "🇮🇪" },
  { code: "SE", nom: "Suède",            drapeau: "🇸🇪" },
  { code: "DK", nom: "Danemark",         drapeau: "🇩🇰" },
  { code: "NO", nom: "Norvège",          drapeau: "🇳🇴" },
  { code: "FI", nom: "Finlande",         drapeau: "🇫🇮" },
  { code: "IS", nom: "Islande",          drapeau: "🇮🇸" },
  { code: "NL", nom: "Pays-Bas",         drapeau: "🇳🇱" },
  { code: "PL", nom: "Pologne",          drapeau: "🇵🇱" },
  { code: "CZ", nom: "Tchéquie",         drapeau: "🇨🇿" },
  { code: "HU", nom: "Hongrie",          drapeau: "🇭🇺" },
  { code: "RO", nom: "Roumanie",         drapeau: "🇷🇴" },
  { code: "RU", nom: "Russie",           drapeau: "🇷🇺" },
  { code: "UA", nom: "Ukraine",          drapeau: "🇺🇦" },
  { code: "GR", nom: "Grèce",            drapeau: "🇬🇷" },
  { code: "PT", nom: "Portugal",         drapeau: "🇵🇹" },
  { code: "AT", nom: "Autriche",         drapeau: "🇦🇹" },
  { code: "TR", nom: "Turquie",          drapeau: "🇹🇷" },
  { code: "IR", nom: "Iran",             drapeau: "🇮🇷" },
  { code: "IL", nom: "Israël",           drapeau: "🇮🇱" },
  { code: "EG", nom: "Égypte",           drapeau: "🇪🇬" },
  { code: "MA", nom: "Maroc",            drapeau: "🇲🇦" },
  { code: "DZ", nom: "Algérie",          drapeau: "🇩🇿" },
  { code: "SN", nom: "Sénégal",          drapeau: "🇸🇳" },
  { code: "ZA", nom: "Afrique du Sud",   drapeau: "🇿🇦" },
  { code: "BR", nom: "Brésil",           drapeau: "🇧🇷" },
  { code: "AR", nom: "Argentine",        drapeau: "🇦🇷" },
  { code: "MX", nom: "Mexique",          drapeau: "🇲🇽" },
  { code: "CL", nom: "Chili",            drapeau: "🇨🇱" },
  { code: "CO", nom: "Colombie",         drapeau: "🇨🇴" },
  { code: "TH", nom: "Thaïlande",        drapeau: "🇹🇭" },
  { code: "VN", nom: "Vietnam",          drapeau: "🇻🇳" },
  { code: "ID", nom: "Indonésie",        drapeau: "🇮🇩" },
  { code: "PH", nom: "Philippines",      drapeau: "🇵🇭" },
];

export const FILTRES_DEFAUT = {
  genres:  [],                       // identifiants TMDB, en chaîne
  prix:    [],                       // "oscars" | "cannes"
  annees:  [ANNEE_MIN, ANNEE_MAX],
  noteMin: 0,
  duree:   [0, DUREE_MAX],
  pays:    [],                       // ISO 3166-1
  tri:     "popularity.desc",
};

// ─── Lecture de l'état ────────────────────────────────────────────────────────

/** Nombre de critères réellement posés — alimente le badge du bouton. */
export function nbFiltresActifs(f) {
  let n = f.genres.length + f.prix.length + f.pays.length;
  if (f.annees[0] > ANNEE_MIN || f.annees[1] < ANNEE_MAX) n += 1;
  if (f.noteMin > 0) n += 1;
  if (f.duree[0] > 0 || f.duree[1] < DUREE_MAX) n += 1;
  if (f.tri !== FILTRES_DEFAUT.tri) n += 1;
  return n;
}

export function aucunFiltre(f)  { return nbFiltresActifs(f) === 0; }
export function aDesPrix(f)     { return f.prix.length > 0; }
export function memesFiltres(a, b) { return JSON.stringify(a) === JSON.stringify(b); }

// ─── Persistance ──────────────────────────────────────────────────────────────

const CLE_STOCKAGE = "swochi_filtres";

/** Fusionne avec les valeurs par défaut : un filtre ajouté plus tard ne doit
    pas casser un état sauvegardé par une version antérieure. */
export function lireFiltres() {
  try {
    const brut = JSON.parse(localStorage.getItem(CLE_STOCKAGE) || "null");
    if (!brut) return FILTRES_DEFAUT;
    return {
      ...FILTRES_DEFAUT,
      ...brut,
      annees: Array.isArray(brut.annees) ? brut.annees : FILTRES_DEFAUT.annees,
      duree:  Array.isArray(brut.duree)  ? brut.duree  : FILTRES_DEFAUT.duree,
      genres: Array.isArray(brut.genres) ? brut.genres.map(String) : [],
      pays:   Array.isArray(brut.pays)   ? brut.pays : [],
      prix:   Array.isArray(brut.prix)   ? brut.prix : [],
    };
  } catch {
    return FILTRES_DEFAUT;
  }
}

export function ecrireFiltres(f) {
  try { localStorage.setItem(CLE_STOCKAGE, JSON.stringify(f)); } catch { /* quota plein */ }
}

// ─── Requêtes TMDB ────────────────────────────────────────────────────────────

function aujourdhui() { return new Date().toISOString().slice(0, 10); }

/** Traduit les filtres en paramètres /discover. */
export function paramsDiscover(f, page, cle) {
  const p = new URLSearchParams({
    api_key: cle,
    language: "fr-FR",
    include_adult: "false",
    sort_by: f.tri,
    page: String(page),
  });

  /* Plancher de votes, qui monte avec l'exigence : trier par note ou
     réclamer une note minimale sur des fiches à trois votes ne produit
     que du bruit. */
  const plancher = f.tri === "vote_average.desc" ? 500 : (f.noteMin > 0 ? 300 : 100);
  p.set("vote_count.gte", String(plancher));

  if (f.genres.length) p.set("with_genres", f.genres.join("|"));
  if (f.pays.length)   p.set("with_origin_country", f.pays.join("|"));
  if (f.noteMin > 0)   p.set("vote_average.gte", String(f.noteMin));

  if (f.annees[0] > ANNEE_MIN) p.set("primary_release_date.gte", `${f.annees[0]}-01-01`);
  /* Borne haute toujours posée : sans elle, le catalogue remonte des films
     annoncés mais pas encore sortis, impossibles à voir. */
  p.set("primary_release_date.lte",
        f.annees[1] >= ANNEE_MAX ? aujourdhui() : `${f.annees[1]}-12-31`);

  if (f.duree[0] > 0)         p.set("with_runtime.gte", String(f.duree[0]));
  if (f.duree[1] < DUREE_MAX) p.set("with_runtime.lte", String(f.duree[1]));

  return p;
}

export function urlDiscover(f, page, cle) {
  return `${TMDB}/discover/movie?${paramsDiscover(f, page, cle)}`;
}

/** Total de films correspondants — alimente le compteur du panneau. */
export async function compterResultats(f, cle, signal) {
  const r = await fetch(`${TMDB}/discover/movie?${paramsDiscover(f, 1, cle)}`, { signal });
  const d = await r.json();
  return d.total_results ?? 0;
}

// ─── Films primés ─────────────────────────────────────────────────────────────
/* TMDB n'expose aucune donnée de récompense : ses mots-clés « award winner »,
   « oscar » et « palme d'or » totalisent 44 films, presque tous obscurs.
   Le palmarès est donc figé côté app (voir scripts/palmares.py) et les fiches
   sont récupérées une à une. Le vivier est petit — 174 films — donc on le
   parcourt par lots au lieu de paginer sur /discover. */

const LOT_PRIX = 30;
const cacheFiches = new Map();

/** Ordre pseudo-aléatoire mais stable : deux chargements successifs doivent
    parcourir le vivier dans le même ordre, sinon la pagination se répète. */
function rang(id) { return Math.imul(id, 2654435761) >>> 0; }

function vivier(f) {
  const ids = [];
  if (f.prix.includes("oscars")) ids.push(...palmares.oscars);
  if (f.prix.includes("cannes")) ids.push(...palmares.cannes);
  return [...new Set(ids)].sort((a, b) => rang(a) - rang(b));
}

export function tailleVivier(f) { return vivier(f).length; }

/** Met une fiche /movie/{id} à la forme des résultats /discover. */
function normaliser(d) {
  return {
    id: d.id,
    title: d.title,
    poster_path: d.poster_path,
    backdrop_path: d.backdrop_path,
    release_date: d.release_date,
    vote_average: d.vote_average,
    vote_count: d.vote_count,
    overview: d.overview,
    genre_ids: (d.genres || []).map(g => g.id),
    runtime: d.runtime,
    origin_country: d.origin_country || [],
  };
}

async function fiche(id, cle) {
  if (cacheFiches.has(id)) return cacheFiches.get(id);
  try {
    const d = await fetch(`${TMDB}/movie/${id}?api_key=${cle}&language=fr-FR`).then(r => r.json());
    if (!d || d.success === false) return null;
    const film = normaliser(d);
    cacheFiches.set(id, film);
    return film;
  } catch {
    return null;
  }
}

/** Les autres critères ne peuvent pas passer par l'API pour les primés :
    on les applique sur la fiche récupérée. */
export function correspond(film, f) {
  const annee = film.release_date ? Number(film.release_date.slice(0, 4)) : null;
  if (annee && (annee < f.annees[0] || annee > f.annees[1])) return false;
  if (f.noteMin > 0 && (film.vote_average || 0) < f.noteMin) return false;
  if (f.duree[0] > 0 && (film.runtime || 0) < f.duree[0]) return false;
  if (f.duree[1] < DUREE_MAX && film.runtime > f.duree[1]) return false;
  if (f.genres.length && !(film.genre_ids || []).some(g => f.genres.includes(String(g)))) return false;
  if (f.pays.length   && !(film.origin_country || []).some(c => f.pays.includes(c))) return false;
  return true;
}

/** Un lot de films primés. `page` démarre à 1 et sert de curseur. */
export async function chargerPrimes(f, page, cle, exclus) {
  const ordre  = vivier(f);
  const debut  = Math.max(0, (page - 1) * LOT_PRIX);
  const lot    = ordre.slice(debut, debut + LOT_PRIX);
  const vus    = new Set(exclus);
  const fiches = await Promise.all(lot.filter(id => !vus.has(id)).map(id => fiche(id, cle)));
  return {
    films:  fiches.filter(x => x && correspond(x, f)),
    epuise: debut + LOT_PRIX >= ordre.length,
  };
}
