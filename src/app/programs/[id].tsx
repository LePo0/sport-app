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
import { HeaderBackButton } from '../../components/ui/HeaderBackButton';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { DraggableList } from '../../components/ui/DraggableList';

export default function ProgramFormScreen() {
    const { id } = useLocalSearchParams<{ id?: string }>();
    const router = useRouter();
    const navigation = useNavigation<any>();
    const isEditMode = !!id && id !== 'new';
    const isInternalNavigationRef = useRef(false);

    const [name, setName] = useState('');
    const [rounds, setRounds] = useState('1');
    const [restBetweenRounds, setRestBetweenRounds] = useState('');
    const [programId, setProgramId] = useState<string | null>(isEditMode ? id! : null);
    const [steps, setSteps] = useState<StepWithExercise[]>([]);
    const [allExercises, setAllExercises] = useState<Exercise[]>([]);
    const [isSaving, setIsSaving] = useState(false);
    const [showExerciseModal, setShowExerciseModal] = useState(false);
    const [showCancelDialog, setShowCancelDialog] = useState(false);
    const [cancelTargetPath, setCancelTargetPath] = useState('/programs');
    const [initialName, setInitialName] = useState('');
    const [initialRounds, setInitialRounds] = useState('1');
    const [initialRestBetweenRounds, setInitialRestBetweenRounds] = useState('');
    const [initialSteps, setInitialSteps] = useState<StepWithExercise[]>([]);
    const [isDraggingStep, setIsDraggingStep] = useState(false);

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
                setRestBetweenRounds(String(program.restBetweenRoundsSeconds));
                setInitialName(program.name);
                setInitialRounds(String(program.rounds));
                setInitialRestBetweenRounds(String(program.restBetweenRoundsSeconds));
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
            restAfterSetSeconds: step.restAfterSetSeconds,
            restAfterExerciseSeconds: step.restAfterExerciseSeconds,
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
        const restBetween = parseInt(restBetweenRounds) || 0;
        setIsSaving(true);
        try {
            if (isEditMode && id) {
                await updateProgram(id, name.trim(), r, restBetween);
                await replaceProgramSteps(id, persistableSteps(id));
            } else {
                const newId = await createProgram(name.trim(), r, restBetween);
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
        exerciseId: string, sets: number | null, reps: number | null, durationSeconds: number | null,
        restAfterSetSeconds: number, restAfterExerciseSeconds: number
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
                restAfterSetSeconds,
                restAfterExerciseSeconds,
                exerciseName: exercise.name,
                exerciseMetricType: exercise.metricType,
                mediaPath: exercise.mediaPath ?? null,
                mediaType: exercise.mediaType ?? null,
            },
        ]);
    };

    const handleReorder = (from: number, to: number) => {
        setSteps((prev) => {
            if (from < 0 || to < 0 || from >= prev.length || to >= prev.length) return prev;
            const next = [...prev];
            const [moved] = next.splice(from, 1);
            next.splice(to, 0, moved);
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
    const hasMetadataChanges = name !== initialName || rounds !== initialRounds || restBetweenRounds !== initialRestBetweenRounds;
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
    }, [navigation, isSaving, hasUnsavedChanges, name, rounds, restBetweenRounds, steps, initialName, initialRounds, initialRestBetweenRounds, initialSteps]);

    return (
        <ScrollView
            style={s.container}
            contentContainerStyle={s.content}
            keyboardShouldPersistTaps="handled"
            scrollEnabled={!isDraggingStep}
        >
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
            <View style={s.fieldGroup}>
                <Text style={s.label}>Repos entre tours (secondes)</Text>
                <TextInput
                    style={[s.input, s.inputShort]} value={restBetweenRounds} onChangeText={setRestBetweenRounds}
                    keyboardType="numeric" placeholder="90" placeholderTextColor={colors.textSecondary}
                />
            </View>

            {/* Steps */}
            <Text style={s.sectionTitle}>Séquence</Text>
            {steps.length === 0 && (
                <Text style={s.emptyHint}>Aucune étape — ajoutez un exercice.</Text>
            )}
            {steps.length > 1 && (
                <Text style={s.emptyHint}>Glissez la poignée pour réordonner.</Text>
            )}
            <DraggableList
                data={steps}
                keyExtractor={(step) => step.id}
                onReorder={handleReorder}
                onDragStateChange={setIsDraggingStep}
                renderItem={(step, idx, dragHandlers, isDragging) => (
                    <View style={[s.stepCard, isDragging && s.stepCardDragging]}>
                        <View style={s.dragHandle} {...dragHandlers}>
                            <MaterialCommunityIcons name="drag-horizontal-variant" size={20} style={s.dragHandleIcon} />
                        </View>
                        <View style={s.stepInfo}>
                            {step.stepType === StepType.EXERCISE ? (
                                <>
                                    <Text style={s.stepName}>{step.exerciseName ?? 'Exercice supprimé'}</Text>
                                    <Text style={s.stepDetail}>
                                        {step.exerciseMetricType === MetricType.REPS
                                            ? `${step.sets ?? '?'} × ${step.reps ?? '?'} rép.`
                                            : `${step.durationSeconds ?? '?'} s`}
                                    </Text>
                                    {(step.restAfterSetSeconds > 0 || step.restAfterExerciseSeconds > 0) && (
                                        <Text style={s.stepDetail}>
                                            {step.restAfterSetSeconds > 0 ? `Repos série ${step.restAfterSetSeconds}s` : null}
                                            {step.restAfterSetSeconds > 0 && step.restAfterExerciseSeconds > 0 ? ' • ' : null}
                                            {step.restAfterExerciseSeconds > 0 ? `Repos exercice ${step.restAfterExerciseSeconds}s` : null}
                                        </Text>
                                    )}
                                </>
                            ) : (
                                <>
                                    <Text style={s.stepName}>Pause</Text>
                                    <Text style={s.stepDetail}>{step.durationSeconds ?? '?'} s</Text>
                                </>
                            )}
                        </View>
                        <View style={s.stepActions}>
                            <TouchableOpacity style={[s.iconBtn, s.iconBtnDanger]} onPress={() => handleDeleteStep(step.id)}>
                                <MaterialCommunityIcons name="delete-outline" size={18} style={[s.iconBtnIcon, s.iconBtnIconDanger]} />
                            </TouchableOpacity>
                        </View>
                    </View>
                )}
            />

            {/* Boutons ajout */}
            <View style={s.addRow}>
                <TouchableOpacity style={s.addBtn} onPress={() => setShowExerciseModal(true)}>
                    <Text style={s.addBtnText}>+ Exercice</Text>
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
    stepCardDragging: { borderColor: colors.accentPrimary, backgroundColor: colors.surfaceElevated, shadowColor: '#000', shadowOpacity: 0.4, shadowRadius: 8, shadowOffset: { width: 0, height: 4 } },
    dragHandle: { paddingVertical: 8, paddingRight: 10, justifyContent: 'center' },
    dragHandleIcon: { color: colors.textSecondary },
    stepInfo: { flex: 1 },
    stepName: { fontSize: 14, fontWeight: '600', color: colors.textPrimary },
    stepDetail: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
    stepActions: { flexDirection: 'row', gap: 6 },
    iconBtn: { width: 32, height: 32, borderRadius: 6, backgroundColor: colors.surfaceElevated, justifyContent: 'center', alignItems: 'center' },
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
