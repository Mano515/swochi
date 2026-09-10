/* ── Portrait de goûts ────────────────────────────
   Tout se calcule sur les listes déjà en mémoire :
   aucun appel réseau, et l'écran cesse de s'arrêter
   à mi-hauteur. On lit les films retenus, pas les
   films écartés — c'est le goût, pas le rejet.
──────────────────────────────────────────────────── */
function portrait(films, genres) {
  if (!films.length) return null;

  const parGenre = new Map();
  for (const f of films)
    for (const id of f.genre_ids || [])
      parGenre.set(id, (parGenre.get(id) || 0) + 1);

  const nomDe = id => genres.find(g => g.id === id)?.name;
  const tops = [...parGenre.entries()]
    .map(([id, n]) => ({ nom: nomDe(id), n }))
    .filter(g => g.nom)
    .sort((a, b) => b.n - a.n)
    .slice(0, 5);

  const parDecennie = new Map();
  for (const f of films) {
    const a = f.release_date ? Number(f.release_date.slice(0, 4)) : null;
    if (!a) continue;
    const d = Math.floor(a / 10) * 10;
    parDecennie.set(d, (parDecennie.get(d) || 0) + 1);
  }
  const decennie = [...parDecennie.entries()].sort((a, b) => b[1] - a[1])[0];

  const notes = films.map(f => f.vote_average).filter(n => n > 0);
  const moyenne = notes.length ? notes.reduce((a, b) => a + b, 0) / notes.length : null;

  return { tops, decennie, moyenne, total: films.length };
}

function Profil({ username, user, listes: listesBrut, genres = [], isGuest, onSeConnecter }) {
  const listes = listesBrut || { aVoir: [], pasInteresse: [], dejavu: [] };
  const totalSwipes = listes.aVoir.length + listes.pasInteresse.length + listes.dejavu.length;
  const initiale = username ? username[0].toUpperCase() : "?";

  /* ── Mode invité ── */
  if (isGuest) {
    return (
      <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: "16px" }}>

        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "14px", padding: "28px 0 12px" }}>
          <div style={{
            width: "80px", height: "80px", borderRadius: "50%",
            background: "linear-gradient(135deg, var(--surface-3), var(--surface-2))",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "var(--t-2xl)", border: "2px dashed var(--border-2)",
          }}>👤</div>
          <div style={{ textAlign: "center" }}>
            <p style={{ margin: "0 0 5px", fontSize: "var(--t-lg)", fontWeight: "700", color: "var(--text)" }}>Mode invité</p>
            <p style={{ margin: 0, color: "var(--text-3)", fontSize: "var(--t-sm)" }}>Swipes non sauvegardés</p>
          </div>
        </div>

        <StatsCard label="Cette session" totalSwipes={totalSwipes} listes={listes} />

        <div style={{
          background: "var(--accent-doux)", border: "1px solid rgb(var(--accent-rvb) / 0.2)",
          borderRadius: "var(--r-lg)", padding: "24px 20px", textAlign: "center",
          display: "flex", flexDirection: "column", gap: "12px",
        }}>
          <p style={{ margin: 0, fontSize: "var(--t-md)", fontWeight: "700", color: "var(--text)" }}>Sauvegarde tes swipes 🎬</p>
          <p style={{ margin: 0, fontSize: "var(--t-sm)", color: "var(--text-3)", lineHeight: "1.6" }}>
            Crée un compte gratuit pour ne plus jamais perdre ta liste et comparer avec tes amis.
          </p>
          <button onClick={onSeConnecter} style={{
            background: "var(--accent)", color: "white", border: "none",
            borderRadius: "var(--r-pill)", padding: "13px 28px",
            fontSize: "var(--t-md)", fontWeight: "700", cursor: "pointer",
            boxShadow: "0 4px 16px rgb(var(--accent-rvb) / 0.35)",
          }}>Créer un compte →</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: "16px" }}>

      {/* Avatar + nom */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "14px", padding: "28px 0 12px" }}>
        <div style={{
          width: "80px", height: "80px", borderRadius: "50%",
          background: "linear-gradient(135deg, var(--accent), var(--accent-txt))",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: "var(--t-2xl)", fontWeight: "700", color: "white",
          boxShadow: "0 6px 20px rgb(var(--accent-rvb) / 0.35)",
        }}>{initiale}</div>
        <div style={{ textAlign: "center" }}>
          <p style={{ margin: "0 0 5px", fontSize: "var(--t-xl)", fontWeight: "700", color: "var(--text)" }}>@{username}</p>
          <p style={{ margin: 0, color: "var(--text-3)", fontSize: "var(--t-sm)" }}>{user?.email}</p>
        </div>
      </div>

      {/* Stats */}
      <StatsCard label="Mes stats" totalSwipes={totalSwipes} listes={listes} />

      {/* Portrait de goûts */}
      <PortraitCard portrait={portrait(listes.aVoir, genres)} />

      {/* Info compte */}
      <div style={{
        background: "var(--surface)", borderRadius: "var(--r-lg)", padding: "22px 20px",
        border: "1px solid var(--border)", boxShadow: "var(--shadow-sm)",
        display: "flex", flexDirection: "column", gap: "14px",
      }}>
        <p style={{ margin: "0 0 4px", color: "var(--text-3)", fontSize: "var(--t-xs)", fontWeight: "700", letterSpacing: "1.2px", textTransform: "uppercase" }}>
          Mon compte
        </p>
        <InfoLigne label="Pseudo" valeur={`@${username}`} />
        <div style={{ height: "1px", background: "var(--divider)" }} />
        <InfoLigne label="Email" valeur={user?.email} />
      </div>

    </div>
  );
}

