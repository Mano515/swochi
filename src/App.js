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
import ErrorBoundary from "./ErrorBoundary";

// ─── App ─────────────────────────────────────────────────────────────────────

function App() {
  const [user, setUser]               = useState(null);
  const [loading, setLoading]         = useState(true);
  const [isGuest, setIsGuest]         = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [loadingFilms, setLoadingFilms] = useState(false);
  const [films, setFilms]             = useState([]);
  const [index, setIndex]             = useState(0);
  const [page, setPage]               = useState(1);
  const [dejaSwiped, setDejaSwiped]   = useState([]);
  const [listes, setListes]           = useState({ aVoir: [], pasInteresse: [], dejavu: [] });
  const [onglet, setOnglet]           = useState("swipe");
  const [genres, setGenres]           = useState([]);
  const [genreChoisi, setGenreChoisi] = useState("");
  const [historique, setHistorique]   = useState([]);
  const [username, setUsername]       = useState(null);
  const [usernameInput, setUsernameInput] = useState("");
  const [usernameError, setUsernameError] = useState("");
  const [menuOuvert, setMenuOuvert]   = useState(false);
  const [toast, setToast]             = useState(null);
  const [showGuestPrompt, setShowGuestPrompt] = useState(false);
  const swipesInvite = useRef(0);
  const fetchIdRef   = useRef(0);
  const toastTimer   = useRef(null);

  function afficherToast(message, type = "error") {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ message, type });
    toastTimer.current = setTimeout(() => setToast(null), 4000);
  }

  // ── Auth Firebase ──────────────────────────────────────────────────────────
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // ── Genres TMDB ────────────────────────────────────────────────────────────
  useEffect(() => {
    fetch(`https://api.themoviedb.org/3/genre/movie/list?api_key=${process.env.REACT_APP_TMDB_KEY}&language=fr-FR`)
      .then(res => res.json())
      .then(data => setGenres(data.genres || []));
  }, []);

  // ── Données utilisateur connecté ───────────────────────────────────────────
  useEffect(() => {
    if (!user) return;
    setIsGuest(false);
    // Quand on se connecte, on efface les données invité du localStorage
    localStorage.removeItem("swochi_guest_listes");
    localStorage.removeItem("swochi_guest_swiped");
    getDoc(doc(db, "users", user.uid)).catch(() => {
      afficherToast("Impossible de charger vos données. Vérifiez votre connexion.");
    }).then(snap => {
      if (!snap) return;
      const listesExistantes = (snap.exists() && snap.data().listes)
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
        if (!localStorage.getItem("swochi_onboarded")) setShowOnboarding(true);
      }
    });
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Mode invité — restaure depuis localStorage ─────────────────────────────
  useEffect(() => {
    if (!isGuest) return;
    const savedListes  = JSON.parse(localStorage.getItem("swochi_guest_listes") || "null")
      || { aVoir: [], pasInteresse: [], dejavu: [] };
    const savedSwiped  = JSON.parse(localStorage.getItem("swochi_guest_swiped") || "[]");
    setListes(savedListes);
    setDejaSwiped(savedSwiped);
    setIndex(0);
    setFilms([]);
    setHistorique([]);
    swipesInvite.current = 0;
    chargerFilms(1, savedSwiped, [], "");
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
    if (!user || isGuest) return;
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
    if (direction === "right") newListes.aVoir        = [...listes.aVoir, film];
    if (direction === "left")  newListes.pasInteresse = [...listes.pasInteresse, film];
    if (direction === "up")    newListes.dejavu        = [...listes.dejavu, film];
    setListes(newListes);
    saveListes(newListes);

    const nextIndex = index + 1;
    setIndex(nextIndex);
    setHistorique(h => [...h, { film, direction }]);
    const newDejaSwiped = [...dejaSwiped, film.id];
    setDejaSwiped(newDejaSwiped);

    // Persistance localStorage en mode invité
    if (isGuest) {
      localStorage.setItem("swochi_guest_listes", JSON.stringify(newListes));
      localStorage.setItem("swochi_guest_swiped", JSON.stringify(newDejaSwiped));
      swipesInvite.current += 1;
      if (swipesInvite.current === 10) setShowGuestPrompt(true);
    }

    if (nextIndex >= films.length - 15 && !loadingFilms) {
      chargerFilms(page + 1, newDejaSwiped, [...films], genreChoisi);
    }
  }

  function handleRetour() {
    if (historique.length === 0) return;
    const { film, direction } = historique[historique.length - 1];
    const newListes = { ...listes };
    if (direction === "right") newListes.aVoir        = listes.aVoir.filter(f => f.id !== film.id);
    if (direction === "left")  newListes.pasInteresse = listes.pasInteresse.filter(f => f.id !== film.id);
    if (direction === "up")    newListes.dejavu        = listes.dejavu.filter(f => f.id !== film.id);
    setListes(newListes);
    saveListes(newListes);
    setHistorique(h => h.slice(0, -1));
    const newDejaSwiped = dejaSwiped.filter(id => id !== film.id);
    setDejaSwiped(newDejaSwiped);
    setIndex(i => i - 1);

    if (isGuest) {
      localStorage.setItem("swochi_guest_listes", JSON.stringify(newListes));
      localStorage.setItem("swochi_guest_swiped", JSON.stringify(newDejaSwiped));
    }
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

  function basculerModeConnexion() {
    setIsGuest(false);
    setMenuOuvert(false);
  }

  // ── Rendu ──────────────────────────────────────────────────────────────────
  if (!loading && !user && !isGuest) return (
    <Login onLogin={() => {}} onGuest={() => setIsGuest(true)} />
  );

  if (user && (username === "" || username === null)) return (
    <div style={{
      minHeight: "100vh", background: "var(--bg)",
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      color: "var(--text)", padding: "20px",
    }}>
      <h1 style={{ fontSize: "28px", letterSpacing: "2px", marginBottom: "6px", color: "var(--text)" }}>🎬 SWOCHI</h1>
      <p style={{ color: "var(--text-3)", marginBottom: "32px", fontSize: "14px" }}>Dernière étape ✨</p>
      <div style={{
        background: "var(--surface)", borderRadius: "20px",
        padding: "32px", width: "100%", maxWidth: "300px",
        display: "flex", flexDirection: "column", gap: "16px",
        boxShadow: "var(--shadow-md)", border: "1px solid var(--border)",
      }}>
        <h2 style={{ margin: 0, fontSize: "19px", color: "var(--text)" }}>Choisis ton pseudo</h2>
        <p style={{ margin: 0, color: "var(--text-3)", fontSize: "13px", lineHeight: "1.6" }}>
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
            onKeyDown={e => e.key === "Enter" && handleChoisirUsername()}
            aria-describedby={usernameError ? "username-error" : undefined}
            style={inputStyle}
          />
        </div>
        {usernameError && (
          <p id="username-error" role="alert" style={{ color: "var(--red)", fontSize: "13px", margin: 0 }}>
            {usernameError}
          </p>
        )}
        <button onClick={handleChoisirUsername} style={{
          background: "var(--green)", color: "white",
          border: "none", borderRadius: "50px",
          padding: "14px", fontSize: "16px",
          fontWeight: "700", cursor: "pointer",
          boxShadow: "0 4px 14px rgba(34,197,94,0.35)",
        }}>Confirmer</button>
      </div>
    </div>
  );

  const filmActuel  = films[index];
  const filmSuivant = films[index + 1];

  return (
    <div className="no-select app-shell">

      {showOnboarding && <Onboarding onTerminer={() => setShowOnboarding(false)} />}

      {/* Prompt invité après 10 swipes */}
      {showGuestPrompt && (
        <div style={{
          position: "fixed", inset: 0,
          background: "rgba(0,0,0,0.8)",
          zIndex: 500,
          display: "flex", alignItems: "center", justifyContent: "center",
          padding: "24px",
        }}>
          <div style={{
            background: "var(--surface)", borderRadius: "24px",
            padding: "36px 28px", maxWidth: "320px", width: "100%",
            textAlign: "center", display: "flex", flexDirection: "column", gap: "16px",
            boxShadow: "var(--shadow-lg)", border: "1px solid var(--border)",
            animation: "slideUp 0.25s ease-out",
          }}>
            <span style={{ fontSize: "44px" }}>🎬</span>
            <h2 style={{ margin: 0, fontSize: "20px", color: "var(--text)" }}>Tu kiffes Swochi ?</h2>
            <p style={{ color: "var(--text-3)", fontSize: "14px", margin: 0, lineHeight: "1.6" }}>
              Crée un compte gratuit pour sauvegarder tes swipes, faire des listes et comparer avec tes amis.
            </p>
            <button onClick={basculerModeConnexion} style={{
              background: "var(--purple)", color: "white",
              border: "none", borderRadius: "50px",
              padding: "14px", fontSize: "15px",
              fontWeight: "700", cursor: "pointer",
              boxShadow: "0 4px 16px rgba(168,85,247,0.35)",
            }}>
              Créer un compte
            </button>
            <button onClick={() => setShowGuestPrompt(false)} style={{
              background: "none", border: "none",
              color: "var(--text-3)", fontSize: "13px", cursor: "pointer",
            }}>
              Continuer sans compte
            </button>
          </div>
        </div>
      )}

      <MenuBurger
        ouvert={menuOuvert}
        onFermer={() => setMenuOuvert(false)}
        onglet={onglet}
        onOnglet={setOnglet}
        isGuest={isGuest}
        onSeConnecter={basculerModeConnexion}
      />

      <div className="desktop-wrapper">
        {/* ── Header ── */}
        <header className="top-section">
          <div className="header-row" style={{ display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
            <button
              onClick={() => setOnglet("swipe")}
              aria-label="Retour au swipe"
              style={{ background: "none", border: "none", cursor: "pointer", padding: 0, fontSize: "24px", fontWeight: "700", letterSpacing: "3px", color: "var(--text)" }}
            >
              🎬 SWOCHI
            </button>
            <div style={{ position: "absolute", right: 0 }}>
              <button
                onClick={() => setMenuOuvert(true)}
                aria-label="Ouvrir le menu"
                aria-expanded={menuOuvert}
                aria-haspopup="dialog"
                style={{
                  background: "var(--surface-2)", border: "1px solid var(--border)",
                  color: "var(--text-2)", borderRadius: "8px",
                  padding: "9px 11px", cursor: "pointer",
                  display: "flex", flexDirection: "column", gap: "5px",
                  transition: "background 0.2s",
                }}
              >
                <span aria-hidden="true" style={{ display: "block", width: "20px", height: "2px", background: "var(--text-2)", borderRadius: "2px" }} />
                <span aria-hidden="true" style={{ display: "block", width: "20px", height: "2px", background: "var(--text-2)", borderRadius: "2px" }} />
                <span aria-hidden="true" style={{ display: "block", width: "20px", height: "2px", background: "var(--text-2)", borderRadius: "2px" }} />
              </button>
            </div>
          </div>

          {isGuest && (
            <div style={{
              background: "var(--purple-dim)", borderRadius: "10px",
              marginBottom: "10px", padding: "8px 14px",
              display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px",
            }}>
              <p style={{ margin: 0, fontSize: "12px", color: "var(--purple)", fontWeight: "500" }}>
                Mode invité · swipes sauvegardés localement
              </p>
              <button onClick={basculerModeConnexion} style={{
                background: "none", border: "1px solid var(--purple)",
                color: "var(--purple)", borderRadius: "20px",
                padding: "4px 12px", fontSize: "12px",
                fontWeight: "600", cursor: "pointer", flexShrink: 0,
              }}>
                Se connecter
              </button>
            </div>
          )}

          {onglet === "swipe" && (
            <div className="genres-row">
              <GenreScroll genres={genres} genreChoisi={genreChoisi} onGenreChange={handleGenreChange} />
            </div>
          )}
        </header>

        {/* ── Contenu principal ── */}
        <main>
              {onglet === "swipe" && (
                <div className="swipe-section">
                  <div className="card-container">
                    {filmSuivant && <MovieCard key={filmSuivant.id + "-bg"} film={filmSuivant} onSwipe={() => {}} isTop={false} />}
                    {filmActuel   && <MovieCard key={filmActuel.id} film={filmActuel} onSwipe={handleSwipe} isTop={true} />}

                    {/* Écran vide — plus de films */}
                    {!filmActuel && !loadingFilms && <EcranVide onRelancer={() => {
                      setIndex(0);
                      setFilms([]);
                      chargerFilms(1, dejaSwiped, [], genreChoisi);
                    }} />}

                    {/* Chargement */}
                    {!filmActuel && loadingFilms && (
                      <div style={{
                        position: "absolute", inset: 0,
                        display: "flex", flexDirection: "column",
                        alignItems: "center", justifyContent: "center", gap: "14px",
                      }}>
                        <div style={{
                          width: "36px", height: "36px",
                          border: "3px solid var(--border-2)",
                          borderTopColor: "var(--purple)",
                          borderRadius: "50%",
                          animation: "spin 0.8s linear infinite",
                        }} />
                        <p role="status" style={{ color: "var(--text-4)", fontSize: "13px", margin: 0 }}>Chargement…</p>
                      </div>
                    )}
                  </div>

                  {filmActuel && (
                    <div style={{
                      position: "relative", width: "100%", maxWidth: "320px",
                      marginTop: "22px", display: "flex", justifyContent: "center", alignItems: "center",
                    }}>
                      <div style={{ display: "flex", gap: "20px", alignItems: "center" }}>
                        <button onClick={() => handleSwipe("left")}  aria-label="Passer ce film" style={btnStyle("var(--red)")}>✕</button>
                        <button onClick={() => handleSwipe("up")}    aria-label="Déjà vu"        style={{ ...btnStyle("var(--blue)"), width: "48px", height: "48px", fontSize: "18px" }}>👁</button>
                        <button onClick={() => handleSwipe("right")} aria-label="À voir"         style={btnStyle("var(--green)")}>♥</button>
                      </div>
                      <button
                        onClick={handleRetour}
                        disabled={historique.length === 0}
                        aria-label="Annuler le dernier swipe"
                        style={{
                          position: "absolute", right: 0,
                          background: "transparent",
                          border: "2px solid " + (historique.length > 0 ? "var(--amber)" : "var(--text-5)"),
                          color: historique.length > 0 ? "var(--amber)" : "var(--text-5)",
                          borderRadius: "50%", width: "36px", height: "36px",
                          fontSize: "15px", cursor: historique.length > 0 ? "pointer" : "default",
                          display: "flex", alignItems: "center", justifyContent: "center",
                        }}
                      >↩</button>
                    </div>
                  )}
                </div>
              )}

              {onglet === "match" && (
                <div className="onglet-content">
                  <ErrorBoundary>
                    <Match user={user} username={username} listesUser={listes} isGuest={isGuest} onSeConnecter={basculerModeConnexion} />
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
                    <Profil username={username} user={user} listes={listes} isGuest={isGuest} onSeConnecter={basculerModeConnexion} />
                  </ErrorBoundary>
                </div>
              )}
        </main>
      </div>

      {/* Toast */}
      {toast && (
        <div
          role="alert"
          aria-live="assertive"
          onClick={() => setToast(null)}
          style={{
            position: "fixed", bottom: "24px", left: "50%",
            transform: "translateX(-50%)",
            background: toast.type === "error" ? "var(--red)" : "var(--green)",
            color: "white", borderRadius: "14px",
            padding: "12px 22px", fontSize: "14px", fontWeight: "500",
            boxShadow: "var(--shadow-lg)",
            zIndex: 1000, cursor: "pointer",
            maxWidth: "88vw", textAlign: "center",
            animation: "apparaitre 0.2s ease-out",
          }}
        >
          {toast.message}
        </div>
      )}
    </div>
  );
}

// ── Écran "plus de films" ──────────────────────────────────────────────────────
function EcranVide({ onRelancer }) {
  return (
    <div style={{
      position: "absolute", inset: 0,
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      gap: "16px", padding: "24px", textAlign: "center",
    }}>
      <div style={{ fontSize: "52px", lineHeight: 1 }}>🎬</div>
      <p style={{ margin: 0, fontSize: "16px", fontWeight: "700", color: "var(--text)" }}>
        Tu as tout vu !
      </p>
      <p style={{ margin: 0, fontSize: "13px", color: "var(--text-3)", lineHeight: "1.6" }}>
        Impressionnant. Essaie un autre genre ou recharge pour découvrir de nouveaux films.
      </p>
      <button
        onClick={onRelancer}
        style={{
          marginTop: "4px",
          background: "var(--purple)", color: "white",
          border: "none", borderRadius: "50px",
          padding: "12px 28px", fontSize: "14px",
          fontWeight: "700", cursor: "pointer",
          boxShadow: "0 4px 16px rgba(168,85,247,0.35)",
        }}
      >
        Recharger
      </button>
    </div>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────────
const inputStyle = {
  background: "var(--input-bg)", border: "1px solid var(--input-border)",
  borderRadius: "10px", padding: "13px 14px",
  color: "var(--text)", fontSize: "16px", outline: "none",
  transition: "border-color 0.2s",
};

function btnStyle(color) {
  return {
    background: "transparent", border: `2.5px solid ${color}`,
    color: color, borderRadius: "50%",
    width: "58px", height: "58px",
    fontSize: "22px", fontWeight: "bold",
    cursor: "pointer", flexShrink: 0,
    display: "flex", alignItems: "center", justifyContent: "center",
    transition: "transform 0.1s, background 0.15s",
  };
}

export default App;
