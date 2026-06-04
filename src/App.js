import { useEffect, useState, useRef } from "react";
import { auth, db } from "./firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, setDoc, getDoc, runTransaction } from "firebase/firestore";
import MovieCard from "./MovieCard";
import Login from "./Login";
import Match from "./Match";
import MesFilms from "./MesFilms";
import GenreScroll from "./GenreScroll";

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingFilms, setLoadingFilms] = useState(false);
  const [films, setFilms] = useState([]);
  const [index, setIndex] = useState(0);
  const [page, setPage] = useState(1);
  const [dejaSwiped, setDejaSwiped] = useState([]);
  const [listes, setListes] = useState({ aVoir: [], pasInteresse: [], dejavu: [] });
  const [onglet, setOnglet] = useState("swipe");
  const [genres, setGenres] = useState([]);
  const [genreChoisi, setGenreChoisi] = useState("");
  const [historique, setHistorique] = useState([]); // { film, direction }
  const [username, setUsername] = useState(null);
  const [usernameInput, setUsernameInput] = useState("");
  const [usernameError, setUsernameError] = useState("");
  const [toast, setToast] = useState(null); // { message, type: "error"|"success" }
  const fetchIdRef = useRef(0);
  const toastTimer = useRef(null);

  function afficherToast(message, type = "error") {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ message, type });
    toastTimer.current = setTimeout(() => setToast(null), 4000);
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    fetch(`https://api.themoviedb.org/3/genre/movie/list?api_key=${process.env.REACT_APP_TMDB_KEY}&language=fr-FR`)
      .then(res => res.json())
      .then(data => setGenres(data.genres || []));
  }, []);

  useEffect(() => {
    if (!user) return;

    // Charge les listes depuis Firestore, puis les films
    getDoc(doc(db, "users", user.uid)).catch(() => {
      afficherToast("Impossible de charger vos données. Vérifiez votre connexion.");
    }).then(snap => {
      if (!snap) return;
      const listesExistantes = snap.exists() ? snap.data().listes : { aVoir: [], pasInteresse: [], dejavu: [] };
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
      }
    });
  }, [user]);

  async function fetchPage(numPage, genre) {
    const key = process.env.REACT_APP_TMDB_KEY;
    const genreParam = genre ? `&with_genres=${genre}` : "";
    const url = `https://api.themoviedb.org/3/discover/movie?api_key=${key}&language=fr-FR&sort_by=popularity.desc&vote_count.gte=100&page=${numPage}${genreParam}`;
    const data = await fetch(url).then(r => r.json());
    return data.results ?? [];
  }

  async function chargerFilms(pageDebut, swipes, filmsExistants, genre) {
    // Chaque appel reçoit un ID unique. Si un appel plus récent démarre,
    // les résultats de celui-ci seront ignorés à l'arrivée.
    fetchIdRef.current += 1;
    const monId = fetchIdRef.current;

    setLoadingFilms(true);
    try {
      // 3 pages en parallèle = ~60 films d'un coup
      const numeros = [pageDebut, pageDebut + 1, pageDebut + 2];
      const pages = await Promise.all(numeros.map(n => fetchPage(n, genre)));
      const nouveaux = pages.flat().filter(f => !swipes.includes(f.id));

      // On ignore ce résultat si un fetch plus récent a déjà pris le relais
      if (monId !== fetchIdRef.current) return;

      setFilms([...filmsExistants, ...nouveaux]);
      setPage(pageDebut + 2);
    } catch (e) {
      console.error("Erreur chargement films:", e);
      afficherToast("Impossible de charger les films. Vérifiez votre connexion.");
    } finally {
      // Ne touche au loading que si on est toujours le fetch en cours
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

  async function saveListes(newListes) {
    if (!user) return;
    try {
      await setDoc(doc(db, "users", user.uid), {
        email: user.email,
        username,
        listes: newListes
      });
    } catch (e) {
      console.error("Erreur sauvegarde:", e);
      afficherToast("Sauvegarde échouée — vérifiez votre connexion.");
    }
  }

  async function handleChoisirUsername() {
    setUsernameError("");
    const pseudo = usernameInput.trim().toLowerCase().replace(/\s+/g, "_");
    if (pseudo.length < 3) return setUsernameError("Minimum 3 caractères.");
    if (pseudo.length > 30) return setUsernameError("Maximum 30 caractères.");
    if (!/^[a-z0-9_]+$/.test(pseudo)) return setUsernameError("Lettres, chiffres et _ uniquement.");

    try {
      await runTransaction(db, async (transaction) => {
        // Vérifie atomiquement que le pseudo n'est pas déjà pris
        const usernameRef = doc(db, "usernames", pseudo);
        const usernameSnap = await transaction.get(usernameRef);
        if (usernameSnap.exists()) throw new Error("Ce pseudo est déjà pris.");

        // Réserve le pseudo
        transaction.set(usernameRef, { uid: user.uid });

        // Crée le document utilisateur
        transaction.set(doc(db, "users", user.uid), {
          email: user.email,
          username: pseudo,
          listes: { aVoir: [], pasInteresse: [], dejavu: [] }
        });
      });

      setUsername(pseudo);
      chargerFilms(1, [], [], "");
    } catch (e) {
      setUsernameError(e.message || "Une erreur est survenue, réessayez.");
    }
  }

  function handleSwipe(direction) {
    const film = films[index];
    const newListes = { ...listes };
    if (direction === "right") newListes.aVoir = [...listes.aVoir, film];
    if (direction === "left")  newListes.pasInteresse = [...listes.pasInteresse, film];
    if (direction === "up")    newListes.dejavu = [...listes.dejavu, film];
    setListes(newListes);
    saveListes(newListes);

    const nextIndex = index + 1;
    setIndex(nextIndex);

    // Mémorise dans l'historique pour le bouton retour
    setHistorique(h => [...h, { film, direction }]);

    // Mémorise ce film comme déjà swipé pour les prochaines pages
    const newDejaSwiped = [...dejaSwiped, film.id];
    setDejaSwiped(newDejaSwiped);

    // Recharge 3 pages dès qu'il reste 15 films — on ne doit jamais arriver à zéro
    if (nextIndex >= films.length - 15 && !loadingFilms) {
      chargerFilms(page + 1, newDejaSwiped, [...films], genreChoisi);
    }
  }

  function handleRetour() {
    if (historique.length === 0) return;
    const derniere = historique[historique.length - 1];
    const { film, direction } = derniere;

    // Retire le film de la liste où il avait été mis
    const newListes = { ...listes };
    if (direction === "right") newListes.aVoir = listes.aVoir.filter(f => f.id !== film.id);
    if (direction === "left")  newListes.pasInteresse = listes.pasInteresse.filter(f => f.id !== film.id);
    if (direction === "up")    newListes.dejavu = listes.dejavu.filter(f => f.id !== film.id);
    setListes(newListes);
    saveListes(newListes);

    setHistorique(h => h.slice(0, -1));
    setDejaSwiped(d => d.filter(id => id !== film.id));
    setIndex(i => i - 1);
  }

  async function handleDeplacer(film, de, vers) {
    const newListes = { ...listes };
    newListes[de] = listes[de].filter(f => f.id !== film.id);
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

  if (loading) return <div style={{ background: "#0f0f0f", minHeight: "100vh" }} />;
  if (!user) return <Login onLogin={() => {}} />;

  // Écran de choix du pseudo pour les nouveaux comptes
  if (username === "" || username === null) return (
    <div style={{
      minHeight: "100vh", background: "#0f0f0f",
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      fontFamily: "sans-serif", color: "white",
      padding: "20px",
    }}>
      <h1 style={{ fontSize: "28px", letterSpacing: "2px", marginBottom: "8px" }}>🎬 SWOCHI</h1>
      <div style={{
        background: "#1a1a1a", borderRadius: "16px",
        padding: "32px", width: "300px",
        display: "flex", flexDirection: "column", gap: "16px", marginTop: "24px"
      }}>
        <h2 style={{ margin: 0, fontSize: "18px" }}>Choisis ton pseudo</h2>
        <p style={{ margin: 0, color: "#888", fontSize: "13px" }}>
          Tes amis l'utiliseront pour comparer vos listes de films.
        </p>
        <input
          type="text"
          placeholder="ex: cinemafan42"
          value={usernameInput}
          onChange={e => setUsernameInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && handleChoisirUsername()}
          style={inputStyle}
        />
        {usernameError && <p style={{ color: "#ef4444", fontSize: "13px", margin: 0 }}>{usernameError}</p>}
        <button onClick={handleChoisirUsername} style={{
          background: "#22c55e", color: "white",
          border: "none", borderRadius: "50px",
          padding: "14px", fontSize: "16px",
          fontWeight: "bold", cursor: "pointer"
        }}>Confirmer</button>
      </div>
    </div>
  );

  const filmActuel = films[index];
  const filmSuivant = films[index + 1];

  return (
    <div className="no-select app-shell">

      <div className="desktop-wrapper">
      {/* ── Section haute (sticky mobile, normale desktop) ── */}
      <div className="top-section">
        {/* Header */}
        <div className="header-row" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <span style={{ fontSize: "20px", fontWeight: "bold", letterSpacing: "2px" }}>🎬 SWOCHI</span>
            <span style={{ marginLeft: "10px", color: "#888", fontSize: "12px" }}>@{username}</span>
          </div>
          <button onClick={() => signOut(auth)} style={{
            background: "transparent", border: "1px solid #333",
            color: "#666", borderRadius: "8px",
            padding: "6px 12px", cursor: "pointer", fontSize: "12px"
          }}>Déco</button>
        </div>

        {/* Onglets */}
        <div className="tabs-row" style={{ display: "flex", gap: "8px" }}>
          <button onClick={() => setOnglet("swipe")}    style={{ ...ongletStyle(onglet === "swipe"),    flex: 1, padding: "10px 6px", fontSize: "13px" }}>🎬 Swipe</button>
          <button onClick={() => setOnglet("match")}    style={{ ...ongletStyle(onglet === "match"),    flex: 1, padding: "10px 6px", fontSize: "13px" }}>🤝 Match</button>
          <button onClick={() => setOnglet("mesfilms")} style={{ ...ongletStyle(onglet === "mesfilms"), flex: 1, padding: "10px 6px", fontSize: "13px" }}>🎞 Mes films</button>
        </div>

        {/* Genres — seulement sur l'onglet swipe */}
        {onglet === "swipe" && (
          <div className="genres-row">
            <GenreScroll genres={genres} genreChoisi={genreChoisi} onGenreChange={handleGenreChange} />
          </div>
        )}
      </div>

      {/* ── Contenu principal ── */}
      {onglet === "swipe" ? (
        <div className="swipe-section">
          {/* Carte */}
          <div className="card-container">
            {filmSuivant && <MovieCard key={filmSuivant.id + "-bg"} film={filmSuivant} onSwipe={() => {}} isTop={false} />}
            {filmActuel  && <MovieCard key={filmActuel.id} film={filmActuel} onSwipe={handleSwipe} isTop={true} />}
            {!filmActuel && !loadingFilms && <p style={{ color: "#888", textAlign: "center", paddingTop: "40%" }}>Plus de films !</p>}
            {!filmActuel &&  loadingFilms && <p style={{ color: "#555", textAlign: "center", paddingTop: "40%" }}>Chargement…</p>}
          </div>

          {/* Boutons */}
          {filmActuel && (
            <div style={{ display: "flex", gap: "12px", marginTop: "16px", alignItems: "center" }}>
              <button onClick={() => handleSwipe("left")}  style={btnStyle("#ef4444")}>✕ Skip</button>
              <button onClick={() => handleSwipe("up")}    style={btnStyle("#3b82f6")}>👁 Déjà vu</button>
              <button onClick={() => handleSwipe("right")} style={btnStyle("#22c55e")}>♥ À voir</button>
              <button
                onClick={handleRetour}
                disabled={historique.length === 0}
                style={{
                  background: "transparent",
                  border: "2px solid " + (historique.length > 0 ? "#f59e0b" : "#333"),
                  color: historique.length > 0 ? "#f59e0b" : "#333",
                  borderRadius: "50%", width: "44px", height: "44px",
                  fontSize: "18px", cursor: historique.length > 0 ? "pointer" : "default",
                  display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                }}
              >↩</button>
            </div>
          )}

          {/* Stats */}
          <div style={{ marginTop: "10px", display: "flex", gap: "20px", fontSize: "12px", color: "#555" }}>
            <span>✅ {listes.aVoir.length}</span>
            <span>❌ {listes.pasInteresse.length}</span>
            <span>👁️ {listes.dejavu.length}</span>
          </div>
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
      </div>{/* fin desktop-wrapper */}

      {/* Toast de notification */}
      {toast && (
        <div onClick={() => setToast(null)} style={{
          position: "fixed", bottom: "24px", left: "50%",
          transform: "translateX(-50%)",
          background: toast.type === "error" ? "#ef4444" : "#22c55e",
          color: "white", borderRadius: "12px",
          padding: "12px 20px", fontSize: "14px",
          boxShadow: "0 4px 20px rgba(0,0,0,0.4)",
          zIndex: 1000, cursor: "pointer",
          maxWidth: "90vw", textAlign: "center",
          animation: "apparaitre 0.2s ease-out",
        }}>
          {toast.message}
        </div>
      )}
    </div>
  );
}

const inputStyle = {
  background: "#2a2a2a", border: "1px solid #333",
  borderRadius: "8px", padding: "12px",
  color: "white", fontSize: "16px", outline: "none"
};

function btnStyle(color) {
  return {
    background: "transparent", border: `2px solid ${color}`,
    color: color, borderRadius: "50px",
    padding: "12px 24px", fontSize: "15px",
    fontWeight: "bold", cursor: "pointer",
  };
}

function ongletStyle(actif) {
  return {
    background: actif ? "white" : "transparent",
    color: actif ? "#0f0f0f" : "#888",
    border: "1px solid #333",
    borderRadius: "50px",
    padding: "10px 24px",
    fontSize: "14px",
    fontWeight: "bold",
    cursor: "pointer",
  };
}

export default App;