import { sqliteTable, text, integer, real, primaryKey } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';
import { MetricType, StepType, MediaType } from '../types/enums';

/**
 * Table exercises — exercices disponibles
 */
export const exercises = sqliteTable('exercises', {
    id: text().primaryKey('exercises_id_pk'),
    name: text().notNull(),
    metricType: text().$type<MetricType>().notNull(), // 'reps' or 'time'
    mediaPath: text(), // chemin du fichier média (nullable)
    mediaType: text().$type<MediaType>(), // 'image' or 'video' (nullable)
});

/**
 * Table programs — programmes d'entraînement
 */
export const programs = sqliteTable('programs', {
    id: text().primaryKey('programs_id_pk'),
    name: text().notNull(),
    rounds: integer().notNull().default(1),
    createdAt: integer().notNull(), // timestamp en ms
});

/**
 * Table programSteps — étapes d'un programme (exercise ou rest)
 */
export const programSteps = sqliteTable(
    'programSteps',
    {
        id: text().primaryKey('programSteps_id_pk'),
        programId: text()
            .notNull()
            .references(() => programs.id, { onDelete: 'cascade' }),
        stepType: text().$type<StepType>().notNull(), // 'exercise' or 'rest'
        exerciseId: text().references(() => exercises.id, { onDelete: 'set null' }), // nullable, FK set null
        orderIndex: integer().notNull(),
        sets: integer(), // nombre de séries (nullable, surtout pour rest)
        reps: integer(), // nombre de reps (nullable, pour reps metric)
        durationSeconds: integer(), // durée en secondes (nullable, pour time metric et rest)
    },
    (table) => ({
        programIdIdx: sql`CREATE INDEX IF NOT EXISTS programSteps_programId_idx ON ${table} (programId)`,
    })
);

/**
 * Table sessions — sessions d'entraînement passées
 */
export const sessions = sqliteTable('sessions', {
    id: text().primaryKey('sessions_id_pk'),
    programId: text()
        .notNull()
        .references(() => programs.id, { onDelete: 'cascade' }),
    date: integer().notNull(), // timestamp en ms
    totalDurationSeconds: integer().notNull(),
});

/**
 * Table weightEntries — historique du poids de l'utilisateur
 */
export const weightEntries = sqliteTable('weightEntries', {
    id: text().primaryKey('weightEntries_id_pk'),
    date: integer().notNull().unique(),
    weightKg: real().notNull(),
});

/**
 * Table profile — profil singleton de l'utilisateur
 * Une seule ligne maintenue via upsertProfile()
 */
export const profile = sqliteTable('profile', {
    id: text().primaryKey('profile_id_pk').default(sql`'singleton'`),
    heightCm: real(), // taille en cm (nullable si non défini)
});
