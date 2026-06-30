import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Image, ScrollView } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { scale, verticalScale, moderateScale } from 'react-native-size-matters';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { Fonts } from '../../constants/fonts';
import { obtenerPerfilAlumno } from '../../services/apiService';

export default function ProfesorPerfilAlumno() {
  const router = useRouter();
  const { alumnoId } = useLocalSearchParams<{ alumnoId: string }>();
  const [alumno, setAlumno] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!alumnoId) return;
    obtenerPerfilAlumno(Number(alumnoId))
      .then(setAlumno)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [alumnoId]);

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={Colors.cian} />
      </View>
    );
  }

  if (!alumno) {
    return (
      <View style={styles.loading}>
        <Text style={{ color: Colors.blanco }}>No se pudo cargar el perfil.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color={Colors.blanco} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Perfil del Alumno</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.avatarSection}>
        <View style={styles.avatar}>
          {alumno.fotoPerfil ? (
            <Image source={{ uri: alumno.fotoPerfil }} style={styles.avatarImg} />
          ) : (
            <Ionicons name="person-outline" size={scale(48)} color="#aaa" />
          )}
        </View>
        <Text style={styles.nombre}>{alumno.nombre} {alumno.apellido}</Text>
        {alumno.email ? (
          <Text style={styles.email}>{alumno.email}</Text>
        ) : null}
      </View>

      <View style={styles.card}>
        <View style={styles.row}>
          <Ionicons name="location-outline" size={18} color={Colors.cian} />
          <View style={{ marginLeft: 10, flex: 1 }}>
            <Text style={styles.rowLabel}>Zona</Text>
            <Text style={styles.rowValue}>{alumno.zonaDeseada || 'No especificada'}</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { paddingHorizontal: scale(24), paddingTop: verticalScale(50), paddingBottom: 40 },
  loading: { flex: 1, backgroundColor: Colors.background, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: verticalScale(28) },
  headerTitle: { fontFamily: Fonts.spaceGroteskBold, color: Colors.blanco, fontSize: moderateScale(16) },
  avatarSection: { alignItems: 'center', marginBottom: verticalScale(28) },
  avatar: {
    width: scale(90), height: scale(90), borderRadius: scale(45),
    backgroundColor: Colors.superficieA, justifyContent: 'center', alignItems: 'center',
    overflow: 'hidden', borderWidth: 2, borderColor: Colors.cian, marginBottom: verticalScale(12),
  },
  avatarImg: { width: '100%', height: '100%', resizeMode: 'cover' },
  nombre: { fontFamily: Fonts.spaceGroteskBold, color: Colors.blanco, fontSize: moderateScale(20), textAlign: 'center' },
  email: { fontFamily: Fonts.rubikRegular, color: '#aaa', fontSize: moderateScale(12), marginTop: 4 },
  card: {
    backgroundColor: Colors.superficieA, borderRadius: 10, padding: scale(16),
    borderWidth: 1, borderColor: '#1e295d',
  },
  row: { flexDirection: 'row', alignItems: 'center' },
  rowLabel: { fontFamily: Fonts.rubikRegular, color: '#aaa', fontSize: moderateScale(11) },
  rowValue: { fontFamily: Fonts.rubikMedium, color: Colors.blanco, fontSize: moderateScale(14), marginTop: 2 },
});
