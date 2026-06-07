import { useEffect, useState, useRef } from "react";
import { auth, db } from "./firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, updateDoc, getDoc, runTransaction } from "firebase/firestore";
import MovieCard from "./MovieCard";
import Login from "./Login";
import Match from "./Match";
import MesFilms from "./MesFilms";
import GenreScroll from "./GenreScroll";
import MenuBurger from "./MenuBurger";
import Profil from "./Profil";
import Onboarding from "./Onboarding";

// ─── Écran verrouillé pour les invités ───────────────────────────────────────

function EcranVerrouille({ titre, emoji, onSeConnecter }) {
  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center",
      justifyContent: "center", textAlign: "center",
      padding: "48px 24px", gap: "16px",
    }}>
      <span style={{ fontSize: "48px" }}>{emoji}</span>
      <h2 style={{ margin: 0, fontSize: "18px" }}>{titre}</h2>
      <p style={{ color: "#666", fontSize: "14px", margin: 0, maxWidth: "260px" }}>
        Crée un compte gratuitement pour débloquer cette fonctionnalité et sauvegarder tous tes swipes.
      </p>
      <button onClick={onSeConnecter} style={{
        background: "#a855f7", color: "white",
        border: "none", borderRadius: "50px",
        padding: "14px 28px", fontSize: "15px",
        fontWeight: "bold", cursor: "pointer",
        marginTop: "8px",
      }}>
        Se connecter / S'inscrire
      </button>
    </div>
  );
}

// ─── App ─────────────────────────────────────────────────────────────────────

