import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { colors } from '../../theme/colors';
import { getSessionDetail, getSessionSteps } from '../../db/queries/sessionDao';
import { getStepsForProgram } from '../../db/queries/programStepDao';
import { ListCard } from '../../components/ui/ListCard';
import { StepType } from '../../types/enums';
import { Session, SessionStep } from '../../types/session';
import { StepWithExercise } from '../../types/program';

export default function SessionDetailScreen() {
    const { id } = useLocalSearchParams<{ id?: string }>();
    const [session, setSession] = useState<Session | null>(null);
    const [playedSteps, setPlayedSteps] = useState<SessionStep[]>([]);
    const [programCurrentSteps, setProgramCurrentSteps] = useState<StepWithExercise[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        let isMounted = true;

        async function load() {
            if (!id) return;
            try {
                const [sessionData, stepsData] = await Promise.all([getSessionDetail(id), getSessionSteps(id)]);

                const currentStepsData = sessionData
                    ? await getStepsForProgram(sessionData.programId)
                    : [];

                if (!isMounted) return;
                setSession(sessionData);
                setPlayedSteps(stepsData);
                setProgramCurrentSteps(currentStepsData);
            } finally {
                if (isMounted) setIsLoading(false);
            }
        }

        load().catch(console.error);

        return () => {
            isMounted = false;
        };
    }, [id]);

    function formatDuration(totalSeconds: number): string {
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;
        if (hours > 0) {
            return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
        }
        return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    }

    function formatDate(timestamp: number): string {
        return new Date(timestamp).toLocaleString('fr-FR');
    }

    if (isLoading) {
        return (
            <View style={s.centerContainer}>
                <ActivityIndicator size="large" color={colors.accentPrimary} />
                <Text style={s.loadingText}>Chargement de la séance...</Text>
            </View>
        );
    }

    if (!session) {
        return (
            <View style={s.centerContainer}>
                <Text style={s.title}>Séance introuvable</Text>
            </View>
        );
    }

    return (
        <ScrollView style={s.container} contentContainerStyle={s.content}>
            <Text style={s.sectionTitle}>Séance</Text>
            <ListCard>
                <Text style={s.programName}>{session.programName}</Text>
                <Text style={s.meta}>{formatDate(session.date)}</Text>
                <Text style={s.duration}>{formatDuration(session.totalDurationSeconds)}</Text>
            </ListCard>

            <Text style={s.sectionTitle}>Étapes jouées</Text>
            {playedSteps.map((step) => (
                <ListCard key={step.id}>
                    {step.stepType === StepType.REST ? (
                        <>
                            <Text style={s.stepName}>Pause</Text>
                            <Text style={s.stepDetail}>{step.durationSeconds ?? '?'} s</Text>
                        </>
                    ) : (
                        <>
                            <Text style={s.stepName}>{step.exerciseName ?? 'Exercice supprimé'}</Text>
                            <Text style={s.stepDetail}>
                                {step.reps !== null
                                    ? `${step.sets ?? '?'} × ${step.reps ?? '?'} rép.`
                                    : `${step.durationSeconds ?? '?'} s`}
                            </Text>
                        </>
                    )}
                </ListCard>
            ))}

            <Text style={s.sectionTitle}>Structure actuelle du programme</Text>
            <Text style={s.sectionHint}>
                Cette section reflète la version actuelle du programme, pas forcément
                celle jouée lors de cette séance.
            </Text>
            {programCurrentSteps.map((step) => (
                <ListCard key={step.id}>
                    {step.stepType === StepType.REST ? (
                        <>
                            <Text style={s.stepName}>Pause</Text>
                            <Text style={s.stepDetail}>{step.durationSeconds ?? '?'} s</Text>
                        </>
                    ) : (
                        <>
                            <Text style={s.stepName}>{step.exerciseName ?? 'Exercice supprimé'}</Text>
                            <Text style={s.stepDetail}>
                                {step.reps !== null
                                    ? `${step.sets ?? '?'} × ${step.reps ?? '?'} rép.`
                                    : `${step.durationSeconds ?? '?'} s`}
                            </Text>
                        </>
                    )}
                </ListCard>
            ))}
        </ScrollView>
    );
}

const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    content: { padding: 16, paddingBottom: 48 },
    centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background, paddingHorizontal: 16 },
    loadingText: { marginTop: 12, fontSize: 14, color: colors.textSecondary },
    title: { color: colors.textPrimary, fontSize: 22, fontWeight: '700' },
    sectionTitle: { fontSize: 16, fontWeight: '700', color: colors.accentPrimary, marginTop: 8, marginBottom: 12 },
    sectionHint: { color: colors.textSecondary, fontSize: 12, marginBottom: 8 },
    programName: { color: colors.textPrimary, fontSize: 18, fontWeight: '700', marginBottom: 8 },
    meta: { color: colors.textSecondary, fontSize: 13, marginBottom: 8 },
    duration: { color: colors.accentPrimary, fontSize: 28, fontWeight: '700' },
    stepName: { color: colors.textPrimary, fontSize: 15, fontWeight: '700', marginBottom: 4 },
    stepDetail: { color: colors.textSecondary, fontSize: 12 },
});