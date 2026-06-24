import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, Alert, ActivityIndicator
} from 'react-native';
import { useRouter } from 'expo-router';
import { scale, verticalScale, moderateScale } from 'react-native-size-matters';
import { iniciarSesion } from '../services/authService';
import { obtenerUsuarioPorFirebase } from '../services/apiService';
import { Colors } from '../constants/colors';
import { Fonts } from '../constants/fonts';

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Completá todos los campos.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const credencial = await iniciarSesion(email, password);
      const usuario = await obtenerUsuarioPorFirebase(credencial.user.uid);
      if (usuario.rol === 'profesor') {
        router.replace('/profesor/dashboard');
      } else {
        router.replace('/alumno/dashboard');
      }
    } catch (e: any) {
        console.log('Error completo:', JSON.stringify(e));
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.titulo}>Wiser</Text>
      <Text style={styles.subtitulo}>Bienvenido</Text>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <TextInput
        style={styles.input}
        placeholder="Email"
        placeholderTextColor="#aaa"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />

      <TextInput
        style={styles.input}
        placeholder="Contraseña"
        placeholderTextColor="#aaa"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      <TouchableOpacity style={styles.botonPrimario} onPress={handleLogin} disabled={loading}>
        {loading
          ? <ActivityIndicator color={Colors.blanco} />
          : <Text style={styles.botonTexto}>INICIAR SESIÓN CON TU CORREO</Text>
        }
      </TouchableOpacity>

      <TouchableOpacity style={styles.botonSecundario}>
        <Text style={styles.botonTexto}>INICIAR SESIÓN CON GOOGLE</Text>
      </TouchableOpacity>

      <TouchableOpacity>
        <Text style={styles.link}>¿Olvidaste tu contraseña?</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.push('/register')}>
        <Text style={styles.link}>No tenés cuenta. ¡Registrate Ahora!</Text>
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
    fontSize: moderateScale(22),
    color: Colors.blanco,
    marginBottom: verticalScale(40),
  },
  error: {
    fontFamily: Fonts.rubikRegular,
    color: Colors.error,
    marginBottom: verticalScale(12),
    fontSize: moderateScale(14),
  },
  input: {
    width: '100%',
    backgroundColor: Colors.superficieB,
    borderRadius: moderateScale(8),
    padding: moderateScale(14),
    color: Colors.blanco,
    fontFamily: Fonts.rubikRegular,
    fontSize: moderateScale(14),
    marginBottom: verticalScale(16),
  },
  botonPrimario: {
    width: '100%',
    backgroundColor: Colors.superficieA,
    borderRadius: moderateScale(8),
    padding: moderateScale(16),
    alignItems: 'center',
    marginBottom: verticalScale(12),
    borderWidth: 1,
    borderColor: Colors.cian,
  },
  botonSecundario: {
    width: '100%',
    backgroundColor: Colors.superficieA,
    borderRadius: moderateScale(8),
    padding: moderateScale(16),
    alignItems: 'center',
    marginBottom: verticalScale(24),
    borderWidth: 1,
    borderColor: Colors.blanco,
  },
  botonTexto: {
    fontFamily: Fonts.spaceGroteskBold,
    color: Colors.blanco,
    fontSize: moderateScale(12),
    letterSpacing: 1,
  },
  link: {
    fontFamily: Fonts.rubikRegular,
    color: Colors.blanco,
    fontSize: moderateScale(13),
    marginTop: verticalScale(8),
    textAlign: 'center',
  },
});