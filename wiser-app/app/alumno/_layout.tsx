import { Stack } from 'expo-router';

export default function AlumnoLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="dashboard" />
      <Stack.Screen name="setup-profile" />
    </Stack>
  );
}
