import * as SQLite from 'expo-sqlite';
import { eq } from 'drizzle-orm';
import { db } from '../client';
import { exercises } from '../schema';
import { Exercise, ExerciseFormData } from '../../types/exercise';

/**
 * DAO pour les exercices
 * Pas de repository layer — fonctions directes consumées par les écrans
 */

/**
 * Retourne tous les exercices
 */
export async function findAllExercises(): Promise<Exercise[]> {
    return db.select().from(exercises).all();
}

/**
 * Retourne un exercice par id, ou null s'il n'existe pas
 */
export async function findExerciseById(id: string): Promise<Exercise | null> {
    const result = await db.select().from(exercises).where(eq(exercises.id, id)).get();
    return result || null;
}

/**
 * Écoute les changements sur la table exercises
 * Retourne une fonction cleanup SYNCHRONE (pas de Promise)
 *
 * - Appelle immédiatement callback avec l'état actuel
 * - Ajoute un listener SQLite qui ne déclenche que si tableName === 'exercises'
 * - Retourne une fonction sync pour nettoyer l'abonnement
 */
export function watchExercises(callback: (exercises: Exercise[]) => void): () => void {
    // Appel immédiat avec l'état courant
    findAllExercises().then(callback).catch(console.error);

    // Ajoute le listener natif avec SQLite.addDatabaseChangeListener
    const subscription = SQLite.addDatabaseChangeListener(({ tableName }: { tableName: string; databaseName: string; databaseFilePath: string; rowId: number }) => {
        // Filtre strictement : n'écoute que la table exercises
        if (tableName === 'exercises') {
            findAllExercises().then(callback).catch(console.error);
        }
    });

    // Retourne une fonction cleanup synchrone
    return () => {
        subscription.remove();
    };
}

/**
 * Insère un nouvel exercice
 * Retourne l'id généré
 */
export async function insertExercise(data: ExerciseFormData): Promise<string> {
    const id = generateId();
    const insertData = {
        ...data,
        id,
        mediaPath: data.mediaPath ?? null,
        mediaType: data.mediaType ?? null,
    };
    await db.insert(exercises).values(insertData);
    return id;
}

/**
 * Met à jour un exercice existant
 */
export async function updateExercise(id: string, data: Partial<ExerciseFormData>): Promise<void> {
    await db.update(exercises).set(data).where(eq(exercises.id, id));
}

/**
 * Supprime un exercice par id
 */
export async function deleteExerciseById(id: string): Promise<void> {
    await db.delete(exercises).where(eq(exercises.id, id));
}

/**
 * Génère un ID unique pour un exercice
 * Format simple : "exercise_" + timestamp + random
 */
function generateId(): string {
    return `exercise_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}
