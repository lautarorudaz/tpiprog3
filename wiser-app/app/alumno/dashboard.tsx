import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../../constants/colors';
import { Fonts } from '../../constants/fonts';

export default function AlumnoDashboard() {
  return (
    <View style={styles.container}>
      <Text style={styles.texto}>Dashboard Alumno 🎓</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  texto: {
    color: Colors.blanco,
    fontFamily: Fonts.spaceGroteskBold,
    fontSize: 24,
  },
});