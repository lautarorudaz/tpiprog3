import { useEffect, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, Alert, ActivityIndicator, Image
} from 'react-native';
import { useRouter } from 'expo-router';
import { scale, verticalScale, moderateScale } from 'react-native-size-matters';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { Colors } from '../../constants/colors';
import { Fonts } from '../../constants/fonts';
import { editarPerfilAlumno } from '../../services/apiService';
import { useAlumno } from '../../hooks/use-alumno';

export default function AlumnoMiPerfil() {
  const router = useRouter();
  const { usuario, alumnoId, loading: loadingAlumno, reload } = useAlumno();

  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [zona, setZona] = useState('');
  const [fotoPerfil, setFotoPerfil] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    if (usuario) {
      setNombre(usuario.nombre || '');
      setApellido(usuario.apellido || '');
      setFotoPerfil(usuario.fotoPerfil || null);
      if (usuario.alumno?.zonaDeseada) setZona(usuario.alumno.zonaDeseada);
    }
  }, [usuario]);

  const handleElegirFoto = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: 0.5, base64: true,
    });
    if (!result.canceled && result.assets[0]?.base64) {
      setFotoPerfil(`data:image/jpeg;base64,${result.assets[0].base64}`);
    }
  };

  const handleGuardar = async () => {
    if (!alumnoId) return;
    if (!nombre.trim() || !apellido.trim()) {
      Alert.alert('Faltan datos', 'Completá tu nombre y apellido.');
      return;
    }
    setGuardando(true);
    try {
      let latitud: number | null = usuario?.alumno?.latitud ?? null;
      let longitud: number | null = usuario?.alumno?.longitud ?? null;

      // Si cambió la zona, geocodificar la nueva dirección
      const zonaAnterior = usuario?.alumno?.zonaDeseada ?? '';
      if (zona.trim() && zona.trim() !== zonaAnterior) {
        try {
          const results = await Location.geocodeAsync(zona.trim());
          if (results.length > 0) {
            latitud = results[0].latitude;
            longitud = results[0].longitude;
          }
        } catch {}
      }

      await editarPerfilAlumno(alumnoId, { nombre, apellido, fotoPerfil, zonaDeseada: zona.trim() || null, latitud, longitud });
      await reload();
      Alert.alert('Listo', 'Tu perfil se actualizó correctamente.', [{ text: 'OK', onPress: () => router.back() }]);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'No se pudo guardar el perfil.');
    } finally {
      setGuardando(false);
    }
  };

  if (loadingAlumno) {
    return <View style={styles.loading}><ActivityIndicator size="large" color={Colors.cian} /></View>;
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color={Colors.blanco} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mi perfil</Text>
        <View style={{ width: 24 }} />
      </View>

      <TouchableOpacity style={styles.avatarSection} onPress={handleElegirFoto}>
        <View style={styles.avatar}>
          {fotoPerfil ? (
            <Image source={{ uri: fotoPerfil }} style={{ width: '100%', height: '100%', resizeMode: 'cover' }} />
          ) : (
            <Ionicons name="person-outline" size={scale(40)} color="#aaa" />
          )}
        </View>
        <Text style={styles.cambiarFotoText}>Cambiar foto</Text>
      </TouchableOpacity>

      <Text style={styles.label}>Nombre</Text>
      <TextInput style={styles.input} value={nombre} onChangeText={setNombre} placeholderTextColor="#aaa" placeholder="Tu nombre" />

      <Text style={styles.label}>Apellido</Text>
      <TextInput style={styles.input} value={apellido} onChangeText={setApellido} placeholderTextColor="#aaa" placeholder="Tu apellido" />

      <Text style={styles.label}>Zona / Ubicación</Text>
      <TextInput style={styles.input} value={zona} onChangeText={setZona} placeholderTextColor="#aaa" placeholder="Ej: Resistencia, Chaco" />

      <TouchableOpacity style={styles.btn} onPress={handleGuardar} disabled={guardando}>
        {guardando ? <ActivityIndicator color={Colors.background} /> : <Text style={styles.btnText}>Guardar cambios</Text>}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { paddingHorizontal: scale(24), paddingTop: verticalScale(50), paddingBottom: 40 },
  loading: { flex: 1, backgroundColor: Colors.background, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: verticalScale(24) },
  headerTitle: { fontFamily: Fonts.spaceGroteskBold, color: Colors.blanco, fontSize: moderateScale(16) },
  avatarSection: { alignItems: 'center', marginBottom: verticalScale(24) },
  avatar: { width: scale(90), height: scale(90), borderRadius: scale(45), backgroundColor: Colors.superficieA, justifyContent: 'center', alignItems: 'center', overflow: 'hidden', borderWidth: 2, borderColor: Colors.cian },
  cambiarFotoText: { fontFamily: Fonts.rubikMedium, color: Colors.cian, fontSize: moderateScale(12), marginTop: 8 },
  label: { fontFamily: Fonts.rubikMedium, color: Colors.blanco, fontSize: moderateScale(13), marginBottom: 6, marginTop: verticalScale(14) },
  input: { backgroundColor: Colors.superficieA, borderRadius: 8, padding: scale(14), color: Colors.blanco, fontFamily: Fonts.rubikRegular, fontSize: moderateScale(14), borderWidth: 1, borderColor: '#1e295d' },
  btn: { backgroundColor: Colors.cian, borderRadius: 8, paddingVertical: scale(16), alignItems: 'center', marginTop: verticalScale(28) },
  btnText: { fontFamily: Fonts.spaceGroteskBold, color: Colors.background, fontSize: moderateScale(14) },
});
