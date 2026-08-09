import { Stack } from 'expo-router';
import { colors } from '../../theme/colors';

const headerTheme = {
    headerStyle: { backgroundColor: colors.background },
    headerTintColor: colors.accentPrimary,
    headerTitleStyle: { fontSize: 18, fontWeight: '600' as const, color: colors.textPrimary },
    headerShadowVisible: false,
};

export default function ProgramsLayout() {
    return (
        <Stack screenOptions={{ headerShown: true, headerBackVisible: true, ...headerTheme }}>
            <Stack.Screen
                name="index"
                options={{
                    title: 'Programmes',
                    headerBackVisible: false,
                }}
            />
            <Stack.Screen
                name="[id]"
                options={({ route }) => {
                    const id = (route.params as { id?: string })?.id;
                    return { title: id && id !== 'new' ? 'Modifier' : 'Nouveau programme' };
                }}
            />
            <Stack.Screen
                name="play/[id]"
                options={{
                    title: 'Exécution',
                }}
            />
        </Stack>
    );
}
