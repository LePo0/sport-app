import React, { useEffect, useRef, useState } from 'react';
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
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { ExerciseFormData } from '../../types/exercise';
import { MediaType, MetricType } from '../../types/enums';
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
    const draftExerciseIdRef = useRef(isEditMode && id ? id : createExerciseId());

    const [formData, setFormData] = useState<ExerciseFormData>({
        name: '',
        metricType: MetricType.REPS,
        mediaPath: null,
        mediaType: null,
    });

    const [isLoading, setIsLoading] = useState(isEditMode);
    const [isSaving, setIsSaving] = useState(false);
    const [isPickingMedia, setIsPickingMedia] = useState(false);
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
                    mediaPath: exercise.mediaPath ?? null,
                    mediaType: exercise.mediaType ?? null,
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

    const handlePickMedia = async () => {
        setIsPickingMedia(true);
        try {
            const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (!permission.granted) {
                Alert.alert('Permission requise', 'L\'accès à la bibliothèque est nécessaire pour choisir un média.');
                return;
            }

            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ['images', 'videos'],
                allowsMultipleSelection: false,
                allowsEditing: false,
                quality: 1,
            });

            if (result.canceled || result.assets.length === 0) {
                return;
            }

            const asset = result.assets[0];
            const nextMediaType = resolveMediaType(asset.type, asset.mimeType);
            if (!nextMediaType) {
                Alert.alert('Erreur', 'Type de média non pris en charge.');
                return;
            }

            const exerciseId = isEditMode && id ? id : draftExerciseIdRef.current;
            const extension = resolveFileExtension(asset.uri, asset.fileName, asset.mimeType, nextMediaType);
            const baseName = `exercise_${exerciseId}`;
            const finalPath = `${MEDIA_DIRECTORY}${baseName}${extension}`;
            const tempPath = `${MEDIA_DIRECTORY}${baseName}_pending${extension}`;

            await FileSystem.makeDirectoryAsync(MEDIA_DIRECTORY, { intermediates: true });
            await deleteIfExists(tempPath);
            await deleteIfExists(finalPath);
            await FileSystem.copyAsync({ from: asset.uri, to: tempPath });

            if (formData.mediaPath) {
                await deleteIfExists(formData.mediaPath);
            }

            await FileSystem.moveAsync({ from: tempPath, to: finalPath });

            setFormData((prev) => ({
                ...prev,
                mediaPath: finalPath,
                mediaType: nextMediaType,
            }));
        } catch (error) {
            Alert.alert('Erreur', 'Impossible de copier le média sélectionné.');
            console.error(error);
        } finally {
            setIsPickingMedia(false);
        }
    };

    const handleRemoveMedia = async () => {
        if (!formData.mediaPath) {
            setFormData((prev) => ({ ...prev, mediaPath: null, mediaType: null }));
            return;
        }

        setIsPickingMedia(true);
        try {
            await deleteIfExists(formData.mediaPath);
            setFormData((prev) => ({ ...prev, mediaPath: null, mediaType: null }));
        } catch (error) {
            Alert.alert('Erreur', 'Impossible de supprimer le média.');
            console.error(error);
        } finally {
            setIsPickingMedia(false);
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
                await insertExercise(formData, draftExerciseIdRef.current);
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
                    isBusy={isPickingMedia}
                    onPick={handlePickMedia}
                    onRemove={handleRemoveMedia}
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

const MEDIA_DIRECTORY = `${FileSystem.documentDirectory}exercise-media/`;

function createExerciseId(): string {
    return `${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

async function deleteIfExists(fileUri: string) {
    const info = await FileSystem.getInfoAsync(fileUri);
    if (info.exists) {
        await FileSystem.deleteAsync(fileUri, { idempotent: true });
    }
}

function resolveMediaType(assetType: string | null | undefined, mimeType: string | null | undefined): MediaType | null {
    if (assetType === 'video' || mimeType?.startsWith('video/')) {
        return MediaType.VIDEO;
    }

    if (assetType === 'image' || assetType === 'livePhoto' || mimeType?.startsWith('image/')) {
        return MediaType.IMAGE;
    }

    return null;
}

function resolveFileExtension(
    assetUri: string,
    fileName: string | null | undefined,
    mimeType: string | null | undefined,
    mediaType: MediaType
): string {
    const nameSource = fileName ?? assetUri;
    const matchedExtension = /\.([a-zA-Z0-9]+)(?:\?.*)?$/.exec(nameSource)?.[1]?.toLowerCase();
    if (matchedExtension) {
        return `.${matchedExtension}`;
    }

    switch (mimeType) {
        case 'image/jpeg':
            return '.jpg';
        case 'image/png':
            return '.png';
        case 'image/webp':
            return '.webp';
        case 'video/quicktime':
            return '.mov';
        case 'video/mp4':
            return '.mp4';
        default:
            return mediaType === MediaType.VIDEO ? '.mp4' : '.jpg';
    }
}
