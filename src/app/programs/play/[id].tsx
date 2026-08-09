import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    Alert,
    Image,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { colors } from '../../../theme/colors';
import { getProgramById } from '../../../db/queries/programDao';
import { getStepsForProgram } from '../../../db/queries/programStepDao';
import { createSession } from '../../../db/queries/sessionDao';
import { MediaType, MetricType, StepType } from '../../../types/enums';
import { StepWithExercise } from '../../../types/program';

export default function ProgramPlayerScreen() {
    const { id } = useLocalSearchParams<{ id?: string }>();
    const router = useRouter();
    const sessionStartTimeRef = useRef(Date.now());
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const [programId, setProgramId] = useState<string | null>(id ?? null);
    const [programName, setProgramName] = useState('');
    const [baseSteps, setBaseSteps] = useState<StepWithExercise[]>([]);
    const [sequence, setSequence] = useState<StepWithExercise[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [remainingSeconds, setRemainingSeconds] = useState<number | null>(null);
    const [isPlacementPhase, setIsPlacementPhase] = useState(false);
    const [placementTargetIndex, setPlacementTargetIndex] = useState<number | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSavingSession, setIsSavingSession] = useState(false);

    const currentStep = sequence[currentIndex] ?? null;
    const isSequenceFinished = sequence.length > 0 && currentIndex >= sequence.length;

    useEffect(() => {
        let isMounted = true;

        async function loadPlayerData() {
            if (!id) return;
            try {
                const [program, steps] = await Promise.all([
                    getProgramById(id),
                    getStepsForProgram(id),
                ]);

                if (!isMounted) return;
                if (program) {
                    setProgramId(program.id);
                    setProgramName(program.name);
                    const builtSequence = Array.from({ length: program.rounds }, () => steps).flat();
                    setBaseSteps(steps);
                    setSequence(builtSequence);
                }
            } finally {
                if (isMounted) setIsLoading(false);
            }
        }

        loadPlayerData().catch(console.error);

        return () => {
            isMounted = false;
            clearTimer();
        };
    }, [id]);

    useEffect(() => {
        clearTimer();

        if (isPlacementPhase) {
            setRemainingSeconds(10);
            intervalRef.current = setInterval(() => {
                setRemainingSeconds((prev) => {
                    if (prev === null) return null;
                    if (prev <= 1) {
                        clearTimer();
                        setIsPlacementPhase(false);
                        if (placementTargetIndex !== null) {
                            setCurrentIndex(placementTargetIndex);
                            setPlacementTargetIndex(null);
                        }
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);

            return () => {
                clearTimer();
            };
        }

        if (!currentStep || isSequenceFinished) {
            setRemainingSeconds(null);
            return;
        }

        const stepDuration = getStepDuration(currentStep);
        if (stepDuration === null) {
            setRemainingSeconds(null);
            return;
        }

        setRemainingSeconds(stepDuration);
        intervalRef.current = setInterval(() => {
            setRemainingSeconds((prev) => {
                if (prev === null) return null;
                return prev > 0 ? prev - 1 : 0;
            });
        }, 1000);

        return () => {
            clearTimer();
        };
    }, [currentIndex, currentStep, isSequenceFinished, isPlacementPhase, placementTargetIndex]);

    const elapsedSeconds = useMemo(
        () => Math.round((Date.now() - sessionStartTimeRef.current) / 1000),
        [currentIndex, isSequenceFinished, isSavingSession]
    );

    function clearTimer() {
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }
    }

    function getStepDuration(step: StepWithExercise): number | null {
        if (step.stepType === StepType.REST) return step.durationSeconds ?? null;
        if (!step.exerciseName || step.exerciseMetricType !== MetricType.TIME) return null;
        return step.durationSeconds ?? null;
    }

    function formatDuration(totalSeconds: number): string {
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;
        if (hours > 0) {
            return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
        }
        return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    }

    function handleNext() {
        clearTimer();
        const nextIndex = currentIndex + 1;
        if (nextIndex >= sequence.length) {
            setCurrentIndex(nextIndex);
            return;
        }

        setPlacementTargetIndex(nextIndex);
        setIsPlacementPhase(true);
    }

    function handleSkipPlacement() {
        clearTimer();
        setIsPlacementPhase(false);
        if (placementTargetIndex !== null) {
            setCurrentIndex(placementTargetIndex);
            setPlacementTargetIndex(null);
        }
    }

    function handleQuit() {
        Alert.alert('Quitter', 'Quitter sans sauvegarder ?', [
            { text: 'Annuler', style: 'cancel' },
            {
                text: 'Quitter',
                style: 'destructive',
                onPress: () => {
                    clearTimer();
                    if (router.canGoBack()) {
                        router.back();
                    } else {
                        router.replace('/programs');
                    }
                },
            },
        ]);
    }

    async function handleFinish() {
        if (!programId) return;
        setIsSavingSession(true);
        try {
            await createSession(programId, new Date(), elapsedSeconds);
            clearTimer();
            if (router.canGoBack()) {
                router.back();
            } else {
                router.replace('/programs');
            }
        } catch (error) {
            Alert.alert('Erreur', 'Impossible de sauvegarder la session');
            console.error(error);
        } finally {
            setIsSavingSession(false);
        }
    }

    function handleAddAnotherRound() {
        if (baseSteps.length === 0) return;
        setSequence((prev) => [...prev, ...baseSteps]);
        setCurrentIndex((prev) => prev);
    }

    if (isLoading) {
        return (
            <View style={s.centerContainer}>
                <ActivityIndicator size="large" color={colors.accentPrimary} />
                <Text style={s.loadingText}>Chargement du programme...</Text>
            </View>
        );
    }

    if (!programId || !programName) {
        return (
            <View style={s.centerContainer}>
                <Text style={s.title}>Programme introuvable</Text>
                <TouchableOpacity style={s.quitButton} onPress={handleQuit}>
                    <Text style={s.quitButtonText}>Quitter</Text>
                </TouchableOpacity>
            </View>
        );
    }

    if (sequence.length === 0) {
        return (
            <View style={s.centerContainer}>
                <Text style={s.title}>{programName}</Text>
                <Text style={s.subtitle}>Ce programme ne contient aucune étape.</Text>
                <TouchableOpacity style={s.quitButton} onPress={handleQuit}>
                    <Text style={s.quitButtonText}>Quitter</Text>
                </TouchableOpacity>
            </View>
        );
    }

    if (isSequenceFinished) {
        return (
            <View style={s.container}>
                <View style={s.headerRow}>
                    <Text style={s.headerLabel}>Tour terminé</Text>
                    <TouchableOpacity style={s.quitGhostButton} onPress={handleQuit}>
                        <Text style={s.quitGhostButtonText}>Quitter</Text>
                    </TouchableOpacity>
                </View>
                <View style={s.finishCard}>
                    <Text style={s.programTitle}>{programName}</Text>
                    <Text style={s.finishTime}>{formatDuration(elapsedSeconds)}</Text>
                    <Text style={s.finishHint}>Temps total écoulé depuis le début</Text>
                </View>
                <View style={s.finishActions}>
                    <TouchableOpacity style={[s.secondaryButton, s.flexButton]} onPress={handleAddAnotherRound}>
                        <Text style={s.secondaryButtonText}>Encore un tour</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[s.primaryButton, s.flexButton, isSavingSession && s.buttonDisabled]} onPress={handleFinish} disabled={isSavingSession}>
                        {isSavingSession
                            ? <ActivityIndicator size="small" color={colors.background} />
                            : <Text style={s.primaryButtonText}>Terminer</Text>}
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    return (
        <View style={s.container}>
            <View style={s.headerRow}>
                <View>
                    <Text style={s.headerLabel}>{programName}</Text>
                    <Text style={s.progressLabel}>
                        {isPlacementPhase
                            ? `Placement avant étape ${(placementTargetIndex ?? 0) + 1} / ${sequence.length}`
                            : `Étape ${currentIndex + 1} / ${sequence.length}`}
                    </Text>
                </View>
                <TouchableOpacity style={s.quitGhostButton} onPress={handleQuit}>
                    <Text style={s.quitGhostButtonText}>Quitter</Text>
                </TouchableOpacity>
            </View>

            <View style={s.playerCard}>
                {isPlacementPhase ? (
                    <>
                        <Text style={s.stepTypeLabel}>Placement</Text>
                        <Text style={s.stepTitle}>Préparez la suite</Text>
                        <Text style={s.timerValue}>{String(remainingSeconds ?? 0)}</Text>
                        <Text style={s.timerLabel}>secondes</Text>
                    </>
                ) : currentStep?.stepType === StepType.REST ? (
                    <>
                        <Text style={s.stepTypeLabel}>Pause</Text>
                        <Text style={s.stepTitle}>Récupération</Text>
                        <Text style={s.timerValue}>{String(remainingSeconds ?? 0)}</Text>
                        <Text style={s.timerLabel}>secondes</Text>
                    </>
                ) : currentStep?.exerciseName ? (
                    <>
                        <Text style={s.stepTypeLabel}>Exercice</Text>
                        <Text style={s.stepTitle}>{currentStep.exerciseName}</Text>
                        {currentStep.mediaPath && currentStep.mediaType === MediaType.IMAGE ? (
                            <Image source={{ uri: currentStep.mediaPath }} style={s.image} resizeMode="cover" />
                        ) : null}
                        {currentStep.mediaPath && currentStep.mediaType === MediaType.VIDEO ? (
                            <View style={s.mediaPlaceholder}>
                                <Text style={s.mediaPlaceholderText}>Vidéo liée</Text>
                            </View>
                        ) : null}
                        {currentStep.exerciseMetricType === MetricType.REPS ? (
                            <Text style={s.metricText}>{currentStep.sets ?? '?'} séries • {currentStep.reps ?? '?'} répétitions</Text>
                        ) : (
                            <>
                                <Text style={s.timerValue}>{String(remainingSeconds ?? 0)}</Text>
                                <Text style={s.timerLabel}>secondes</Text>
                            </>
                        )}
                    </>
                ) : (
                    <>
                        <Text style={s.stepTypeLabel}>Exercice</Text>
                        <Text style={s.stepTitle}>Exercice supprimé</Text>
                        <Text style={s.subtitle}>Étape conservée pour laisser le programme se dérouler normalement.</Text>
                    </>
                )}
            </View>

            <View style={s.bottomActions}>
                <TouchableOpacity style={s.secondaryButton} onPress={handleQuit}>
                    <Text style={s.secondaryButtonText}>Quitter</Text>
                </TouchableOpacity>
                <TouchableOpacity style={s.primaryButton} onPress={isPlacementPhase ? handleSkipPlacement : handleNext}>
                    <Text style={s.primaryButtonText}>{isPlacementPhase ? 'Passer' : 'Suivant'}</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background, padding: 16 },
    centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background, padding: 16 },
    loadingText: { marginTop: 12, fontSize: 14, color: colors.textSecondary },
    headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
    headerLabel: { color: colors.accentPrimary, fontSize: 15, fontWeight: '700' },
    progressLabel: { color: colors.textSecondary, fontSize: 12, marginTop: 4 },
    programTitle: { color: colors.textPrimary, fontSize: 22, fontWeight: '700', marginBottom: 12, textAlign: 'center' },
    title: { color: colors.textPrimary, fontSize: 22, fontWeight: '700', marginBottom: 12, textAlign: 'center' },
    subtitle: { color: colors.textSecondary, fontSize: 14, textAlign: 'center', lineHeight: 20 },
    playerCard: { flex: 1, backgroundColor: colors.surface, borderRadius: 14, borderWidth: 1, borderColor: colors.borderAccent, padding: 20, alignItems: 'center', justifyContent: 'center' },
    finishCard: { flex: 1, backgroundColor: colors.surface, borderRadius: 14, borderWidth: 1, borderColor: colors.borderAccent, padding: 20, alignItems: 'center', justifyContent: 'center' },
    stepTypeLabel: { color: colors.textSecondary, fontSize: 13, fontWeight: '700', marginBottom: 10, textTransform: 'uppercase' },
    stepTitle: { color: colors.textPrimary, fontSize: 26, fontWeight: '700', textAlign: 'center', marginBottom: 18 },
    metricText: { color: colors.textPrimary, fontSize: 18, fontWeight: '600', textAlign: 'center' },
    timerValue: { color: colors.accentPrimary, fontSize: 64, fontWeight: '700', marginBottom: 8 },
    timerLabel: { color: colors.textSecondary, fontSize: 14 },
    image: { width: '100%', height: 220, borderRadius: 12, marginBottom: 18 },
    mediaPlaceholder: { width: '100%', paddingVertical: 24, borderRadius: 12, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surfaceElevated, marginBottom: 18, alignItems: 'center' },
    mediaPlaceholderText: { color: colors.textSecondary, fontSize: 14, fontWeight: '600' },
    bottomActions: { flexDirection: 'row', gap: 12, marginTop: 16 },
    finishActions: { flexDirection: 'row', gap: 12, marginTop: 16 },
    flexButton: { flex: 1 },
    primaryButton: { flex: 1, backgroundColor: colors.accentPrimary, borderRadius: 10, minHeight: 52, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: 'rgba(255,255,255,0.25)' },
    primaryButtonText: { color: colors.background, fontSize: 15, fontWeight: '700' },
    secondaryButton: { flex: 1, backgroundColor: colors.surfaceElevated, borderRadius: 10, minHeight: 52, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border },
    secondaryButtonText: { color: colors.textPrimary, fontSize: 15, fontWeight: '700' },
    quitButton: { marginTop: 24, paddingHorizontal: 18, paddingVertical: 12, borderRadius: 8, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surfaceElevated },
    quitButtonText: { color: colors.textPrimary, fontSize: 14, fontWeight: '700' },
    quitGhostButton: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 8, borderWidth: 1, borderColor: colors.border },
    quitGhostButtonText: { color: colors.textSecondary, fontSize: 13, fontWeight: '700' },
    finishTime: { color: colors.accentPrimary, fontSize: 42, fontWeight: '700', marginBottom: 12 },
    finishHint: { color: colors.textSecondary, fontSize: 14, textAlign: 'center' },
    buttonDisabled: { opacity: 0.5 },
});
