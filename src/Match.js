import { useState, useEffect, useRef } from "react";
import { db } from "./firebase";
import { collection, query, where, getDocs } from "firebase/firestore";

// Génère des confettis aléatoires
function useConfettis(actif) {
  const [confettis, setConfettis] = useState([]);

  useEffect(() => {
    if (!actif) { setConfettis([]); return; }
    const couleurs = ["#22c55e", "#a855f7", "#f59e0b", "#3b82f6", "#ef4444", "#ec4899"];
    const items = Array.from({ length: 60 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      delai: Math.random() * 1.2,
      duree: 1.5 + Math.random() * 1.5,
      couleur: couleurs[Math.floor(Math.random() * couleurs.length)],
      taille: 6 + Math.random() * 8,
      rotation: Math.random() * 360,
    }));
    setConfettis(items);
    const t = setTimeout(() => setConfettis([]), 4000);
    return () => clearTimeout(t);
  }, [actif]);

  return confettis;
}

function Match({ listesUser, username }) {
  const [pseudo, setPseudo] = useState("");
  const [matches, setMatches] = useState(null);
  const [nomAmi, setNomAmi] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [celebration, setCelebration] = useState(false);
  const confettis = useConfettis(celebration);

  async function findMatch() {
    setError("");
    setMatches(null);
    setCelebration(false);
    setLoading(true);

    try {
      const q = query(collection(db, "users"), where("username", "==", pseudo.trim().toLowerCase()));
      const snap = await getDocs(q);

      if (snap.empty) {
        setError("Aucun utilisateur trouvé avec ce pseudo.");
        setLoading(false);
        return;
      }

      const ami = snap.docs[0].data();
      const idsUser = listesUser.aVoir.map(f => f.id);
      const filmsCommuns = ami.listes.aVoir.filter(f => idsUser.includes(f.id));

      setNomAmi(ami.username);
      setMatches(filmsCommuns);
      if (filmsCommuns.length > 0) setCelebration(true);
    } catch (e) {
      setError("Erreur : " + e.message);
    }

    setLoading(false);
  }

  return (
    <div style={{ position: "relative", width: "300px" }}>

      {/* Confettis */}
      {confettis.map(c => (
        <div key={c.id} style={{
          position: "fixed",
          top: "-10px",
          left: `${c.x}vw`,
          width: c.taille,
          height: c.taille,
          background: c.couleur,
          borderRadius: Math.random() > 0.5 ? "50%" : "2px",
          animation: `tomber ${c.duree}s ${c.delai}s ease-in forwards`,
          transform: `rotate(${c.rotation}deg)`,
          zIndex: 999,
          pointerEvents: "none",
        }} />
      ))}

      <style>{`
        @keyframes tomber {
          0%   { transform: translateY(0) rotate(0deg); opacity: 1; }
          100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
        }
        @keyframes apparaitre {
          0%   { transform: scale(0.7); opacity: 0; }
          60%  { transform: scale(1.05); }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>

      <div style={{
        background: "#1a1a1a", borderRadius: "16px",
        padding: "24px", display: "flex", flexDirection: "column", gap: "16px"
      }}>
        <h2 style={{ margin: 0, fontSize: "18px" }}>🤝 Match avec un ami</h2>
        <p style={{ margin: 0, color: "#888", fontSize: "13px" }}>
          Entre le pseudo d'un ami pour voir vos films en commun
        </p>

        <input
          type="text"
          placeholder="@pseudo de ton ami"
          value={pseudo}
          onChange={e => setPseudo(e.target.value)}
          onKeyDown={e => e.key === "Enter" && findMatch()}
          style={inputStyle}
        />

        <button onClick={findMatch} disabled={loading} style={{
          background: "#a855f7", color: "white",
          border: "none", borderRadius: "50px",
          padding: "12px", fontSize: "15px",
          fontWeight: "bold", cursor: "pointer",
          opacity: loading ? 0.7 : 1,
        }}>
          {loading ? "Recherche..." : "Trouver les matches 🎬"}
        </button>

        {username && (
          <p style={{ margin: 0, color: "#555", fontSize: "12px", textAlign: "center" }}>
            Ton pseudo : <span style={{ color: "#888" }}>@{username}</span>
          </p>
        )}

        {error && <p style={{ color: "#ef4444", fontSize: "13px", margin: 0 }}>{error}</p>}

        {matches !== null && (
          <div>
            {matches.length === 0 ? (
              <p style={{ color: "#888", fontSize: "13px" }}>
                Aucun film en commun avec @{nomAmi} pour l'instant... Swipez plus ! 😄
              </p>
            ) : (
              <div style={{ animation: "apparaitre 0.4s ease-out" }}>
                <p style={{
                  color: "#22c55e", fontSize: "16px",
                  fontWeight: "bold", marginBottom: "16px", textAlign: "center"
                }}>
                  🎉 {matches.length} film{matches.length > 1 ? "s" : ""} en commun avec @{nomAmi} !
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  {matches.map(film => (
                    <div key={film.id} style={{
                      display: "flex", gap: "12px", alignItems: "center",
                      background: "#222", borderRadius: "10px", padding: "8px",
                    }}>
                      <img
                        src={`https://image.tmdb.org/t/p/w92${film.poster_path}`}
                        alt={film.title}
                        style={{ borderRadius: "6px", width: "46px", flexShrink: 0 }}
                      />
                      <span style={{ fontSize: "14px" }}>{film.title}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

const inputStyle = {
  background: "#2a2a2a", border: "1px solid #333",
  borderRadius: "8px", padding: "12px",
  color: "white", fontSize: "15px", outline: "none"
};

export default Match;
