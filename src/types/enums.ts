/**
 * TypeScript enums pour les types de données du schéma
 */

export enum MetricType {
    REPS = 'reps',
    TIME = 'time',
}

export enum StepType {
    EXERCISE = 'exercise',
    /** @deprecated legacy uniquement (anciennes sessionSteps) ; plus jamais créé depuis l'éditeur de programme */
    REST = 'rest',
}

export enum MediaType {
    IMAGE = 'image',
    VIDEO = 'video',
}
