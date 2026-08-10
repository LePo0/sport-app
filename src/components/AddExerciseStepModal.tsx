import React, { useState, useEffect } from 'react';
import { Modal, View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Exercise } from '../types/exercise';
import { MetricType } from '../types/enums';
import { colors } from '../theme/colors';

interface Props {
    visible: boolean;
    exercises: Exercise[];
    onAdd: (exerciseId: string, sets: number | null, reps: number | null, durationSeconds: number | null) => void;
    onCancel: () => void;
}

export function AddExerciseStepModal({ visible, exercises, onAdd, onCancel }: Props) {
    const insets = useSafeAreaInsets();
    const [selected, setSelected] = useState<Exercise | null>(null);
    const [sets, setSets] = useState('');
    const [reps, setReps] = useState('');
    const [duration, setDuration] = useState('');

    useEffect(() => {
        if (!visible) { setSelected(null); setSets(''); setReps(''); setDuration(''); }
    }, [visible]);

    const canAdd = !!selected && (
        selected.metricType === MetricType.REPS ? parseInt(reps) > 0 : parseInt(duration) > 0
    );

    const handleAdd = () => {
        if (!selected) return;
        onAdd(
            selected.id,
            parseInt(sets) || null,
            parseInt(reps) || null,
            parseInt(duration) || null
        );
    };

    return (
        <Modal transparent animationType="slide" visible={visible} onRequestClose={onCancel}>
            <View style={s.overlay}>
                <View style={[s.sheet, { paddingBottom: 20 + Math.max(insets.bottom, 12) }] }>
                    <Text style={s.title}>Ajouter un exercice</Text>

                    <Text style={s.label}>Choisir</Text>
                    <FlatList
                        data={exercises}
                        keyExtractor={e => e.id}
                        style={s.list}
                        renderItem={({ item }) => (
                            <TouchableOpacity
                                style={[s.item, selected?.id === item.id && s.itemSelected]}
                                onPress={() => setSelected(item)}
                            >
                                <Text style={[s.itemName, selected?.id === item.id && s.itemNameSelected]}>
                                    {item.name}
                                </Text>
                                <Text style={s.badge}>
                                    {item.metricType === MetricType.REPS ? 'Rép.' : 'Durée'}
                                </Text>
                            </TouchableOpacity>
                        )}
                    />

                    {selected && (
                        <View style={s.values}>
                            {selected.metricType === MetricType.REPS ? (
                                <View style={s.row}>
                                    <View style={s.half}>
                                        <Text style={s.label}>Séries</Text>
                                        <TextInput style={s.input} keyboardType="numeric" value={sets}
                                            onChangeText={setSets} placeholder="3" placeholderTextColor={colors.textSecondary} />
                                    </View>
                                    <View style={s.half}>
                                        <Text style={s.label}>Répétitions</Text>
                                        <TextInput style={s.input} keyboardType="numeric" value={reps}
                                            onChangeText={setReps} placeholder="12" placeholderTextColor={colors.textSecondary} />
                                    </View>
                                </View>
                            ) : (
                                <>
                                    <Text style={s.label}>Durée (secondes)</Text>
                                    <TextInput style={s.input} keyboardType="numeric" value={duration}
                                        onChangeText={setDuration} placeholder="60" placeholderTextColor={colors.textSecondary} />
                                </>
                            )}
                        </View>
                    )}

                    <View style={s.actions}>
                        <TouchableOpacity style={s.cancelBtn} onPress={onCancel}>
                            <Text style={s.cancelLabel}>Annuler</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[s.addBtn, !canAdd && s.addBtnDisabled]} onPress={handleAdd} disabled={!canAdd}>
                            <Text style={s.addLabel}>Ajouter</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
}

const s = StyleSheet.create({
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'flex-end' },
    sheet: { backgroundColor: colors.surfaceElevated, borderTopLeftRadius: 16, borderTopRightRadius: 16, paddingTop: 20, paddingHorizontal: 20, maxHeight: '85%' },
    title: { fontSize: 17, fontWeight: '700', color: colors.textPrimary, marginBottom: 16 },
    label: { fontSize: 13, fontWeight: '600', color: colors.textSecondary, marginBottom: 6 },
    list: { maxHeight: 180, marginBottom: 12 },
    item: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 12, borderRadius: 8, marginBottom: 4, backgroundColor: colors.surface },
    itemSelected: { backgroundColor: colors.accentPrimary },
    itemName: { fontSize: 14, color: colors.textPrimary, flex: 1 },
    itemNameSelected: { color: colors.background, fontWeight: '600' },
    badge: { fontSize: 11, color: colors.textSecondary, marginLeft: 8 },
    values: { marginBottom: 16 },
    row: { flexDirection: 'row', gap: 12 },
    half: { flex: 1 },
    input: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: colors.textPrimary },
    actions: { flexDirection: 'row', gap: 12, marginTop: 4 },
    cancelBtn: { flex: 1, paddingVertical: 12, borderRadius: 8, borderWidth: 1, borderColor: colors.border, alignItems: 'center' },
    cancelLabel: { fontSize: 14, fontWeight: '600', color: colors.textSecondary },
    addBtn: { flex: 1, paddingVertical: 12, borderRadius: 8, backgroundColor: colors.accentPrimary, alignItems: 'center' },
    addBtnDisabled: { opacity: 0.4 },
    addLabel: { fontSize: 14, fontWeight: '700', color: colors.background },
});
