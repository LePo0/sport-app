import React, { useState, useEffect, useCallback } from 'react';
import {
    View, Text, TextInput, TouchableOpacity, ScrollView,
    StyleSheet, Alert, ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { colors } from '../../theme/colors';
import { StepType, MetricType } from '../../types/enums';
import { StepWithExercise } from '../../types/program';
import { Exercise } from '../../types/exercise';
import { findAllExercises } from '../../db/queries/exerciseDao';
import { createProgram, getAllPrograms, updateProgram } from '../../db/queries/programDao';
import {
    getStepsForProgram, addExerciseStep, addRestStep,
    reorderStep, deleteStep,
} from '../../db/queries/programStepDao';
import { AddExerciseStepModal } from '../../components/AddExerciseStepModal';
import { AddRestStepModal } from '../../components/AddRestStepModal';

export default function ProgramFormScreen() {
    const { id } = useLocalSearchParams<{ id?: string }>();
    const router = useRouter();
    const isEditMode = !!id && id !== 'new';

    const [name, setName] = useState('');
    const [rounds, setRounds] = useState('1');
    const [programId, setProgramId] = useState<string | null>(isEditMode ? id! : null);
    const [steps, setSteps] = useState<StepWithExercise[]>([]);
    const [allExercises, setAllExercises] = useState<Exercise[]>([]);
    const [isSaving, setIsSaving] = useState(false);
    const [showExerciseModal, setShowExerciseModal] = useState(false);
    const [showRestModal, setShowRestModal] = useState(false);

    const loadSteps = useCallback(async (pid: string) => {
        const data = await getStepsForProgram(pid);
        setSteps(data);
    }, []);

    useEffect(() => {
        findAllExercises().then(setAllExercises).catch(console.error);
        if (isEditMode && id) loadSteps(id);
    }, []);

    useEffect(() => {
        if (!isEditMode || !id) return;

        getAllPrograms()
            .then((items) => {
                const program = items.find((item) => item.id === id);
                if (!program) return;
                setName(program.name);
                setRounds(String(program.rounds));
            })
            .catch(console.error);
    }, [id, isEditMode]);

    // Crée le programme en brouillon si ce n'est pas encore fait, retourne son id
    const ensureProgramExists = async (): Promise<string> => {
        if (programId) return programId;
        const newId = await createProgram(name.trim() || 'Nouveau programme', parseInt(rounds) || 1);
        setProgramId(newId);
        return newId;
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
            if (programId) {
                await updateProgram(programId, name.trim(), r);
            } else {
                const newId = await createProgram(name.trim(), r);
                setProgramId(newId);
            }
            router.replace('/programs');
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
        const pid = await ensureProgramExists();
        await addExerciseStep(pid, exerciseId, steps.length, sets, reps, durationSeconds);
        await loadSteps(pid);
    };

    const handleAddRest = async (durationSeconds: number) => {
        setShowRestModal(false);
        const pid = await ensureProgramExists();
        await addRestStep(pid, steps.length, durationSeconds);
        await loadSteps(pid);
    };

    const handleReorder = async (step: StepWithExercise, direction: 'up' | 'down') => {
        const newIndex = direction === 'up' ? step.orderIndex - 1 : step.orderIndex + 1;
        await reorderStep(step.id, newIndex);
        if (programId) await loadSteps(programId);
    };

    const handleDeleteStep = async (stepId: string) => {
        await deleteStep(stepId);
        if (programId) await loadSteps(programId);
    };

    return (
        <ScrollView style={s.container} contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
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
                            <Text style={s.iconBtnText}>↑</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[s.iconBtn, idx === steps.length - 1 && s.iconBtnDisabled]}
                            onPress={() => handleReorder(step, 'down')} disabled={idx === steps.length - 1}
                        >
                            <Text style={s.iconBtnText}>↓</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[s.iconBtn, s.iconBtnDanger]} onPress={() => handleDeleteStep(step.id)}>
                            <Text style={[s.iconBtnText, s.iconBtnTextDanger]}>✕</Text>
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

            {/* Enregistrer */}
            <TouchableOpacity
                style={[s.saveBtn, isSaving && s.saveBtnDisabled]}
                onPress={handleSave} disabled={isSaving}
            >
                {isSaving
                    ? <ActivityIndicator size="small" color={colors.background} />
                    : <Text style={s.saveBtnText}>Enregistrer</Text>}
            </TouchableOpacity>

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
    iconBtnText: { fontSize: 14, color: colors.textPrimary, fontWeight: '600' },
    iconBtnTextDanger: { color: colors.danger },
    addRow: { flexDirection: 'row', gap: 12, marginTop: 4, marginBottom: 20 },
    addBtn: { flex: 1, paddingVertical: 11, borderRadius: 8, backgroundColor: colors.accentPrimary, alignItems: 'center' },
    addBtnSecondary: { backgroundColor: 'transparent', borderWidth: 1, borderColor: colors.accentSecondary },
    addBtnText: { fontSize: 14, fontWeight: '600', color: colors.background },
    addBtnTextSecondary: { color: colors.accentSecondary },
    saveBtn: { paddingVertical: 14, borderRadius: 8, backgroundColor: colors.accentPrimary, alignItems: 'center', borderWidth: 2, borderColor: 'rgba(255,255,255,0.25)' },
    saveBtnDisabled: { opacity: 0.5 },
    saveBtnText: { fontSize: 15, fontWeight: '700', color: colors.background },
});
