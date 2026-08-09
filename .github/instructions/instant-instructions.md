CONTEXTE
--------
Stack : React Native (Expo) + Drizzle ORM + SQLite, projet local-only.
Tables : sessions (id, program_id, date, total_duration_seconds),
programs (id, name, rounds), program_steps (pour le détail éventuel).

Convention projet : pas de repository layer, DAO consommés directement
par les écrans. DAO scopés aux besoins réels de l'écran.

DÉPENDANCE À AJOUTER
-------------------------
npx expo install react-native-calendars
(seule lib externe ajoutée pour cet écran, décision assumée pour ne pas
recoder une grille de calendrier à la main)

1. sessionDao — NOUVELLES FONCTIONS SCOPÉES
------------------------------------------------
- getSessionDates(): Promise<string[]>
  Retourne les dates distinctes (format 'YYYY-MM-DD') ayant au moins une
  session, pour alimenter les markedDates du calendrier
- getSessionsForDate(date: string): Promise<{ id: number, programId: number,
  programName: string, totalDurationSeconds: number }[]>
  Jointure sessions -> programs sur program_id, filtré sur la date
  (comparaison sur la partie date uniquement, pas l'heure)
- getSessionDetail(sessionId: number): Promise<{ id: number, programName: string,
  date: Date, totalDurationSeconds: number } | null>
  Pour l'écran de détail d'une séance

2. ÉCRAN CalendarScreen — STRUCTURE
----------------------------------------
- Composant Calendar de react-native-calendars
- markedDates alimenté par getSessionDates() au montage (marker simple,
  type 'dot' ou couleur de fond sur les jours ayant une séance)
- onDayPress(day) :
  - appelle getSessionsForDate(day.dateString)
  - si résultat vide : ne rien afficher (jour sans séance, pas d'action)
  - si résultat non vide : afficher en dessous du calendrier (pas de
    modal nécessaire, une simple liste qui s'affiche/se met à jour sous
    le calendrier suffit) la liste des séances de ce jour : nom du
    programme + durée formatée (mm:ss ou hh:mm:ss)
  - chaque item de cette liste est tapable et navigue vers
    SessionDetailScreen avec sessionId en param

3. ÉCRAN SessionDetailScreen
----------------------------------
- Récupère les détails via getSessionDetail(sessionId)
- Affiche : nom du programme, date (formatée), durée totale formatée
- Optionnel mais utile : afficher aussi la liste des steps du programme
  tel qu'il existe actuellement (via programStepDao.getStepsForProgram)
  pour rappel de ce que contenait la séance — attention, ce n'est PAS un
  instantané figé de ce qui a été fait ce jour-là, juste la structure
  actuelle du programme (si le programme a été modifié depuis, l'affichage
  reflète sa version actuelle, pas celle du jour de la séance). Ajouter
  un court texte explicatif si tu gardes cette section, ex. "Structure
  actuelle du programme" pour éviter toute confusion.

CONTRAINTES
-----------
- Une seule dépendance externe ajoutée (react-native-calendars), aucune
  autre
- État local en useState, re-fetch après navigation retour si besoin
  (pas de state global)
- Pas de gestion de suppression de session depuis cet écran (hors scope,
  à ajouter plus tard si besoin)