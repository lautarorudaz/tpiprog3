import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, Alert, ActivityIndicator, Modal
} from 'react-native';
import { useRouter } from 'expo-router';
import { scale, verticalScale, moderateScale } from 'react-native-size-matters';
import { Ionicons } from '@expo/vector-icons';
import { iniciarSesion, enviarResetPassword } from '../services/authService';
import { obtenerUsuarioPorFirebase } from '../services/apiService';
import { Colors } from '../constants/colors';
import { Fonts } from '../constants/fonts';

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const [forgotVisible, setForgotVisible] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetLoading, setResetLoading] = useState(false);

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
      const msg =
        e.code === 'auth/user-not-found' || e.code === 'auth/wrong-password' || e.code === 'auth/invalid-credential'
          ? 'Email o contraseña incorrectos.'
          : e.code === 'auth/invalid-email'
          ? 'El email no es válido.'
          : e.message || 'Error al iniciar sesión.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleEnviarReset = async () => {
    if (!resetEmail.trim()) {
      Alert.alert('Ingresá tu email', 'Escribí el email de tu cuenta para recibir el link.');
      return;
    }
    setResetLoading(true);
    try {
      await enviarResetPassword(resetEmail.trim());
      setForgotVisible(false);
      setResetEmail('');
      Alert.alert(
        'Email enviado ✓',
        'Revisá tu bandeja de entrada y seguí el link para restablecer tu contraseña.'
      );
    } catch (e: any) {
      const msg =
        e.code === 'auth/user-not-found'
          ? 'No existe ninguna cuenta con ese email.'
          : e.code === 'auth/invalid-email'
          ? 'El email no es válido.'
          : 'No se pudo enviar el email. Intentá de nuevo.';
      Alert.alert('Error', msg);
    } finally {
      setResetLoading(false);
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
        onChangeText={(t) => { setEmail(t); setError(''); }}
        keyboardType="email-address"
        autoCapitalize="none"
      />

      <TextInput
        style={styles.input}
        placeholder="Contraseña"
        placeholderTextColor="#aaa"
        value={password}
        onChangeText={(t) => { setPassword(t); setError(''); }}
        secureTextEntry
      />

      <TouchableOpacity style={styles.botonPrimario} onPress={handleLogin} disabled={loading}>
        {loading
          ? <ActivityIndicator color={Colors.background} />
          : <Text style={styles.botonTexto}>INICIAR SESIÓN</Text>
        }
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.botonSecundario}
        onPress={() => Alert.alert('Próximamente', 'El inicio de sesión con Google estará disponible en una próxima versión.')}
      >
        <Ionicons name="logo-google" size={16} color={Colors.blanco} style={{ marginRight: 8 }} />
        <Text style={styles.botonTextoSecundario}>INICIAR SESIÓN CON GOOGLE</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => { setResetEmail(email); setForgotVisible(true); }}>
        <Text style={styles.link}>¿Olvidaste tu contraseña?</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.push('/register')}>
        <Text style={styles.link}>No tenés cuenta. ¡Registrate Ahora!</Text>
      </TouchableOpacity>

      {/* Modal recuperar contraseña */}
      <Modal visible={forgotVisible} animationType="fade" transparent onRequestClose={() => setForgotVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Recuperar contraseña</Text>
            <Text style={styles.modalSubtitle}>
              Ingresá tu email y te enviaremos un link para restablecer tu contraseña.
            </Text>
            <TextInput
              style={styles.input}
              placeholder="tu@email.com"
              placeholderTextColor="#aaa"
              value={resetEmail}
              onChangeText={setResetEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <TouchableOpacity style={styles.botonPrimario} onPress={handleEnviarReset} disabled={resetLoading}>
              {resetLoading
                ? <ActivityIndicator color={Colors.background} />
                : <Text style={styles.botonTexto}>ENVIAR LINK</Text>
              }
            </TouchableOpacity>
            <TouchableOpacity style={{ marginTop: 12 }} onPress={() => setForgotVisible(false)}>
              <Text style={[styles.link, { textAlign: 'center' }]}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
    fontSize: moderateScale(13),
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
  botonPrimario: {
    width: '100%',
    backgroundColor: Colors.cian,
    borderRadius: moderateScale(8),
    padding: moderateScale(16),
    alignItems: 'center',
    marginBottom: verticalScale(12),
  },
  botonSecundario: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.superficieA,
    borderRadius: moderateScale(8),
    padding: moderateScale(16),
    marginBottom: verticalScale(24),
    borderWidth: 1,
    borderColor: '#1e295d',
  },
  botonTexto: {
    fontFamily: Fonts.spaceGroteskBold,
    color: Colors.background,
    fontSize: moderateScale(12),
    letterSpacing: 1,
  },
  botonTextoSecundario: {
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: scale(24),
  },
  modalBox: {
    backgroundColor: Colors.superficieA,
    borderRadius: 12,
    padding: scale(24),
    width: '100%',
    borderWidth: 1,
    borderColor: '#1e295d',
  },
  modalTitle: {
    fontFamily: Fonts.spaceGroteskBold,
    color: Colors.blanco,
    fontSize: moderateScale(18),
    marginBottom: verticalScale(8),
  },
  modalSubtitle: {
    fontFamily: Fonts.rubikRegular,
    color: '#8b93b8',
    fontSize: moderateScale(13),
    marginBottom: verticalScale(20),
    lineHeight: moderateScale(20),
  },
});