function App() {
  const [user, setUser]               = useState(null);
  const [loading, setLoading]         = useState(true);
  const [loadingFilms, setLoadingFilms] = useState(false);
  const [films, setFilms]             = useState([]);
  const [index, setIndex]             = useState(0);
  const [page, setPage]               = useState(1);
  const [dejaSwiped, setDejaSwiped]   = useState([]);
  const [listes, setListes]           = useState({ aVoir: [], pasInteresse: [], dejavu: [] });
  const [onglet, setOnglet]           = useState("swipe");
  const [genres, setGenres]           = useState([]);
  const [genreChoisi, setGenreChoisi] = useState("");
  const [historique, setHistorique]   = useState([]); // { film, direction }
  const [username, setUsername]       = useState(null);
  const [usernameInput, setUsernameInput] = useState("");
  const [usernameError, setUsernameError] = useState("");
  const [menuOuvert, setMenuOuvert]   = useState(false);
  const [toast, setToast]             = useState(null); // { message, type: "error"|"success" }
  const fetchIdRef = useRef(0);
  const toastTimer = useRef(null);

  function afficherToast(message, type = "error") {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ message, type });
    toastTimer.current = setTimeout(() => setToast(null), 4000);
  }

  // Auth Firebase
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Genres TMDB
  useEffect(() => {
    fetch(`https://api.themoviedb.org/3/genre/movie/list?api_key=${process.env.REACT_APP_TMDB_KEY}&language=fr-FR`)
      .then(res => res.json())
      .then(data => setGenres(data.genres || []));
  }, []);

  // Chargement des données utilisateur connecté
  useEffect(() => {
    if (!user) return;

    getDoc(doc(db, "users", user.uid)).catch(() => {
      afficherToast("Impossible de charger vos données. Vérifiez votre connexion.");
    }).then(snap => {
      if (!snap) return;
      const listesExistantes = snap.exists()
        ? snap.data().listes
        : { aVoir: [], pasInteresse: [], dejavu: [] };
      setListes(listesExistantes);
      const ids = [
        ...listesExistantes.aVoir,
        ...listesExistantes.pasInteresse,
        ...listesExistantes.dejavu,
      ].map(f => f.id);
      setUsername(snap.exists() ? (snap.data().username || "") : "");
      setDejaSwiped(ids);
      if (snap.exists() && snap.data().username) {
        chargerFilms(1, ids, [], "");
        // Onboarding : première connexion
        if (!localStorage.getItem("swochi_onboarded")) setShowOnboarding(true);
      }
    });
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  // Mode invité : charge les films sans auth
  useEffect(() => {
    if (!isGuest) return;
    setListes({ aVoir: [], pasInteresse: [], dejavu: [] });
    setDejaSwiped([]);
    setIndex(0);
    setFilms([]);
    setHistorique([]);
    swipesInvite.current = 0;
    chargerFilms(1, [], [], "");
    // Onboarding invité
    if (!localStorage.getItem("swochi_onboarded")) setShowOnboarding(true);
  }, [isGuest]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Chargement des films ───────────────────────────────────────────────────

  async function fetchPage(numPage, genre) {
    const key = process.env.REACT_APP_TMDB_KEY;
    const genreParam = genre ? `&with_genres=${genre}` : "";
    const url = `https://api.themoviedb.org/3/discover/movie?api_key=${key}&language=fr-FR&sort_by=popularity.desc&vote_count.gte=100&page=${numPage}${genreParam}`;
    const data = await fetch(url).then(r => r.json());
    return data.results ?? [];
  }

  async function chargerFilms(pageDebut, swipes, filmsExistants, genre) {
    fetchIdRef.current += 1;
    const monId = fetchIdRef.current;
    setLoadingFilms(true);
    try {
      const numeros = [pageDebut, pageDebut + 1, pageDebut + 2];
      const pages   = await Promise.all(numeros.map(n => fetchPage(n, genre)));
      const nouveaux = pages.flat().filter(f => !swipes.includes(f.id));

      if (monId !== fetchIdRef.current) return;
      setFilms([...filmsExistants, ...nouveaux]);
      setPage(pageDebut + 2);
    } catch (e) {
      console.error("Erreur chargement films:", e);
      afficherToast("Impossible de charger les films. Vérifiez votre connexion.");
    } finally {
      if (monId === fetchIdRef.current) setLoadingFilms(false);
    }
  }

  function handleGenreChange(nouveauGenre) {
    setGenreChoisi(nouveauGenre);
    setIndex(0);
    setPage(1);
    setFilms([]);
    chargerFilms(1, dejaSwiped, [], nouveauGenre);
  }

  // ── Sauvegarde Firestore ───────────────────────────────────────────────────

  async function saveListes(newListes) {
    if (!user || isGuest) return; // pas de sauvegarde en mode invité
    try {
      await updateDoc(doc(db, "users", user.uid), { listes: newListes });
    } catch (e) {
      console.error("Erreur sauvegarde:", e);
      afficherToast("Sauvegarde échouée — vérifiez votre connexion.");
    }
  }

  // ── Choix du username ──────────────────────────────────────────────────────

  async function handleChoisirUsername() {
    setUsernameError("");
    const pseudo = usernameInput.trim().toLowerCase().replace(/\s+/g, "_");
    if (pseudo.length < 3)  return setUsernameError("Minimum 3 caractères.");
    if (pseudo.length > 30) return setUsernameError("Maximum 30 caractères.");
    if (!/^[a-z0-9_]+$/.test(pseudo)) return setUsernameError("Lettres, chiffres et _ uniquement.");
    try {
      await runTransaction(db, async (transaction) => {
        const usernameRef  = doc(db, "usernames", pseudo);
        const usernameSnap = await transaction.get(usernameRef);
        if (usernameSnap.exists()) throw new Error("Ce pseudo est déjà pris.");

        transaction.set(usernameRef, { uid: user.uid });
        transaction.set(doc(db, "users", user.uid), {
          email: user.email,
          username: pseudo,
          listes: { aVoir: [], pasInteresse: [], dejavu: [] }
        });
      });
      setUsername(pseudo);
      chargerFilms(1, [], [], "");
      if (!localStorage.getItem("swochi_onboarded")) setShowOnboarding(true);
    } catch (e) {
      setUsernameError(e.message || "Une erreur est survenue, réessayez.");
    }
  }

  // ── Swipe ──────────────────────────────────────────────────────────────────

  function handleSwipe(direction) {
    const film = films[index];
    const newListes = { ...listes };
    if (direction === "right") newListes.aVoir         = [...listes.aVoir, film];
    if (direction === "left")  newListes.pasInteresse  = [...listes.pasInteresse, film];
    if (direction === "up")    newListes.dejavu         = [...listes.dejavu, film];
    setListes(newListes);
    saveListes(newListes);

    const nextIndex = index + 1;
    setIndex(nextIndex);
    setHistorique(h => [...h, { film, direction }]);

    const newDejaSwiped = [...dejaSwiped, film.id];
    setDejaSwiped(newDejaSwiped);

    if (nextIndex >= films.length - 15 && !loadingFilms) {
      chargerFilms(page + 1, newDejaSwiped, [...films], genreChoisi);
    }
  }

  function handleRetour() {
    if (historique.length === 0) return;
    const derniere = historique[historique.length - 1];
    const { film, direction } = derniere;

    const newListes = { ...listes };
    if (direction === "right") newListes.aVoir        = listes.aVoir.filter(f => f.id !== film.id);
    if (direction === "left")  newListes.pasInteresse = listes.pasInteresse.filter(f => f.id !== film.id);
    if (direction === "up")    newListes.dejavu        = listes.dejavu.filter(f => f.id !== film.id);
    setListes(newListes);
    saveListes(newListes);
    setHistorique(h => h.slice(0, -1));
    setDejaSwiped(d => d.filter(id => id !== film.id));
    setIndex(i => i - 1);
  }

  async function handleDeplacer(film, de, vers) {
    const newListes = { ...listes };
    newListes[de]   = listes[de].filter(f => f.id !== film.id);
    newListes[vers] = [...listes[vers], film];
    setListes(newListes);
    await saveListes(newListes);
  }

  async function handleSupprimer(film, de) {
    const newListes = { ...listes };
    newListes[de] = listes[de].filter(f => f.id !== film.id);
    setListes(newListes);
    setDejaSwiped(d => d.filter(id => id !== film.id));
    await saveListes(newListes);
  }

  // Écran de chargement initial
  if (loading) return (
    <div role="status" aria-label="Chargement en cours" style={{ background: "#0f0f0f", minHeight: "100vh" }} />
  );

  if (!user) return <Login onLogin={() => {}} />;

  if (loading) return (
    <div role="status" aria-label="Chargement" style={{ background: "#0f0f0f", minHeight: "100vh" }} />
  );

  if (!user && !isGuest) return (
    <Login onLogin={() => {}} onGuest={() => setIsGuest(true)} />
  );

  // Écran de choix du pseudo (nouveaux comptes)
  if (user && (username === "" || username === null)) return (
    <div style={{
      minHeight: "100vh", background: "#0f0f0f",
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      fontFamily: "sans-serif", color: "white", padding: "20px",
    }}>
      <h1 style={{ fontSize: "28px", letterSpacing: "2px", marginBottom: "8px" }}>🎬 SWOCHI</h1>
      <div style={{
        background: "#1a1a1a", borderRadius: "16px",
        padding: "32px", width: "100%", maxWidth: "300px",
        display: "flex", flexDirection: "column", gap: "16px", marginTop: "24px"
      }}>
        <h2 style={{ margin: 0, fontSize: "18px" }}>Choisis ton pseudo</h2>
        <p style={{ margin: 0, color: "#666", fontSize: "13px", lineHeight: "1.5" }}>
          Tes amis l'utiliseront pour t'ajouter et comparer vos listes de films.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          <label htmlFor="username-input" style={{ fontSize: "13px", color: "#aaa" }}>
            Ton pseudo
          </label>
          <input
            id="username-input"
            type="text"
            placeholder="ex: cinemafan42"
            value={usernameInput}
            onChange={e => setUsernameInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleChoisirUsername()}
            aria-describedby={usernameError ? "username-error" : undefined}
            aria-required="true"
            style={inputStyle}
          />
        </div>

        {usernameError && (
          <p id="username-error" role="alert" style={{ color: "#ef4444", fontSize: "13px", margin: 0 }}>
            {usernameError}
          </p>
        )}

        <button onClick={handleChoisirUsername} style={{
          background: "#22c55e", color: "white",
          border: "none", borderRadius: "50px",
          padding: "14px", fontSize: "16px",
          fontWeight: "bold", cursor: "pointer",
        }}>Confirmer</button>
      </div>
    </div>
  );

  const filmActuel  = films[index];
  const filmSuivant = films[index + 1];

  return (
    <div className="no-select app-shell">

      <MenuBurger ouvert={menuOuvert} onFermer={() => setMenuOuvert(false)} onglet={onglet} onOnglet={setOnglet} />

      <div className="desktop-wrapper">
        {/* ── Section haute ── */}
        <header className="top-section">
          <div className="header-row" style={{ display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
            <span aria-label="Swochi" style={{ fontSize: "26px", fontWeight: "bold", letterSpacing: "3px" }}>🎬 SWOCHI</span>
            <button
              onClick={() => setMenuOuvert(true)}
              aria-label="Ouvrir le menu"
              aria-expanded={menuOuvert}
              aria-haspopup="dialog"
              style={{
                position: "absolute", right: 0,
                background: "transparent", border: "1px solid #2a2a2a",
                color: "#aaa", borderRadius: "8px",
                padding: "9px 12px", cursor: "pointer",
                display: "flex", flexDirection: "column", gap: "5px",
              }}
            >
              {/* Barres du burger — décoratives */}
              <span aria-hidden="true" style={{ display: "block", width: "22px", height: "2px", background: "#aaa", borderRadius: "2px" }} />
              <span aria-hidden="true" style={{ display: "block", width: "22px", height: "2px", background: "#aaa", borderRadius: "2px" }} />
              <span aria-hidden="true" style={{ display: "block", width: "22px", height: "2px", background: "#aaa", borderRadius: "2px" }} />
            </button>
          </div>

          {onglet === "swipe" && (
            <div className="genres-row">
              <GenreScroll genres={genres} genreChoisi={genreChoisi} onGenreChange={handleGenreChange} />
            </div>
          )}
        </header>

        {/* ── Contenu principal ── */}
        <main>
          {onglet === "swipe" ? (
            <div className="swipe-section">
              {/* Carte */}
              <div className="card-container">
                {filmSuivant && <MovieCard key={filmSuivant.id + "-bg"} film={filmSuivant} onSwipe={() => {}} isTop={false} />}
                {filmActuel   && <MovieCard key={filmActuel.id} film={filmActuel} onSwipe={handleSwipe} isTop={true} />}
                {!filmActuel && !loadingFilms && (
                  <p style={{ color: "#888", textAlign: "center", paddingTop: "40%" }}>Plus de films !</p>
                )}
                {!filmActuel && loadingFilms && (
                  <p role="status" style={{ color: "#555", textAlign: "center", paddingTop: "40%" }}>Chargement…</p>
                )}
              </div>

              {/* Boutons de swipe */}
              {filmActuel && (
                <div style={{
                  position: "relative", width: "100%", maxWidth: "340px",
                  marginTop: "24px", display: "flex", justifyContent: "center", alignItems: "center"
                }}>
                  <div style={{ display: "flex", gap: "22px" }}>
                    <button
                      onClick={() => handleSwipe("left")}
                      aria-label="Passer ce film"
                      style={btnStyle("#ef4444")}
                    >✕</button>
                    <button
                      onClick={() => handleSwipe("up")}
                      aria-label="Déjà vu"
                      style={btnStyle("#3b82f6")}
                    >👁</button>
                    <button
                      onClick={() => handleSwipe("right")}
                      aria-label="À voir"
                      style={btnStyle("#22c55e")}
                    >♥</button>
                  </div>

                  {/* Bouton retour */}
                  <button
                    onClick={handleRetour}
                    disabled={historique.length === 0}
                    aria-label="Annuler le dernier swipe"
                    style={{
                      position: "absolute", right: 0,
                      background: "transparent",
                      border: "2px solid " + (historique.length > 0 ? "#f59e0b" : "#2a2a2a"),
                      color: historique.length > 0 ? "#f59e0b" : "#2a2a2a",
                      borderRadius: "50%", width: "36px", height: "36px",
                      fontSize: "15px", cursor: historique.length > 0 ? "pointer" : "default",
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}
                  >↩</button>
                </div>
              )}
            </div>
          ) : null}

          {onglet === "match" && (
            <div style={{ padding: "16px", width: "100%", maxWidth: "480px", margin: "0 auto" }}>
              <Match listesUser={listes} username={username} />
            </div>
          )}
          {onglet === "mesfilms" && (
            <div style={{ padding: "16px", width: "100%", maxWidth: "480px", margin: "0 auto" }}>
              <MesFilms listes={listes} onDeplacer={handleDeplacer} onSupprimer={handleSupprimer} />
            </div>
          )}
          {onglet === "profil" && (
            <div style={{ padding: "16px", width: "100%", maxWidth: "480px", margin: "0 auto" }}>
              <Profil username={username} user={user} listes={listes} />
            </div>
          )}
        </main>
      </div>{/* fin desktop-wrapper */}

      {/* Toast de notification — annoncé immédiatement aux lecteurs d'écran */}
      {toast && (
        <div
          role="alert"
          aria-live="assertive"
          onClick={() => setToast(null)}
          style={{
            position: "fixed", bottom: "24px", left: "50%",
            transform: "translateX(-50%)",
            background: toast.type === "error" ? "#ef4444" : "#22c55e",
            color: "white", borderRadius: "12px",
            padding: "12px 20px", fontSize: "14px",
            boxShadow: "0 4px 20px rgba(0,0,0,0.4)",
            zIndex: 1000, cursor: "pointer",
            maxWidth: "90vw", textAlign: "center",
            animation: "apparaitre 0.2s ease-out",
          }}
        >
          {toast.message}
        </div>
      )}
    </div>
  );
}

const inputStyle = {
  background: "#2a2a2a", border: "1px solid #333",
  borderRadius: "8px", padding: "12px",
  color: "white", fontSize: "16px", outline: "none",
};

function btnStyle(color) {
  return {
    background: "transparent", border: `3px solid ${color}`,
    color: color, borderRadius: "50%",
    width: "58px", height: "58px",
    fontSize: "22px", fontWeight: "bold",
    cursor: "pointer", flexShrink: 0,
    display: "flex", alignItems: "center", justifyContent: "center",
  };
}

export default App;
