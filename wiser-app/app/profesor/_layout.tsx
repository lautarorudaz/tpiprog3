import { Stack } from 'expo-router';

export default function ProfesorLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="dashboard" />
      <Stack.Screen name="setup-profile" />
    </Stack>
  );
}
