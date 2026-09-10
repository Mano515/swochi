import { useEffect, useState, useRef } from "react";
import Logo from "./Logo";
import { useTheme } from "./ThemeContext";
import { auth, db } from "./firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, updateDoc, getDoc, runTransaction } from "firebase/firestore";
import MovieCard    from "./MovieCard";
import Login        from "./Login";
import Match        from "./Match";
import MesFilms     from "./MesFilms";
import GenreScroll  from "./GenreScroll";
import MenuBurger   from "./MenuBurger";
import Profil       from "./Profil";
import Onboarding   from "./Onboarding";
import ErrorBoundary from "./ErrorBoundary";
import SplashScreen from "./SplashScreen";
import Recherche    from "./Recherche";
import { useBoutonRetour, vibrer } from "./native";
import { ICONES_NAV, IconeSoleil, IconeLune, IconeCroix, IconeOeil, IconeCoeur, IconeRetour, IconeRecherche, IconeFleche } from "./Icones";
import PanneauFiltres, { BoutonFiltres } from "./PanneauFiltres";
import {
  FILTRES_DEFAUT, aDesPrix, aucunFiltre, chargerPrimes, ecrireFiltres,
  lireFiltres, memesFiltres, nbFiltresActifs, urlDiscover,
} from "./filtres";

// ─── Constantes ──────────────────────────────────────────────────────────────

const TMDB_KEY = process.env.REACT_APP_TMDB_KEY;

const NAV_ITEMS = [
  { key: "swipe", label: "Découvrir" },
  { key: "match", label: "Amis"      },
  { key: "mesfilms", label: "Mes films" },
  { key: "profil", label: "Profil"    },
];

const LISTES_VIDES = { aVoir: [], pasInteresse: [], dejavu: [] };

// ─── App ─────────────────────────────────────────────────────────────────────

