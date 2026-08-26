import { and, asc, eq } from 'drizzle-orm';
import { db } from '../client';
import { exercises, programSteps } from '../schema';
import { StepType } from '../../types/enums';
import { StepWithExercise } from '../../types/program';

function generateId(): string {
    return `step_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

export async function getStepsForProgram(programId: string): Promise<StepWithExercise[]> {
    const rows = await db
        .select({
            id: programSteps.id,
            programId: programSteps.programId,
            stepType: programSteps.stepType,
            exerciseId: programSteps.exerciseId,
            orderIndex: programSteps.orderIndex,
            sets: programSteps.sets,
            reps: programSteps.reps,
            durationSeconds: programSteps.durationSeconds,
            restAfterSetSeconds: programSteps.restAfterSetSeconds,
            restAfterExerciseSeconds: programSteps.restAfterExerciseSeconds,
            exerciseName: exercises.name,
            exerciseMetricType: exercises.metricType,
            mediaPath: exercises.mediaPath,
            mediaType: exercises.mediaType,
        })
        .from(programSteps)
        .leftJoin(exercises, eq(programSteps.exerciseId, exercises.id))
        .where(eq(programSteps.programId, programId))
        .orderBy(asc(programSteps.orderIndex))
        .all();
    return rows as StepWithExercise[];
}

export async function addExerciseStep(
    programId: string,
    exerciseId: string,
    orderIndex: number,
    sets: number | null,
    reps: number | null,
    durationSeconds: number | null,
    restAfterSetSeconds: number = 0,
    restAfterExerciseSeconds: number = 0
): Promise<string> {
    const id = generateId();
    await db.insert(programSteps).values({
        id, programId, stepType: StepType.EXERCISE, exerciseId, orderIndex, sets, reps, durationSeconds,
        restAfterSetSeconds, restAfterExerciseSeconds,
    });
    return id;
}

// Échange l'orderIndex du step avec celui de son voisin à newOrderIndex
export async function reorderStep(stepId: string, newOrderIndex: number): Promise<void> {
    const step = await db.select().from(programSteps).where(eq(programSteps.id, stepId)).get();
    if (!step) return;

    const neighbor = await db
        .select()
        .from(programSteps)
        .where(and(eq(programSteps.programId, step.programId), eq(programSteps.orderIndex, newOrderIndex)))
        .get();
    if (!neighbor) return;

    await db.update(programSteps).set({ orderIndex: newOrderIndex }).where(eq(programSteps.id, stepId));
    await db.update(programSteps).set({ orderIndex: step.orderIndex }).where(eq(programSteps.id, neighbor.id));
}

export async function deleteStep(stepId: string): Promise<void> {
    const step = await db.select().from(programSteps).where(eq(programSteps.id, stepId)).get();
    if (!step) return;

    await db.delete(programSteps).where(eq(programSteps.id, stepId));

    // Renormalise les orderIndex sans trous après suppression
    const remaining = await db
        .select()
        .from(programSteps)
        .where(eq(programSteps.programId, step.programId))
        .orderBy(asc(programSteps.orderIndex))
        .all();

    for (let i = 0; i < remaining.length; i++) {
        if (remaining[i].orderIndex !== i) {
            await db.update(programSteps).set({ orderIndex: i }).where(eq(programSteps.id, remaining[i].id));
        }
    }
}

export async function updateExerciseStepValues(
    stepId: string,
    sets: number | null,
    reps: number | null,
    durationSeconds: number | null,
    restAfterSetSeconds: number = 0,
    restAfterExerciseSeconds: number = 0
): Promise<void> {
    await db.update(programSteps).set({ sets, reps, durationSeconds, restAfterSetSeconds, restAfterExerciseSeconds }).where(eq(programSteps.id, stepId));
}

export async function replaceProgramSteps(programId: string, steps: StepWithExercise[]): Promise<void> {
    await db.delete(programSteps).where(eq(programSteps.programId, programId));

    if (steps.length === 0) return;

    await db.insert(programSteps).values(
        steps.map((step) => ({
            id: step.id,
            programId,
            stepType: step.stepType,
            exerciseId: step.exerciseId,
            orderIndex: step.orderIndex,
            sets: step.sets,
            reps: step.reps,
            durationSeconds: step.durationSeconds,
            restAfterSetSeconds: step.restAfterSetSeconds,
            restAfterExerciseSeconds: step.restAfterExerciseSeconds,
        }))
    );
}
