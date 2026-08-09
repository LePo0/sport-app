# Contexte du projet — my-fit-app (React Native / Expo)

## Objectif
App de sport à usage strictement personnel, sans publication sur un store.
Distribution en APK via EAS Build (sideload uniquement, profile preview).
Toutes les données sont stockées **en local sur l'appareil** — aucun
backend, aucune API distante, aucune synchronisation.

## Contexte historique
Ce projet remplace une version précédente écrite en Flutter/Drift,
abandonnée à cause de problèmes de build Android Studio. Le schéma de
données ci-dessous reprend celui du projet Flutter d'origine.

## Stack technique
- Expo (React Native) + TypeScript
- expo-sqlite comme moteur SQLite
- Drizzle ORM pour la persistance locale (schéma typé, migrations via
  drizzle-kit)
- expo-file-system pour les fichiers média (images/vidéos d'exercices),
  seul le chemin est enregistré en base — jamais de blob
- expo-router pour la navigation
- Distribution via EAS Build (APK sideload)
- Dev sur PC Windows, VS Code, GitHub Copilot comme agent de code

## Structure du projet
src/
db/
schema.ts définitions des tables Drizzle
client.ts setup connexion expo-sqlite + drizzle
queries/ fonctions CRUD par entité, scoped aux besoins réels
app/ écrans (expo-router)
components/
services/ logique métier (calcul IMC, gestion timer, etc.)
types/ types partagés (enums, etc.)

## Schéma de données
- **exercises** : id, name, metricType (enum reps/time), mediaPath
  (nullable), mediaType (enum image/video, nullable)
- **programs** : id, name, rounds, createdAt
- **programSteps** : id, programId (FK cascade), stepType (enum
  exercise/rest), exerciseId (FK nullable, set null si exercice
  supprimé), orderIndex, sets (nullable), reps (nullable),
  durationSeconds (nullable — rest et exercices type time)
- **sessions** : id, programId (FK cascade), date, totalDurationSeconds
- **weightEntries** : id, date, weightKg
- **profile** : singleton applicatif, heightCm (une seule ligne
  maintenue via upsertProfile())

## Conventions
- Simplicité avant tout (projet solo, pas de sur-ingénierie) : les
  queries ne sont pas homogénéisées artificiellement, pas de findAll
  générique si pas nécessaire
- Pas de dépendance nécessitant un compte/service cloud
- **Pas de repository layer** : les écrans consomment les fonctions de
  db/queries/ directement
- **Pas de state management externe** (Redux/Zustand) sauf besoin
  avéré — hooks React standards (useState, custom hooks)
- **Pas de useLiveQuery de Drizzle** pour le watch réactif : préférer
  un listener manuel via SQLite.addDatabaseChangeListener, avec
  cleanup synchrone garanti (watchAll ne doit jamais être async côté
  signature de retour, sinon le cleanup ne fonctionne pas dans
  useEffect)
- Le chrono de temps total d'un programme doit être **invisible
  pendant l'exécution**, affiché uniquement à l'écran de fin
- Convention de nommage fichiers : camelCase (exerciseDao.ts, pas
  exercise_dao.ts) — standard écosystème RN/TS
- **Pas de CRUD spéculatif** : les queries pour Program, ProgramStep,
  Session, WeightEntry, Profile sont ajoutées au fur et à mesure du
  développement de chaque écran correspondant, pas générées à l'avance

## État d'avancement
- Projet Expo initialisé, dépendances posées (drizzle-orm, drizzle-kit,
  expo-sqlite, expo-file-system, expo-router)
- Pas encore de schema.ts / client.ts / queries générés à ce stade