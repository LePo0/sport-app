# sport-app

Application mobile d'entraînement sportif (Expo / React Native). Elle sert à créer ses exercices, à les assembler en programmes (séries, tours, temps de repos), à lancer une séance guidée avec chrono et signaux sonores, puis à suivre l'historique des séances et l'évolution de son poids.

Toutes les données sont stockées en local sur l'appareil (SQLite). Il n'y a ni compte ni serveur.

## Fonctionnalités

- **Exercices** : création d'exercices mesurés en répétitions ou en durée, avec une image ou une vidéo facultative prise dans la galerie.
- **Programmes** : enchaînement d'exercices réordonnables par glisser-déposer. Pour chaque étape, on règle le nombre de séries, les répétitions ou la durée, le repos entre séries et le repos après l'exercice. Au niveau du programme, on règle le nombre de tours et le repos entre tours.
- **Lecteur de séance** : déroulé automatique du programme avec compte à rebours, phase de mise en place de 10 s avant les exercices chronométrés (qu'on peut passer), sifflet au début et à la fin d'un exercice, tic-tac pendant le chrono, annonce de l'exercice suivant pendant les repos.
- **Séances** : calendrier des séances réalisées et détail de chacune. Chaque séance enregistre une copie figée du programme joué, si bien que modifier le programme plus tard ne change pas l'historique.
- **Profil** : taille, historique du poids et calcul de l'IMC.

## Stack technique

| Domaine | Outil |
| --- | --- |
| Framework | [Expo SDK 57](https://docs.expo.dev/versions/v57.0.0/), React Native 0.86, React 19 |
| Navigation | `expo-router` (routes basées sur les fichiers, onglets) |
| Base de données | `expo-sqlite` + [Drizzle ORM](https://orm.drizzle.team/) (migrations via `drizzle-kit`) |
| Médias / audio | `expo-image`, `expo-video`, `expo-image-picker`, `expo-audio` |
| UI | `@expo/vector-icons`, police Orbitron, `react-native-calendars` |
| Langage | TypeScript |

> ⚠️ Expo évolue vite. Avant de modifier le code, référez-vous à la documentation de la version utilisée : https://docs.expo.dev/versions/v57.0.0/

## Prérequis

- Node.js (version LTS récente) et npm
- Pour Android : Android Studio et un émulateur, ou un appareil physique
- Pour iOS : macOS avec Xcode
- Facultatif : [EAS CLI](https://docs.expo.dev/build/introduction/) (`npm i -g eas-cli`) pour les builds dans le cloud

L'application utilise des modules natifs (SQLite, audio, vidéo, sélecteur de médias). Il faut donc un **development build** (`expo run:*` ou un build EAS `development`) plutôt qu'Expo Go.

## Installation et lancement

```bash
npm install

# Compiler et lancer sur Android / iOS (development build)
npm run android
npm run ios

# Démarrer seulement le serveur Metro (une fois le development build installé)
npm start
```

Au démarrage, les migrations de base de données sont appliquées automatiquement (voir [src/hooks/useDatabaseMigrations.ts](src/hooks/useDatabaseMigrations.ts)).

## Structure du projet

```
src/
├── app/                  # Écrans (expo-router)
│   ├── _layout.tsx       # Barre d'onglets + exécution des migrations
│   ├── exercises/        # Liste et édition des exercices
│   ├── programs/         # Liste, édition et lecteur (play/[id].tsx) des programmes
│   ├── sessions/         # Calendrier et détail des séances
│   └── profile.tsx       # Profil, poids, IMC
├── components/           # Composants métier (modales, médias...) et ui/ (boutons, cartes, liste draggable...)
├── db/
│   ├── schema.ts         # Schéma Drizzle (tables)
│   ├── client.ts         # Connexion SQLite
│   └── queries/          # DAO par entité
├── hooks/                # Hooks (migrations)
├── services/             # Logique pure : séquence du lecteur, IMC
├── theme/                # Couleurs et effets "glow"
└── types/                # Types et enums TypeScript
drizzle/                  # Migrations SQL générées + snapshots
assets/                   # Icône et sons (sifflet, tic-tac)
```

## Modèle de données

| Table | Rôle |
| --- | --- |
| `exercises` | Exercices (nom, type de mesure `reps`/`time`, média facultatif) |
| `programs` | Programmes (nom, nombre de tours, repos entre tours) |
| `programSteps` | Étapes d'un programme, ordonnées (séries, reps/durée, repos) |
| `sessions` | Séances réalisées (date, durée totale, copie du programme) |
| `sessionSteps` | Copie figée des étapes jouées pendant une séance |
| `weightEntries` | Historique du poids (une entrée par date) |
| `profile` | Profil unique (taille) |

### Modifier le schéma

1. Modifier [src/db/schema.ts](src/db/schema.ts).
2. Générer la migration :
   ```bash
   npx drizzle-kit generate
   ```
3. Vérifier les fichiers créés dans `drizzle/` (SQL, snapshot, `migrations.js`) et les committer. Ils seront appliqués au prochain lancement de l'application.

## Lecteur de séance

La séquence jouée est calculée par [src/services/programSequence.ts](src/services/programSequence.ts) à partir des étapes du programme. Pour chaque tour, chaque série d'exercice est suivie :

- d'un repos **entre séries**, sauf après la dernière série ;
- d'un repos **après l'exercice**, sauf pour le dernier exercice du tour.

Un repos **entre tours** est inséré entre deux tours, mais pas après le dernier.

## Builds (EAS)

Les profils sont définis dans [eas.json](eas.json) :

```bash
eas build --profile development --platform android   # development build
eas build --profile preview --platform android       # APK de test à installer directement
eas build --profile production --platform android    # build de production
```

## Licence

Voir [LICENSE](LICENSE).
