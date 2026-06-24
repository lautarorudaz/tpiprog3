import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { useFonts, SpaceGrotesk_700Bold, SpaceGrotesk_500Medium } from '@expo-google-fonts/space-grotesk';
import { Rubik_400Regular, Rubik_500Medium } from '@expo-google-fonts/rubik';
import * as SplashScreen from 'expo-splash-screen';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    SpaceGrotesk_700Bold,
    SpaceGrotesk_500Medium,
    Rubik_400Regular,
    Rubik_500Medium,
  });

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="register" />
      <Stack.Screen name="select-role" />
      <Stack.Screen name="alumno" />
      <Stack.Screen name="profesor" />
    </Stack>
  );
}