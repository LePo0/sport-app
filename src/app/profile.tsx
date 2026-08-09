import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    ScrollView,
    StyleSheet,
    ActivityIndicator,
    Alert,
} from 'react-native';
import { colors } from '../theme/colors';
import { calculateBmi, getBmiCategory } from '../services/bmi';
import { getProfile, upsertProfile } from '../db/queries/profileDao';
import {
    addWeightEntry,
    deleteWeightEntry,
    getAllWeightEntries,
    getLatestWeightEntry,
} from '../db/queries/weightEntryDao';
import { Profile, WeightEntry } from '../types/profile';
import { ListCard } from '../components/ui/ListCard';
import { ActionIconButton } from '../components/ui/ActionIconButton';

export default function ProfileScreen() {
    const [heightCm, setHeightCm] = useState('');
    const [weightKg, setWeightKg] = useState('');
    const [profile, setProfile] = useState<Profile | null>(null);
    const [latestWeightEntry, setLatestWeightEntry] = useState<WeightEntry | null>(null);
    const [weightEntries, setWeightEntries] = useState<WeightEntry[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSavingHeight, setIsSavingHeight] = useState(false);
    const [isAddingWeight, setIsAddingWeight] = useState(false);

    const loadData = useCallback(async () => {
        setIsLoading(true);
        try {
            const [profileData, latestWeight, entries] = await Promise.all([
                getProfile(),
                getLatestWeightEntry(),
                getAllWeightEntries(),
            ]);
            setProfile(profileData);
            setLatestWeightEntry(latestWeight);
            setWeightEntries(entries);
            setHeightCm(profileData?.heightCm ? String(profileData.heightCm) : '');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        loadData().catch(console.error);
    }, [loadData]);

    const bmiData = useMemo(() => {
        const parsedHeight = parseFloat(heightCm || String(profile?.heightCm ?? ''));
        const latestWeight = latestWeightEntry?.weightKg ?? null;

        if (!parsedHeight || parsedHeight <= 0 || latestWeight === null) {
            return null;
        }

        const bmi = calculateBmi(parsedHeight, latestWeight);
        return {
            value: bmi,
            category: getBmiCategory(bmi),
        };
    }, [heightCm, latestWeightEntry, profile?.heightCm]);

    const handleSaveHeight = async () => {
        const parsedHeight = parseFloat(heightCm);
        if (!parsedHeight || parsedHeight <= 0) {
            Alert.alert('Erreur', 'La taille doit être un nombre positif');
            return;
        }

        setIsSavingHeight(true);
        try {
            await upsertProfile(parsedHeight);
            await loadData();
        } catch (error) {
            console.error(error);
            Alert.alert('Erreur', 'Impossible d\'enregistrer la taille');
        } finally {
            setIsSavingHeight(false);
        }
    };

    const handleAddWeight = async () => {
        const parsedWeight = parseFloat(weightKg);
        if (!parsedWeight || parsedWeight <= 0) {
            Alert.alert('Erreur', 'Le poids doit être un nombre positif');
            return;
        }

        setIsAddingWeight(true);
        try {
            await addWeightEntry(new Date(), parsedWeight);
            setWeightKg('');
            await loadData();
        } catch (error) {
            console.error(error);
            Alert.alert('Erreur', 'Impossible d\'ajouter l\'entrée de poids');
        } finally {
            setIsAddingWeight(false);
        }
    };

    const handleDeleteWeight = (entry: WeightEntry) => {
        Alert.alert(
            'Supprimer',
            `Supprimer l\'entrée du ${formatDate(entry.date)} ?`,
            [
                { text: 'Annuler', style: 'cancel' },
                {
                    text: 'Supprimer',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await deleteWeightEntry(entry.id);
                            await loadData();
                        } catch (error) {
                            console.error(error);
                            Alert.alert('Erreur', 'Impossible de supprimer cette entrée');
                        }
                    },
                },
            ]
        );
    };

    function formatDate(timestamp: number): string {
        return new Date(timestamp).toLocaleDateString('fr-FR');
    }

    if (isLoading) {
        return (
            <View style={s.centerContainer}>
                <ActivityIndicator size="large" color={colors.accentPrimary} />
                <Text style={s.loadingText}>Chargement du profil...</Text>
            </View>
        );
    }

    return (
        <ScrollView style={s.container} contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
            <Text style={s.sectionTitle}>Profil</Text>
            <ListCard>
                <Text style={s.label}>Taille (cm)</Text>
                <TextInput
                    style={s.input}
                    keyboardType="numeric"
                    value={heightCm}
                    onChangeText={setHeightCm}
                    placeholder="ex : 178"
                    placeholderTextColor={colors.textSecondary}
                />
                <TouchableOpacity style={[s.primaryButton, isSavingHeight && s.buttonDisabled]} onPress={handleSaveHeight} disabled={isSavingHeight}>
                    {isSavingHeight
                        ? <ActivityIndicator size="small" color={colors.background} />
                        : <Text style={s.primaryButtonText}>Enregistrer</Text>}
                </TouchableOpacity>
            </ListCard>

            <Text style={s.sectionTitle}>IMC</Text>
            <ListCard>
                {bmiData ? (
                    <>
                        <Text style={s.bmiValue}>{bmiData.value.toFixed(1)}</Text>
                        <Text style={s.bmiCategory}>{bmiData.category}</Text>
                        <Text style={s.helperText}>Calculé à partir de votre dernier poids enregistré</Text>
                    </>
                ) : (
                    <Text style={s.helperText}>Renseignez votre taille et un poids pour calculer l'IMC</Text>
                )}
            </ListCard>

            <Text style={s.sectionTitle}>Historique de poids</Text>
            <ListCard>
                <Text style={s.label}>Poids (kg)</Text>
                <TextInput
                    style={s.input}
                    keyboardType="numeric"
                    value={weightKg}
                    onChangeText={setWeightKg}
                    placeholder="ex : 74.5"
                    placeholderTextColor={colors.textSecondary}
                />
                <Text style={s.helperText}>Date : {formatDate(Date.now())}</Text>
                <TouchableOpacity style={[s.primaryButton, isAddingWeight && s.buttonDisabled, s.addButton]} onPress={handleAddWeight} disabled={isAddingWeight}>
                    {isAddingWeight
                        ? <ActivityIndicator size="small" color={colors.background} />
                        : <Text style={s.primaryButtonText}>Ajouter</Text>}
                </TouchableOpacity>
            </ListCard>

            {weightEntries.length === 0 ? (
                <Text style={s.emptyText}>Aucune entrée de poids</Text>
            ) : (
                weightEntries.map((entry) => (
                    <ListCard key={entry.id}>
                        <View style={s.entryRow}>
                            <View style={s.entryMain}>
                                <Text style={s.entryWeight}>{entry.weightKg.toFixed(1)} kg</Text>
                                <Text style={s.entryDate}>{formatDate(entry.date)}</Text>
                            </View>
                            <View style={s.entryActions}>
                                <ActionIconButton icon="delete-outline" variant="danger" onPress={() => handleDeleteWeight(entry)} />
                            </View>
                        </View>
                    </ListCard>
                ))
            )}
        </ScrollView>
    );
}

