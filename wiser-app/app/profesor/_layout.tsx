import { Stack } from 'expo-router';

export default function ProfesorLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="dashboard" />
      <Stack.Screen name="setup-profile" />
      <Stack.Screen name="agenda" />
      <Stack.Screen name="chats" />
      <Stack.Screen name="chat-detail" />
      <Stack.Screen name="ajustes" />
    </Stack>
  );
}
