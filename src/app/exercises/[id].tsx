import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    Alert,
    ScrollView,
    ActivityIndicator,
} from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { ExerciseFormData } from '../../types/exercise';
import { MetricType } from '../../types/enums';
import {
    findExerciseById,
    insertExercise,
    updateExercise,
    getProgramsUsingExercise,
} from '../../db/queries/exerciseDao';
import { MetricTypeToggle } from '../../components/MetricTypeToggle';
import { MediaPicker } from '../../components/MediaPicker';
import { exerciseEditStyles } from './styles';
import { colors } from '../../theme/colors';
import { HeaderBackButton } from '../../components/ui/HeaderBackButton';

export default function ExerciseEditScreen() {
    const { id } = useLocalSearchParams<{ id?: string }>();
    const router = useRouter();
    const isEditMode = !!id && id !== 'new';

    const [formData, setFormData] = useState<ExerciseFormData>({
        name: '',
        metricType: MetricType.REPS,
        mediaPath: undefined,
        mediaType: undefined,
    });

    const [isLoading, setIsLoading] = useState(isEditMode);
    const [isSaving, setIsSaving] = useState(false);
    const [originalMetricType, setOriginalMetricType] = useState<MetricType | null>(null);

    useEffect(() => {
        if (isEditMode && id) loadExercise(id);
    }, [id, isEditMode]);

    const loadExercise = async (exerciseId: string) => {
        try {
            const exercise = await findExerciseById(exerciseId);
            if (exercise) {
                setFormData({
                    name: exercise.name,
                    metricType: exercise.metricType,
                    mediaPath: exercise.mediaPath ?? undefined,
                    mediaType: exercise.mediaType ?? undefined,
                });
                setOriginalMetricType(exercise.metricType);
            } else {
                Alert.alert('Erreur', 'Exercice introuvable');
                router.back();
            }
        } catch (error) {
            Alert.alert('Erreur', 'Impossible de charger l\'exercice');
            console.error(error);
            router.back();
        } finally {
            setIsLoading(false);
        }
    };

    const handleSave = async () => {
        if (!formData.name.trim()) {
            Alert.alert('Erreur', 'Le nom de l\'exercice est obligatoire');
            return;
        }

        // Garde-fou : changement de metricType sur un exo utilisé dans des programmes
        if (isEditMode && id && originalMetricType && formData.metricType !== originalMetricType) {
            const usedIn = await getProgramsUsingExercise(id);
            if (usedIn.length > 0) {
                Alert.alert(
                    'Modification impossible',
                    `Impossible de changer le type de cet exercice : il est utilisé dans ${usedIn.map(p => p.programName).join(', ')}.\nRetirez-le de ces programmes d\'abord.`
                );
                return;
            }
        }

        setIsSaving(true);
        try {
            if (isEditMode && id) {
                await updateExercise(id, formData);
                Alert.alert('Succès', 'Exercice mis à jour');
            } else {
                await insertExercise(formData);
                Alert.alert('Succès', 'Exercice créé');
            }
            router.back();
        } catch (error) {
            Alert.alert('Erreur', 'Impossible de sauvegarder l\'exercice');
            console.error(error);
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <View style={exerciseEditStyles.centerContainer}>
                <ActivityIndicator size="large" color={colors.accentPrimary} />
                <Text style={exerciseEditStyles.loadingText}>Chargement...</Text>
            </View>
        );
    }

    return (
        <ScrollView style={exerciseEditStyles.container} showsVerticalScrollIndicator={false}>
            <Stack.Screen
                options={{
                    headerBackVisible: false,
                    headerLeft: () => <HeaderBackButton onPress={() => router.back()} />,
                }}
            />
            <View style={exerciseEditStyles.content}>
                <Text style={exerciseEditStyles.sectionTitle}>Détails de l'exercice</Text>

                {/* Champ Nom */}
                <View style={exerciseEditStyles.fieldGroup}>
                    <Text style={exerciseEditStyles.label}>Nom de l'exercice *</Text>
                    <TextInput
                        style={exerciseEditStyles.input}
                        placeholder="ex : Pompes, Squats, Course"
                        value={formData.name}
                        onChangeText={(text) => setFormData((prev) => ({ ...prev, name: text }))}
                        placeholderTextColor="#999"
                    />
                </View>

                {/* Toggle Type Métrique */}
                <MetricTypeToggle
                    value={formData.metricType}
                    onChange={(metricType) => setFormData((prev) => ({ ...prev, metricType }))}
                />

                {/* Media Picker */}
                <MediaPicker
                    mediaPath={formData.mediaPath}
                    mediaType={formData.mediaType}
                    onRemove={() =>
                        setFormData((prev) => ({ ...prev, mediaPath: undefined, mediaType: undefined }))
                    }
                />
            </View>

            {/* Boutons d'action */}
            <View style={exerciseEditStyles.actions}>
                <TouchableOpacity
                    style={[exerciseEditStyles.button, exerciseEditStyles.cancelButton]}
                    onPress={() => router.back()}
                    disabled={isSaving}
                >
                    <Text style={exerciseEditStyles.cancelButtonText}>Annuler</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[exerciseEditStyles.button, exerciseEditStyles.saveButton, isSaving && exerciseEditStyles.saveButtonDisabled]}
                    onPress={handleSave}
                    disabled={isSaving}
                >
                    {isSaving ? (
                        <ActivityIndicator size="small" color="#fff" />
                    ) : (
                        <Text style={exerciseEditStyles.saveButtonText}>{isEditMode ? 'Modifier' : 'Créer'}</Text>
                    )}
                </TouchableOpacity>
            </View>
        </ScrollView>
    );
}
