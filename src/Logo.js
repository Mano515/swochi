/* ══════════════════════════════════════════════════
   SWOCHI — Verrou logo

   L'icône reste le SVG vectoriel d'origine ; le nom
   devient du vrai texte.

   Pourquoi : logo_swochi_nom.svg embarquait un <text>
   en CocogooseProTrial, une fonte d'essai absente de
   tout appareil. Pire, les positions x y étaient
   figées glyphe par glyphe pour les métriques de
   Cocogoose, puis « CHI » coulait librement — d'où le
   « SW OCHI » visible dès que la fonte manquait,
   c'est-à-dire partout sauf sur le poste du designer.

   En texte, le nom rend identiquement sur tous les
   appareils, reste net à n'importe quelle taille et
   suit la couleur du thème.
══════════════════════════════════════════════════ */

function Logo({ hauteur = 32, avecNom = true }) {
  return (
    <span
      role="img"
      aria-label="Swochi"
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: `${Math.round(hauteur * 0.24)}px`,
      }}
    >
      <img
        src="/logo_swochi.svg"
        alt=""
        aria-hidden="true"
        style={{ height: `${hauteur}px`, width: `${hauteur}px`, display: "block" }}
      />
      {avecNom && (
        <span
          aria-hidden="true"
          style={{
            fontSize: `${Math.round(hauteur * 0.72)}px`,
            fontWeight: 800,
            letterSpacing: "0.005em",
            lineHeight: 1,
            color: "var(--purple)",
            whiteSpace: "nowrap",
          }}
        >
          SWOCHI
        </span>
      )}
    </span>
  );
}

export default Logo;
