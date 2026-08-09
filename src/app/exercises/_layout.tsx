import { Stack } from 'expo-router';

const headerTheme = {
    headerStyle: { backgroundColor: '#0D1117' },
    headerTintColor: '#00A8FF',
    headerTitleStyle: { fontSize: 18, fontWeight: '600' as const, color: '#E8EDF5' },
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
