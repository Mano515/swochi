/* ══════════════════════════════════════════════════
   Panneau de filtres — feuille remontante
   Les filtres se manipulent au pouce : cibles à 48px,
   aucun champ de saisie, tout se règle par pastilles
   et curseurs. Le compteur en pied de feuille dit en
   direct combien de films restent, pour qu'on ne
   valide jamais un filtrage à l'aveugle.
══════════════════════════════════════════════════ */

import { useEffect, useState } from "react";
import { IconeCroix } from "./Icones";
import { vibrer } from "./native";
import {
  ANNEE_MIN, ANNEE_MAX, DUREE_MAX, NOTE_MAX,
  FILTRES_DEFAUT, PAYS, PLATEFORMES, PRIX, TRIS,
  aDesPrix, compterResultats, memesFiltres, nbFiltresActifs,
} from "./filtres";

const TMDB_KEY = process.env.REACT_APP_TMDB_KEY;

// ─── Panneau ──────────────────────────────────────────────────────────────────

function PanneauFiltres({ filtres, genres, onAppliquer, onFermer }) {
  /* Brouillon local : on ne relance pas un chargement de films à chaque
     déplacement de curseur. Rien n'est appliqué avant la validation. */
  const [brouillon, setBrouillon] = useState(filtres);
  const [total, setTotal]         = useState(null);
  const [compte, setCompte]       = useState(false);

  const modifie = !memesFiltres(brouillon, filtres);
  const nbActifs = nbFiltresActifs(brouillon);

  function poser(champ, valeur) {
    setBrouillon(b => ({ ...b, [champ]: valeur }));
  }

  function basculer(champ, valeur) {
    vibrer("leger");
    setBrouillon(b => {
      const liste = b[champ];
      return {
        ...b,
        [champ]: liste.includes(valeur) ? liste.filter(v => v !== valeur) : [...liste, valeur],
      };
    });
  }

  // ── Compteur en direct ──────────────────────────────────────────────────────
  // Débouncé : un curseur qu'on fait glisser émettrait sinon trente requêtes.
  useEffect(() => {
    if (aDesPrix(brouillon)) { setTotal(null); setCompte(false); return; }
    const ctrl = new AbortController();
    setCompte(true);
    const t = setTimeout(() => {
      compterResultats(brouillon, TMDB_KEY, ctrl.signal)
        .then(n => { setTotal(n); setCompte(false); })
        .catch(() => setCompte(false));
    }, 350);
    return () => { clearTimeout(t); ctrl.abort(); };
  }, [brouillon]);

  // Échap ferme la feuille (desktop).
  useEffect(() => {
    const onTouche = e => { if (e.key === "Escape") onFermer(); };
    window.addEventListener("keydown", onTouche);
    return () => window.removeEventListener("keydown", onTouche);
  }, [onFermer]);

  /* En mode palmarès on n'annonce pas de nombre : les autres critères sont
     appliqués fiche par fiche, on ne saurait pas combien de titres passent
     sans les télécharger tous. La taille du vivier est déjà sur la pastille. */
  const resume = aDesPrix(brouillon)
    ? "Voir les primés"
    : compte  ? "Recherche…"
    : total === null ? "Appliquer"
    : total === 0 ? "Aucun film"
    : `Voir ${formaterNombre(total)} film${total > 1 ? "s" : ""}`;

  return (
    <div className="feuille-fond" onClick={onFermer} role="presentation">
      <div
        className="feuille"
        role="dialog"
        aria-modal="true"
        aria-label="Filtres de découverte"
        onClick={e => e.stopPropagation()}
      >
        {/* Poignée + en-tête */}
        <div className="feuille-tete">
          <div className="feuille-poignee" aria-hidden="true" />
          <div className="feuille-titre-ligne">
            <h2 className="feuille-titre">
              Filtres
              {nbActifs > 0 && <span className="feuille-compteur">{nbActifs}</span>}
            </h2>
            <button className="feuille-fermer" onClick={onFermer} aria-label="Fermer les filtres">
              <IconeCroix taille={18} />
            </button>
          </div>
        </div>

        {/* Corps défilant */}
        <div className="feuille-corps">

          <Section titre="Trier par">
            <div className="pastilles">
              {TRIS.map(t => (
                <Pastille
                  key={t.valeur}
                  actif={brouillon.tri === t.valeur}
                  onClick={() => { vibrer("leger"); poser("tri", t.valeur); }}
                >{t.label}</Pastille>
              ))}
            </div>
          </Section>

          <Section
            titre="Récompenses"
            aide="Palmarès officiels. TMDB n'expose pas les prix : la liste est tenue dans l'app."
            compte={brouillon.prix.length}
          >
            <div className="pastilles">
              {PRIX.map(p => (
                <Pastille
                  key={p.valeur}
                  actif={brouillon.prix.includes(p.valeur)}
                  onClick={() => basculer("prix", p.valeur)}
                >
                  {p.label} <span className="pastille-nb">{p.nb}</span>
                </Pastille>
              ))}
            </div>
            {aDesPrix(brouillon) && (
              <p className="feuille-note">
                Vivier restreint&nbsp;: le tri et le nombre de résultats ne s'appliquent pas,
                les autres filtres si.
              </p>
            )}
          </Section>

          <Section titre="Genres" compte={brouillon.genres.length}>
            <div className="pastilles">
              {genres.map(g => (
                <Pastille
                  key={g.id}
                  actif={brouillon.genres.includes(String(g.id))}
                  onClick={() => basculer("genres", String(g.id))}
                >{g.name}</Pastille>
              ))}
            </div>
          </Section>

          <Section
            titre="Année de sortie"
            valeur={brouillon.annees[0] === ANNEE_MIN && brouillon.annees[1] === ANNEE_MAX
              ? "Toutes"
              : `${brouillon.annees[0]} – ${brouillon.annees[1]}`}
          >
            <CurseurDouble
              min={ANNEE_MIN} max={ANNEE_MAX} pas={1}
              valeurs={brouillon.annees}
              onChange={v => poser("annees", v)}
              libelle="Année de sortie"
              format={a => String(a)}
            />
            <div className="pastilles" style={{ marginTop: "var(--s-3)" }}>
              {RACCOURCIS_ANNEES.map(r => (
                <Pastille
                  key={r.label}
                  petite
                  actif={brouillon.annees[0] === r.plage[0] && brouillon.annees[1] === r.plage[1]}
                  onClick={() => { vibrer("leger"); poser("annees", r.plage); }}
                >{r.label}</Pastille>
              ))}
            </div>
          </Section>

          <Section
            titre="Note minimale"
            valeur={brouillon.noteMin === 0 ? "Toutes" : `★ ${brouillon.noteMin.toFixed(1)} et plus`}
          >
            <Curseur
              min={0} max={NOTE_MAX} pas={0.5}
              valeur={brouillon.noteMin}
              onChange={v => poser("noteMin", v)}
              libelle="Note minimale"
            />
            <div className="curseur-bornes">
              <span>Toutes</span><span>★ {NOTE_MAX}</span>
            </div>
          </Section>

          <Section
            titre="Durée"
            valeur={brouillon.duree[0] === 0 && brouillon.duree[1] === DUREE_MAX
              ? "Toutes"
              : `${formaterDuree(brouillon.duree[0])} – ${formaterDuree(brouillon.duree[1])}`}
          >
            <CurseurDouble
              min={0} max={DUREE_MAX} pas={10}
              valeurs={brouillon.duree}
              onChange={v => poser("duree", v)}
              libelle="Durée"
              format={formaterDuree}
            />
          </Section>

          <Section
            titre="Plateformes"
            aide="Uniquement les films inclus dans l'abonnement — pas la location ni l'achat à l'acte."
            compte={brouillon.plateformes.length}
          >
            <div className="pastilles">
              {PLATEFORMES.map(pf => (
                <Pastille
                  key={pf.id}
                  actif={brouillon.plateformes.includes(String(pf.id))}
                  onClick={() => basculer("plateformes", String(pf.id))}
                >
                  {/* Pas de `loading="lazy"` : huit vignettes de quelques Ko chacune,
                      et le chargement différé s'est avéré peu fiable dans une feuille
                      qui s'anime — le navigateur ne relance pas toujours l'observation
                      d'intersection une fois l'animation d'entrée terminée. */}
                  <img
                    src={`https://image.tmdb.org/t/p/w45${pf.logo}`}
                    alt="" aria-hidden="true"
                    className="pastille-logo"
                  />
                  {pf.nom}
                </Pastille>
              ))}
            </div>
          </Section>

          <Section titre="Pays d'origine" compte={brouillon.pays.length}>
            <div className="pastilles">
              {PAYS.map(p => (
                <Pastille
                  key={p.code}
                  actif={brouillon.pays.includes(p.code)}
                  onClick={() => basculer("pays", p.code)}
                >
                  <span aria-hidden="true">{p.drapeau}</span> {p.nom}
                </Pastille>
              ))}
            </div>
          </Section>

          <div style={{ height: "var(--s-4)" }} />
        </div>

        {/* Pied collant */}
        <div className="feuille-pied">
          <button
            className="feuille-reset"
            onClick={() => { vibrer("leger"); setBrouillon(FILTRES_DEFAUT); }}
            disabled={nbActifs === 0}
          >
            Tout effacer
          </button>
          <button
            className="feuille-valider"
            onClick={() => onAppliquer(brouillon)}
            disabled={total === 0 && !aDesPrix(brouillon)}
          >
            {resume}
            {modifie && <span className="feuille-point" aria-hidden="true" />}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Briques ──────────────────────────────────────────────────────────────────

const RACCOURCIS_ANNEES = [
  { label: "2020s",   plage: [2020, ANNEE_MAX] },
  { label: "2010s",   plage: [2010, 2019] },
  { label: "2000s",   plage: [2000, 2009] },
  { label: "90s",     plage: [1990, 1999] },
  { label: "80s",     plage: [1980, 1989] },
  { label: "Avant 80", plage: [ANNEE_MIN, 1979] },
];

function Section({ titre, aide, valeur, compte, children }) {
  return (
    <section className="feuille-section">
      <div className="feuille-section-tete">
        <h3 className="feuille-section-titre">
          {titre}
          {compte > 0 && <span className="feuille-section-compte">{compte}</span>}
        </h3>
        {valeur && <span className="feuille-section-valeur">{valeur}</span>}
      </div>
      {aide && <p className="feuille-section-aide">{aide}</p>}
      {children}
    </section>
  );
}

function Pastille({ actif, petite, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={actif}
      className={`pastille${actif ? " pastille--active" : ""}${petite ? " pastille--petite" : ""}`}
    >
      {children}
    </button>
  );
}

/* Curseur simple. Un <input type="range"> natif : le navigateur gère le
   toucher, le clavier et le lecteur d'écran mieux que n'importe quel
   remplacement maison. On ne repeint que la piste. */
function Curseur({ min, max, pas, valeur, onChange, libelle }) {
  const pct = ((valeur - min) / (max - min)) * 100;
  return (
    <div className="curseur">
      {/* Le rail est rentré de la moitié d'une poignée de chaque côté : sinon
          la portion colorée déborde du centre des poignées aux extrémités. */}
      <div className="curseur-rail" aria-hidden="true">
        <div className="curseur-piste" />
        <div className="curseur-plage" style={{ left: 0, width: `${pct}%` }} />
      </div>
      <input
        type="range" min={min} max={max} step={pas} value={valeur}
        aria-label={libelle}
        onChange={e => onChange(Number(e.target.value))}
        className="curseur-input"
      />
    </div>
  );
}

/* Curseur à deux poignées : deux <input type="range"> superposés. La piste
   ne reçoit pas les évènements, seules les poignées le font — sans quoi le
   curseur du dessus capterait tous les appuis, y compris ceux destinés à
   l'autre poignée. */
function CurseurDouble({ min, max, pas, valeurs, onChange, libelle, format }) {
  const [bas, haut] = valeurs;
  const pctBas  = ((bas - min) / (max - min)) * 100;
  const pctHaut = ((haut - min) / (max - min)) * 100;

  /* Quand les deux poignées se rejoignent à une extrémité, celle du dessus
     doit être celle qu'on peut encore décoller, sinon la plage se bloque. */
  const basDevant = bas > max - (max - min) * 0.08;

  return (
    <>
      <div className="curseur curseur--double">
        <div className="curseur-rail" aria-hidden="true">
          <div className="curseur-piste" />
          <div className="curseur-plage"
               style={{ left: `${pctBas}%`, width: `${Math.max(0, pctHaut - pctBas)}%` }} />
        </div>
        <input
          type="range" min={min} max={max} step={pas} value={bas}
          aria-label={`${libelle} — minimum`}
          aria-valuetext={format(bas)}
          onChange={e => onChange([Math.min(Number(e.target.value), haut), haut])}
          className="curseur-input"
          style={{ zIndex: basDevant ? 4 : 3 }}
        />
        <input
          type="range" min={min} max={max} step={pas} value={haut}
          aria-label={`${libelle} — maximum`}
          aria-valuetext={format(haut)}
          onChange={e => onChange([bas, Math.max(Number(e.target.value), bas)])}
          className="curseur-input"
          style={{ zIndex: basDevant ? 3 : 4 }}
        />
      </div>
      <div className="curseur-bornes">
        <span>{format(min)}</span>
        <span>{format(max)}</span>
      </div>
    </>
  );
}

// ─── Bouton d'ouverture (rangée d'actions) ────────────────────────────────────

export function BoutonFiltres({ nb, onClick }) {
  return (
    <button
      onClick={() => { vibrer("leger"); onClick(); }}
      aria-label={nb > 0 ? `Filtres, ${nb} actif${nb > 1 ? "s" : ""}` : "Filtres"}
      className={`action-btn action-btn--filtres${nb > 0 ? " action-btn--filtres-actif" : ""}`}
    >
      <IconeFiltresGlyphe />
      {nb > 0 && <span className="action-btn-badge">{nb}</span>}
    </button>
  );
}

/* Trois réglages à curseur : le pictogramme dit « on ajuste », là où un
   entonnoir dit seulement « on retire ». */
function IconeFiltresGlyphe() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true"
         stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M4 7h10M18 7h2M4 12h3M11 12h9M4 17h8M16 17h4" />
      <circle cx="16" cy="7"  r="2.1" fill="currentColor" stroke="none" />
      <circle cx="9"  cy="12" r="2.1" fill="currentColor" stroke="none" />
      <circle cx="14" cy="17" r="2.1" fill="currentColor" stroke="none" />
    </svg>
  );
}

// ─── Formatage ────────────────────────────────────────────────────────────────

function formaterDuree(minutes) {
  if (minutes >= DUREE_MAX) return "3h+";
  if (minutes === 0) return "0";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (!h) return `${m} min`;
  return m ? `${h}h${String(m).padStart(2, "0")}` : `${h}h`;
}

function formaterNombre(n) {
  return n.toLocaleString("fr-FR");
}

export default PanneauFiltres;
