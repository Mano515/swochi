# 🎬 Swochi

**Swochi** est une application de swipe de films — pensée pour ne plus jamais passer 20 minutes à chercher quoi regarder avec ses amis.

> Swipez des films, construisez vos listes, trouvez ce que vous avez en commun.

🔗 **[Essayer l'app](https://swochi.vercel.app)**

---

## Aperçu

Swochi fonctionne comme un Tinder pour les films. Vous swipez les affiches une par une, vous les ajoutez à vos listes, et vous comparez ensuite avec vos amis pour trouver un film à regarder ensemble.

---

## Fonctionnalités

### 🎴 Swipe de films
- Faites glisser l'affiche vers la **droite** pour mettre un film dans "À voir"
- Vers la **gauche** pour le passer (Skip)
- Vers le **haut** si vous l'avez déjà vu
- Utilisez les boutons ✕ / 👁 / ♥ si vous préférez cliquer
- Bouton ↩ pour annuler le dernier swipe

### 🔍 Détails du film
- Appuyez sur la partie basse de l'affiche pour voir le synopsis, le genre, la durée, la note, le réalisateur et les acteurs principaux

### 🎭 Filtres par genre
- Filtrez les films par genre (Action, Comédie, Horreur…) via la barre de catégories
- Glissez la barre ou utilisez les flèches pour naviguer entre les genres

### 📂 Mes Films
- Retrouvez tous vos films classés en trois listes : **À voir**, **Déjà vu**, **Skip**
- Recherchez un film par titre dans vos listes
- Déplacez un film d'une liste à une autre ou supprimez-le via le menu **···**

### 🤝 Match
- Entrez le pseudo d'un ami pour voir les films que vous avez tous les deux mis en "À voir"
- Tirez un film au sort parmi vos matchs avec le bouton 🎲
- Relancez le tirage pour en choisir un autre
- Partagez votre pseudo à vos amis via le bouton **Partager**

### 👤 Profil
- Consultez vos statistiques : nombre de films swipés, à voir, déjà vus, skippés
- Accessible depuis le menu burger en haut à droite

---

## Algorithme de recommandation

Swochi adapte les films suggérés à votre profil :

- **Nouveau compte** — les premiers films proposés sont des incontournables (notes élevées, très votés)
- **Utilisateur actif** — une partie des suggestions est basée sur les films que vous avez aimés (recommandations TMDB)
- **Filtre genre actif** — les films du genre choisi, triés par popularité

Les films déjà swipés ne réapparaissent jamais, même après un changement de catégorie.

---

## Stack technique

| Technologie | Usage |
|---|---|
| **React 18** | Interface utilisateur |
| **Firebase Auth** | Connexion email et Google |
| **Firestore** | Stockage des listes et profils |
| **Firebase App Check** | Protection contre les abus |
| **TMDB API** | Données films (affiches, synopsis, casting...) |
| **Framer Motion** | Animations de swipe |
| **Vercel** | Hébergement |

---

## Sécurité

- Chaque utilisateur ne peut modifier que ses propres données (règles Firestore)
- Les pseudos sont réservés atomiquement — deux personnes ne peuvent pas choisir le même simultanément
- Les requêtes Firebase sont protégées par reCAPTCHA v3 (invisible)
- Les clés d'API ne sont jamais exposées dans le code source

---

## Lancer le projet en local

### Prérequis
- Node.js 20+
- Un projet Firebase (Auth + Firestore activés)
- Une clé API TMDB (https://www.themoviedb.org/settings/api)

### Installation

```bash
git clone https://github.com/Mano515/swochi.git
cd swochi
npm install --legacy-peer-deps
```

### Variables d'environnement

Créez un fichier `.env` à la racine :

```env
REACT_APP_FIREBASE_API_KEY=...
REACT_APP_FIREBASE_AUTH_DOMAIN=...
REACT_APP_FIREBASE_PROJECT_ID=...
REACT_APP_FIREBASE_STORAGE_BUCKET=...
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=...
REACT_APP_FIREBASE_APP_ID=...
REACT_APP_TMDB_KEY=...
REACT_APP_RECAPTCHA_KEY=...
```

### Lancement

```bash
npm start
```

L'app est disponible sur http://localhost:3000

---

## Déploiement

L'app est déployée automatiquement sur **Vercel** à chaque merge sur `main`.

---

*Projet personnel — construit avec Claude Code*
