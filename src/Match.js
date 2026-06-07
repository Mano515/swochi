import { useState, useEffect, useCallback } from "react";
import { db } from "./firebase";
import {
  collection, query, where, getDocs,
  addDoc, updateDoc, deleteDoc, doc, getDoc,
  serverTimestamp,
} from "firebase/firestore";

// ─── Confettis ────────────────────────────────────────────────────────────────

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

// ─── Avatar lettre ────────────────────────────────────────────────────────────

function Avatar({ username, size = 36 }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%",
      background: "linear-gradient(135deg, #a855f7, #3b82f6)",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: size * 0.4, fontWeight: "bold", color: "white",
      flexShrink: 0,
    }}>
      {username?.[0]?.toUpperCase() ?? "?"}
    </div>
  );
}

// ─── Vue principale : liste d'amis ────────────────────────────────────────────

function VueAmis({ amis, demandesRecues, username, onComparer, onAccepter, onRefuser, onAjouter, onPartager, copied }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

      <button onClick={onAjouter} style={{
        background: "var(--purple)", color: "white",
        border: "none", borderRadius: "14px",
        padding: "14px", fontSize: "15px",
        fontWeight: "700", cursor: "pointer",
        display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
        boxShadow: "0 4px 14px rgba(168,85,247,0.3)",
      }}>
        + Ajouter un ami
      </button>

      {/* Demandes reçues */}
      {demandesRecues.length > 0 && (
        <section>
          <p style={titreSectionStyle}>📬 Demandes reçues ({demandesRecues.length})</p>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {demandesRecues.map(d => (
              <div key={d.id} style={carteStyle}>
                <Avatar username={d.username} />
                <span style={{ flex: 1, fontSize: "15px", fontWeight: "500" }}>@{d.username}</span>
                <button onClick={() => onAccepter(d)} style={btnVertStyle}>Accepter</button>
                <button onClick={() => onRefuser(d)} style={btnGrisStyle}>✕</button>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Mes amis */}
      <section>
        <p style={titreSectionStyle}>
          👥 Mes amis {amis.length > 0 ? `(${amis.length})` : ""}
        </p>
        {amis.length === 0 ? (
          <div style={{
            background: "var(--surface)", borderRadius: "14px",
            padding: "28px", textAlign: "center",
            border: "1px solid var(--border)",
          }}>
            <p style={{ color: "var(--text-3)", fontSize: "14px", margin: 0, lineHeight: "1.6" }}>
              Aucun ami pour l'instant.<br />Ajoute quelqu'un pour comparer vos listes !
            </p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {amis.map(a => (
              <div key={a.id} style={carteStyle}>
                <Avatar username={a.username} />
                <span style={{ flex: 1, fontSize: "15px", fontWeight: "500" }}>@{a.username}</span>
                <button onClick={() => onComparer(a)} style={{
                  background: "var(--purple-dim)", color: "var(--purple)",
                  border: "1px solid rgba(168,85,247,0.25)",
                  borderRadius: "20px", padding: "7px 16px",
                  fontSize: "13px", fontWeight: "600",
                  cursor: "pointer", flexShrink: 0,
                }}>
                  Comparer →
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Mon pseudo */}
      {username && (
        <section>
          <p style={titreSectionStyle}>Mon pseudo</p>
          <div style={{
            background: "var(--surface)", border: "1px solid var(--border)",
            borderRadius: "14px", padding: "14px 16px",
            display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px",
            boxShadow: "var(--shadow-sm)",
          }}>
            <div>
              <p style={{ margin: 0, fontSize: "16px", fontWeight: "700", color: "var(--text)" }}>@{username}</p>
              <p style={{ margin: "3px 0 0", fontSize: "12px", color: "var(--text-3)" }}>Partage-le à tes amis</p>
            </div>
            <button
              onClick={onPartager}
              aria-label={copied ? "Pseudo copié !" : "Partager mon pseudo"}
              style={{
                background: copied ? "var(--green)" : "var(--surface-3)",
                color: copied ? "white" : "var(--text-2)", border: "none",
                borderRadius: "20px", padding: "8px 16px",
                fontSize: "13px", fontWeight: "600",
                cursor: "pointer", flexShrink: 0,
                transition: "background 0.2s, color 0.2s",
              }}
            >
              {copied ? "✓ Copié !" : "Partager"}
            </button>
          </div>
        </section>
      )}
    </div>
  );
}

// ─── Vue : ajouter un ami ─────────────────────────────────────────────────────

function VueAjouter({ myUid, myUsername, onRetour }) {
  const [pseudo, setPseudo]               = useState("");
  const [resultat, setResultat]           = useState(null);
  const [loading, setLoading]             = useState(false);
  const [loadingAction, setLoadingAction] = useState(false);
  const [succès, setSuccès]               = useState(false);

  async function chercher() {
    if (!pseudo.trim()) return;
    setLoading(true);
    setResultat(null);
    setSuccès(false);
    const cible = pseudo.trim().toLowerCase().replace(/^@/, "");
    if (cible === myUsername) {
      setResultat({ etat: "soi_meme" });
      setLoading(false);
      return;
    }
    try {
      const userSnap = await getDocs(
        query(collection(db, "users"), where("username", "==", cible))
      );
      if (userSnap.empty) { setResultat({ etat: "not_found" }); setLoading(false); return; }

      const cibleDoc = userSnap.docs[0];
      const cibleUid = cibleDoc.id;

      const [sent, received] = await Promise.all([
        getDocs(query(collection(db, "friendRequests"),
          where("fromUid", "==", myUid), where("toUid", "==", cibleUid))),
        getDocs(query(collection(db, "friendRequests"),
          where("fromUid", "==", cibleUid), where("toUid", "==", myUid))),
      ]);

      let etat = "aucun";
      if (!sent.empty)     { etat = sent.docs[0].data().status === "accepted" ? "ami" : "envoyée"; }
      if (!received.empty) { etat = received.docs[0].data().status === "accepted" ? "ami" : "recue"; }

      setResultat({ uid: cibleUid, username: cible, etat });
    } catch {
      setResultat({ etat: "erreur" });
    }
    setLoading(false);
  }

  async function envoyerDemande(cibleUid, cibleUsername) {
    setLoadingAction(true);
    try {
      await addDoc(collection(db, "friendRequests"), {
        fromUid:      myUid,
        fromUsername: myUsername,
        toUid:        cibleUid,
        toUsername:   cibleUsername,
        status:       "pending",
        createdAt:    serverTimestamp(),
      });
      setSuccès(true);
      setResultat(r => ({ ...r, etat: "envoyée" }));
    } catch { /* silencieux */ }
    setLoadingAction(false);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

      <button onClick={onRetour} style={btnRetourStyle}>← Retour</button>

      <div>
        <h3 style={{ margin: "0 0 4px", fontSize: "18px", color: "var(--text)" }}>Ajouter un ami</h3>
        <p style={{ color: "var(--text-3)", fontSize: "13px", margin: 0 }}>
          Entre le pseudo de quelqu'un pour lui envoyer une demande
        </p>
      </div>

      <div style={{ display: "flex", gap: "8px" }}>
        <input
          type="text"
          placeholder="@pseudo"
          value={pseudo}
          onChange={e => setPseudo(e.target.value)}
          onKeyDown={e => e.key === "Enter" && chercher()}
          style={{ ...inputStyle, flex: 1 }}
        />
        <button onClick={chercher} disabled={loading} style={{
          background: "var(--purple)", color: "white",
          border: "none", borderRadius: "10px",
          padding: "0 18px", fontSize: "14px",
          fontWeight: "700", cursor: "pointer",
          opacity: loading ? 0.7 : 1, flexShrink: 0,
        }}>
          {loading ? "…" : "Chercher"}
        </button>
      </div>

      {resultat && (
        <div style={{
          background: "var(--surface)", borderRadius: "14px",
          padding: "16px", border: "1px solid var(--border)",
          animation: "slideUp 0.2s ease-out",
        }}>
          {resultat.etat === "not_found" && (
            <p style={{ color: "var(--text-3)", margin: 0, fontSize: "14px" }}>
              Aucun utilisateur avec ce pseudo. Vérifie l'orthographe.
            </p>
          )}
          {resultat.etat === "soi_meme" && (
            <p style={{ color: "var(--text-3)", margin: 0, fontSize: "14px" }}>
              C'est toi ! Entre le pseudo d'un ami 😄
            </p>
          )}
          {resultat.etat === "erreur" && (
            <p style={{ color: "var(--red)", margin: 0, fontSize: "14px" }}>
              Une erreur est survenue, réessaie.
            </p>
          )}
          {resultat.etat === "ami" && (
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <Avatar username={resultat.username} />
              <div>
                <p style={{ margin: "0 0 2px", fontWeight: "700", color: "var(--text)" }}>@{resultat.username}</p>
                <p style={{ margin: 0, color: "var(--green)", fontSize: "13px" }}>✓ Vous êtes déjà amis</p>
              </div>
            </div>
          )}
          {resultat.etat === "envoyée" && (
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <Avatar username={resultat.username} />
              <div>
                <p style={{ margin: "0 0 2px", fontWeight: "700", color: "var(--text)" }}>@{resultat.username}</p>
                <p style={{ margin: 0, color: "var(--amber)", fontSize: "13px" }}>
                  {succès ? "✓ Demande envoyée !" : "Demande déjà envoyée"}
                </p>
              </div>
            </div>
          )}
          {resultat.etat === "recue" && (
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <Avatar username={resultat.username} />
              <div>
                <p style={{ margin: "0 0 2px", fontWeight: "700", color: "var(--text)" }}>@{resultat.username}</p>
                <p style={{ margin: 0, color: "var(--blue)", fontSize: "13px" }}>
                  Il t'a déjà envoyé une demande — accepte-la dans tes demandes reçues
                </p>
              </div>
            </div>
          )}
          {resultat.etat === "aucun" && (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <Avatar username={resultat.username} />
                <p style={{ margin: 0, fontWeight: "700", color: "var(--text)" }}>@{resultat.username}</p>
              </div>
              <button
                onClick={() => envoyerDemande(resultat.uid, resultat.username)}
                disabled={loadingAction}
                style={{
                  background: "var(--purple)", color: "white",
                  border: "none", borderRadius: "20px",
                  padding: "8px 16px", fontSize: "13px",
                  fontWeight: "700", cursor: "pointer",
                  opacity: loadingAction ? 0.7 : 1, flexShrink: 0,
                }}
              >
                {loadingAction ? "…" : "Ajouter"}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Vue : comparaison de listes ──────────────────────────────────────────────

function VueComparer({ ami, listesUser, onRetour }) {
  const [matches, setMatches]   = useState(null);
  const [filmTire, setFilmTire] = useState(null);
  const [loading, setLoading]   = useState(true);
  const confettis = useConfettis(matches !== null && matches.length > 0 && !loading);

  useEffect(() => {
    async function charger() {
      try {
        const snap = await getDoc(doc(db, "users", ami.uid));
        if (!snap.exists()) { setMatches([]); setLoading(false); return; }
        const idsUser     = listesUser.aVoir.map(f => f.id);
        const aVoirAmi    = snap.data().listes?.aVoir || [];
        const filmsCommuns = aVoirAmi.filter(f => idsUser.includes(f.id));
        setMatches(filmsCommuns);
      } catch {
        setMatches([]);
      }
      setLoading(false);
    }
    charger();
  }, [ami, listesUser]);

  function tirerAuSort() {
    if (!matches || matches.length === 0) return;
    const pool   = filmTire ? matches.filter(f => f.id !== filmTire.id) : matches;
    const source = pool.length > 0 ? pool : matches;
    setFilmTire(source[Math.floor(Math.random() * source.length)]);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

      {/* Confettis */}
      <div aria-hidden="true">
        {confettis.map(c => (
          <div key={c.id} style={{
            position: "fixed", top: "-10px", left: `${c.x}vw`,
            width: c.taille, height: c.taille,
            background: c.couleur,
            borderRadius: Math.random() > 0.5 ? "50%" : "2px",
            animation: `tomber ${c.duree}s ${c.delai}s ease-in forwards`,
            transform: `rotate(${c.rotation}deg)`,
            zIndex: 999, pointerEvents: "none",
          }} />
        ))}
      </div>

      <button onClick={onRetour} style={btnRetourStyle}>← Retour</button>

      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        <Avatar username={ami.username} size={42} />
        <div>
          <p style={{ margin: 0, fontSize: "17px", fontWeight: "bold" }}>@{ami.username}</p>
          <p style={{ margin: 0, color: "var(--text-3)", fontSize: "13px" }}>Films à voir en commun</p>
        </div>
      </div>

      {loading ? (
        <p role="status" style={{ color: "var(--text-3)", textAlign: "center", padding: "20px" }}>Chargement…</p>
      ) : (
        <div aria-live="polite">
          {matches === null || matches.length === 0 ? (
            <div style={{
              background: "var(--surface)", borderRadius: "14px",
              padding: "28px", textAlign: "center",
              border: "1px solid var(--border)",
            }}>
              <p style={{ fontSize: "32px", margin: "0 0 12px" }}>🤷</p>
              <p style={{ color: "var(--text-3)", margin: 0, fontSize: "14px", lineHeight: "1.6" }}>
                Aucun film en commun pour l'instant.<br />Swipez plus tous les deux !
              </p>
            </div>
          ) : (
            <>
              <div style={{
                background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.2)",
                borderRadius: "14px", padding: "16px",
                textAlign: "center", marginBottom: "12px",
              }}>
                <p style={{ fontSize: "28px", margin: "0 0 4px" }}>🎉</p>
                <p style={{ color: "var(--green)", fontSize: "16px", fontWeight: "700", margin: 0 }}>
                  {matches.length} film{matches.length > 1 ? "s" : ""} en commun !
                </p>
              </div>

              <button onClick={tirerAuSort} style={{
                background: "var(--amber)", color: "#0d0d0d",
                border: "none", borderRadius: "14px",
                padding: "14px", fontSize: "15px",
                fontWeight: "700", cursor: "pointer",
                width: "100%", marginBottom: "12px",
                boxShadow: "0 4px 14px rgba(245,158,11,0.3)",
              }}>
                🎲 {filmTire ? "Retirer au sort" : "Choisir au sort"}
              </button>

              {filmTire && (
                <div style={{
                  display: "flex", gap: "14px", alignItems: "center",
                  background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.25)",
                  borderRadius: "14px", padding: "14px", marginBottom: "12px",
                  animation: "slideUp 0.25s ease-out",
                }}>
                  <img
                    src={`https://image.tmdb.org/t/p/w92${filmTire.poster_path}`}
                    alt={`Affiche de ${filmTire.title}`}
                    style={{ borderRadius: "8px", width: "54px", flexShrink: 0 }}
                  />
                  <div>
                    <p style={{ margin: "0 0 4px", fontSize: "10px", color: "var(--amber)", fontWeight: "700", letterSpacing: "0.8px", textTransform: "uppercase" }}>
                      Ce soir on regarde
                    </p>
                    <p style={{ margin: 0, fontSize: "15px", fontWeight: "700", color: "var(--text)" }}>{filmTire.title}</p>
                  </div>
                </div>
              )}

              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {matches.map(film => (
                  <div key={film.id} style={{
                    display: "flex", gap: "12px", alignItems: "center",
                    background: filmTire?.id === film.id ? "rgba(245,158,11,0.08)" : "var(--surface)",
                    border: `1px solid ${filmTire?.id === film.id ? "rgba(245,158,11,0.25)" : "var(--border)"}`,
                    borderRadius: "12px", padding: "10px",
                    transition: "all 0.2s",
                  }}>
                    <img
                      src={`https://image.tmdb.org/t/p/w92${film.poster_path}`}
                      alt={`Affiche de ${film.title}`}
                      style={{ borderRadius: "6px", width: "44px", flexShrink: 0 }}
                    />
                    <span style={{ fontSize: "14px", color: "var(--text)", fontWeight: "500" }}>{film.title}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Composant principal ──────────────────────────────────────────────────────

function Match({ user, username, listesUser, isGuest, onSeConnecter }) {
  const [vue, setVue]                       = useState("amis");
  const [amis, setAmis]                     = useState([]);
  const [demandesRecues, setDemandesRecues] = useState([]);
  const [amiSelectionne, setAmiSelectionne] = useState(null);
  const [copied, setCopied]                 = useState(false);
  const [chargement, setChargement]         = useState(!isGuest);

  const chargerAmis = useCallback(async () => {
    if (!user || isGuest) return;
    setChargement(true);
    try {
      const [snap1, snap2, snap3] = await Promise.all([
        getDocs(query(collection(db, "friendRequests"),
          where("fromUid", "==", user.uid), where("status", "==", "accepted"))),
        getDocs(query(collection(db, "friendRequests"),
          where("toUid", "==", user.uid), where("status", "==", "accepted"))),
        getDocs(query(collection(db, "friendRequests"),
          where("toUid", "==", user.uid), where("status", "==", "pending"))),
      ]);

      setAmis([
        ...snap1.docs.map(d => ({ id: d.id, uid: d.data().toUid,   username: d.data().toUsername   })),
        ...snap2.docs.map(d => ({ id: d.id, uid: d.data().fromUid, username: d.data().fromUsername })),
      ]);
      setDemandesRecues(snap3.docs.map(d => ({
        id: d.id,
        uid: d.data().fromUid,
        username: d.data().fromUsername,
      })));
    } catch (e) {
      console.error("Erreur chargement amis:", e);
    }
    setChargement(false);
  }, [user, isGuest]);

  useEffect(() => { chargerAmis(); }, [chargerAmis]);

  async function accepterDemande(demande) {
    try {
      await updateDoc(doc(db, "friendRequests", demande.id), { status: "accepted" });
      await chargerAmis();
    } catch (e) { console.error(e); }
  }

  async function refuserDemande(demande) {
    try {
      await deleteDoc(doc(db, "friendRequests", demande.id));
      await chargerAmis();
    } catch (e) { console.error(e); }
  }

  async function partagerPseudo() {
    const texte = `Rejoins-moi sur Swochi ! Mon pseudo : @${username}`;
    if (navigator.share) {
      try { await navigator.share({ title: "Swochi", text: texte }); return; } catch { return; }
    }
    try {
      await navigator.clipboard.writeText(texte);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch { /* silencieux */ }
  }

  if (vue === "ajouter") {
    return (
      <div style={conteneurStyle}>
        <VueAjouter
          myUid={user.uid}
          myUsername={username}
          onRetour={() => { setVue("amis"); chargerAmis(); }}
        />
      </div>
    );
  }

  if (vue === "comparer" && amiSelectionne) {
    return (
      <div style={conteneurStyle}>
        <VueComparer
          ami={amiSelectionne}
          listesUser={listesUser}
          onRetour={() => setVue("amis")}
        />
      </div>
    );
  }

  /* ── Mode invité ── */
  if (isGuest) {
    return (
      <div style={conteneurStyle}>
        {/* Bannière info */}
        <div style={{
          background: "var(--purple-dim)", border: "1px solid rgba(168,85,247,0.2)",
          borderRadius: "14px", padding: "16px 18px", marginBottom: "20px",
          display: "flex", gap: "12px", alignItems: "flex-start",
        }}>
          <span style={{ fontSize: "20px", lineHeight: 1, flexShrink: 0 }}>🔒</span>
          <div>
            <p style={{ margin: "0 0 6px", fontSize: "14px", fontWeight: "600", color: "var(--purple)" }}>
              Les amis nécessitent un compte
            </p>
            <p style={{ margin: "0 0 12px", fontSize: "13px", color: "var(--text-3)", lineHeight: "1.5" }}>
              Crée un compte gratuit pour ajouter des amis et comparer vos listes de films.
            </p>
            <button onClick={onSeConnecter} style={{
              background: "var(--purple)", color: "white", border: "none",
              borderRadius: "20px", padding: "8px 18px",
              fontSize: "13px", fontWeight: "600", cursor: "pointer",
            }}>
              Créer un compte →
            </button>
          </div>
        </div>

        {/* Aperçu désactivé */}
        <div style={{ opacity: 0.35, pointerEvents: "none", userSelect: "none" }}>
          <div style={{ background: "var(--surface)", borderRadius: "14px", padding: "14px", marginBottom: "8px", border: "1px solid var(--border)" }}>
            <p style={{ margin: 0, fontSize: "13px", color: "var(--text-3)", fontWeight: "700", letterSpacing: "1px", textTransform: "uppercase", marginBottom: "12px" }}>👥 Mes amis</p>
            {[1,2].map(i => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "8px 0", borderBottom: i === 1 ? "1px solid var(--divider)" : "none" }}>
                <div style={{ width: 36, height: 36, borderRadius: "50%", background: "var(--surface-3)" }} />
                <div style={{ flex: 1 }}>
                  <div style={{ width: "60%", height: 12, background: "var(--surface-3)", borderRadius: 6 }} />
                </div>
                <div style={{ width: 70, height: 28, background: "var(--surface-3)", borderRadius: 20 }} />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={conteneurStyle}>
      {chargement ? (
        <p role="status" style={{ color: "var(--text-3)", textAlign: "center", padding: "40px" }}>Chargement…</p>
      ) : (
        <VueAmis
          amis={amis}
          demandesRecues={demandesRecues}
          username={username}
          onComparer={ami => { setAmiSelectionne(ami); setVue("comparer"); }}
          onAccepter={accepterDemande}
          onRefuser={refuserDemande}
          onAjouter={() => setVue("ajouter")}
          onPartager={partagerPseudo}
          copied={copied}
        />
      )}
    </div>
  );
}

// ─── Styles partagés ──────────────────────────────────────────────────────────

const conteneurStyle    = { width: "100%", color: "var(--text)" };
const carteStyle        = { background: "var(--surface)", borderRadius: "14px", padding: "12px 14px", display: "flex", alignItems: "center", gap: "12px", border: "1px solid var(--border)", boxShadow: "var(--shadow-sm)" };
const titreSectionStyle = { margin: "0 0 10px", fontSize: "11px", fontWeight: "700", color: "var(--text-3)", letterSpacing: "1.2px", textTransform: "uppercase" };
const btnVertStyle      = { background: "var(--green)", color: "white", border: "none", borderRadius: "20px", padding: "6px 14px", fontSize: "13px", fontWeight: "700", cursor: "pointer", flexShrink: 0 };
const btnGrisStyle      = { background: "transparent", color: "var(--text-3)", border: "1px solid var(--border-2)", borderRadius: "20px", padding: "6px 12px", fontSize: "14px", cursor: "pointer", flexShrink: 0 };
const btnRetourStyle    = { background: "transparent", border: "none", color: "var(--text-3)", fontSize: "14px", cursor: "pointer", padding: 0, textAlign: "left" };
const inputStyle        = { background: "var(--input-bg)", border: "1px solid var(--input-border)", borderRadius: "10px", padding: "13px 14px", color: "var(--text)", fontSize: "15px", outline: "none" };

export default Match;
