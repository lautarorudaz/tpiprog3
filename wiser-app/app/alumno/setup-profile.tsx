import { useEffect, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, Alert, ActivityIndicator, Image
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { scale, verticalScale, moderateScale } from 'react-native-size-matters';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
import { Colors } from '../../constants/colors';
import { Fonts } from '../../constants/fonts';
import { obtenerUsuarioPorFirebase, editarPerfilAlumno } from '../../services/apiService';

export default function AlumnoSetupProfile() {
  const router = useRouter();
  const { firebaseUid, email } = useLocalSearchParams<{ firebaseUid: string; email: string }>();

  const [loading, setLoading] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [alumnoId, setAlumnoId] = useState<number | null>(null);

  const [nombreCompleto, setNombreCompleto] = useState('');
  const [zona, setZona] = useState('');
  const [fotoPerfil, setFotoPerfil] = useState<string | null>(null);

  useEffect(() => {
    const init = async () => {
      try {
        const uid = firebaseUid;
        if (!uid) { router.replace('/'); return; }
        const userObj = await obtenerUsuarioPorFirebase(uid);
        if (userObj?.alumno) {
          setAlumnoId(userObj.alumno.id);
          const nombrePrev = `${userObj.nombre || ''} ${userObj.apellido || ''}`.trim();
          if (nombrePrev) setNombreCompleto(nombrePrev);
          if (userObj.fotoPerfil) setFotoPerfil(userObj.fotoPerfil);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [firebaseUid]);

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

  const handleContinuar = async () => {
    if (!nombreCompleto.trim()) {
      Alert.alert('Completá tus datos', 'Por favor ingresá tu nombre y apellido.');
      return;
    }
    if (!alumnoId) {
      Alert.alert('Error', 'No se encontró tu perfil. Intentá de nuevo.');
      return;
    }
    setGuardando(true);
    try {
      let latitud: number | null = null;
      let longitud: number | null = null;

      const permGps = await Location.requestForegroundPermissionsAsync();
      if (permGps.status === 'granted') {
        const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        latitud = pos.coords.latitude;
        longitud = pos.coords.longitude;
      }

      const parts = nombreCompleto.trim().split(' ');
      const nombre = parts[0];
      const apellido = parts.slice(1).join(' ');

      await editarPerfilAlumno(alumnoId, { nombre, apellido, fotoPerfil, zonaDeseada: zona.trim() || null, latitud, longitud });

      router.replace('/alumno/dashboard');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'No se pudo guardar el perfil.');
    } finally {
      setGuardando(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.cian} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color={Colors.blanco} />
        </TouchableOpacity>
        <Text style={styles.wiser}>Wiser</Text>
        <View style={{ width: 24 }} />
      </View>

      <Text style={styles.titulo}>ARMA TU PERFIL</Text>
      <Text style={styles.subtitulo}>Los siguientes datos son los que percibirán los profesores</Text>

      <TouchableOpacity style={styles.avatarContainer} onPress={handleElegirFoto}>
        <View style={styles.avatarBorder}>
          {fotoPerfil ? (
            <Image source={{ uri: fotoPerfil }} style={styles.avatarImage} />
          ) : (
            <Ionicons name="person-outline" size={scale(56)} color="#aaa" />
          )}
        </View>
        <Text style={styles.fotoText}>Carga tu foto de perfil</Text>
      </TouchableOpacity>

      <View style={styles.form}>
        <Text style={styles.label}>Nombre y Apellido</Text>
        <TextInput
          style={styles.input}
          placeholder="Ingresá tu nombre"
          placeholderTextColor="#aaa"
          value={nombreCompleto}
          onChangeText={setNombreCompleto}
        />

        <Text style={styles.label}>Ubicación</Text>
        <View style={styles.inputIcon}>
          <Ionicons name="location-outline" size={18} color={Colors.cian} />
          <TextInput
            style={styles.inputInner}
            placeholder="Zona UTN, Resistencia"
            placeholderTextColor="#aaa"
            value={zona}
            onChangeText={setZona}
          />
        </View>

        <TouchableOpacity style={styles.btn} onPress={handleContinuar} disabled={guardando}>
          {guardando ? (
            <ActivityIndicator color={Colors.background} />
          ) : (
            <Text style={styles.btnText}>Continuar</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    paddingHorizontal: scale(24),
    paddingTop: verticalScale(50),
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: verticalScale(20),
  },
  wiser: {
    fontFamily: Fonts.spaceGroteskBold,
    fontSize: moderateScale(24),
    color: '#3455ff',
  },
  titulo: {
    fontFamily: Fonts.spaceGroteskBold,
    color: Colors.blanco,
    fontSize: moderateScale(18),
    letterSpacing: 1,
    marginBottom: verticalScale(8),
  },
  subtitulo: {
    fontFamily: Fonts.rubikRegular,
    color: '#aaa',
    fontSize: moderateScale(12),
    marginBottom: verticalScale(24),
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: verticalScale(28),
  },
  avatarBorder: {
    width: scale(110),
    height: scale(110),
    borderRadius: scale(55),
    backgroundColor: Colors.blanco,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#aaa',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  fotoText: {
    fontFamily: Fonts.rubikMedium,
    color: Colors.blanco,
    fontSize: moderateScale(12),
    textDecorationLine: 'underline',
    marginTop: verticalScale(10),
  },
  form: {
    width: '100%',
  },
  label: {
    fontFamily: Fonts.rubikMedium,
    color: Colors.blanco,
    fontSize: moderateScale(13),
    marginBottom: verticalScale(6),
  },
  input: {
    backgroundColor: Colors.superficieB,
    borderRadius: 6,
    padding: scale(12),
    color: Colors.blanco,
    fontFamily: Fonts.rubikRegular,
    fontSize: moderateScale(14),
    marginBottom: verticalScale(20),
    borderWidth: 1,
    borderColor: '#1e295d',
  },
  inputIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.superficieB,
    borderRadius: 6,
    paddingHorizontal: scale(12),
    borderWidth: 1,
    borderColor: '#1e295d',
    marginBottom: verticalScale(30),
  },
  inputInner: {
    flex: 1,
    paddingVertical: scale(12),
    paddingLeft: scale(8),
    color: Colors.blanco,
    fontFamily: Fonts.rubikRegular,
    fontSize: moderateScale(14),
  },
  btn: {
    backgroundColor: '#b8c6e2',
    borderRadius: 25,
    paddingVertical: scale(14),
    alignItems: 'center',
    alignSelf: 'center',
    paddingHorizontal: scale(48),
  },
  btnText: {
    fontFamily: Fonts.spaceGroteskBold,
    color: Colors.background,
    fontSize: moderateScale(14),
    fontWeight: 'bold',
  },
});
