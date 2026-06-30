import { Stack } from 'expo-router';

export default function ProfesorLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="setup-profile" />
      <Stack.Screen name="chat-detail" />
      <Stack.Screen name="mi-perfil" />
      <Stack.Screen name="ajustes-cuenta" />
      <Stack.Screen name="preguntas-frecuentes" />
    </Stack>
  );
}
