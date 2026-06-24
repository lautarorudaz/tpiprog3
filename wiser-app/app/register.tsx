import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator, Alert
} from 'react-native';
import { useRouter } from 'expo-router';
import { scale, verticalScale, moderateScale } from 'react-native-size-matters';
import { registrarse } from '../services/authService';
import { Colors } from '../constants/colors';
import { Fonts } from '../constants/fonts';

export default function RegisterScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [repetirEmail, setRepetirEmail] = useState('');
  const [password, setPassword] = useState('');
  const [repetirPassword, setRepetirPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegistro = async () => {
    setError('');

    if (!email || !repetirEmail || !password || !repetirPassword) {
      setError('Completá todos los campos.');
      return;
    }
    if (email !== repetirEmail) {
      setError('Los emails no coinciden.');
      return;
    }
    if (password !== repetirPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }
    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    setLoading(true);
    try {
      const credencial = await registrarse(email, password);
      // Guardamos el uid y email para usarlos en la siguiente pantalla
      router.replace({
        pathname: '/select-role',
        params: {
          firebaseUid: credencial.user.uid,
          email: credencial.user.email,
        }
      });
    } catch (e: any) {
      if (e.code === 'auth/email-already-in-use') {
        setError('Ese email ya está registrado.');
      } else {
        setError('Ocurrió un error. Intentá de nuevo.');
      }
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
        placeholder="Repetir Email"
        placeholderTextColor="#aaa"
        value={repetirEmail}
        onChangeText={setRepetirEmail}
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

      <TextInput
        style={styles.input}
        placeholder="Repetir Contraseña"
        placeholderTextColor="#aaa"
        value={repetirPassword}
        onChangeText={setRepetirPassword}
        secureTextEntry
      />

      <TouchableOpacity style={styles.boton} onPress={handleRegistro} disabled={loading}>
        {loading
          ? <ActivityIndicator color={Colors.blanco} />
          : <Text style={styles.botonTexto}>Continuar</Text>
        }
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.back()}>
        <Text style={styles.link}>¿Ya tenés cuenta? Iniciá sesión</Text>
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
    textAlign: 'center',
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
  boton: {
    width: '100%',
    backgroundColor: Colors.superficieA,
    borderRadius: moderateScale(8),
    padding: moderateScale(16),
    alignItems: 'center',
    marginBottom: verticalScale(16),
    borderWidth: 1,
    borderColor: Colors.blanco,
  },
  botonTexto: {
    fontFamily: Fonts.spaceGroteskBold,
    color: Colors.blanco,
    fontSize: moderateScale(14),
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