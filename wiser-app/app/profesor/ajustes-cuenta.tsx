import { useEffect, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, Alert, ActivityIndicator, Image
} from 'react-native';
import { useRouter } from 'expo-router';
import { scale, verticalScale, moderateScale } from 'react-native-size-matters';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { EmailAuthProvider, reauthenticateWithCredential, updatePassword } from 'firebase/auth';
import { Colors } from '../../constants/colors';
import { Fonts } from '../../constants/fonts';
import {
  editarCuentaUsuario, obtenerPerfilProfesor, actualizarPerfilProfesor,
  obtenerTurnosProfesor, obtenerDatosBancariosProfesor, guardarDatosBancarios
} from '../../services/apiService';
import { useProfesor } from '../../hooks/use-profesor';
import { auth } from '../../services/firebase';
import DisponibilidadGrid, { DIAS, TurnoKey, DisponibilidadValue, crearDisponibilidadVacia } from '../../components/disponibilidad-grid';

const DIA_POR_INDICE = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];

export default function AjustesCuenta() {
  const router = useRouter();
  const { usuario, profesorId, loading: loadingUsuario, reload } = useProfesor();

  const [loading, setLoading] = useState(true);

  // Datos personales
  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [fotoPerfil, setFotoPerfil] = useState<string | null>(null);
  const [guardandoDatos, setGuardandoDatos] = useState(false);

  // Contraseña
  const [passwordActual, setPasswordActual] = useState('');
  const [passwordNueva, setPasswordNueva] = useState('');
  const [passwordRepetir, setPasswordRepetir] = useState('');
  const [cambiandoPassword, setCambiandoPassword] = useState(false);

  // Datos bancarios
  const [cbu, setCbu] = useState('');
  const [alias, setAlias] = useState('');
  const [banco, setBanco] = useState('');
  const [titular, setTitular] = useState('');
  const [guardandoBancarios, setGuardandoBancarios] = useState(false);

  // Horarios
  const [perfil, setPerfil] = useState<any>(null);
  const [disponibilidad, setDisponibilidad] = useState<DisponibilidadValue>(crearDisponibilidadVacia());
  const [turnosConfirmadosFuturos, setTurnosConfirmadosFuturos] = useState<{ dia: string; turno: string }[]>([]);
  const [guardandoHorarios, setGuardandoHorarios] = useState(false);

  useEffect(() => {
    if (usuario) {
      setNombre(usuario.nombre || '');
      setApellido(usuario.apellido || '');
      setFotoPerfil(usuario.fotoPerfil || null);
    }
  }, [usuario]);

  useEffect(() => {
    const init = async () => {
      if (!profesorId) return;
      try {
        const [perfilData, turnos, datosBanc] = await Promise.all([
          obtenerPerfilProfesor(profesorId),
          obtenerTurnosProfesor(profesorId),
          obtenerDatosBancariosProfesor(profesorId),
        ]);
        if (datosBanc) {
          setCbu(datosBanc.cbu || '');
          setAlias(datosBanc.alias || '');
          setBanco(datosBanc.banco || '');
          setTitular(datosBanc.titular || '');
        }
        setPerfil(perfilData);

        const disp = crearDisponibilidadVacia();
        (perfilData.disponibilidades || []).forEach((d: any) => {
          if (disp[d.diaSemana]) disp[d.diaSemana][d.turno as TurnoKey] = true;
        });
        setDisponibilidad(disp);

        const todayStr = new Date().toISOString().split('T')[0];
        const ocupados = turnos
          .filter((t: any) => t.estado === 'confirmado' && t.fecha >= todayStr)
          .map((t: any) => ({
            dia: DIA_POR_INDICE[new Date(t.fecha).getDay()],
            turno: t.turnoHorario,
          }));
        setTurnosConfirmadosFuturos(ocupados);
      } catch (err) {
        console.error(err);
        Alert.alert('Error', 'No se pudieron cargar tus horarios.');
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [profesorId]);

  const handleGuardarBancarios = async () => {
    if (!profesorId) return;
    if (!cbu.trim() && !alias.trim()) {
      Alert.alert('Faltan datos', 'Ingresá al menos el CBU o el Alias.');
      return;
    }
    setGuardandoBancarios(true);
    try {
      await guardarDatosBancarios(profesorId, { cbu: cbu.trim(), alias: alias.trim(), banco: banco.trim(), titular: titular.trim() });
      Alert.alert('Listo', 'Tus datos bancarios se guardaron correctamente.');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'No se pudieron guardar los datos bancarios.');
    } finally {
      setGuardandoBancarios(false);
    }
  };

  const isLocked = (dia: string, turno: TurnoKey) =>
    turnosConfirmadosFuturos.some(o => o.dia === dia && o.turno === turno);

  const handleElegirFoto = async () => {
    const permiso = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permiso.granted) {
      Alert.alert('Permiso requerido', 'Necesitamos acceso a tus fotos para cambiar tu imagen de perfil.');
      return;
    }
    const resultado = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
      base64: true,
    });
    if (!resultado.canceled && resultado.assets[0]?.base64) {
      setFotoPerfil(`data:image/jpeg;base64,${resultado.assets[0].base64}`);
    }
  };

  const handleGuardarDatos = async () => {
    if (!usuario?.id) return;
    if (!nombre.trim() || !apellido.trim()) {
      Alert.alert('Faltan datos', 'Completá tu nombre y apellido.');
      return;
    }
    setGuardandoDatos(true);
    try {
      await editarCuentaUsuario(usuario.id, { nombre, apellido, fotoPerfil });
      await reload();
      Alert.alert('Listo', 'Tus datos se actualizaron correctamente.');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'No se pudieron guardar tus datos.');
    } finally {
      setGuardandoDatos(false);
    }
  };

  const handleCambiarPassword = async () => {
    if (!passwordActual || !passwordNueva || !passwordRepetir) {
      Alert.alert('Faltan datos', 'Completá los tres campos de contraseña.');
      return;
    }
    if (passwordNueva.length < 6) {
      Alert.alert('Contraseña inválida', 'La nueva contraseña debe tener al menos 6 caracteres.');
      return;
    }
    if (passwordNueva !== passwordRepetir) {
      Alert.alert('No coinciden', 'La nueva contraseña y su repetición no coinciden.');
      return;
    }
    const user = auth.currentUser;
    if (!user?.email) return;

    setCambiandoPassword(true);
    try {
      const credencial = EmailAuthProvider.credential(user.email, passwordActual);
      await reauthenticateWithCredential(user, credencial);
      await updatePassword(user, passwordNueva);
      setPasswordActual('');
      setPasswordNueva('');
      setPasswordRepetir('');
      Alert.alert('Listo', 'Tu contraseña se actualizó correctamente.');
    } catch (err: any) {
      const msg = err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password'
        ? 'La contraseña actual es incorrecta.'
        : 'No se pudo cambiar la contraseña.';
      Alert.alert('Error', msg);
    } finally {
      setCambiandoPassword(false);
    }
  };

  const toggleTurno = (dia: string, turno: TurnoKey) => {
    if (isLocked(dia, turno)) return;
    setDisponibilidad(prev => ({
      ...prev,
      [dia]: { ...prev[dia], [turno]: !prev[dia]?.[turno] }
    }));
  };

  const handleGuardarHorarios = async () => {
    if (!profesorId || !perfil) return;
    setGuardandoHorarios(true);
    try {
      const disponibilidadesPayload: { diaSemana: string; turno: string }[] = [];
      DIAS.forEach(({ key: dia }) => {
        (['manana', 'tarde', 'noche'] as TurnoKey[]).forEach(turno => {
          if (disponibilidad[dia]?.[turno]) disponibilidadesPayload.push({ diaSemana: dia, turno });
        });
      });

      await actualizarPerfilProfesor(profesorId, {
        nombre: perfil.nombre,
        apellido: perfil.apellido,
        fotoPerfil: perfil.fotoPerfil,
        titulo: perfil.titulo,
        descripcion: perfil.descripcion,
        modalidad: perfil.modalidad,
        precioHora: perfil.precioHora,
        zona: perfil.zona,
        latitud: perfil.latitud,
        longitud: perfil.longitud,
        materiaIds: (perfil.materias || []).map((m: any) => m.id),
        disponibilidades: disponibilidadesPayload,
      });

      Alert.alert('Listo', 'Tus horarios se actualizaron correctamente.');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'No se pudieron guardar los horarios.');
    } finally {
      setGuardandoHorarios(false);
    }
  };

  if (loadingUsuario || loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.cian} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color={Colors.blanco} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Ajustes de cuenta</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Foto de perfil */}
      <View style={styles.avatarSection}>
        <TouchableOpacity style={styles.avatarBorder} onPress={handleElegirFoto}>
          {fotoPerfil ? (
            <Image source={{ uri: fotoPerfil }} style={styles.avatarImage} />
          ) : (
            <Ionicons name="person-outline" size={scale(40)} color="#aaa" />
          )}
          <View style={styles.avatarEditBadge}>
            <Ionicons name="camera" size={14} color={Colors.background} />
          </View>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleElegirFoto}>
          <Text style={styles.cambiarFotoText}>Cambiar foto de perfil</Text>
        </TouchableOpacity>
      </View>

      {/* Datos personales */}
      <Text style={styles.sectionTitle}>Datos personales</Text>
      <Text style={styles.label}>Nombre</Text>
      <TextInput style={styles.input} value={nombre} onChangeText={setNombre} placeholderTextColor="#aaa" />
      <Text style={styles.label}>Apellido</Text>
      <TextInput style={styles.input} value={apellido} onChangeText={setApellido} placeholderTextColor="#aaa" />

      <TouchableOpacity style={styles.btnGuardar} onPress={handleGuardarDatos} disabled={guardandoDatos}>
        {guardandoDatos ? <ActivityIndicator color={Colors.background} /> : <Text style={styles.btnGuardarText}>Guardar datos</Text>}
      </TouchableOpacity>

      {/* Contraseña */}
      <Text style={styles.sectionTitle}>Cambiar contraseña</Text>
      <Text style={styles.label}>Contraseña actual</Text>
      <TextInput style={styles.input} secureTextEntry value={passwordActual} onChangeText={setPasswordActual} placeholderTextColor="#aaa" />
      <Text style={styles.label}>Nueva contraseña</Text>
      <TextInput style={styles.input} secureTextEntry value={passwordNueva} onChangeText={setPasswordNueva} placeholderTextColor="#aaa" />
      <Text style={styles.label}>Repetir nueva contraseña</Text>
      <TextInput style={styles.input} secureTextEntry value={passwordRepetir} onChangeText={setPasswordRepetir} placeholderTextColor="#aaa" />

      <TouchableOpacity style={styles.btnGuardar} onPress={handleCambiarPassword} disabled={cambiandoPassword}>
        {cambiandoPassword ? <ActivityIndicator color={Colors.background} /> : <Text style={styles.btnGuardarText}>Cambiar contraseña</Text>}
      </TouchableOpacity>

      {/* Datos bancarios */}
      <Text style={styles.sectionTitle}>Datos bancarios</Text>
      <Text style={styles.sectionSubtitle}>
        Tus alumnos los verán al agendar una clase por transferencia.
      </Text>
      <Text style={styles.label}>CBU</Text>
      <TextInput
        style={styles.input}
        value={cbu}
        onChangeText={setCbu}
        placeholderTextColor="#aaa"
        placeholder="22 dígitos"
        keyboardType="number-pad"
        maxLength={22}
      />
      <Text style={styles.label}>Alias</Text>
      <TextInput
        style={styles.input}
        value={alias}
        onChangeText={setAlias}
        placeholderTextColor="#aaa"
        placeholder="Ej: MARIA.GARCIA.MP"
        autoCapitalize="characters"
      />
      <Text style={styles.label}>Banco</Text>
      <TextInput
        style={styles.input}
        value={banco}
        onChangeText={setBanco}
        placeholderTextColor="#aaa"
        placeholder="Ej: Mercado Pago"
      />
      <Text style={styles.label}>Titular de la cuenta</Text>
      <TextInput
        style={styles.input}
        value={titular}
        onChangeText={setTitular}
        placeholderTextColor="#aaa"
        placeholder="Tu nombre completo"
      />
      <TouchableOpacity style={styles.btnGuardar} onPress={handleGuardarBancarios} disabled={guardandoBancarios}>
        {guardandoBancarios ? <ActivityIndicator color={Colors.background} /> : <Text style={styles.btnGuardarText}>Guardar datos bancarios</Text>}
      </TouchableOpacity>

      {/* Horarios disponibles */}
      <Text style={styles.sectionTitle}>Horarios disponibles</Text>
      <DisponibilidadGrid value={disponibilidad} onToggle={toggleTurno} isLocked={isLocked} />

      <TouchableOpacity style={styles.btnGuardar} onPress={handleGuardarHorarios} disabled={guardandoHorarios}>
        {guardandoHorarios ? <ActivityIndicator color={Colors.background} /> : <Text style={styles.btnGuardarText}>Guardar horarios</Text>}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    paddingHorizontal: scale(24),
    paddingTop: verticalScale(50),
    paddingBottom: verticalScale(50),
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
  headerTitle: {
    fontFamily: Fonts.spaceGroteskBold,
    color: Colors.blanco,
    fontSize: moderateScale(16),
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: verticalScale(24),
  },
  avatarBorder: {
    width: scale(90),
    height: scale(90),
    borderRadius: scale(45),
    backgroundColor: Colors.superficieA,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: Colors.cian,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  avatarEditBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: Colors.cian,
    width: scale(26),
    height: scale(26),
    borderRadius: scale(13),
    justifyContent: 'center',
    alignItems: 'center',
  },
  cambiarFotoText: {
    fontFamily: Fonts.rubikMedium,
    color: Colors.cian,
    fontSize: moderateScale(12),
    marginTop: verticalScale(8),
  },
  sectionTitle: {
    fontFamily: Fonts.spaceGroteskBold,
    color: Colors.blanco,
    fontSize: moderateScale(14),
    marginTop: verticalScale(24),
    marginBottom: verticalScale(12),
  },
  sectionSubtitle: {
    fontFamily: Fonts.rubikRegular,
    color: '#8b93b8',
    fontSize: moderateScale(11),
    marginTop: verticalScale(-8),
    marginBottom: verticalScale(10),
  },
  label: {
    fontFamily: Fonts.rubikMedium,
    color: Colors.blanco,
    fontSize: moderateScale(12),
    marginBottom: verticalScale(6),
    marginTop: verticalScale(10),
  },
  input: {
    backgroundColor: Colors.superficieA,
    borderRadius: 8,
    padding: scale(14),
    color: Colors.blanco,
    fontFamily: Fonts.rubikRegular,
    fontSize: moderateScale(14),
    borderWidth: 1,
    borderColor: '#1e295d',
  },
  btnGuardar: {
    backgroundColor: Colors.cian,
    borderRadius: 8,
    paddingVertical: scale(14),
    alignItems: 'center',
    marginTop: verticalScale(16),
  },
  btnGuardarText: {
    fontFamily: Fonts.spaceGroteskBold,
    color: Colors.background,
    fontSize: moderateScale(13),
  },
});
