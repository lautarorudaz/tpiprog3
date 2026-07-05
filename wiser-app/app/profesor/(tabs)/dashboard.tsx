import { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, Alert, ActivityIndicator, Image
} from 'react-native';
import { useRouter } from 'expo-router';
import { scale, verticalScale, moderateScale } from 'react-native-size-matters';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../../constants/colors';
import { Fonts } from '../../../constants/fonts';
import { obtenerTurnosProfesor, actualizarEstadoTurno } from '../../../services/apiService';
import { useProfesor } from '../../../hooks/use-profesor';

export default function ProfesorDashboard() {
  const router = useRouter();
  const { usuario, profesorId, nombre, fotoPerfil, loading: loadingUsuario } = useProfesor();

  const [loadingTurnos, setLoadingTurnos] = useState(true);
  const [todosLosTurnos, setTodosLosTurnos] = useState<any[]>([]);

  const precioHora = usuario?.profesor?.precioHora || 0;
  const valoracionPromedio = usuario?.profesor?.valoracionPromedio;

  const loadTurnos = async (id: number) => {
    try {
      const turnos = await obtenerTurnosProfesor(id);
      setTodosLosTurnos(turnos);
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'No se pudieron cargar los datos del dashboard.');
    } finally {
      setLoadingTurnos(false);
    }
  };

  useEffect(() => {
    if (profesorId) loadTurnos(profesorId);
  }, [profesorId]);

  const loading = loadingUsuario || loadingTurnos;

  // Fechas de referencia
  const todayStr = new Date().toISOString().split('T')[0];
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

  // Tarjetas de estadísticas
  const clasesDictadas = todosLosTurnos.filter(t => t.estado === 'confirmado' && t.fecha < todayStr).length;
  const clasesPendientes = todosLosTurnos.filter(t => t.estado === 'confirmado' && t.fecha >= todayStr).length;

  const solicitudes = todosLosTurnos.filter(t => t.estado === 'pendiente_pago');

  const handleAccept = async (turnoId: number) => {
    try {
      setLoadingTurnos(true);
      await actualizarEstadoTurno(turnoId, 'confirmado');
      if (profesorId) await loadTurnos(profesorId);
    } catch {
      Alert.alert('Error', 'No se pudo aceptar la solicitud.');
      setLoadingTurnos(false);
    }
  };

  const handleReject = async (turnoId: number) => {
    try {
      setLoadingTurnos(true);
      await actualizarEstadoTurno(turnoId, 'rechazado');
      if (profesorId) await loadTurnos(profesorId);
    } catch {
      Alert.alert('Error', 'No se pudo rechazar la solicitud.');
      setLoadingTurnos(false);
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

        {/* Resumen / Estadísticas */}
        <Text style={styles.sectionTitle}>Resumen</Text>
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Ionicons name="checkmark-done-circle-outline" size={scale(20)} color={Colors.cian} />
            <Text style={styles.statValue}>{clasesDictadas}</Text>
            <Text style={styles.statLabel}>Clases dictadas</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="time-outline" size={scale(20)} color={Colors.cian} />
            <Text style={styles.statValue}>{clasesPendientes}</Text>
            <Text style={styles.statLabel}>Clases pendientes</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="star-outline" size={scale(20)} color={Colors.cian} />
            <Text style={styles.statValue}>
              {valoracionPromedio ? valoracionPromedio.toFixed(1) : '—'}
            </Text>
            <Text style={styles.statLabel}>Valoración</Text>
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

        {/* Solicitudes Section */}
        <Text style={styles.sectionTitle}>Nuevas Solicitudes</Text>
        <View style={styles.solicitudesContainer}>
          {solicitudes.length === 0 ? (
            <Text style={styles.noSolicitudes}>No tenés solicitudes pendientes.</Text>
          ) : (
            solicitudes.map((sol) => (
              <View key={sol.id} style={styles.solicitudCard}>
                <View style={styles.solicitudLeft}>
                  <Text style={styles.solicitudMateria}>{sol.materia}</Text>
                  <Text style={styles.solicitudFecha}>
                    Fecha: {sol.fecha} — Turno: {sol.turnoHorario === 'manana' ? '9-12hs' : sol.turnoHorario === 'tarde' ? '13-17hs' : '18-22hs'}
                  </Text>
                  <Text style={styles.solicitudAlumno}>{sol.alumno}</Text>
                  <TouchableOpacity
                    style={styles.btnVerPerfil}
                    onPress={() => router.push({ pathname: '/profesor/perfil-alumno', params: { alumnoId: String(sol.alumnoId ?? '') } })}
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
    paddingBottom: verticalScale(40),
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
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: verticalScale(24),
    gap: 10,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.superficieA,
    borderRadius: 8,
    paddingVertical: scale(14),
    paddingHorizontal: scale(8),
    borderWidth: 1,
    borderColor: '#1e295d',
    alignItems: 'center',
  },
  statValue: {
    fontFamily: Fonts.spaceGroteskBold,
    color: Colors.blanco,
    fontSize: moderateScale(18),
    marginTop: 6,
  },
  statLabel: {
    fontFamily: Fonts.rubikRegular,
    color: '#aaa',
    fontSize: moderateScale(10),
    textAlign: 'center',
    marginTop: 2,
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
    borderColor: Colors.cian,
    borderRadius: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
    alignSelf: 'flex-start',
  },
  btnVerPerfilText: {
    fontFamily: Fonts.spaceGroteskBold,
    color: Colors.cian,
    fontSize: moderateScale(9),
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
    backgroundColor: '#4cd964',
  },
  rejectBtn: {
    backgroundColor: Colors.error,
  },
});
