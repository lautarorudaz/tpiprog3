import { View, Text, StyleSheet } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Colors } from '../../constants/colors';
import { Fonts } from '../../constants/fonts';

export default function AlumnoSetupProfile() {
  const { firebaseUid, email } = useLocalSearchParams<{ firebaseUid: string; email: string }>();

  return (
    <View style={styles.container}>
      <Text style={styles.titulo}>Configurá tu perfil</Text>
      <Text style={styles.subtitulo}>Alumno 🎓</Text>
      <Text style={styles.info}>{email}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
  },
  titulo: {
    color: Colors.blanco,
    fontFamily: Fonts.spaceGroteskBold,
    fontSize: 28,
    marginBottom: 8,
  },
  subtitulo: {
    color: Colors.cian,
    fontFamily: Fonts.spaceGroteskBold,
    fontSize: 20,
    marginBottom: 16,
  },
  info: {
    color: '#aaa',
    fontFamily: Fonts.rubikRegular,
    fontSize: 14,
  },
});
