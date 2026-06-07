function Profil({ username, user, listes, isGuest, onSeConnecter }) {
  const totalSwipes = listes.aVoir.length + listes.pasInteresse.length + listes.dejavu.length;
  const initiale = username ? username[0].toUpperCase() : "?";

  /* ── Mode invité ── */
  if (isGuest) {
    return (
      <div style={{ width: "100%" }}>
        <div className="profil-grid">
          {/* Colonne gauche */}
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <AvatarCard initiale="👤" username={null} email={null} guest />

            <div style={{
              background: "var(--purple-dim)", border: "1px solid rgba(168,85,247,0.2)",
              borderRadius: "18px", padding: "24px 20px", textAlign: "center",
              display: "flex", flexDirection: "column", gap: "12px",
            }}>
              <p style={{ margin: 0, fontSize: "16px", fontWeight: "700", color: "var(--text)" }}>
                Sauvegarde tes swipes 🎬
              </p>
              <p style={{ margin: 0, fontSize: "13px", color: "var(--text-3)", lineHeight: "1.6" }}>
                Crée un compte gratuit pour ne plus jamais perdre ta liste et comparer avec tes amis.
              </p>
              <button onClick={onSeConnecter} style={{
                background: "var(--purple)", color: "white", border: "none",
                borderRadius: "50px", padding: "13px 28px",
                fontSize: "15px", fontWeight: "700", cursor: "pointer",
                boxShadow: "0 4px 16px rgba(168,85,247,0.35)",
              }}>
                Créer un compte →
              </button>
            </div>
          </div>

          {/* Colonne droite — stats */}
          <div>
            <StatsCard
              label="Cette session"
              totalSwipes={totalSwipes}
              listes={listes}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ width: "100%" }}>
      <div className="profil-grid">
        {/* Colonne gauche */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <AvatarCard initiale={initiale} username={username} email={user?.email} />

          {/* Info compte */}
          <div style={{
            background: "var(--surface)", borderRadius: "18px", padding: "22px 20px",
            border: "1px solid var(--border)", boxShadow: "var(--shadow-sm)",
            display: "flex", flexDirection: "column", gap: "14px",
          }}>
            <p style={{ margin: "0 0 4px", color: "var(--text-3)", fontSize: "11px", fontWeight: "700", letterSpacing: "1.2px", textTransform: "uppercase" }}>
              Mon compte
            </p>
            <InfoLigne label="Pseudo" valeur={`@${username}`} />
            <div style={{ height: "1px", background: "var(--divider)" }} />
            <InfoLigne label="Email" valeur={user?.email} />
          </div>
        </div>

        {/* Colonne droite — stats */}
        <div>
          <StatsCard
            label="Mes stats"
            totalSwipes={totalSwipes}
            listes={listes}
          />
        </div>
      </div>
    </div>
  );
}

/* ── Sous-composants ───────────────────────────────────────── */

function AvatarCard({ initiale, username, email, guest }) {
  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center",
      gap: "14px", padding: "28px 20px",
      background: "var(--surface)", borderRadius: "18px",
      border: "1px solid var(--border)", boxShadow: "var(--shadow-sm)",
    }}>
      <div style={{
        width: "80px", height: "80px", borderRadius: "50%",
        background: guest
          ? "linear-gradient(135deg, var(--surface-3), var(--surface-2))"
          : "linear-gradient(135deg, #a855f7, #3b82f6)",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: guest ? "32px" : "30px",
        fontWeight: "700", color: "white",
        boxShadow: guest ? "none" : "0 6px 20px rgba(168,85,247,0.35)",
        border: guest ? "2px dashed var(--border-2)" : "none",
      }}>
        {initiale}
      </div>
      <div style={{ textAlign: "center" }}>
        <p style={{ margin: "0 0 5px", fontSize: "20px", fontWeight: "700", color: "var(--text)" }}>
          {guest ? "Mode invité" : `@${username}`}
        </p>
        <p style={{ margin: 0, color: "var(--text-3)", fontSize: "13px" }}>
          {guest ? "Swipes non sauvegardés" : email}
        </p>
      </div>
    </div>
  );
}

function StatsCard({ label, totalSwipes, listes }) {
  return (
    <div style={{
      background: "var(--surface)", borderRadius: "18px", padding: "22px 20px",
      border: "1px solid var(--border)", boxShadow: "var(--shadow-sm)",
      height: "100%", boxSizing: "border-box",
    }}>
      <p style={{ margin: "0 0 20px", color: "var(--text-3)", fontSize: "11px", fontWeight: "700", letterSpacing: "1.2px", textTransform: "uppercase" }}>
        {label}
      </p>

      {/* 2×2 sur mobile, 4 colonnes si colonne large */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
        <StatItem valeur={totalSwipes}                label="Swipés"   couleur="var(--text)" />
        <StatItem valeur={listes.aVoir.length}        label="À voir"   couleur="var(--green)" />
        <StatItem valeur={listes.dejavu.length}       label="Déjà vu"  couleur="var(--blue)" />
        <StatItem valeur={listes.pasInteresse.length} label="Skippés"  couleur="var(--red)" />
      </div>
    </div>
  );
}

function StatItem({ valeur, label, couleur }) {
  return (
    <div style={{
      background: "var(--surface-2)", borderRadius: "14px",
      padding: "16px", textAlign: "center",
    }}>
      <p style={{ margin: "0 0 6px", fontSize: "28px", fontWeight: "800", color: couleur }}>{valeur}</p>
      <p style={{ margin: 0, fontSize: "12px", color: "var(--text-3)", fontWeight: "500" }}>{label}</p>
    </div>
  );
}

function InfoLigne({ label, valeur }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px" }}>
      <span style={{ color: "var(--text-3)", fontSize: "14px" }}>{label}</span>
      <span style={{ color: "var(--text-2)", fontSize: "14px", fontWeight: "500", textAlign: "right", wordBreak: "break-all" }}>{valeur}</span>
    </div>
  );
}

export default Profil;
