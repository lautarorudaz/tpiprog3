import { useState } from 'react';
import {
  View, Text, TouchableOpacity,
  StyleSheet, ActivityIndicator, Alert
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { scale, verticalScale, moderateScale } from 'react-native-size-matters';
import { registrarUsuarioEnBD } from '../services/apiService';
import { Colors } from '../constants/colors';
import { Fonts } from '../constants/fonts';

export default function SelectRoleScreen() {
  const router = useRouter();
  const { firebaseUid, email } = useLocalSearchParams<{ firebaseUid: string; email: string }>();
  const [rolSeleccionado, setRolSeleccionado] = useState<'alumno' | 'profesor' | null>(null);
  const [loading, setLoading] = useState(false);

  const handleContinuar = async () => {
    if (!rolSeleccionado) {
      Alert.alert('Seleccioná un rol', 'Tenés que elegir si sos alumno o profesor.');
      return;
    }

    setLoading(true);
    try {
      await registrarUsuarioEnBD(firebaseUid, email, '', '', rolSeleccionado);

      if (rolSeleccionado === 'profesor') {
        router.replace({
          pathname: '/profesor/setup-profile',
          params: { firebaseUid, email }
        });
      } else {
        router.replace({
          pathname: '/alumno/setup-profile',
          params: { firebaseUid, email }
        });
      }
    } catch (e) {
      Alert.alert('Error', 'No se pudo registrar. Intentá de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.titulo}>Wiser</Text>
      <Text style={styles.subtitulo}>¿Cómo querés usar la app?</Text>
      <Text style={styles.descripcion}>
        Esta elección no se puede cambiar después.
      </Text>

      <TouchableOpacity
        style={[styles.opcion, rolSeleccionado === 'alumno' && styles.opcionSeleccionada]}
        onPress={() => setRolSeleccionado('alumno')}
      >
        <Text style={styles.opcionTitulo}>🎓 Soy Alumno</Text>
        <Text style={styles.opcionDescripcion}>
          Buscá profesores, filtrá por materia y reservá clases.
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.opcion, rolSeleccionado === 'profesor' && styles.opcionSeleccionada]}
        onPress={() => setRolSeleccionado('profesor')}
      >
        <Text style={styles.opcionTitulo}>👨‍🏫 Soy Profesor</Text>
        <Text style={styles.opcionDescripcion}>
          Ofrecé tus clases, gestioná tu agenda y conectá con alumnos.
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.boton, !rolSeleccionado && styles.botonDeshabilitado]}
        onPress={handleContinuar}
        disabled={loading || !rolSeleccionado}
      >
        {loading
          ? <ActivityIndicator color={Colors.blanco} />
          : <Text style={styles.botonTexto}>Continuar</Text>
        }
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: scale(30),
  },
  titulo: {
    fontFamily: Fonts.spaceGroteskBold,
    fontSize: moderateScale(48),
    color: Colors.cian,
    marginBottom: verticalScale(8),
  },
  subtitulo: {
    fontFamily: Fonts.spaceGroteskBold,
    fontSize: moderateScale(20),
    color: Colors.blanco,
    marginBottom: verticalScale(8),
    textAlign: 'center',
  },
  descripcion: {
    fontFamily: Fonts.rubikRegular,
    fontSize: moderateScale(13),
    color: '#aaa',
    marginBottom: verticalScale(40),
    textAlign: 'center',
  },
  opcion: {
    width: '100%',
    backgroundColor: Colors.superficieA,
    borderRadius: moderateScale(12),
    padding: moderateScale(20),
    marginBottom: verticalScale(16),
    borderWidth: 2,
    borderColor: 'transparent',
  },
  opcionSeleccionada: {
    borderColor: Colors.cian,
  },
  opcionTitulo: {
    fontFamily: Fonts.spaceGroteskBold,
    fontSize: moderateScale(16),
    color: Colors.blanco,
    marginBottom: verticalScale(6),
  },
  opcionDescripcion: {
    fontFamily: Fonts.rubikRegular,
    fontSize: moderateScale(13),
    color: '#aaa',
  },
  boton: {
    width: '100%',
    backgroundColor: Colors.cian,
    borderRadius: moderateScale(8),
    padding: moderateScale(16),
    alignItems: 'center',
    marginTop: verticalScale(8),
  },
  botonDeshabilitado: {
    backgroundColor: Colors.superficieB,
  },
  botonTexto: {
    fontFamily: Fonts.spaceGroteskBold,
    color: Colors.background,
    fontSize: moderateScale(14),
    letterSpacing: 1,
  },
});