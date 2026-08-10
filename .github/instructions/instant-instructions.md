Contexte : app React Native (Expo) + Drizzle/SQLite, projet solo local-only.
Table exercises a déjà les colonnes mediaPath (text, nullable) et mediaType 
(enum 'image'/'video', nullable). Un seul média par exercice (image OU vidéo, 
jamais les deux).

Objectif : gérer l'ajout, l'affichage et le remplacement du média dans le 
formulaire de création/édition d'exercice.

1. Créer un composant partagé `src/components/ExerciseMedia.tsx` :
   - Props : { mediaPath: string | null, mediaType: 'image' | 'video' | null, 
     style? }
   - Si mediaType === 'image' : afficher via expo-image (<Image source={{uri}} 
     contentFit="cover" />)
   - Si mediaType === 'video' : afficher via expo-video, en boucle (loop: true), 
     muet, autoplay
   - Si mediaPath est null : afficher un placeholder simple cohérent avec le 
     thème neon existant (src/theme/), pas d'image cassée
   - Ce composant doit être utilisable à la fois dans le formulaire (preview) 
     et potentiellement plus tard dans la liste d'exercices et le player

2. Dans ExerciseFormScreen (création/édition) :
   - Ajouter un bouton "Choisir un média" qui ouvre expo-image-picker en mode 
     mixte (images + vidéos), une seule sélection
   - Au retour du picker, déterminer mediaType selon le type renvoyé par le 
     picker (image vs video)
   - Copier le fichier sélectionné dans le répertoire local de l'app via 
     expo-file-system (FileSystem.documentDirectory + un sous-dossier 
     'exercise-media/'), nom de fichier basé sur l'id de l'exercice + extension 
     d'origine (ex: exercise_<id>.mp4)
   - Si l'exercice a déjà un media existant (édition, remplacement) : supprimer 
     l'ancien fichier via FileSystem.deleteAsync AVANT d'écrire le nouveau, 
     pour ne pas laisser de fichier orphelin (un seul média possible)
   - Afficher un preview immédiat via <ExerciseMedia /> après sélection, avant 
     la sauvegarde en base
   - Ajouter un bouton "Supprimer le média" qui vide mediaPath/mediaType et 
     supprime le fichier local correspondant

3. Mettre à jour exerciseDao (src/db/) :
   - La méthode de création/update d'exercice doit accepter mediaPath et 
     mediaType (nullable) et les persister
   - Pas de nouvelle méthode générique : rester scopé à ce que le formulaire 
     utilise réellement (pas de findByMediaType ou autre chose non demandé)

4. Gestion d'erreur minimale : si le picker échoue ou est annulé, ne rien 
   modifier ; si la copie du fichier échoue, afficher une alerte simple et ne 
   pas enregistrer de mediaPath invalide en base.

Ne pas introduire de librairie de gestion d'état ni de couche repository. 
Suivre le style déjà en place dans le projet (useState local, DAO consommé 
directement par l'écran).