const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    content: { padding: 16, paddingBottom: 48 },
    centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background, paddingHorizontal: 16 },
    loadingText: { marginTop: 12, fontSize: 14, color: colors.textSecondary },
    sectionTitle: { fontSize: 16, fontWeight: '700', color: colors.accentPrimary, marginTop: 8, marginBottom: 12 },
    label: { fontSize: 13, fontWeight: '600', color: colors.textSecondary, marginBottom: 6 },
    input: { backgroundColor: colors.surfaceElevated, borderWidth: 1, borderColor: colors.border, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: colors.textPrimary },
    primaryButton: { marginTop: 12, minHeight: 48, borderRadius: 8, backgroundColor: colors.accentPrimary, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: 'rgba(255,255,255,0.25)' },
    primaryButtonText: { color: colors.background, fontSize: 14, fontWeight: '700' },
    buttonDisabled: { opacity: 0.5 },
    bmiValue: { color: colors.accentPrimary, fontSize: 42, fontWeight: '700', textAlign: 'center', marginBottom: 8 },
    bmiCategory: { color: colors.textPrimary, fontSize: 18, fontWeight: '700', textAlign: 'center', marginBottom: 8 },
    helperText: { color: colors.textSecondary, fontSize: 13, lineHeight: 18 },
    addButton: { marginTop: 10 },
    emptyText: { color: colors.textSecondary, fontSize: 14, fontStyle: 'italic', marginTop: 4 },
    entryRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
    entryMain: { flex: 1 },
    entryActions: { flexDirection: 'row', gap: 8, justifyContent: 'flex-end', paddingTop: 2 },
    entryWeight: { color: colors.textPrimary, fontSize: 15, fontWeight: '700', marginBottom: 4 },
    entryDate: { color: colors.textSecondary, fontSize: 12 },
});
