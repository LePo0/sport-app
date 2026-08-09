CONTEXTE
--------
Stack : React Native (Expo) + Drizzle ORM + SQLite, projet local-only.
Tables : profile (id, height_cm) — singleton géré via upsertProfile() déjà
existant dans profileDao —, weight_entries (id, date, weight_kg).

Convention projet : pas de repository layer, DAO consommés directement par
les écrans. Logique métier (calcul IMC) dans services/, pas dans le composant
écran directement.

OBJECTIF
--------
Écran Profil (ProfileScreen) regroupant : gestion de la taille, calcul
d'IMC à la volée, ajout et historique des entrées de poids.

1. services/bmi.ts — LOGIQUE MÉTIER
----------------------------------------
- calculateBmi(heightCm: number, weightKg: number): number
  Formule : weightKg / (heightCm / 100) ** 2, arrondi à 1 décimale
- Pas de branchement UI ici, fonction pure testable isolément

2. weightEntryDao — NOUVELLES FONCTIONS SCOPÉES
----------------------------------------------------
- getAllWeightEntries(): Promise<WeightEntry[]>
  (triées par date décroissante, la plus récente en premier)
- getLatestWeightEntry(): Promise<WeightEntry | null>
  (utilisée pour le calcul IMC, indépendamment de la liste affichée)
- addWeightEntry(date: Date, weightKg: number): Promise<number>
- deleteWeightEntry(id: number): Promise<void>

3. profileDao — VÉRIFIER L'EXISTANT
-----------------------------------------
upsertProfile(heightCm: number) existe déjà. Ajouter si absent :
- getProfile(): Promise<Profile | null>

4. ÉCRAN ProfileScreen — STRUCTURE
---------------------------------------
Un seul écran, trois sections verticales :

A. Section Profil
   - Champ numérique "Taille (cm)", pré-rempli via getProfile() au montage
   - Bouton "Enregistrer" appelant upsertProfile(heightCm)
   - Pas de validation complexe, juste s'assurer que la valeur saisie est
     un nombre positif avant d'enregistrer

B. Section IMC (lecture seule, pas de formulaire)
   - Récupérer heightCm (profil) et le poids via getLatestWeightEntry()
   - Si les deux sont disponibles : afficher l'IMC calculé via
     calculateBmi(), avec la catégorie associée (insuffisance pondérale
     / poids normal / surpoids / obésité — seuils OMS standards 18.5,
     25, 30)
   - Si taille absente ou aucune entrée de poids : afficher un message
     du type "Renseignez votre taille et un poids pour calculer l'IMC"
     plutôt qu'un calcul erroné ou un crash

C. Section Historique de poids
   - Formulaire d'ajout en haut : champ numérique "Poids (kg)" + date
     (par défaut aujourd'hui, pas besoin de date picker complexe, une
     valeur par défaut suffit pour l'instant sauf si tu veux pouvoir
     antidater une entrée — dans ce cas un simple DateTimePicker Expo)
   - Bouton "Ajouter" appelant addWeightEntry(date, weightKg), puis
     rafraîchissement de la liste et du calcul IMC (B) en conséquence
   - Liste des entrées (getAllWeightEntries), affichage simple :
     date formatée + poids, triée du plus récent au plus ancien
   - Chaque entrée a un bouton "Supprimer" (icône ou texte) appelant
     deleteWeightEntry(id), avec confirmation légère (Alert.alert) avant
     suppression pour éviter un tap accidentel
   - Après suppression, rafraîchir la liste ET le calcul IMC si l'entrée
     supprimée était la plus récente

CONTRAINTES
-----------
- Pas de graphique, pas de nouvelle dépendance de charting
- Pas de nouvelle dépendance externe en général, sauf DateTimePicker Expo
  si tu choisis l'option date antidatable (déjà dans l'écosystème Expo,
  pas une lib tierce à ajouter)
- État local en useState, rafraîchissement des listes par re-fetch après
  chaque mutation (pas de state global synchronisé)