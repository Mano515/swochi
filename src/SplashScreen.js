function SplashScreen() {
  return (
    <div style={{
      position: "fixed", inset: 0,
      background: "var(--bg)",
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      gap: "32px",
      zIndex: 9999,
      animation: "fonduIn 0.3s ease",
    }}>
      {/* Logo */}
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: "52px", marginBottom: "12px", lineHeight: 1 }}>🎬</div>
        <h1 style={{
          margin: 0,
          fontSize: "28px",
          fontWeight: "800",
          letterSpacing: "4px",
          color: "var(--text)",
        }}>SWOCHI</h1>
      </div>

      {/* Indicateur de chargement — trois points pulsants */}
      <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
        {[0, 1, 2].map(i => (
          <div
            key={i}
            style={{
              width: "8px", height: "8px",
              borderRadius: "50%",
              background: "var(--purple)",
              animation: `pulse 1.2s ease-in-out ${i * 0.2}s infinite`,
            }}
          />
        ))}
      </div>

      <style>{`
        @keyframes pulse {
          0%, 80%, 100% { transform: scale(0.6); opacity: 0.3; }
          40%            { transform: scale(1);   opacity: 1;   }
        }
      `}</style>
    </div>
  );
}

export default SplashScreen;
