import { InferSelectModel, InferInsertModel } from 'drizzle-orm';
import { exercises } from '../db/schema';
import { MetricType, MediaType } from './enums';

/**
 * Type Exercise — inféré du schéma Drizzle
 */
export type Exercise = InferSelectModel<typeof exercises>;

/**
 * Type pour l'insertion/mise à jour d'un exercice
 */
export type ExerciseInsert = InferInsertModel<typeof exercises>;

/**
 * Type pour la création d'un exercice (sans id)
 */
export type ExerciseFormData = {
    name: string;
    metricType: MetricType;
    mediaPath: string | null;
    mediaType: MediaType | null;
};
