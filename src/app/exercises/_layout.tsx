import { Stack } from 'expo-router';
import { colors } from '../../theme/colors';

const headerTheme = {
    headerStyle: { backgroundColor: colors.background },
    headerTintColor: colors.accentPrimary,
    headerTitleStyle: { fontSize: 18, fontWeight: '600' as const, color: colors.textPrimary },
    headerShadowVisible: false,
};

export default function ExercisesLayout() {
    return (
        <Stack screenOptions={{ headerShown: true, headerBackVisible: true, ...headerTheme }}>
            <Stack.Screen
                name="index"
                options={{ title: 'Exercices' }}
            />
            <Stack.Screen
                name="[id]"
                options={({ route }) => {
                    const id = (route.params as { id?: string })?.id;
                    return { title: id && id !== 'new' ? 'Modifier' : 'Nouvel exercice' };
                }}
            />
        </Stack>
    );
}
