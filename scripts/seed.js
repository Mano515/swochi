/**
 * seed.js — Peuple Firestore avec 2 comptes de test + relation d'amis
 *
 * Usage :
 *   node scripts/seed.js            → crée tout
 *   node scripts/seed.js --reset    → supprime et recrée tout
 *
 * Prérequis :
 *   - Avoir téléchargé la clé de service Firebase (serviceAccount.json)
 *     et l'avoir placée dans scripts/serviceAccount.json
 *   - npm install firebase-admin --save-dev  (déjà fait)
 */

const admin = require("firebase-admin");
const path  = require("path");

// ── Config ─────────────────────────────────────────────────────────────────────
const SERVICE_ACCOUNT_PATH = path.join(__dirname, "serviceAccount.json");

const TEST_USERS = [
  {
    email:    "test1@swochi-test.dev",
    password: "Swochi123!",
    username: "alice_test",
    // Films "À voir" (ids TMDB populaires)
    aVoir: [
      { id: 550,   title: "Fight Club",               poster_path: "/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg", release_date: "1999-10-15" },
      { id: 13,    title: "Forrest Gump",              poster_path: "/arw2vcBveWOVZr6pxd9XTd1TdQa.jpg", release_date: "1994-07-06" },
      { id: 680,   title: "Pulp Fiction",              poster_path: "/d5iIlFn5s0ImszYzBPb8JPIfbXD.jpg", release_date: "1994-09-10" },
      { id: 238,   title: "Le Parrain",                poster_path: "/3bhkrj58Vtu7enYsLkQLiHV8eDy.jpg", release_date: "1972-03-14" },
      { id: 27205, title: "Inception",                 poster_path: "/ljsZTbVsrQSqZgWeep2B1QiDKuh.jpg", release_date: "2010-07-14" },
    ],
    pasInteresse: [
      { id: 11,    title: "Star Wars",                 poster_path: "/6FfCtAuVAW8XJjZ7eWeLibRLWTw.jpg", release_date: "1977-05-25" },
    ],
    dejavu: [
      { id: 19404, title: "Dilwale Dulhania Le Jayenge", poster_path: "/2CAL2433ZeIihfX1Hb2139CX0pW.jpg", release_date: "1995-10-20" },
    ],
  },
  {
    email:    "test2@swochi-test.dev",
    password: "Swochi123!",
    username: "bob_test",
    // Films "À voir" — certains en commun avec alice (550, 680, 27205)
    aVoir: [
      { id: 550,   title: "Fight Club",               poster_path: "/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg", release_date: "1999-10-15" },
      { id: 680,   title: "Pulp Fiction",              poster_path: "/d5iIlFn5s0ImszYzBPb8JPIfbXD.jpg", release_date: "1994-09-10" },
      { id: 27205, title: "Inception",                 poster_path: "/ljsZTbVsrQSqZgWeep2B1QiDKuh.jpg", release_date: "2010-07-14" },
      { id: 157336, title: "Interstellar",             poster_path: "/gEU2QniE6E77NI6lCU6MxlNBvIe.jpg", release_date: "2014-11-05" },
      { id: 299536, title: "Avengers: Infinity War",   poster_path: "/7WsyChQLEftFiDOVTGkv3hFpyyt.jpg", release_date: "2018-04-25" },
    ],
    pasInteresse: [],
    dejavu: [
      { id: 238,   title: "Le Parrain",                poster_path: "/3bhkrj58Vtu7enYsLkQLiHV8eDy.jpg", release_date: "1972-03-14" },
    ],
  },
];

