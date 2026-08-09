import { InferSelectModel } from 'drizzle-orm';
import { programs, programSteps } from '../db/schema';
import { MetricType, StepType } from './enums';

export type Program = InferSelectModel<typeof programs>;
export type ProgramStep = InferSelectModel<typeof programSteps>;

export interface StepWithExercise {
    id: string;
    programId: string;
    stepType: StepType;
    exerciseId: string | null;
    orderIndex: number;
    sets: number | null;
    reps: number | null;
    durationSeconds: number | null;
    exerciseName: string | null;
    exerciseMetricType: MetricType | null;
}