function App() {
  const { theme, toggleTheme } = useTheme();

  // Auth
  const [user, setUser]                   = useState(null);
  const [loading, setLoading]             = useState(true);       // true jusqu'à la 1ère réponse Firebase
  const [loadingUserData, setLoadingUserData] = useState(false);  // true pendant le fetch Firestore
  const [isGuest, setIsGuest]             = useState(true);

  // Films
  const [films, setFilms]                 = useState([]);
  const [index, setIndex]                 = useState(0);
  const [page, setPage]                   = useState(1);
  const [loadingFilms, setLoadingFilms]   = useState(true);
  const [filmsCherches, setFilmsCherches] = useState(false);      // true dès le 1er chargement réussi
  const [genres, setGenres]               = useState([]);
  const [filtres, setFiltres]             = useState(lireFiltres);
  const [historique, setHistorique]       = useState([]);
  const [dejaSwiped, setDejaSwiped]       = useState([]);

  // Listes utilisateur
  const [listes, setListes]               = useState(LISTES_VIDES);
  const [username, setUsername]           = useState(null);
  const [usernameInput, setUsernameInput] = useState("");
  const [usernameError, setUsernameError] = useState("");

  // UI
  const [onglet, setOnglet]               = useState("swipe");
  const [menuOuvert, setMenuOuvert]       = useState(false);
  const [rechercheOuverte, setRechercheOuverte] = useState(false);
  const [filtresOuverts, setFiltresOuverts]     = useState(false);
  const [loginModalOuvert, setLoginModalOuvert] = useState(false);
  const [showOnboarding, setShowOnboarding]     = useState(false);
  const [showGuestPrompt, setShowGuestPrompt]   = useState(false);
  const [toast, setToast]                 = useState(null);

  // Refs (pas de re-render nécessaire)
  const fetchIdRef   = useRef(0);   // annule les fetchs obsolètes
  const swipesInvite = useRef(0);   // compte les swipes en mode invité
  const toastTimer   = useRef(null);
  const carteRef     = useRef(null);   // pilote l'animation de la carte du dessus

  // ── Utilitaires ─────────────────────────────────────────────────────────────

  function afficherToast(message, type = "error") {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ message, type });
    toastTimer.current = setTimeout(() => setToast(null), 4000);
  }

  // Précharge les affiches suivantes. Sans ça, chaque nouvelle carte affiche
  // un rectangle vide le temps du téléchargement — c'est ce qui donnait
  // l'impression que l'app "rame" alors qu'elle attend simplement le réseau.
  useEffect(() => {
    for (let i = index; i < Math.min(index + 4, films.length); i++) {
      const affiche = films[i]?.poster_path;
      if (!affiche) continue;
      const img = new Image();
      img.src = `https://image.tmdb.org/t/p/w780${affiche}`;
    }
  }, [films, index]);

  // Bouton d'action : on rejoue l'animation de la carte plutôt que de la
  // faire disparaître d'un coup. Repli si la carte n'est pas encore montée.
  function declencher(direction) {
    if (carteRef.current) carteRef.current.flyOut(direction);
    else handleSwipe(direction);
  }

  function ouvrirConnexion() {
    setLoginModalOuvert(true);
    setMenuOuvert(false);
  }

  // Bouton retour Android : on ferme d'abord ce qui est ouvert, puis on
  // revient sur Découvrir. Si rien à fermer, false → Android quitte l'app.
  useBoutonRetour(() => {
    if (menuOuvert)         { setMenuOuvert(false);       return true; }
    if (rechercheOuverte)   { setRechercheOuverte(false); return true; }
    if (filtresOuverts)     { setFiltresOuverts(false);   return true; }
    if (loginModalOuvert)   { setLoginModalOuvert(false); return true; }
    if (showGuestPrompt)    { setShowGuestPrompt(false);  return true; }
    if (onglet !== "swipe") { setOnglet("swipe");         return true; }
    return false;
  });

  // ── Firebase Auth ────────────────────────────────────────────────────────────
  // Écoute les changements de session (connexion, déconnexion, rechargement).

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        // Utilisateur connecté → annuler tout fetch invité en cours
        fetchIdRef.current += 1;
        setFilmsCherches(false);
        setFilms([]);
        setIndex(0);
        setLoadingFilms(true);
        setLoadingUserData(true);
        setMenuOuvert(false);
      } else {
        // Déconnexion → repasser en mode invité
        setIsGuest(true);
        setUsername(null);
        setListes(LISTES_VIDES);
        setDejaSwiped([]);
        setFilms([]);
        setFilmsCherches(false);
        setIndex(0);
        setPage(1);
        setMenuOuvert(false);
        setLoadingUserData(false);
      }
      setUser(firebaseUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // ── Chargement des genres TMDB ───────────────────────────────────────────────

  useEffect(() => {
    fetch(`https://api.themoviedb.org/3/genre/movie/list?api_key=${TMDB_KEY}&language=fr-FR`)
      .then(r => r.json())
      .then(data => setGenres(data.genres || []));
  }, []);

  // ── Données utilisateur connecté ─────────────────────────────────────────────
  // Déclenché à chaque changement de `user` (connexion / rechargement).

  useEffect(() => {
    if (!user) return;
    setIsGuest(false);
    localStorage.removeItem("swochi_guest_listes");
    localStorage.removeItem("swochi_guest_swiped");

    getDoc(doc(db, "users", user.uid))
      .catch(() => afficherToast("Impossible de charger vos données. Vérifiez votre connexion."))
      .then(snap => {
        if (!snap) { setLoadingUserData(false); return; }

        const listesExistantes = snap.exists() && snap.data().listes
          ? snap.data().listes
          : LISTES_VIDES;

        const idsDejaSwiped = [
          ...listesExistantes.aVoir,
          ...listesExistantes.pasInteresse,
          ...listesExistantes.dejavu,
        ].map(f => f.id);

        setListes(listesExistantes);
        setDejaSwiped(idsDejaSwiped);
        setUsername(snap.exists() ? (snap.data().username || "") : "");

        if (snap.exists() && snap.data().username) {
          const pageRestauree = parseInt(localStorage.getItem("swochi_page") || "1", 10);
          chargerFilms(pageRestauree, idsDejaSwiped, [], filtres);
          if (!localStorage.getItem("swochi_onboarded")) setShowOnboarding(true);
        }

        setLoadingUserData(false);
      });
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Mode invité ──────────────────────────────────────────────────────────────
  // Déclenché quand isGuest passe à true ET que Firebase a confirmé qu'il n'y a pas de compte.

  useEffect(() => {
    if (!isGuest) return;
    if (loading)  return; // attendre la réponse Firebase
    if (user)     return; // Firebase a confirmé un compte → pas de mode invité

    const savedListes = JSON.parse(localStorage.getItem("swochi_guest_listes") || "null") || LISTES_VIDES;
    const savedSwiped = JSON.parse(localStorage.getItem("swochi_guest_swiped") || "[]");

    setListes(savedListes);
    setDejaSwiped(savedSwiped);
    setIndex(0);
    setFilms([]);
    setHistorique([]);
    swipesInvite.current = 0;
    const pageRestauree = parseInt(localStorage.getItem("swochi_page") || "1", 10);
    chargerFilms(pageRestauree, savedSwiped, [], filtres);
    if (!localStorage.getItem("swochi_onboarded")) setShowOnboarding(true);
  }, [isGuest, loading, user]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Chargement des films ─────────────────────────────────────────────────────

  async function fetchPage(numPage, f) {
    const data = await fetch(urlDiscover(f, numPage, TMDB_KEY)).then(r => r.json());
    return data.results ?? [];
  }

  // Récupère les recommandations TMDB basées sur un film aimé
  async function fetchRecommandations(filmId) {
    const url = `https://api.themoviedb.org/3/movie/${filmId}/recommendations?api_key=${TMDB_KEY}&language=fr-FR&page=1`;
    const data = await fetch(url).then(r => r.json());
    return data.results ?? [];
  }

  // Charge les films selon les filtres actifs. Trois régimes :
  //   • un filtre « récompenses » → on parcourt le palmarès figé (voir filtres.js) ;
  //   • aucun filtre du tout      → recommandations TMDB d'après les films aimés,
  //                                 complétées par le catalogue ;
  //   • filtres posés             → catalogue seul, sinon les recommandations
  //                                 ramèneraient des films hors critères.
  async function chargerFilms(pageDebut, swipes, filmsExistants, f) {
    fetchIdRef.current += 1;
    const monId = fetchIdRef.current;
    setLoadingFilms(true);

    try {
      const nouveaux   = [];
      const vus        = new Set(swipes);   // déjà swipés + déjà retenus ici
      let pageCourante = pageDebut;

      // Retient un film s'il n'a pas déjà été vu ou collecté dans ce chargement.
      const retenir = film => {
        if (vus.has(film.id)) return;
        vus.add(film.id);
        nouveaux.push(film);
      };

      if (aDesPrix(f)) {
        // ── Palmarès ────────────────────────────────────────────────────────
        // Vivier de 174 titres : on avance par lots jusqu'à en avoir assez
        // qui passent les autres critères, ou jusqu'à l'épuiser.
        let epuise = false, tentatives = 0;
        while (nouveaux.length < 6 && !epuise && tentatives < 8) {
          const lot = await chargerPrimes(f, pageCourante, TMDB_KEY, swipes);
          if (monId !== fetchIdRef.current) return;
          lot.films.forEach(retenir);
          epuise   = lot.epuise;
          pageCourante += 1;
          tentatives   += 1;
        }
      } else {
        // ── Étape 1 : recommandations personnalisées ──────────────────────────
        // Seulement si l'utilisateur a des films aimés et qu'aucun filtre n'est posé
        const filmsAimes = listes.aVoir;
        if (filmsAimes.length >= 2 && aucunFiltre(f)) {
          // On prend les 5 derniers films aimés (goûts les plus récents)
          const echantillon = filmsAimes.slice(-5).reverse();
          const resultats   = await Promise.all(echantillon.map(x => fetchRecommandations(x.id)));
          if (monId !== fetchIdRef.current) return;

          resultats.flat().forEach(retenir);
        }

        // ── Étape 2 : catalogue général pour compléter ────────────────────────
        let tentatives = 0;
        const MAX = 8;
        while (nouveaux.length < 6 && tentatives < MAX && pageCourante <= 490) {
          const pages = await Promise.all(
            [pageCourante, pageCourante + 1, pageCourante + 2].map(n => fetchPage(n, f))
          );
          pages.flat().forEach(retenir);
          pageCourante += 3;
          tentatives++;
          if (monId !== fetchIdRef.current) return;
        }
      }

      setFilms([...filmsExistants, ...nouveaux]);
      setPage(pageCourante);
      setFilmsCherches(true);
      localStorage.setItem("swochi_page", String(pageCourante));
    } catch (e) {
      console.error("Erreur chargement films:", e);
      afficherToast("Impossible de charger les films. Vérifiez votre connexion.");
    } finally {
      if (monId === fetchIdRef.current) setLoadingFilms(false);
    }
  }

  // ── Sauvegarde Firestore ─────────────────────────────────────────────────────

  async function saveListes(newListes) {
    if (!user || isGuest) return;
    try {
      await updateDoc(doc(db, "users", user.uid), { listes: newListes });
    } catch (e) {
      console.error("Erreur sauvegarde:", e);
      afficherToast("Sauvegarde échouée — vérifiez votre connexion.");
    }
  }

  // Sauvegarde locale pour les invités (localStorage) + Firestore pour les comptes.
  function sauvegarderListes(newListes, newSwiped) {
    saveListes(newListes);
    if (isGuest) {
      localStorage.setItem("swochi_guest_listes", JSON.stringify(newListes));
      localStorage.setItem("swochi_guest_swiped", JSON.stringify(newSwiped ?? dejaSwiped));
    }
  }

  // ── Choix du pseudo (1ère connexion) ────────────────────────────────────────

  async function handleChoisirUsername() {
    setUsernameError("");
    const pseudo = usernameInput.trim().toLowerCase().replace(/\s+/g, "_");
    if (pseudo.length < 3)               return setUsernameError("Minimum 3 caractères.");
    if (pseudo.length > 30)              return setUsernameError("Maximum 30 caractères.");
    if (!/^[a-z0-9_]+$/.test(pseudo))   return setUsernameError("Lettres, chiffres et _ uniquement.");

    try {
      await runTransaction(db, async (tx) => {
        const usernameRef  = doc(db, "usernames", pseudo);
        const usernameSnap = await tx.get(usernameRef);
        if (usernameSnap.exists()) throw new Error("Ce pseudo est déjà pris.");
        tx.set(usernameRef, { uid: user.uid });
        tx.set(doc(db, "users", user.uid), {
          email: user.email,
          username: pseudo,
          listes: LISTES_VIDES,
        });
      });
      setUsername(pseudo);
      chargerFilms(1, [], [], filtres);
      if (!localStorage.getItem("swochi_onboarded")) setShowOnboarding(true);
    } catch (e) {
      setUsernameError(e.message || "Une erreur est survenue, réessayez.");
    }
  }

  // ── Actions de swipe ─────────────────────────────────────────────────────────

  function handleSwipe(direction) {
    const film = films[index];

    // Mettre à jour la liste correspondante
    const newListes = { ...listes };
    if (direction === "right") newListes.aVoir        = [...listes.aVoir, film];
    if (direction === "left")  newListes.pasInteresse = [...listes.pasInteresse, film];
    if (direction === "up")    newListes.dejavu        = [...listes.dejavu, film];

    const newSwiped = [...dejaSwiped, film.id];
    setListes(newListes);
    setDejaSwiped(newSwiped);
    setIndex(i => i + 1);
    setHistorique(h => [...h, { film, direction }]);
    sauvegarderListes(newListes, newSwiped);

    // Prompt de création de compte après 10 swipes invité
    if (isGuest) {
      swipesInvite.current += 1;
      if (swipesInvite.current === 10) setShowGuestPrompt(true);
    }

    // Charger plus de films en avance quand il en reste peu
    const nextIndex = index + 1;
    if (nextIndex >= films.length - 15 && !loadingFilms) {
      // `page` pointe déjà sur la prochaine page non lue : y ajouter 1 en sautait une.
      chargerFilms(page, newSwiped, [...films], filtres);
    }
  }

  function handleRetour() {
    if (historique.length === 0) return;
    const { film, direction } = historique[historique.length - 1];

    const newListes = { ...listes };
    if (direction === "right") newListes.aVoir        = listes.aVoir.filter(f => f.id !== film.id);
    if (direction === "left")  newListes.pasInteresse = listes.pasInteresse.filter(f => f.id !== film.id);
    if (direction === "up")    newListes.dejavu        = listes.dejavu.filter(f => f.id !== film.id);

    const newSwiped = dejaSwiped.filter(id => id !== film.id);
    setListes(newListes);
    setDejaSwiped(newSwiped);
    setIndex(i => i - 1);
    setHistorique(h => h.slice(0, -1));
    sauvegarderListes(newListes, newSwiped);
  }

  // Déplace un film d'une liste à une autre (depuis "Mes films")
  async function handleDeplacer(film, de, vers) {
    const newListes = {
      ...listes,
      [de]:   listes[de].filter(f => f.id !== film.id),
      [vers]: [...listes[vers], film],
    };
    setListes(newListes);
    await saveListes(newListes);
  }

  // Supprime un film d'une liste (depuis "Mes films")
  async function handleSupprimer(film, de) {
    const newListes = { ...listes, [de]: listes[de].filter(f => f.id !== film.id) };
    setListes(newListes);
    setDejaSwiped(d => d.filter(id => id !== film.id));
    await saveListes(newListes);
  }

  // Ajoute un film depuis la recherche (sans swipe)
  function ajouterFilmDansListe(film, liste) {
    if (dejaSwiped.includes(film.id)) return;
    const newSwiped = [...dejaSwiped, film.id];
    const newListes = { ...listes, [liste]: [...listes[liste], film] };
    setListes(newListes);
    setDejaSwiped(newSwiped);
    sauvegarderListes(newListes, newSwiped);
  }

  // ── Filtres ─────────────────────────────────────────────────────────────────

  // Repart de zéro : les filtres changent le vivier, pas l'ordre d'une liste
  // déjà chargée. Rien à faire si les critères sont identiques.
  function appliquerFiltres(nouveaux) {
    setFiltresOuverts(false);
    if (memesFiltres(nouveaux, filtres)) return;
    setFiltres(nouveaux);
    ecrireFiltres(nouveaux);
    setIndex(0);
    setPage(1);
    setFilms([]);
    setHistorique([]);
    localStorage.removeItem("swochi_page");
    chargerFilms(1, dejaSwiped, [], nouveaux);
  }

  // Bandeau de genres : une pastille bascule le genre sans ouvrir le panneau.
  function basculerGenre(id) {
    const liste = filtres.genres;
    appliquerFiltres({
      ...filtres,
      genres: id === "" ? []
            : liste.includes(id) ? liste.filter(g => g !== id)
            : [...liste, id],
    });
  }

  // ── Écrans spéciaux (avant le rendu principal) ───────────────────────────────

  // Splash : auth en cours ou chargement des données utilisateur
  if (loading || loadingUserData) return <SplashScreen />;

  // Choix du pseudo : utilisateur connecté mais sans pseudo encore
  if (user && (username === "" || username === null)) return (
    <EcranPseudo
      usernameInput={usernameInput}
      setUsernameInput={setUsernameInput}
      usernameError={usernameError}
      onConfirmer={handleChoisirUsername}
    />
  );

  // ── Rendu principal ──────────────────────────────────────────────────────────

  const filmActuel  = films[index];
  const filmSuivant = films[index + 1];

  return (
    <div className={`no-select app-shell${onglet === "swipe" ? " app-shell--swipe" : ""}`}>

      {/* Fond ambiant : poster du film courant, très flouté */}
      {filmActuel && (
        <div aria-hidden="true" style={{
          position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none",
          backgroundImage: `url(https://image.tmdb.org/t/p/w500${filmActuel.poster_path})`,
          backgroundSize: "cover", backgroundPosition: "center",
          filter: "blur(60px) saturate(1.4)",
          opacity: 0.07, transform: "scale(1.15)",
        }} />
      )}

      {/* ── Overlays ── */}
      {loginModalOuvert && (
        <Login
          onLogin={() => setLoginModalOuvert(false)}
          onGuest={() => setLoginModalOuvert(false)}
          onFermer={() => setLoginModalOuvert(false)}
        />
      )}
      {rechercheOuverte && (
        <Recherche
          onFermer={() => setRechercheOuverte(false)}
          listes={listes}
          dejaSwiped={dejaSwiped}
          onAVoir={f => ajouterFilmDansListe(f, "aVoir")}
          onPasInteresse={f => ajouterFilmDansListe(f, "pasInteresse")}
          onDejaVu={f => ajouterFilmDansListe(f, "dejavu")}
        />
      )}
      {filtresOuverts && (
        <PanneauFiltres
          filtres={filtres}
          genres={genres}
          onAppliquer={appliquerFiltres}
          onFermer={() => setFiltresOuverts(false)}
        />
      )}
      {showOnboarding && <Onboarding onTerminer={() => setShowOnboarding(false)} />}
      {showGuestPrompt && (
        <PromptInvite
          onSeConnecter={() => { setShowGuestPrompt(false); ouvrirConnexion(); }}
          onFermer={() => setShowGuestPrompt(false)}
        />
      )}

      {/* Menu burger mobile */}
      <MenuBurger
        ouvert={menuOuvert}
        onFermer={() => setMenuOuvert(false)}
        onglet={onglet}
        onOnglet={setOnglet}
        isGuest={isGuest}
        onSeConnecter={ouvrirConnexion}
      />

      {/* ── Sidebar desktop ── */}
      <aside className="sidebar">
        <button className="sidebar-logo" onClick={() => setOnglet("swipe")} aria-label="Accueil">
          <Logo hauteur={30} />
        </button>

        {NAV_ITEMS.map(({ key, label }) => {
          const Icone = ICONES_NAV[key];
          return (
          <button
            key={key}
            onClick={() => setOnglet(key)}
            className={`sidebar-nav-item${onglet === key ? " active" : ""}`}
            aria-current={onglet === key ? "page" : undefined}
          >
            {Icone && <Icone taille={18} />}
            {label}
          </button>
          );
        })}

        <div className="sidebar-divider" />

        <div className="sidebar-bottom">
          <button
            onClick={() => setRechercheOuverte(true)}
            aria-label="Rechercher un film"
            style={{
              display: "flex", alignItems: "center", gap: "8px",
              width: "100%", padding: "10px 14px", borderRadius: "var(--r-sm)",
              background: "var(--accent-doux)", border: "1.5px solid rgb(var(--accent-rvb) / 0.25)",
              color: "var(--accent-txt)", fontSize: "var(--t-sm)", fontWeight: "600",
              cursor: "pointer", fontFamily: "inherit",
            }}
          >
            <IconeRecherche taille={16} />
            Rechercher
          </button>
          <button onClick={toggleTheme} className="sidebar-nav-item" aria-label="Changer le thème">
            {theme === "dark" ? <IconeSoleil taille={18} /> : <IconeLune taille={18} />}
            {theme === "dark" ? "Mode clair" : "Mode sombre"}
          </button>
          {!isGuest && (
            <button onClick={() => signOut(auth)} className="sidebar-nav-item" style={{ color: "var(--red-txt)" }}>
              <IconeFleche vers="gauche" taille={18} />
              Se déconnecter
            </button>
          )}
        </div>
      </aside>

      {/* ── Zone principale ── */}
      <div className="desktop-wrapper">

        {/* Header mobile */}
        <header className="top-section">
          <div className="header-row" style={{ display: "flex", alignItems: "center", gap: "10px", position: "relative" }}>
            {onglet === "swipe" ? (
              <>
                {/* Logo seul à gauche + barre de recherche */}
                <button onClick={() => setOnglet("swipe")} aria-label="Accueil"
                  style={{ background: "none", border: "none", cursor: "pointer", padding: 0, flexShrink: 0,
                           display: "flex", alignItems: "center", justifyContent: "center",
                           minHeight: "var(--touch)", minWidth: "var(--touch)" }}>
                  <img src="/logo_swochi.svg" alt="Swochi" style={{ height: "30px" }} />
                </button>
                <button onClick={() => setRechercheOuverte(true)} aria-label="Rechercher un film"
                  style={{
                    flex: 1, display: "flex", alignItems: "center", gap: "8px",
                    background: "var(--surface-2)", border: "1.5px solid var(--border-2)",
                    borderRadius: "var(--r-sm)", padding: "0 13px", cursor: "pointer",
                    minHeight: "var(--touch)",
                    color: "var(--text-3)", fontSize: "var(--t-sm)", fontFamily: "inherit",
                  }}>
                  <IconeRecherche taille={16} />
                  <span style={{ flex: 1 }}>Rechercher un film…</span>
                </button>
              </>
            ) : (
              <>
                {/* Logo + nom centré sur l'écran */}
                <button onClick={() => setOnglet("swipe")} aria-label="Accueil"
                  style={{ background: "none", border: "none", cursor: "pointer", padding: "0 8px",
                           display: "flex", alignItems: "center", minHeight: "var(--touch)",
                           position: "absolute", left: "50%", top: "50%", transform: "translate(-50%, -50%)" }}>
                  <Logo hauteur={30} />
                </button>
                <div style={{ flex: 1 }} />
              </>
            )}
            {/* Bouton burger — toujours à droite */}
            <BurgerButton onClick={() => setMenuOuvert(true)} />
          </div>

          {/* Bannière invité mobile */}
          {isGuest && (
            <div className="mobile-only" style={{
              background: "var(--accent-doux)", borderRadius: "var(--r-sm)",
              margin: "8px 0 10px", padding: "8px 14px",
              display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px",
            }}>
              <p style={{ margin: 0, fontSize: "var(--t-xs)", color: "var(--accent-txt)", fontWeight: "500", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                Invité · sauvegarde locale
              </p>
              <button onClick={ouvrirConnexion} style={{
                background: "none", border: "1px solid var(--accent-txt)", color: "var(--accent-txt)",
                borderRadius: "var(--r-lg)", padding: "0 14px", fontSize: "var(--t-xs)",
                fontWeight: "600", cursor: "pointer", flexShrink: 0, minHeight: "44px",
              }}>Se connecter</button>
            </div>
          )}

          {/* Genres (uniquement sur l'onglet découvrir) */}
          {onglet === "swipe" && (
            <div className="genres-row">
              <GenreScroll genres={genres} genresChoisis={filtres.genres} onBasculer={basculerGenre} />
            </div>
          )}
        </header>

        {/* Contenu — animation au changement d'onglet */}
        <main key={onglet} style={{ animation: "tabFadeIn 0.18s ease" }}>

          {onglet === "swipe" && (
            <div className="swipe-section">

              {/* Bloc "Se connecter" invité (desktop, coin haut-gauche) */}
              {isGuest && (
                <div className="guest-connect-block">
                  <span style={{ fontSize: "var(--t-2xl)" }}>👤</span>
                  <p style={{ margin: 0, fontSize: "var(--t-sm)", fontWeight: "700", color: "var(--text)" }}>Mode invité</p>
                  <p style={{ margin: 0, fontSize: "var(--t-xs)", color: "var(--text)", lineHeight: 1.5, textAlign: "center", opacity: 0.85 }}>
                    Sauvegarde tes swipes et retrouve tes amis.
                  </p>
                  <button onClick={ouvrirConnexion} style={{
                    marginTop: "4px", background: "var(--accent)", color: "#fff",
                    border: "none", borderRadius: "var(--r-lg)", padding: "9px 18px",
                    fontSize: "var(--t-sm)", fontWeight: "700", cursor: "pointer",
                    width: "100%", boxShadow: "0 2px 10px rgb(var(--accent-rvb) / 0.4)",
                  }}>Se connecter</button>
                </div>
              )}

              {/* Carte à swiper */}
              <div className="swipe-center">
                <div className="card-container" style={{ zIndex: 1 }}>
                  {filmSuivant && <MovieCard key={filmSuivant.id + "-bg"} film={filmSuivant} onSwipe={() => {}} isTop={false} />}
                  {filmActuel   && <MovieCard key={filmActuel.id} ref={carteRef} film={filmActuel}  onSwipe={handleSwipe}  isTop={true} />}
                  {!filmActuel && loadingFilms  && <Spinner />}
                  {!filmActuel && !loadingFilms && filmsCherches && (
                    <EcranVide
                      nbFiltres={nbFiltresActifs(filtres)}
                      onEffacerFiltres={() => appliquerFiltres(FILTRES_DEFAUT)}
                      onRelancer={() => { setIndex(0); setFilms([]); localStorage.removeItem("swochi_page"); chargerFilms(1, dejaSwiped, [], filtres); }}
                    />
                  )}
                </div>

                {/* Boutons d'action sous la carte (mobile) */}
                {filmActuel && (
                  <div className="swipe-actions-mobile" style={{ zIndex: 1, marginTop: "14px", width: "100%" }}>
                    <div className="actions-row">
                      <BoutonFiltres nb={nbFiltresActifs(filtres)} onClick={() => setFiltresOuverts(true)} />
                      <button onClick={() => declencher("left")}  aria-label="Passer"  className="action-btn action-btn--pass"><IconeCroix taille={26} /></button>
                      <button onClick={() => declencher("up")}    aria-label="Déjà vu" className="action-btn action-btn--seen"><IconeOeil taille={21} /></button>
                      <button onClick={() => declencher("right")} aria-label="À voir"  className="action-btn action-btn--like"><IconeCoeur taille={30} /></button>
                      <button
                        onClick={() => { vibrer("leger"); handleRetour(); }}
                        disabled={historique.length === 0}
                        aria-label="Annuler le dernier swipe"
                        className="action-btn action-btn--undo"
                      ><IconeRetour taille={18} /></button>
                    </div>
                  </div>
                )}
              </div>

              {/* Genres (desktop, sidebar droite) */}
              <aside className="genres-sidebar">
                <button onClick={() => basculerGenre("")} className={`genre-sidebar-item${filtres.genres.length === 0 ? " active" : ""}`}>
                  Tous
                </button>
                {genres.map(g => (
                  <button
                    key={g.id}
                    onClick={() => basculerGenre(String(g.id))}
                    aria-pressed={filtres.genres.includes(String(g.id))}
                    className={`genre-sidebar-item${filtres.genres.includes(String(g.id)) ? " active" : ""}`}
                  >
                    {g.name}
                  </button>
                ))}
              </aside>
            </div>
          )}

          {onglet === "match" && (
            <div className="onglet-content">
              <ErrorBoundary>
                <Match user={user} username={username} listesUser={listes} isGuest={isGuest} onSeConnecter={ouvrirConnexion} />
              </ErrorBoundary>
            </div>
          )}

          {onglet === "mesfilms" && (
            <div className="onglet-content">
              <ErrorBoundary>
                <MesFilms listes={listes} onDeplacer={handleDeplacer} onSupprimer={handleSupprimer} isGuest={isGuest} />
              </ErrorBoundary>
            </div>
          )}

          {onglet === "profil" && (
            <div className="onglet-content">
              <ErrorBoundary>
                <Profil username={username} user={user} listes={listes} genres={genres} isGuest={isGuest} onSeConnecter={ouvrirConnexion} />
              </ErrorBoundary>
            </div>
          )}
        </main>
      </div>

      {/* Toast (notifications) */}
      {toast && (
        <div
          role="alert"
          aria-live="assertive"
          onClick={() => setToast(null)}
          style={{
            position: "fixed", bottom: "calc(24px + env(safe-area-inset-bottom))",
            left: "50%", transform: "translateX(-50%)",
            background: toast.type === "error" ? "var(--red)" : "var(--green)",
            color: "white", borderRadius: "var(--r-md)", padding: "12px 22px",
            fontSize: "var(--t-sm)", fontWeight: "500", boxShadow: "var(--shadow-lg)",
            zIndex: 1000, cursor: "pointer", maxWidth: "88vw", textAlign: "center",
            animation: "apparaitre 0.2s ease-out",
          }}
        >
          {toast.message}
        </div>
      )}
    </div>
  );
}

// ─── Petits composants ────────────────────────────────────────────────────────

// Spinner de chargement affiché pendant le fetch des films
function Spinner() {
  return (
    <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "14px" }}>
      <div style={{ width: "36px", height: "36px", border: "3px solid var(--border-2)", borderTopColor: "var(--accent)", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
      <p role="status" style={{ color: "var(--text-4)", fontSize: "var(--t-sm)", margin: 0 }}>Chargement…</p>
    </div>
  );
}

// Affiché quand il n'y a plus de films à swiper. Avec des filtres posés, le
// vivier est souvent vide parce qu'ils sont trop serrés, pas parce qu'on a
// tout vu : proposer « Recharger » enverrait alors dans le mur.
function EcranVide({ onRelancer, nbFiltres, onEffacerFiltres }) {
  const filtre = nbFiltres > 0;
  return (
    <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "16px", padding: "24px", textAlign: "center" }}>
      <div style={{ fontSize: "52px" }}>{filtre ? "🎯" : "🎬"}</div>
      <p style={{ margin: 0, fontSize: "var(--t-md)", fontWeight: "700", color: "var(--text)" }}>
        {filtre ? "Plus rien avec ces filtres" : "Tu as tout vu !"}
      </p>
      <p style={{ margin: 0, fontSize: "var(--t-sm)", color: "var(--text-3)", lineHeight: 1.6 }}>
        {filtre
          ? `${nbFiltres} critère${nbFiltres > 1 ? "s" : ""} en cours. Élargis-les pour retrouver des films à découvrir.`
          : "Impressionnant. Essaie un autre genre ou recharge pour découvrir de nouveaux films."}
      </p>
      <button onClick={filtre ? onEffacerFiltres : onRelancer} style={{
        marginTop: "4px", background: "var(--accent)", color: "white",
        border: "none", borderRadius: "var(--r-pill)", padding: "12px 28px",
        fontSize: "var(--t-sm)", fontWeight: "700", cursor: "pointer",
        boxShadow: "0 4px 16px rgb(var(--accent-rvb) / 0.35)",
      }}>{filtre ? "Effacer les filtres" : "Recharger"}</button>
    </div>
  );
}

// Popup invité affiché après 10 swipes pour inciter à créer un compte
function PromptInvite({ onSeConnecter, onFermer }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", zIndex: 500, display: "flex", alignItems: "center", justifyContent: "center", padding: "24px" }}>
      <div style={{
        background: "var(--surface)", borderRadius: "var(--r-xl)", padding: "36px 28px",
        maxWidth: "320px", width: "100%", textAlign: "center",
        display: "flex", flexDirection: "column", gap: "16px",
        boxShadow: "var(--shadow-lg)", border: "1px solid var(--border)",
        animation: "slideUp 0.25s ease-out",
      }}>
        <span style={{ fontSize: "44px" }}>🎬</span>
        <h2 style={{ margin: 0, fontSize: "var(--t-xl)", color: "var(--text)" }}>Tu kiffes Swochi ?</h2>
        <p style={{ color: "var(--text-3)", fontSize: "var(--t-sm)", margin: 0, lineHeight: 1.6 }}>
          Crée un compte gratuit pour sauvegarder tes swipes, faire des listes et comparer avec tes amis.
        </p>
        <button onClick={onSeConnecter} style={{
          background: "var(--accent)", color: "white", border: "none",
          borderRadius: "var(--r-pill)", padding: "14px", fontSize: "var(--t-md)",
          fontWeight: "700", cursor: "pointer", boxShadow: "0 4px 16px rgb(var(--accent-rvb) / 0.35)",
        }}>Créer un compte</button>
        <button onClick={onFermer} style={{ background: "none", border: "none", color: "var(--text-3)", fontSize: "var(--t-sm)", cursor: "pointer" }}>
          Continuer sans compte
        </button>
      </div>
    </div>
  );
}

// Écran de choix du pseudo (1ère connexion)
function EcranPseudo({ usernameInput, setUsernameInput, usernameError, onConfirmer }) {
  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "var(--text)", padding: "20px" }}>
      <span style={{ marginBottom: "6px" }}><Logo hauteur={32} /></span>
      <p style={{ color: "var(--text-3)", marginBottom: "32px", fontSize: "var(--t-sm)" }}>Dernière étape ✨</p>
      <div style={{
        background: "var(--surface)", borderRadius: "var(--r-lg)", padding: "32px",
        width: "100%", maxWidth: "300px", display: "flex", flexDirection: "column", gap: "16px",
        boxShadow: "var(--shadow-md)", border: "1px solid var(--border)",
      }}>
        <h2 style={{ margin: 0, fontSize: "var(--t-lg)", color: "var(--text)" }}>Choisis ton pseudo</h2>
        <p style={{ margin: 0, color: "var(--text-3)", fontSize: "var(--t-sm)", lineHeight: 1.6 }}>
          Tes amis l'utiliseront pour t'ajouter et comparer vos listes de films.
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          <label htmlFor="username-input" style={{ fontSize: "var(--t-sm)", color: "var(--text-3)" }}>Ton pseudo</label>
          <input
            id="username-input"
            type="text"
            placeholder="ex: cinemafan42"
            value={usernameInput}
            onChange={e => setUsernameInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && onConfirmer()}
            style={inputStyle}
          />
        </div>
        {usernameError && (
          <p role="alert" style={{ color: "var(--red-txt)", fontSize: "var(--t-sm)", margin: 0 }}>{usernameError}</p>
        )}
        <button onClick={onConfirmer} style={{
          background: "var(--green)", color: "white", border: "none",
          borderRadius: "var(--r-pill)", padding: "14px", fontSize: "var(--t-md)",
          fontWeight: "700", cursor: "pointer", boxShadow: "0 4px 14px rgba(34,197,94,0.35)",
        }}>Confirmer</button>
      </div>
    </div>
  );
}

// Icône hamburger (3 lignes)
function BurgerButton({ onClick }) {
  return (
    <button onClick={onClick} aria-label="Menu" style={{
      background: "var(--surface-2)", border: "1px solid var(--border)",
      color: "var(--text-2)", borderRadius: "var(--r-sm)", padding: 0,
      cursor: "pointer", display: "flex", flexDirection: "column", gap: "5px", flexShrink: 0,
      alignItems: "center", justifyContent: "center",
      minWidth: "var(--touch)", minHeight: "var(--touch)",
    }}>
      {[0, 1, 2].map(i => (
        <span key={i} style={{ display: "block", width: "18px", height: "2px", background: "var(--text-2)", borderRadius: "2px" }} />
      ))}
    </button>
  );
}

// ─── Styles partagés ──────────────────────────────────────────────────────────

const inputStyle = {
  background: "var(--input-bg)", border: "1px solid var(--input-border)",
  borderRadius: "var(--r-sm)", padding: "13px 14px",
  color: "var(--text)", fontSize: "var(--t-md)", outline: "none",
};

export default App;
