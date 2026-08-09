import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    View, Text, TextInput, TouchableOpacity, ScrollView,
    StyleSheet, Alert, ActivityIndicator,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import { colors } from '../../theme/colors';
import { StepType, MetricType } from '../../types/enums';
import { StepWithExercise } from '../../types/program';
import { Exercise } from '../../types/exercise';
import { findAllExercises } from '../../db/queries/exerciseDao';
import { createProgram, getProgramById, updateProgram } from '../../db/queries/programDao';
import {
    getStepsForProgram, replaceProgramSteps,
} from '../../db/queries/programStepDao';
import { AddExerciseStepModal } from '../../components/AddExerciseStepModal';
import { AddRestStepModal } from '../../components/AddRestStepModal';
import { HeaderBackButton } from '../../components/ui/HeaderBackButton';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';

export default function ProgramFormScreen() {
    const { id } = useLocalSearchParams<{ id?: string }>();
    const router = useRouter();
    const navigation = useNavigation<any>();
    const isEditMode = !!id && id !== 'new';
    const isInternalNavigationRef = useRef(false);

    const [name, setName] = useState('');
    const [rounds, setRounds] = useState('1');
    const [programId, setProgramId] = useState<string | null>(isEditMode ? id! : null);
    const [steps, setSteps] = useState<StepWithExercise[]>([]);
    const [allExercises, setAllExercises] = useState<Exercise[]>([]);
    const [isSaving, setIsSaving] = useState(false);
    const [showExerciseModal, setShowExerciseModal] = useState(false);
    const [showRestModal, setShowRestModal] = useState(false);
    const [showCancelDialog, setShowCancelDialog] = useState(false);
    const [cancelTargetPath, setCancelTargetPath] = useState('/programs');
    const [initialName, setInitialName] = useState('');
    const [initialRounds, setInitialRounds] = useState('1');
    const [initialSteps, setInitialSteps] = useState<StepWithExercise[]>([]);

    const loadSteps = useCallback(async (pid: string) => {
        const data = await getStepsForProgram(pid);
        setSteps(data);
    }, []);

    useEffect(() => {
        findAllExercises().then(setAllExercises).catch(console.error);
        if (isEditMode && id) loadSteps(id);
    }, [id, isEditMode, loadSteps]);

    useEffect(() => {
        if (!isEditMode || !id) return;

        getProgramById(id)
            .then((program) => {
                if (!program) return;
                setName(program.name);
                setRounds(String(program.rounds));
                setInitialName(program.name);
                setInitialRounds(String(program.rounds));
            })
            .catch(console.error);
    }, [id, isEditMode]);

    useEffect(() => {
        if (!isEditMode || !id) return;

        getStepsForProgram(id)
            .then((items) => {
                setInitialSteps(items);
            })
            .catch(console.error);
    }, [id, isEditMode]);

    useEffect(() => {
        if (isEditMode && id) return;
        setInitialSteps([]);
    }, [id, isEditMode]);

    const serializeSteps = (items: StepWithExercise[]) => JSON.stringify(
        items.map((step) => ({
            id: step.id,
            stepType: step.stepType,
            exerciseId: step.exerciseId,
            orderIndex: step.orderIndex,
            sets: step.sets,
            reps: step.reps,
            durationSeconds: step.durationSeconds,
        }))
    );

    const persistableSteps = (pid: string) => steps.map((step, index) => ({
        ...step,
        programId: pid,
        orderIndex: index,
    }));

    const navigateAway = (targetPath: string) => {
        isInternalNavigationRef.current = true;
        router.replace(targetPath);
    };

    const handleSave = async () => {
        if (!name.trim()) {
            Alert.alert('Erreur', 'Le nom du programme est obligatoire');
            return;
        }
        const r = parseInt(rounds);
        if (!r || r < 1) {
            Alert.alert('Erreur', 'Le nombre de tours doit être supérieur à 0');
            return;
        }
        setIsSaving(true);
        try {
            if (isEditMode && id) {
                await updateProgram(id, name.trim(), r);
                await replaceProgramSteps(id, persistableSteps(id));
            } else {
                const newId = await createProgram(name.trim(), r);
                setProgramId(newId);
                await replaceProgramSteps(newId, persistableSteps(newId));
            }
            navigateAway('/programs');
        } catch (e) {
            Alert.alert('Erreur', 'Impossible de sauvegarder le programme');
            console.error(e);
        } finally {
            setIsSaving(false);
        }
    };

    const handleAddExercise = async (
        exerciseId: string, sets: number | null, reps: number | null, durationSeconds: number | null
    ) => {
        setShowExerciseModal(false);
        const exercise = allExercises.find((item) => item.id === exerciseId);
        if (!exercise) return;

        setSteps((prev) => [
            ...prev,
            {
                id: `local_step_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
                programId: programId ?? 'draft_program',
                stepType: StepType.EXERCISE,
                exerciseId,
                orderIndex: prev.length,
                sets,
                reps,
                durationSeconds,
                exerciseName: exercise.name,
                exerciseMetricType: exercise.metricType,
                mediaPath: exercise.mediaPath ?? null,
                mediaType: exercise.mediaType ?? null,
            },
        ]);
    };

    const handleAddRest = async (durationSeconds: number) => {
        setShowRestModal(false);
        setSteps((prev) => [
            ...prev,
            {
                id: `local_step_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
                programId: programId ?? 'draft_program',
                stepType: StepType.REST,
                exerciseId: null,
                orderIndex: prev.length,
                sets: null,
                reps: null,
                durationSeconds,
                exerciseName: null,
                exerciseMetricType: null,
                mediaPath: null,
                mediaType: null,
            },
        ]);
    };

    const handleReorder = (step: StepWithExercise, direction: 'up' | 'down') => {
        setSteps((prev) => {
            const currentIndex = prev.findIndex((item) => item.id === step.id);
            if (currentIndex < 0) return prev;

            const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
            if (targetIndex < 0 || targetIndex >= prev.length) return prev;

            const next = [...prev];
            [next[currentIndex], next[targetIndex]] = [next[targetIndex], next[currentIndex]];
            return next.map((item, index) => ({ ...item, orderIndex: index }));
        });
    };

    const handleDeleteStep = (stepId: string) => {
        setSteps((prev) => prev
            .filter((item) => item.id !== stepId)
            .map((item, index) => ({ ...item, orderIndex: index }))
        );
    };

    const hasStepChanges = serializeSteps(steps) !== serializeSteps(initialSteps);
    const hasMetadataChanges = name !== initialName || rounds !== initialRounds;
    const hasUnsavedChanges = hasStepChanges || hasMetadataChanges;

    const discardChangesAndExit = async (targetPath = '/programs') => {
        navigateAway(targetPath);
    };

    const handleCancel = (targetPath = '/programs') => {
        if (!hasUnsavedChanges) {
            navigateAway(targetPath);
            return;
        }

        setCancelTargetPath(targetPath);
        setShowCancelDialog(true);
    };

    useEffect(() => {
        const unsubscribeBeforeRemove = navigation.addListener('beforeRemove', (event: any) => {
            if (isInternalNavigationRef.current || isSaving) return;
            event.preventDefault();
            handleCancel('/programs');
        });

        const parent: any = navigation.getParent();
        const unsubscribeTabPress = parent?.addListener('tabPress', (event: any) => {
            if (isInternalNavigationRef.current || isSaving) return;
            event.preventDefault();
            const state = parent.getState();
            const route = state.routes.find((item: any) => item.key === event.target);
            const targetPath = route?.name === 'exercises' ? '/exercises' : '/programs';
            handleCancel(targetPath);
        });

        return () => {
            unsubscribeBeforeRemove();
            unsubscribeTabPress?.();
        };
    }, [navigation, isSaving, hasUnsavedChanges, name, rounds, steps, initialName, initialRounds, initialSteps]);

    return (
        <ScrollView style={s.container} contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
            <Stack.Screen
                options={{
                    headerBackVisible: false,
                    headerLeft: () => <HeaderBackButton onPress={() => handleCancel()} />,
                }}
            />
            <ConfirmDialog
                visible={showCancelDialog}
                title="Annuler les modifications"
                message="Quitter sans enregistrer ? Les changements non sauvegardés seront perdus."
                confirmLabel="Quitter"
                onCancel={() => setShowCancelDialog(false)}
                onConfirm={() => {
                    setShowCancelDialog(false);
                    discardChangesAndExit(cancelTargetPath).catch(console.error);
                }}
            />
            {/* Métadonnées */}
            <Text style={s.sectionTitle}>Informations</Text>
            <View style={s.fieldGroup}>
                <Text style={s.label}>Nom du programme *</Text>
                <TextInput
                    style={s.input} value={name} onChangeText={setName}
                    placeholder="ex : Full Body A" placeholderTextColor={colors.textSecondary}
                />
            </View>
            <View style={s.fieldGroup}>
                <Text style={s.label}>Nombre de tours</Text>
                <TextInput
                    style={[s.input, s.inputShort]} value={rounds} onChangeText={setRounds}
                    keyboardType="numeric" placeholderTextColor={colors.textSecondary}
                />
            </View>

            {/* Steps */}
            <Text style={s.sectionTitle}>Séquence</Text>
            {steps.length === 0 && (
                <Text style={s.emptyHint}>Aucune étape — ajoutez un exercice ou une pause.</Text>
            )}
            {steps.map((step, idx) => (
                <View key={step.id} style={s.stepCard}>
                    <View style={s.stepInfo}>
                        {step.stepType === StepType.EXERCISE ? (
                            <>
                                <Text style={s.stepName}>{step.exerciseName ?? 'Exercice supprimé'}</Text>
                                <Text style={s.stepDetail}>
                                    {step.exerciseMetricType === MetricType.REPS
                                        ? `${step.sets ?? '?'} × ${step.reps ?? '?'} rép.`
                                        : `${step.durationSeconds ?? '?'} s`}
                                </Text>
                            </>
                        ) : (
                            <>
                                <Text style={s.stepName}>Pause</Text>
                                <Text style={s.stepDetail}>{step.durationSeconds ?? '?'} s</Text>
                            </>
                        )}
                    </View>
                    <View style={s.stepActions}>
                        <TouchableOpacity
                            style={[s.iconBtn, idx === 0 && s.iconBtnDisabled]}
                            onPress={() => handleReorder(step, 'up')} disabled={idx === 0}
                        >
                            <MaterialCommunityIcons name="arrow-up" size={18} style={s.iconBtnIcon} />
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[s.iconBtn, idx === steps.length - 1 && s.iconBtnDisabled]}
                            onPress={() => handleReorder(step, 'down')} disabled={idx === steps.length - 1}
                        >
                            <MaterialCommunityIcons name="arrow-down" size={18} style={s.iconBtnIcon} />
                        </TouchableOpacity>
                        <TouchableOpacity style={[s.iconBtn, s.iconBtnDanger]} onPress={() => handleDeleteStep(step.id)}>
                            <MaterialCommunityIcons name="delete-outline" size={18} style={[s.iconBtnIcon, s.iconBtnIconDanger]} />
                        </TouchableOpacity>
                    </View>
                </View>
            ))}

            {/* Boutons ajout */}
            <View style={s.addRow}>
                <TouchableOpacity style={s.addBtn} onPress={() => setShowExerciseModal(true)}>
                    <Text style={s.addBtnText}>+ Exercice</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[s.addBtn, s.addBtnSecondary]} onPress={() => setShowRestModal(true)}>
                    <Text style={[s.addBtnText, s.addBtnTextSecondary]}>+ Pause</Text>
                </TouchableOpacity>
            </View>

            {programId && steps.length > 0 ? (
                <TouchableOpacity
                    style={s.playBtn}
                    onPress={() => router.push(`/programs/play/${programId}`)}
                >
                    <Text style={s.playBtnText}>Lancer le programme</Text>
                </TouchableOpacity>
            ) : null}

            {/* Enregistrer */}
            <View style={s.footerActions}>
                <TouchableOpacity
                    style={s.cancelBtn}
                    onPress={() => handleCancel()}
                    disabled={isSaving}
                >
                    <Text style={s.cancelBtnText}>Annuler</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[s.saveBtn, isSaving && s.saveBtnDisabled]}
                    onPress={handleSave} disabled={isSaving}
                >
                    {isSaving
                        ? <ActivityIndicator size="small" color={colors.background} />
                        : <Text style={s.saveBtnText}>Enregistrer</Text>}
                </TouchableOpacity>
            </View>

            <AddExerciseStepModal
                visible={showExerciseModal}
                exercises={allExercises}
                onAdd={handleAddExercise}
                onCancel={() => setShowExerciseModal(false)}
            />
            <AddRestStepModal
                visible={showRestModal}
                onAdd={handleAddRest}
                onCancel={() => setShowRestModal(false)}
            />
        </ScrollView>
    );
}

