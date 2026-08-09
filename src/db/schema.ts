import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';
import { MetricType, StepType, MediaType } from '../types/enums';

/**
 * Table exercises — exercices disponibles
 */
export const exercises = sqliteTable('exercises', {
    id: text().primaryKey(),
    name: text().notNull(),
    metricType: text().$type<MetricType>().notNull(), // 'reps' or 'time'
    mediaPath: text(), // chemin du fichier média (nullable)
    mediaType: text().$type<MediaType>(), // 'image' or 'video' (nullable)
});

/**
 * Table programs — programmes d'entraînement
 */
export const programs = sqliteTable('programs', {
    id: text().primaryKey(),
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
        id: text().primaryKey(),
        programId: text()
            .notNull()
            .references(() => programs.id, { onDelete: 'cascade' }),
        stepType: text().$type<StepType>().notNull(), // 'exercise' or 'rest'
        exerciseId: text().references(() => exercises.id, { onDelete: 'set null' }), // nullable, FK set null
        orderIndex: integer().notNull(),
        sets: integer(), // nombre de séries (nullable, surtout pour rest)
        reps: integer(), // nombre de reps (nullable, pour reps metric)
        durationSeconds: integer(), // durée en secondes (nullable, pour time metric et rest)
    }
);

/**
 * Table sessions — sessions d'entraînement passées
 */
export const sessions = sqliteTable('sessions', {
    id: text().primaryKey(),
    programId: text()
        .notNull()
        .references(() => programs.id, { onDelete: 'cascade' }),
    programName: text().notNull(),
    date: integer().notNull(), // timestamp en ms
    totalDurationSeconds: integer().notNull(),
});

/**
 * Table sessionSteps — instantané immuable des steps réellement joués lors d'une session.
 */
export const sessionSteps = sqliteTable('sessionSteps', {
    id: integer().primaryKey({ autoIncrement: true }),
    sessionId: text()
        .notNull()
        .references(() => sessions.id, { onDelete: 'cascade' }),
    stepType: text().$type<StepType>().notNull(),
    exerciseName: text(),
    orderIndex: integer().notNull(),
    sets: integer(),
    reps: integer(),
    durationSeconds: integer(),
});

/**
 * Table weightEntries — historique du poids de l'utilisateur
 */
export const weightEntries = sqliteTable('weightEntries', {
    id: text().primaryKey(),
    date: integer().notNull().unique(),
    weightKg: real().notNull(),
});

/**
 * Table profile — profil singleton de l'utilisateur
 * Une seule ligne maintenue via upsertProfile()
 */
export const profile = sqliteTable('profile', {
    id: text().primaryKey().default(sql`'singleton'`),
    heightCm: real(), // taille en cm (nullable si non défini)
});