// ── Initialisation ─────────────────────────────────────────────────────────────
let serviceAccount;
try {
  serviceAccount = require(SERVICE_ACCOUNT_PATH);
} catch {
  console.error("\n❌ Fichier introuvable : scripts/serviceAccount.json");
  console.error("   → Firebase Console → Paramètres du projet → Comptes de service");
  console.error("   → Générer une nouvelle clé privée → placer dans scripts/serviceAccount.json\n");
  process.exit(1);
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const auth = admin.auth();
const db   = admin.firestore();

// ── Helpers ────────────────────────────────────────────────────────────────────
async function getOrCreateUser(email, password, username) {
  let uid;
  try {
    const existing = await auth.getUserByEmail(email);
    uid = existing.uid;
    console.log(`  ✓ Compte existant : ${email} (${uid})`);
  } catch {
    const created = await auth.createUser({ email, password, displayName: username });
    uid = created.uid;
    console.log(`  ✓ Compte créé     : ${email} (${uid})`);
  }
  return uid;
}

async function deleteUser(email) {
  try {
    const u = await auth.getUserByEmail(email);
    await auth.deleteUser(u.uid);
    console.log(`  🗑  Auth supprimé  : ${email}`);
  } catch { /* pas trouvé, ok */ }
}

async function seed() {
  const reset = process.argv.includes("--reset");

  // ── Reset optionnel ──────────────────────────────────────────────────────────
  if (reset) {
    console.log("\n🔄 Reset en cours…");
    for (const u of TEST_USERS) {
      await deleteUser(u.email);
      // Supprime le doc user si uid trouvé
      const snap = await db.collection("users").where("username", "==", u.username).get();
      for (const d of snap.docs) {
        await d.ref.delete();
        console.log(`  🗑  Firestore supprimé : users/${d.id}`);
      }
      // Supprime le username réservé
      try { await db.collection("usernames").doc(u.username).delete(); } catch {}
    }
    // Supprime les friendRequests entre les deux comptes test
    const frSnap = await db.collection("friendRequests").get();
    const testEmails = TEST_USERS.map(u => u.username);
    for (const d of frSnap.docs) {
      const data = d.data();
      if (testEmails.includes(data.fromUsername) || testEmails.includes(data.toUsername)) {
        await d.ref.delete();
        console.log(`  🗑  friendRequest supprimé : ${d.id}`);
      }
    }
    console.log("  ✓ Reset terminé\n");
  }

  // ── Création des comptes ─────────────────────────────────────────────────────
  console.log("\n👤 Création des comptes de test…");
  const uids = [];
  for (const u of TEST_USERS) {
    const uid = await getOrCreateUser(u.email, u.password, u.username);
    uids.push(uid);
  }

  // ── Documents Firestore ──────────────────────────────────────────────────────
  console.log("\n📁 Écriture des documents Firestore…");
  for (let i = 0; i < TEST_USERS.length; i++) {
    const u   = TEST_USERS[i];
    const uid = uids[i];

    // users/{uid}
    await db.collection("users").doc(uid).set({
      email:    u.email,
      username: u.username,
      listes: {
        aVoir:        u.aVoir,
        pasInteresse: u.pasInteresse,
        dejavu:       u.dejavu,
      },
    }, { merge: true });
    console.log(`  ✓ users/${uid} → @${u.username}`);

    // usernames/{username}
    await db.collection("usernames").doc(u.username).set({ uid }, { merge: true });
    console.log(`  ✓ usernames/${u.username}`);
  }

  // ── Relation d'amis acceptée ─────────────────────────────────────────────────
  console.log("\n🤝 Création de la relation d'amis…");
  const [uid1, uid2] = uids;
  const [u1, u2]     = TEST_USERS;

  // Vérifie si une demande existe déjà
  const existing = await db.collection("friendRequests")
    .where("fromUid", "==", uid1)
    .where("toUid",   "==", uid2)
    .get();

  if (existing.empty) {
    await db.collection("friendRequests").add({
      fromUid:      uid1,
      fromUsername: u1.username,
      toUid:        uid2,
      toUsername:   u2.username,
      status:       "accepted",
      createdAt:    admin.firestore.FieldValue.serverTimestamp(),
    });
    console.log(`  ✓ friendRequest : @${u1.username} ↔ @${u2.username} (accepted)`);
  } else {
    console.log(`  ↩ Relation déjà existante, pas de doublon`);
  }

  // ── Résumé ───────────────────────────────────────────────────────────────────
  console.log("\n✅ Seed terminé !\n");
  console.log("┌─────────────────────────────────────────────────────────────┐");
  console.log("│  Comptes de test                                            │");
  console.log("├─────────────────────────────────────────────────────────────┤");
  for (const u of TEST_USERS) {
    const commun = u === u1 ? "Fight Club, Pulp Fiction, Inception" : "(idem)";
    console.log(`│  Email    : ${u.email.padEnd(43)}│`);
    console.log(`│  Password : ${u.password.padEnd(43)}│`);
    console.log(`│  Pseudo   : @${u.username.padEnd(42)}│`);
    console.log(`│  Films À voir : ${u.aVoir.length} films${" ".repeat(38)}│`);
    console.log("├─────────────────────────────────────────────────────────────┤");
  }
  console.log("│  Films EN COMMUN : Fight Club, Pulp Fiction, Inception      │");
  console.log("│  → Comparer les listes doit afficher 3 matchs + confettis   │");
  console.log("└─────────────────────────────────────────────────────────────┘\n");
  console.log("Pour tester :");
  console.log("  1. Ouvre l'app dans Chrome + Chrome incognito");
  console.log("  2. Connecte-toi avec test1@swochi-test.dev (mot de passe : Swochi123!)");
  console.log("  3. Connecte-toi avec test2@swochi-test.dev dans l'autre fenêtre");
  console.log("  4. Match → Comparer → tu dois voir 3 films + confettis\n");

  process.exit(0);
}

seed().catch(e => {
  console.error("\n❌ Erreur :", e.message);
  process.exit(1);
});