const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    content: { padding: 16, paddingBottom: 48 },
    sectionTitle: { fontSize: 16, fontWeight: '700', color: colors.accentPrimary, marginTop: 8, marginBottom: 12 },
    fieldGroup: { marginBottom: 16 },
    label: { fontSize: 13, fontWeight: '600', color: colors.textSecondary, marginBottom: 6 },
    input: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: colors.textPrimary },
    inputShort: { width: 100 },
    emptyHint: { fontSize: 13, color: colors.textSecondary, fontStyle: 'italic', marginBottom: 12 },
    stepCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderRadius: 8, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: colors.borderAccent },
    stepInfo: { flex: 1 },
    stepName: { fontSize: 14, fontWeight: '600', color: colors.textPrimary },
    stepDetail: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
    stepActions: { flexDirection: 'row', gap: 6 },
    iconBtn: { width: 32, height: 32, borderRadius: 6, backgroundColor: colors.surfaceElevated, justifyContent: 'center', alignItems: 'center' },
    iconBtnDisabled: { opacity: 0.3 },
    iconBtnDanger: { borderWidth: 1, borderColor: colors.danger },
    iconBtnIcon: { color: colors.textPrimary },
    iconBtnIconDanger: { color: colors.danger },
    addRow: { flexDirection: 'row', gap: 12, marginTop: 4, marginBottom: 20 },
    addBtn: { flex: 1, paddingVertical: 11, borderRadius: 8, backgroundColor: colors.accentPrimary, alignItems: 'center' },
    addBtnSecondary: { backgroundColor: 'transparent', borderWidth: 1, borderColor: colors.accentSecondary },
    addBtnText: { fontSize: 14, fontWeight: '600', color: colors.background },
    addBtnTextSecondary: { color: colors.accentSecondary },
    playBtn: { paddingVertical: 12, borderRadius: 8, borderWidth: 1, borderColor: colors.accentSecondary, backgroundColor: colors.surfaceElevated, alignItems: 'center', marginBottom: 12 },
    playBtnText: { fontSize: 14, fontWeight: '700', color: colors.accentSecondary },
    footerActions: { flexDirection: 'row', gap: 12 },
    cancelBtn: { flex: 1, paddingVertical: 14, borderRadius: 8, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surfaceElevated, alignItems: 'center' },
    cancelBtnText: { fontSize: 15, fontWeight: '700', color: colors.textPrimary },
    saveBtn: { flex: 1, paddingVertical: 14, borderRadius: 8, backgroundColor: colors.accentPrimary, alignItems: 'center', borderWidth: 2, borderColor: 'rgba(255,255,255,0.25)' },
    saveBtnDisabled: { opacity: 0.5 },
    saveBtnText: { fontSize: 15, fontWeight: '700', color: colors.background },
});
