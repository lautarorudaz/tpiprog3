import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { scale, verticalScale, moderateScale } from 'react-native-size-matters';
import { Ionicons } from '@expo/vector-icons';
import { EmailAuthProvider, reauthenticateWithCredential, updatePassword } from 'firebase/auth';
import { Colors } from '../../constants/colors';
import { Fonts } from '../../constants/fonts';
import { auth } from '../../services/firebase';

export default function AlumnoAjustesCuenta() {
  const router = useRouter();
  const [passwordActual, setPasswordActual] = useState('');
  const [passwordNueva, setPasswordNueva] = useState('');
  const [passwordRepetir, setPasswordRepetir] = useState('');
  const [cambiando, setCambiando] = useState(false);

  const handleCambiarPassword = async () => {
    if (!passwordActual || !passwordNueva || !passwordRepetir) {
      Alert.alert('Faltan datos', 'Completá los tres campos.'); return;
    }
    if (passwordNueva.length < 6) {
      Alert.alert('Contraseña inválida', 'La nueva contraseña debe tener al menos 6 caracteres.'); return;
    }
    if (passwordNueva !== passwordRepetir) {
      Alert.alert('No coinciden', 'Las contraseñas nuevas no coinciden.'); return;
    }
    const user = auth.currentUser;
    if (!user?.email) return;
    setCambiando(true);
    try {
      const credencial = EmailAuthProvider.credential(user.email, passwordActual);
      await reauthenticateWithCredential(user, credencial);
      await updatePassword(user, passwordNueva);
      setPasswordActual(''); setPasswordNueva(''); setPasswordRepetir('');
      Alert.alert('Listo', 'Tu contraseña se actualizó correctamente.');
    } catch (err: any) {
      const msg = err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential'
        ? 'La contraseña actual es incorrecta.' : 'No se pudo cambiar la contraseña.';
      Alert.alert('Error', msg);
    } finally {
      setCambiando(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color={Colors.blanco} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Ajustes de cuenta</Text>
        <View style={{ width: 24 }} />
      </View>

      <Text style={styles.sectionTitle}>Cambiar contraseña</Text>
      <Text style={styles.label}>Contraseña actual</Text>
      <TextInput style={styles.input} secureTextEntry value={passwordActual} onChangeText={setPasswordActual} placeholderTextColor="#aaa" placeholder="••••••" />
      <Text style={styles.label}>Nueva contraseña</Text>
      <TextInput style={styles.input} secureTextEntry value={passwordNueva} onChangeText={setPasswordNueva} placeholderTextColor="#aaa" placeholder="••••••" />
      <Text style={styles.label}>Repetir nueva contraseña</Text>
      <TextInput style={styles.input} secureTextEntry value={passwordRepetir} onChangeText={setPasswordRepetir} placeholderTextColor="#aaa" placeholder="••••••" />

      <TouchableOpacity style={styles.btn} onPress={handleCambiarPassword} disabled={cambiando}>
        {cambiando ? <ActivityIndicator color={Colors.background} /> : <Text style={styles.btnText}>Cambiar contraseña</Text>}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { paddingHorizontal: scale(24), paddingTop: verticalScale(50), paddingBottom: 40 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: verticalScale(24) },
  headerTitle: { fontFamily: Fonts.spaceGroteskBold, color: Colors.blanco, fontSize: moderateScale(16) },
  sectionTitle: { fontFamily: Fonts.spaceGroteskBold, color: Colors.blanco, fontSize: moderateScale(14), marginBottom: verticalScale(12) },
  label: { fontFamily: Fonts.rubikMedium, color: Colors.blanco, fontSize: moderateScale(12), marginBottom: 6, marginTop: verticalScale(10) },
  input: { backgroundColor: Colors.superficieA, borderRadius: 8, padding: scale(14), color: Colors.blanco, fontFamily: Fonts.rubikRegular, fontSize: moderateScale(14), borderWidth: 1, borderColor: '#1e295d' },
  btn: { backgroundColor: Colors.cian, borderRadius: 8, paddingVertical: scale(16), alignItems: 'center', marginTop: verticalScale(24) },
  btnText: { fontFamily: Fonts.spaceGroteskBold, color: Colors.background, fontSize: moderateScale(14) },
});
