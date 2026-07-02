import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { scale, verticalScale, moderateScale } from 'react-native-size-matters';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../../constants/colors';
import { Fonts } from '../../../constants/fonts';
import { cerrarSesion } from '../../../services/authService';

export default function AlumnoAjustes() {
  const router = useRouter();

  const handleCerrarSesion = () => {
    Alert.alert('Cerrar sesión', '¿Estás seguro?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Cerrar sesión', style: 'destructive',
        onPress: async () => { await cerrarSesion(); router.replace('/'); }
      }
    ]);
  };

  const opciones = [
    { icon: 'person-outline' as const, label: 'Mi perfil', onPress: () => router.push('/alumno/mi-perfil') },
    { icon: 'settings-outline' as const, label: 'Ajuste de cuenta', onPress: () => router.push('/alumno/ajustes-cuenta') },
    { icon: 'help-circle-outline' as const, label: 'Preguntas frecuentes', onPress: () => router.push('/alumno/preguntas-frecuentes') },
  ];

  return (
    <View style={styles.container}>
      <Text style={styles.wiser}>Wiser</Text>
      <Text style={styles.titulo}>Ajustes</Text>
      {opciones.map(op => (
        <TouchableOpacity key={op.label} style={styles.opcion} onPress={op.onPress}>
          <Ionicons name={op.icon} size={20} color={Colors.cian} />
          <Text style={styles.opcionTexto}>{op.label}</Text>
          <Ionicons name="chevron-forward" size={18} color="#8b93b8" />
        </TouchableOpacity>
      ))}
      <TouchableOpacity style={styles.cerrarSesionBtn} onPress={handleCerrarSesion}>
        <Text style={styles.cerrarSesionTexto}>Cerrar sesión</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background, paddingHorizontal: scale(24), paddingTop: verticalScale(30) },
  wiser: { fontFamily: Fonts.spaceGroteskBold, fontSize: moderateScale(32), color: '#3455ff', textAlign: 'center', marginBottom: verticalScale(4) },
  titulo: { fontFamily: Fonts.spaceGroteskMedium, fontSize: moderateScale(16), color: Colors.blanco, textAlign: 'center', marginBottom: verticalScale(28) },
  opcion: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: Colors.superficieA, borderRadius: 8, padding: scale(16), marginBottom: verticalScale(14), borderWidth: 1, borderColor: '#1e295d' },
  opcionTexto: { flex: 1, fontFamily: Fonts.rubikMedium, color: Colors.blanco, fontSize: moderateScale(14) },
  cerrarSesionBtn: { backgroundColor: Colors.error, borderRadius: 8, paddingVertical: scale(14), alignItems: 'center', marginTop: verticalScale(20) },
  cerrarSesionTexto: { fontFamily: Fonts.spaceGroteskBold, color: Colors.blanco, fontSize: moderateScale(13), letterSpacing: 0.5 },
});
