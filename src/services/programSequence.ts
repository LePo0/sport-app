import { StepWithExercise } from '../types/program';

export type PlayerAction =
    | { kind: 'exercise-set'; step: StepWithExercise; setIndex: number; totalSets: number; round: number; exerciseIndex: number; totalExercises: number }
    | { kind: 'rest'; restKind: 'set' | 'exercise' | 'round'; durationSeconds: number; nextExerciseName: string | null; round: number };

// Une passe (un tour) : chaque set d'exercice suivi de son repos série/exercice sauf en fin de tour
export function buildRoundActions(steps: StepWithExercise[], round: number): PlayerAction[] {
    const actions: PlayerAction[] = [];
    const totalExercises = steps.length;

    steps.forEach((step, stepIndex) => {
        const totalSets = step.sets ?? 1;
        const isLastStepOfRound = stepIndex === steps.length - 1;
        const nextStepName = steps[stepIndex + 1]?.exerciseName ?? null;

        for (let setIndex = 0; setIndex < totalSets; setIndex++) {
            actions.push({ kind: 'exercise-set', step, setIndex, totalSets, round, exerciseIndex: stepIndex + 1, totalExercises });

            const isLastSet = setIndex === totalSets - 1;
            if (!isLastSet && step.restAfterSetSeconds > 0) {
                actions.push({
                    kind: 'rest',
                    restKind: 'set',
                    durationSeconds: step.restAfterSetSeconds,
                    nextExerciseName: step.exerciseName,
                    round,
                });
            }
        }

        if (!isLastStepOfRound && step.restAfterExerciseSeconds > 0) {
            actions.push({
                kind: 'rest',
                restKind: 'exercise',
                durationSeconds: step.restAfterExerciseSeconds,
                nextExerciseName: nextStepName,
                round,
            });
        }
    });

    return actions;
}

export function buildPlayerSequence(
    steps: StepWithExercise[],
    rounds: number,
    restBetweenRoundsSeconds: number
): PlayerAction[] {
    const actions: PlayerAction[] = [];

    for (let round = 1; round <= rounds; round++) {
        actions.push(...buildRoundActions(steps, round));

        const isLastRound = round === rounds;
        if (!isLastRound && restBetweenRoundsSeconds > 0) {
            actions.push({
                kind: 'rest',
                restKind: 'round',
                durationSeconds: restBetweenRoundsSeconds,
                nextExerciseName: steps[0]?.exerciseName ?? null,
                round,
            });
        }
    }

    return actions;
}