function StatsCard({ label, totalSwipes, listes }) {
  return (
    <div style={{
      background: "var(--surface)", borderRadius: "var(--r-lg)", padding: "22px 20px",
      border: "1px solid var(--border)", boxShadow: "var(--shadow-sm)",
    }}>
      <p style={{ margin: "0 0 18px", color: "var(--text-3)", fontSize: "var(--t-xs)", fontWeight: "700", letterSpacing: "1.2px", textTransform: "uppercase" }}>
        {label}
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", textAlign: "center", gap: "8px" }}>
        <StatItem valeur={totalSwipes}                label="Swipés" />
        <StatItem valeur={listes.aVoir.length}        label="À voir"   couleur="var(--green-txt)" />
        <StatItem valeur={listes.dejavu.length}       label="Déjà vu"  couleur="var(--blue-txt)" />
        <StatItem valeur={listes.pasInteresse.length} label="Skippés"  couleur="var(--red-txt)" />
      </div>
    </div>
  );
}

function PortraitCard({ portrait: p }) {
  if (!p) return null;
  const max = p.tops[0]?.n || 1;
  return (
    <div style={{
      background: "var(--surface)", borderRadius: "var(--r-lg)", padding: "22px 20px",
      border: "1px solid var(--border)", boxShadow: "var(--shadow-sm)",
    }}>
      <p style={{ margin: "0 0 4px", color: "var(--text-3)", fontSize: "var(--t-xs)", fontWeight: "700", letterSpacing: "1.2px", textTransform: "uppercase" }}>
        Mes goûts
      </p>
      <p style={{ margin: "0 0 18px", color: "var(--text-3)", fontSize: "var(--t-xs)" }}>
        D'après les {p.total} film{p.total > 1 ? "s" : ""} de ta liste « À voir »
      </p>

      {/* Genres : la barre porte la proportion, le nombre reste lisible seul */}
      <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "20px" }}>
        {p.tops.map(g => (
          <div key={g.nom} style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <span style={{ flex: "0 0 92px", fontSize: "var(--t-sm)", color: "var(--text-2)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{g.nom}</span>
            <span style={{ flex: 1, height: "8px", borderRadius: "var(--r-pill)", background: "var(--surface-3)", overflow: "hidden" }}>
              <span style={{ display: "block", height: "100%", width: `${Math.round((g.n / max) * 100)}%`, background: "var(--accent)", borderRadius: "var(--r-pill)" }} />
            </span>
            <span style={{ flex: "0 0 28px", textAlign: "right", fontSize: "var(--t-xs)", color: "var(--text-3)", fontVariantNumeric: "tabular-nums" }}>{g.n}</span>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", gap: "10px" }}>
        {p.decennie && (
          <Fait valeur={`${p.decennie[0]}s`} label="Décennie de prédilection" />
        )}
        {p.moyenne && (
          <Fait valeur={`★ ${p.moyenne.toFixed(1)}`} label="Note moyenne de tes choix" />
        )}
      </div>
    </div>
  );
}

function Fait({ valeur, label }) {
  return (
    <div style={{
      flex: 1, minWidth: 0, background: "var(--surface-2)", borderRadius: "var(--r-md)",
      padding: "12px 14px", border: "1px solid var(--border)",
    }}>
      <p style={{ margin: "0 0 2px", fontSize: "var(--t-lg)", fontWeight: "700", color: "var(--text)" }}>{valeur}</p>
      <p style={{ margin: 0, fontSize: "var(--t-2xs)", color: "var(--text-3)", lineHeight: 1.35 }}>{label}</p>
    </div>
  );
}

function StatItem({ valeur, label, couleur = "var(--text)" }) {
  return (
    <div>
      <p style={{ margin: "0 0 4px", fontSize: "var(--t-xl)", fontWeight: "700", color: couleur }}>{valeur}</p>
      <p style={{ margin: 0, fontSize: "var(--t-xs)", color: "var(--text-3)" }}>{label}</p>
    </div>
  );
}

function InfoLigne({ label, valeur }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px" }}>
      <span style={{ color: "var(--text-3)", fontSize: "var(--t-sm)" }}>{label}</span>
      <span style={{ color: "var(--text-2)", fontSize: "var(--t-sm)", fontWeight: "500", textAlign: "right", wordBreak: "break-all" }}>{valeur}</span>
    </div>
  );
}

export default Profil;
