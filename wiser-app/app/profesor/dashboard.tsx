import { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, Alert, ActivityIndicator, Image
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { scale, verticalScale, moderateScale } from 'react-native-size-matters';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { Fonts } from '../../constants/fonts';
import { obtenerTurnosProfesor, obtenerUsuarioPorFirebase, actualizarEstadoTurno } from '../../services/apiService';
import { auth } from '../../services/firebase';
import { onAuthStateChanged } from 'firebase/auth';

export default function ProfesorDashboard() {
  const router = useRouter();
  const { firebaseUid } = useLocalSearchParams<{ firebaseUid: string }>();

  const [loading, setLoading] = useState(true);
  const [nombre, setNombre] = useState('Profesor');
  const [precioHora, setPrecioHora] = useState(0);
  const [fotoPerfil, setFotoPerfil] = useState<string | null>(null);
  const [solicitudes, setSolicitudes] = useState<any[]>([]);
  const [todosLosTurnos, setTodosLosTurnos] = useState<any[]>([]);

  const loadDashboardData = async (uid: string) => {
    try {
      const userObj = await obtenerUsuarioPorFirebase(uid);
      if (userObj) {
        setNombre(userObj.nombre || 'Profesor');
        if (userObj.fotoPerfil) setFotoPerfil(userObj.fotoPerfil);
        
        if (userObj.profesor) {
          setPrecioHora(userObj.profesor.precioHora || 0);
          const turnos = await obtenerTurnosProfesor(userObj.profesor.id);
          setTodosLosTurnos(turnos);
          
          // Filter requests that are in "pendiente_pago" status (new requests)
          const nuevas = turnos.filter((t: any) => t.estado === 'pendiente_pago');
          setSolicitudes(nuevas);
        }
      }
    } catch (err: any) {
      console.error(err);
      Alert.alert('Error', 'No se pudieron cargar los datos del dashboard.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      const uid = firebaseUid || currentUser?.uid;
      if (uid) {
        loadDashboardData(uid);
      } else {
        setLoading(false);
        router.replace('/');
      }
    });
    return unsubscribe;
  }, [firebaseUid]);

  // Calculate earnings
  const todayStr = new Date().toISOString().split('T')[0];

  // Current week range
  const now = new Date();
  const currentDay = now.getDay();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - (currentDay === 0 ? 6 : currentDay - 1));
  startOfWeek.setHours(0, 0, 0, 0);

  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);
  endOfWeek.setHours(23, 59, 59, 999);

  const turnosHoy = todosLosTurnos.filter(t => t.fecha === todayStr && t.estado === 'confirmado');
  const ingresosHoy = turnosHoy.length * precioHora;

  const turnosSemana = todosLosTurnos.filter(t => {
    const tDate = new Date(t.fecha);
    return tDate >= startOfWeek && tDate <= endOfWeek && t.estado === 'confirmado';
  });
  const ingresosSemana = turnosSemana.length * precioHora;

  const handleAccept = async (turnoId: number) => {
    try {
      setLoading(true);
      await actualizarEstadoTurno(turnoId, 'confirmado');
      Alert.alert('Aceptado', 'Has aceptado esta clase correctamente.');
      const uid = firebaseUid || auth.currentUser?.uid;
      if (uid) await loadDashboardData(uid);
    } catch (err: any) {
      Alert.alert('Error', 'No se pudo aceptar la solicitud.');
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async (turnoId: number) => {
    try {
      setLoading(true);
      await actualizarEstadoTurno(turnoId, 'rechazado');
      Alert.alert('Rechazado', 'Has rechazado la solicitud de clase.');
      const uid = firebaseUid || auth.currentUser?.uid;
      if (uid) await loadDashboardData(uid);
    } catch (err: any) {
      Alert.alert('Error', 'No se pudo rechazar la solicitud.');
    } finally {
      setLoading(false);
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
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <Text style={styles.wiser}>Wiser</Text>

        {/* Welcome Card */}
        <View style={styles.welcomeCard}>
          <View style={styles.welcomeLeft}>
            <Text style={styles.welcomeText}>Hola {nombre} 👋</Text>
          </View>
          <View style={styles.avatarBorder}>
            {fotoPerfil ? (
              <Image source={{ uri: fotoPerfil }} style={styles.avatarImage} />
            ) : (
              <Ionicons name="person-outline" size={scale(24)} color={Colors.cian} />
            )}
          </View>
        </View>

        {/* Ingresos Section */}
        <Text style={styles.sectionTitle}>Ingresos</Text>
        <View style={styles.ingresosContainer}>
          <View style={styles.ingresoCard}>
            <Text style={styles.ingresoLabel}>Ingresos del día</Text>
            <Text style={styles.ingresoValue}>${ingresosHoy.toLocaleString('es-AR')}</Text>
          </View>
          <View style={styles.ingresoCard}>
            <Text style={styles.ingresoLabel}>Esta semana</Text>
            <Text style={styles.ingresoValue}>${ingresosSemana.toLocaleString('es-AR')}</Text>
          </View>
        </View>

        {/* solicitudes Section */}
        <Text style={styles.sectionTitle}>Nuevas Solicitudes</Text>
        <View style={styles.solicitudesContainer}>
          {solicitudes.length === 0 ? (
            <Text style={styles.noSolicitudes}>No tienes solicitudes pendientes.</Text>
          ) : (
            solicitudes.map((sol) => (
              <View key={sol.id} style={styles.solicitudCard}>
                <View style={styles.solicitudLeft}>
                  <Text style={styles.solicitudMateria}>{sol.materia}</Text>
                  <Text style={styles.solicitudFecha}>
                    Fecha: {sol.fecha} - Hora: {sol.turnoHorario === 'manana' ? '09:00' : sol.turnoHorario === 'tarde' ? '14:00' : '19:00'}
                  </Text>
                  <Text style={styles.solicitudAlumno}>{sol.alumno}</Text>
                  <TouchableOpacity
                    style={styles.btnVerPerfil}
                    onPress={() => Alert.alert('Perfil de Alumno', `Detalles de ${sol.alumno}`)}
                  >
                    <Text style={styles.btnVerPerfilText}>VER PERFIL</Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.solicitudActions}>
                  <TouchableOpacity
                    style={[styles.actionBtn, styles.acceptBtn]}
                    onPress={() => handleAccept(sol.id)}
                  >
                    <Ionicons name="checkmark-sharp" size={18} color={Colors.blanco} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionBtn, styles.rejectBtn]}
                    onPress={() => handleReject(sol.id)}
                  >
                    <Ionicons name="close-sharp" size={18} color={Colors.blanco} />
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      {/* Bottom Navigation Tab Bar */}
      <View style={styles.bottomTab}>
        <TouchableOpacity style={styles.tabItem} onPress={() => {}}>
          <Ionicons name="home-sharp" size={24} color={Colors.cian} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.tabItem} onPress={() => Alert.alert('Agenda', 'Calendario próximamente.')}>
          <Ionicons name="calendar-outline" size={24} color={Colors.blanco} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.tabItem} onPress={() => Alert.alert('Chats', 'Conversaciones próximamente.')}>
          <Ionicons name="chatbubble-outline" size={24} color={Colors.blanco} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    paddingHorizontal: scale(24),
    paddingTop: verticalScale(30),
    paddingBottom: verticalScale(80),
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  wiser: {
    fontFamily: Fonts.spaceGroteskBold,
    fontSize: moderateScale(36),
    color: '#3455ff',
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: verticalScale(16),
  },
  welcomeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.superficieA,
    paddingHorizontal: scale(16),
    paddingVertical: scale(14),
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#1e295d',
    marginBottom: verticalScale(24),
  },
  welcomeLeft: {
    flex: 1,
  },
  welcomeText: {
    fontFamily: Fonts.spaceGroteskBold,
    color: Colors.blanco,
    fontSize: moderateScale(16),
    fontWeight: 'bold',
  },
  avatarBorder: {
    width: scale(36),
    height: scale(36),
    borderRadius: scale(18),
    backgroundColor: Colors.superficieB,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  sectionTitle: {
    fontFamily: Fonts.spaceGroteskBold,
    color: Colors.blanco,
    fontSize: moderateScale(14),
    letterSpacing: 0.5,
    marginBottom: verticalScale(12),
  },
  ingresosContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: verticalScale(24),
    gap: 12,
  },
  ingresoCard: {
    flex: 1,
    backgroundColor: Colors.superficieA,
    borderRadius: 8,
    padding: scale(16),
    borderWidth: 1,
    borderColor: '#1e295d',
  },
  ingresoLabel: {
    fontFamily: Fonts.rubikRegular,
    color: '#aaa',
    fontSize: moderateScale(11),
    marginBottom: 6,
  },
  ingresoValue: {
    fontFamily: Fonts.spaceGroteskBold,
    color: Colors.blanco,
    fontSize: moderateScale(18),
    fontWeight: 'bold',
  },
  solicitudesContainer: {
    width: '100%',
  },
  noSolicitudes: {
    fontFamily: Fonts.rubikRegular,
    color: '#aaa',
    fontSize: moderateScale(13),
    textAlign: 'center',
    marginTop: 10,
  },
  solicitudCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: Colors.superficieA,
    borderRadius: 8,
    padding: scale(16),
    marginBottom: verticalScale(12),
    borderWidth: 1,
    borderColor: '#1e295d',
  },
  solicitudLeft: {
    flex: 1,
  },
  solicitudMateria: {
    fontFamily: Fonts.spaceGroteskBold,
    color: Colors.blanco,
    fontSize: moderateScale(14),
    fontWeight: 'bold',
    marginBottom: 4,
  },
  solicitudFecha: {
    fontFamily: Fonts.rubikRegular,
    color: '#aaa',
    fontSize: moderateScale(11),
    marginBottom: 4,
  },
  solicitudAlumno: {
    fontFamily: Fonts.rubikRegular,
    color: Colors.blanco,
    fontSize: moderateScale(12),
    marginBottom: 10,
  },
  btnVerPerfil: {
    borderWidth: 1,
    borderColor: '#aaa',
    borderRadius: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
    alignSelf: 'flex-start',
  },
  btnVerPerfilText: {
    fontFamily: Fonts.spaceGroteskBold,
    color: '#aaa',
    fontSize: moderateScale(9),
    fontWeight: 'bold',
  },
  solicitudActions: {
    justifyContent: 'center',
    gap: 12,
    alignItems: 'center',
  },
  actionBtn: {
    width: scale(28),
    height: scale(28),
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  acceptBtn: {
    backgroundColor: '#4cd964', // Green check button
  },
  rejectBtn: {
    backgroundColor: Colors.error, // Red cross button
  },
  bottomTab: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: verticalScale(60),
    backgroundColor: Colors.purpuraOscuro, // Deep purple navbar background
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#1e1b4b',
  },
  tabItem: {
    padding: scale(10),
  },
});