import { useEffect, useState, useRef } from "react";
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

// ─── Constantes ──────────────────────────────────────────────────────────────

const TMDB_KEY = process.env.REACT_APP_TMDB_KEY;

const NAV_ITEMS = [
  { key: "swipe",    emoji: "🍿", label: "Découvrir" },
  { key: "match",    emoji: "🤝", label: "Amis"      },
  { key: "mesfilms", emoji: "🎬", label: "Mes films" },
  { key: "profil",   emoji: "👤", label: "Profil"    },
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
  const [genreChoisi, setGenreChoisi]     = useState("");
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
  const [loginModalOuvert, setLoginModalOuvert] = useState(false);
  const [showOnboarding, setShowOnboarding]     = useState(false);
  const [showGuestPrompt, setShowGuestPrompt]   = useState(false);
  const [toast, setToast]                 = useState(null);

  // Refs (pas de re-render nécessaire)
  const fetchIdRef   = useRef(0);   // annule les fetchs obsolètes
  const swipesInvite = useRef(0);   // compte les swipes en mode invité
  const toastTimer   = useRef(null);

  // ── Utilitaires ─────────────────────────────────────────────────────────────

  function afficherToast(message, type = "error") {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ message, type });
    toastTimer.current = setTimeout(() => setToast(null), 4000);
  }

  function ouvrirConnexion() {
    setLoginModalOuvert(true);
    setMenuOuvert(false);
  }

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
          chargerFilms(1, idsDejaSwiped, [], "");
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
    chargerFilms(1, savedSwiped, [], "");
    if (!localStorage.getItem("swochi_onboarded")) setShowOnboarding(true);
  }, [isGuest, loading, user]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Chargement des films ─────────────────────────────────────────────────────

  async function fetchPage(numPage, genre) {
    const genreParam = genre ? `&with_genres=${genre}` : "";
    const url = `https://api.themoviedb.org/3/discover/movie?api_key=${TMDB_KEY}&language=fr-FR&sort_by=popularity.desc&vote_count.gte=100&page=${numPage}${genreParam}`;
    const data = await fetch(url).then(r => r.json());
    return data.results ?? [];
  }

  // Charge les films en sautant ceux déjà swipés. Annulable via fetchIdRef.
  async function chargerFilms(pageDebut, swipes, filmsExistants, genre) {
    fetchIdRef.current += 1;
    const monId = fetchIdRef.current;
    setLoadingFilms(true);

    try {
      let nouveaux    = [];
      let pageCourante = pageDebut;
      let tentatives   = 0;
      const MAX = 8; // cherche jusqu'à 24 pages si tout est déjà vu

      while (nouveaux.length < 6 && tentatives < MAX && pageCourante <= 490) {
        const pages = await Promise.all(
          [pageCourante, pageCourante + 1, pageCourante + 2].map(n => fetchPage(n, genre))
        );
        nouveaux = [...nouveaux, ...pages.flat().filter(f => !swipes.includes(f.id))];
        pageCourante += 3;
        tentatives++;
        if (monId !== fetchIdRef.current) return; // annulé par un fetch plus récent
      }

      setFilms([...filmsExistants, ...nouveaux]);
      setPage(pageCourante);
      setFilmsCherches(true);
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
      chargerFilms(1, [], [], "");
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
      chargerFilms(page + 1, newSwiped, [...films], genreChoisi);
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

  function handleGenreChange(genre) {
    setGenreChoisi(genre);
    setIndex(0);
    setPage(1);
    setFilms([]);
    chargerFilms(1, dejaSwiped, [], genre);
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
    <div className="no-select app-shell">

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
          <img src="/logo_swochi_nom.svg" alt="Swochi" style={{ width: "130px", height: "auto" }} />
        </button>

        {NAV_ITEMS.map(({ key, emoji, label }) => (
          <button
            key={key}
            onClick={() => setOnglet(key)}
            className={`sidebar-nav-item${onglet === key ? " active" : ""}`}
            aria-current={onglet === key ? "page" : undefined}
          >
            <span style={{ fontSize: "16px" }}>{emoji}</span>
            {label}
          </button>
        ))}

        <div className="sidebar-divider" />

        <div className="sidebar-bottom">
          <button
            onClick={() => setRechercheOuverte(true)}
            aria-label="Rechercher un film"
            style={{
              display: "flex", alignItems: "center", gap: "8px",
              width: "100%", padding: "10px 14px", borderRadius: "12px",
              background: "var(--purple-dim)", border: "1.5px solid rgba(29,99,205,0.25)",
              color: "var(--purple)", fontSize: "13px", fontWeight: "600",
              cursor: "pointer", fontFamily: "inherit",
            }}
          >
            <span style={{ fontSize: "15px" }}>🔍</span>
            Rechercher
          </button>
          <button onClick={toggleTheme} className="sidebar-nav-item" aria-label="Changer le thème">
            <span style={{ fontSize: "16px" }}>{theme === "dark" ? "☀️" : "🌙"}</span>
            {theme === "dark" ? "Mode clair" : "Mode sombre"}
          </button>
          {!isGuest && (
            <button onClick={() => signOut(auth)} className="sidebar-nav-item" style={{ color: "var(--red)" }}>
              <span style={{ fontSize: "15px" }}>↩</span>
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
                  style={{ background: "none", border: "none", cursor: "pointer", padding: "4px 0 0", flexShrink: 0 }}>
                  <img src="/logo_swochi.svg" alt="Swochi" style={{ height: "40px" }} />
                </button>
                <button onClick={() => setRechercheOuverte(true)} aria-label="Rechercher un film"
                  style={{
                    flex: 1, display: "flex", alignItems: "center", gap: "8px",
                    background: "var(--surface-2)", border: "1.5px solid var(--border-2)",
                    borderRadius: "12px", padding: "9px 14px", cursor: "pointer",
                    color: "var(--text-3)", fontSize: "14px", fontFamily: "inherit",
                  }}>
                  <span style={{ fontSize: "15px" }}>🔍</span>
                  <span style={{ flex: 1 }}>Rechercher un film…</span>
                </button>
              </>
            ) : (
              <>
                {/* Logo + nom centré sur l'écran */}
                <button onClick={() => setOnglet("swipe")} aria-label="Accueil"
                  style={{ background: "none", border: "none", cursor: "pointer", padding: 0, position: "absolute", left: "50%", transform: "translateX(-50%) translateY(4px)" }}>
                  <img src="/logo_swochi_nom.svg" alt="Swochi" style={{ height: "38px" }} />
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
              background: "var(--purple-dim)", borderRadius: "10px",
              margin: "8px 0 10px", padding: "8px 14px",
              display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px",
            }}>
              <p style={{ margin: 0, fontSize: "12px", color: "var(--purple)", fontWeight: "500" }}>
                Mode invité · swipes sauvegardés localement
              </p>
              <button onClick={ouvrirConnexion} style={{
                background: "none", border: "1px solid var(--purple)", color: "var(--purple)",
                borderRadius: "20px", padding: "4px 12px", fontSize: "12px",
                fontWeight: "600", cursor: "pointer", flexShrink: 0,
              }}>Se connecter</button>
            </div>
          )}

          {/* Genres (uniquement sur l'onglet découvrir) */}
          {onglet === "swipe" && (
            <div className="genres-row">
              <GenreScroll genres={genres} genreChoisi={genreChoisi} onGenreChange={handleGenreChange} />
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
                  <span style={{ fontSize: "28px" }}>👤</span>
                  <p style={{ margin: 0, fontSize: "14px", fontWeight: "700", color: "var(--text)" }}>Mode invité</p>
                  <p style={{ margin: 0, fontSize: "12px", color: "var(--text)", lineHeight: 1.5, textAlign: "center", opacity: 0.85 }}>
                    Sauvegarde tes swipes et retrouve tes amis.
                  </p>
                  <button onClick={ouvrirConnexion} style={{
                    marginTop: "4px", background: "var(--purple)", color: "#fff",
                    border: "none", borderRadius: "20px", padding: "9px 18px",
                    fontSize: "13px", fontWeight: "700", cursor: "pointer",
                    width: "100%", boxShadow: "0 2px 10px rgba(29,99,205,0.4)",
                  }}>Se connecter</button>
                </div>
              )}

              {/* Carte à swiper */}
              <div className="swipe-center">
                <div className="card-container" style={{ zIndex: 1 }}>
                  {filmSuivant && <MovieCard key={filmSuivant.id + "-bg"} film={filmSuivant} onSwipe={() => {}} isTop={false} />}
                  {filmActuel   && <MovieCard key={filmActuel.id}         film={filmActuel}  onSwipe={handleSwipe}  isTop={true} />}
                  {!filmActuel && loadingFilms  && <Spinner />}
                  {!filmActuel && !loadingFilms && filmsCherches && (
                    <EcranVide onRelancer={() => { setIndex(0); setFilms([]); chargerFilms(page, dejaSwiped, [], genreChoisi); }} />
                  )}
                </div>

                {/* Boutons d'action sous la carte (mobile) */}
                {filmActuel && (
                  <div className="swipe-actions-mobile" style={{ zIndex: 1, marginTop: "16px", width: "100%" }}>
                    <p style={{
                      margin: "0 0 12px", fontSize: "14px", fontWeight: "600", color: "var(--text-2)",
                      textAlign: "center", maxWidth: "260px", whiteSpace: "nowrap",
                      overflow: "hidden", textOverflow: "ellipsis",
                    }}>
                      {filmActuel.title}
                      {filmActuel.release_date && (
                        <span style={{ color: "var(--text-4)", fontWeight: "400", marginLeft: "6px", fontSize: "12px" }}>
                          {filmActuel.release_date.slice(0, 4)}
                        </span>
                      )}
                    </p>
                    <div style={{ position: "relative", width: "100%", maxWidth: "320px", display: "flex", justifyContent: "center", alignItems: "center" }}>
                      <div style={{ display: "flex", gap: "20px", alignItems: "center" }}>
                        <button onClick={() => handleSwipe("left")}  aria-label="Passer"  style={btnStyle("var(--red)")}>✕</button>
                        <button onClick={() => handleSwipe("up")}    aria-label="Déjà vu" style={{ ...btnStyle("var(--blue)"), width: "48px", height: "48px", fontSize: "18px" }}>👁</button>
                        <button onClick={() => handleSwipe("right")} aria-label="À voir"  style={btnStyle("var(--green)")}>♥</button>
                      </div>
                      <button
                        onClick={handleRetour}
                        disabled={historique.length === 0}
                        aria-label="Annuler le dernier swipe"
                        style={{
                          position: "absolute", right: 0,
                          background: "transparent",
                          border: `2px solid ${historique.length > 0 ? "var(--amber)" : "var(--text-5)"}`,
                          color: historique.length > 0 ? "var(--amber)" : "var(--text-5)",
                          borderRadius: "50%", width: "36px", height: "36px",
                          fontSize: "15px", cursor: historique.length > 0 ? "pointer" : "default",
                          display: "flex", alignItems: "center", justifyContent: "center",
                        }}
                      >↩</button>
                    </div>
                  </div>
                )}
              </div>

              {/* Genres (desktop, sidebar droite) */}
              <aside className="genres-sidebar">
                <button onClick={() => handleGenreChange("")} className={`genre-sidebar-item${genreChoisi === "" ? " active" : ""}`}>
                  Tous
                </button>
                {genres.map(g => (
                  <button
                    key={g.id}
                    onClick={() => handleGenreChange(g.id)}
                    className={`genre-sidebar-item${genreChoisi === g.id ? " active" : ""}`}
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
                <Profil username={username} user={user} listes={listes} isGuest={isGuest} onSeConnecter={ouvrirConnexion} />
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
            position: "fixed", bottom: "24px", left: "50%", transform: "translateX(-50%)",
            background: toast.type === "error" ? "var(--red)" : "var(--green)",
            color: "white", borderRadius: "14px", padding: "12px 22px",
            fontSize: "14px", fontWeight: "500", boxShadow: "var(--shadow-lg)",
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
      <div style={{ width: "36px", height: "36px", border: "3px solid var(--border-2)", borderTopColor: "var(--purple)", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
      <p role="status" style={{ color: "var(--text-4)", fontSize: "13px", margin: 0 }}>Chargement…</p>
    </div>
  );
}

// Affiché quand il n'y a plus de films à swiper
function EcranVide({ onRelancer }) {
  return (
    <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "16px", padding: "24px", textAlign: "center" }}>
      <div style={{ fontSize: "52px" }}>🎬</div>
      <p style={{ margin: 0, fontSize: "16px", fontWeight: "700", color: "var(--text)" }}>Tu as tout vu !</p>
      <p style={{ margin: 0, fontSize: "13px", color: "var(--text-3)", lineHeight: 1.6 }}>
        Impressionnant. Essaie un autre genre ou recharge pour découvrir de nouveaux films.
      </p>
      <button onClick={onRelancer} style={{
        marginTop: "4px", background: "var(--purple)", color: "white",
        border: "none", borderRadius: "50px", padding: "12px 28px",
        fontSize: "14px", fontWeight: "700", cursor: "pointer",
        boxShadow: "0 4px 16px rgba(29,99,205,0.35)",
      }}>Recharger</button>
    </div>
  );
}

// Popup invité affiché après 10 swipes pour inciter à créer un compte
function PromptInvite({ onSeConnecter, onFermer }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", zIndex: 500, display: "flex", alignItems: "center", justifyContent: "center", padding: "24px" }}>
      <div style={{
        background: "var(--surface)", borderRadius: "24px", padding: "36px 28px",
        maxWidth: "320px", width: "100%", textAlign: "center",
        display: "flex", flexDirection: "column", gap: "16px",
        boxShadow: "var(--shadow-lg)", border: "1px solid var(--border)",
        animation: "slideUp 0.25s ease-out",
      }}>
        <span style={{ fontSize: "44px" }}>🎬</span>
        <h2 style={{ margin: 0, fontSize: "20px", color: "var(--text)" }}>Tu kiffes Swochi ?</h2>
        <p style={{ color: "var(--text-3)", fontSize: "14px", margin: 0, lineHeight: 1.6 }}>
          Crée un compte gratuit pour sauvegarder tes swipes, faire des listes et comparer avec tes amis.
        </p>
        <button onClick={onSeConnecter} style={{
          background: "var(--purple)", color: "white", border: "none",
          borderRadius: "50px", padding: "14px", fontSize: "15px",
          fontWeight: "700", cursor: "pointer", boxShadow: "0 4px 16px rgba(29,99,205,0.35)",
        }}>Créer un compte</button>
        <button onClick={onFermer} style={{ background: "none", border: "none", color: "var(--text-3)", fontSize: "13px", cursor: "pointer" }}>
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
      <img src="/logo_swochi_nom.svg" alt="Swochi" style={{ height: "36px", marginBottom: "6px" }} />
      <p style={{ color: "var(--text-3)", marginBottom: "32px", fontSize: "14px" }}>Dernière étape ✨</p>
      <div style={{
        background: "var(--surface)", borderRadius: "20px", padding: "32px",
        width: "100%", maxWidth: "300px", display: "flex", flexDirection: "column", gap: "16px",
        boxShadow: "var(--shadow-md)", border: "1px solid var(--border)",
      }}>
        <h2 style={{ margin: 0, fontSize: "19px", color: "var(--text)" }}>Choisis ton pseudo</h2>
        <p style={{ margin: 0, color: "var(--text-3)", fontSize: "13px", lineHeight: 1.6 }}>
          Tes amis l'utiliseront pour t'ajouter et comparer vos listes de films.
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          <label htmlFor="username-input" style={{ fontSize: "13px", color: "var(--text-3)" }}>Ton pseudo</label>
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
          <p role="alert" style={{ color: "var(--red)", fontSize: "13px", margin: 0 }}>{usernameError}</p>
        )}
        <button onClick={onConfirmer} style={{
          background: "var(--green)", color: "white", border: "none",
          borderRadius: "50px", padding: "14px", fontSize: "16px",
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
      color: "var(--text-2)", borderRadius: "10px", padding: "9px 11px",
      cursor: "pointer", display: "flex", flexDirection: "column", gap: "5px", flexShrink: 0,
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
  borderRadius: "10px", padding: "13px 14px",
  color: "var(--text)", fontSize: "16px", outline: "none",
};

function btnStyle(color) {
  return {
    background: "transparent", border: `2.5px solid ${color}`,
    color, borderRadius: "50%", width: "58px", height: "58px",
    fontSize: "22px", fontWeight: "bold", cursor: "pointer", flexShrink: 0,
    display: "flex", alignItems: "center", justifyContent: "center",
    transition: "transform 0.1s, background 0.15s",
  };
}

export default App;
