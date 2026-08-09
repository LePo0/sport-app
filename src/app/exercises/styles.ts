import { StyleSheet } from 'react-native';
import { colors } from '../../theme/colors';
import { glowMd } from '../../theme/glow';

export const exerciseEditStyles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: colors.background,
    },
    loadingText: {
        marginTop: 12,
        fontSize: 14,
        color: colors.textSecondary,
    },
    content: {
        padding: 16,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: colors.textPrimary,
        marginBottom: 16,
    },
    fieldGroup: {
        marginBottom: 20,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.textSecondary,
        marginBottom: 8,
    },
    input: {
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 10,
        fontSize: 14,
        color: colors.textPrimary,
    },
    actions: {
        flexDirection: 'row',
        gap: 12,
        padding: 16,
        paddingBottom: 32,
    },
    button: {
        flex: 1,
        borderRadius: 8,
        paddingVertical: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    cancelButton: {
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
    },
    cancelButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.textSecondary,
    },
    saveButton: {
        backgroundColor: colors.accentPrimary,
        borderWidth: 2,
        borderColor: 'rgba(255,255,255,0.25)',
        ...glowMd(),
    },
    saveButtonDisabled: {
        backgroundColor: colors.disabled,
    },
    saveButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.background,
    },
});

export default exerciseEditStyles;