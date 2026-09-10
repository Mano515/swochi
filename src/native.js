/* ══════════════════════════════════════════════════
   SWOCHI — Couche native (Capacitor / Android)

   Tout ce fichier est inerte sur le web : `estNatif`
   est faux dans un navigateur, chaque fonction sort
   immédiatement. Le build Vercel est donc inchangé.
══════════════════════════════════════════════════ */

import { useEffect, useRef } from "react";
import { Capacitor } from "@capacitor/core";
import { App as AppNatif } from "@capacitor/app";
import { SplashScreen } from "@capacitor/splash-screen";
import { StatusBar, Style } from "@capacitor/status-bar";

export const estNatif = Capacitor.isNativePlatform();

// Couleurs des barres système — alignées sur --bg dans index.css
const COULEUR_BARRE = { dark: "#0d0d0d", light: "#f2f2f7" };

/** Aligne la barre de statut (fond + icônes) sur le thème courant. */
export async function synchroniserBarreStatut(theme) {
  if (!estNatif) return;
  try {
    // Style.Light = icônes sombres (fond clair), Style.Dark = icônes claires.
    await StatusBar.setStyle({ style: theme === "light" ? Style.Light : Style.Dark });
    await StatusBar.setBackgroundColor({ color: COULEUR_BARRE[theme] || COULEUR_BARRE.dark });
  } catch {
    // Barre indisponible (vieux Android, mode immersif) — sans gravité.
  }
}

/** Masque le splash natif. Appelé une fois React monté, pour éviter le flash blanc. */
export async function masquerSplash() {
  if (!estNatif) return;
  try { await SplashScreen.hide(); } catch { /* déjà masqué */ }
}

/**
 * Branche le bouton retour physique / le geste de retour d'Android.
 *
 * `resoudre` est rappelé à chaque retour : s'il renvoie true, le retour est
 * considéré comme consommé (on a fermé un panneau, changé d'onglet…) ;
 * s'il renvoie false, l'app se ferme — le comportement attendu sur Android.
 */
export function useBoutonRetour(resoudre) {
  // Ref pour garder le handler à jour sans réenregistrer le listener natif.
  const handlerRef = useRef(resoudre);
  handlerRef.current = resoudre;

  useEffect(() => {
    if (!estNatif) return undefined;

    let listener;
    let monte = true;

    AppNatif.addListener("backButton", () => {
      if (!handlerRef.current?.()) AppNatif.exitApp();
    }).then(l => {
      listener = l;
      if (!monte) l.remove();   // démonté avant la résolution
    });

    return () => { monte = false; listener?.remove(); };
  }, []);
}
