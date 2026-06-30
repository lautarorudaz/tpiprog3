import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Alert, ActivityIndicator, Modal
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { scale, verticalScale, moderateScale } from 'react-native-size-matters';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../../constants/colors';
import { Fonts } from '../../../constants/fonts';
import { obtenerTurnosProfesor, actualizarEstadoTurno } from '../../../services/apiService';
import { useProfesor } from '../../../hooks/use-profesor';
import MonthCalendar, { MarcaDia } from '../../../components/month-calendar';
import { TURNOS } from '../../../components/disponibilidad-grid';

function labelTurno(turnoHorario: string) {
  const t = TURNOS.find(t => t.key === turnoHorario);
  return t ? `${t.label} (${t.rango})` : turnoHorario;
}

function formatFecha(fechaISO: string) {
  const [y, m, d] = fechaISO.split('-');
  return `${d}/${m}/${y}`;
}

export default function ProfesorAgenda() {
  const router = useRouter();
  const { profesorId, loading: loadingUsuario } = useProfesor();

  const [loadingTurnos, setLoadingTurnos] = useState(true);
  const [turnos, setTurnos] = useState<any[]>([]);
  const [mes, setMes] = useState(new Date());
  const [fechaSeleccionada, setFechaSeleccionada] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [verPasadas, setVerPasadas] = useState(false);

  const loadTurnos = async (id: number) => {
    try {
      const data = await obtenerTurnosProfesor(id);
      setTurnos(data);
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'No se pudo cargar la agenda.');
    } finally {
      setLoadingTurnos(false);
    }
  };

  useEffect(() => {
    if (profesorId) loadTurnos(profesorId);
  }, [profesorId]);

  useFocusEffect(
    useCallback(() => {
      if (profesorId) {
        setLoadingTurnos(true);
        loadTurnos(profesorId);
      }
    }, [profesorId])
  );

  const todayStr = new Date().toISOString().split('T')[0];

  const marcas: Record<string, MarcaDia> = useMemo(() => {
    const map: Record<string, MarcaDia> = {};
    turnos.forEach(t => {
      if (t.estado === 'confirmado') {
        if (map[t.fecha] !== 'pendiente') map[t.fecha] = 'confirmado';
      } else if (t.estado === 'pendiente_pago') {
        map[t.fecha] = 'pendiente';
      }
    });
    return map;
  }, [turnos]);

  const turnosDelDiaSeleccionado = useMemo(() => {
    if (!fechaSeleccionada) return [];
    return turnos
      .filter(t => t.fecha === fechaSeleccionada && t.estado !== 'rechazado' && t.estado !== 'cancelado')
      .sort((a, b) => a.turnoHorario.localeCompare(b.turnoHorario));
  }, [turnos, fechaSeleccionada]);

  const proximasClases = useMemo(() => {
    return turnos
      .filter(t => t.estado === 'confirmado' && t.fecha >= todayStr)
      .sort((a, b) => a.fecha.localeCompare(b.fecha));
  }, [turnos, todayStr]);

  const solicitudes = useMemo(() => {
    return turnos.filter(t => t.estado === 'pendiente_pago');
  }, [turnos]);

  const clasesPasadas = useMemo(() => {
    return turnos
      .filter(t => t.fecha < todayStr && (t.estado === 'confirmado' || t.estado === 'rechazado' || t.estado === 'cancelado'))
      .sort((a, b) => b.fecha.localeCompare(a.fecha));
  }, [turnos, todayStr]);

  const handleSeleccionarDia = (fechaISO: string) => {
    setFechaSeleccionada(fechaISO);
    setModalVisible(true);
  };

  const handleAccept = async (turnoId: number) => {
    if (!profesorId) return;
    try {
      setLoadingTurnos(true);
      await actualizarEstadoTurno(turnoId, 'confirmado');
      await loadTurnos(profesorId);
    } catch {
      Alert.alert('Error', 'No se pudo aceptar la solicitud.');
      setLoadingTurnos(false);
    }
  };

  const handleReject = async (turnoId: number) => {
    if (!profesorId) return;
    try {
      setLoadingTurnos(true);
      await actualizarEstadoTurno(turnoId, 'rechazado');
      await loadTurnos(profesorId);
    } catch {
      Alert.alert('Error', 'No se pudo rechazar la solicitud.');
      setLoadingTurnos(false);
    }
  };

  if (loadingUsuario || loadingTurnos) {
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
        <Text style={styles.titulo}>Mi Agenda</Text>

        <MonthCalendar
          mes={mes}
          onCambiarMes={setMes}
          fechaSeleccionada={fechaSeleccionada}
          onSeleccionarDia={handleSeleccionarDia}
          marcas={marcas}
        />

        {/* Nuevas solicitudes */}
        <Text style={styles.sectionTitle}>Nuevas solicitudes</Text>
        {solicitudes.length === 0 ? (
          <Text style={styles.vacioText}>No tenés solicitudes pendientes.</Text>
        ) : (
          solicitudes.map(sol => (
            <View key={sol.id} style={styles.claseCard}>
              <View style={styles.claseCardLeft}>
                <Text style={styles.claseMateria}>{sol.materia}</Text>
                <Text style={styles.claseDetalle}>{formatFecha(sol.fecha)} · {labelTurno(sol.turnoHorario)}</Text>
                <Text style={styles.claseAlumno}>{sol.alumno}</Text>
              </View>
              <View style={styles.claseActions}>
                <TouchableOpacity style={[styles.actionBtn, styles.acceptBtn]} onPress={() => handleAccept(sol.id)}>
                  <Ionicons name="checkmark-sharp" size={18} color={Colors.blanco} />
                </TouchableOpacity>
                <TouchableOpacity style={[styles.actionBtn, styles.rejectBtn]} onPress={() => handleReject(sol.id)}>
                  <Ionicons name="close-sharp" size={18} color={Colors.blanco} />
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}

        {/* Próximas clases */}
        <Text style={styles.sectionTitle}>Próximas clases</Text>
        {proximasClases.length === 0 ? (
          <Text style={styles.vacioText}>No tenés clases confirmadas próximamente.</Text>
        ) : (
          proximasClases.map(c => (
            <TouchableOpacity
              key={c.id}
              style={styles.claseCard}
              onPress={() => router.push({
                pathname: '/profesor/detalle-turno',
                params: {
                  turnoId: String(c.id),
                  materia: c.materia,
                  fecha: String(c.fecha),
                  turnoHorario: c.turnoHorario,
                  modalidad: c.modalidad,
                  alumnoNombre: c.alumno,
                  alumnoId: String(c.alumnoId ?? ''),
                  alumnoFoto: c.alumnoFoto ?? '',
                },
              })}
            >
              <View style={styles.claseCardLeft}>
                <Text style={styles.claseMateria}>{c.materia}</Text>
                <Text style={styles.claseDetalle}>{formatFecha(c.fecha)} · {labelTurno(c.turnoHorario)}</Text>
                <Text style={styles.claseAlumno}>{c.alumno}</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color="#aaa" />
            </TouchableOpacity>
          ))
        )}

        {/* Filtro clases pasadas */}
        <TouchableOpacity style={styles.filtroBtn} onPress={() => setVerPasadas(!verPasadas)}>
          <Ionicons name={verPasadas ? 'eye-off-outline' : 'time-outline'} size={16} color={Colors.cian} />
          <Text style={styles.filtroBtnText}>
            {verPasadas ? 'Ocultar clases pasadas' : 'Ver clases pasadas'}
          </Text>
        </TouchableOpacity>

        {verPasadas && (
          <>
            <Text style={styles.sectionTitle}>Clases pasadas</Text>
            {clasesPasadas.length === 0 ? (
              <Text style={styles.vacioText}>Todavía no tuviste clases.</Text>
            ) : (
              clasesPasadas.map(c => (
                <View key={c.id} style={[styles.claseCard, styles.claseCardPasada]}>
                  <View style={styles.claseCardLeft}>
                    <Text style={styles.claseMateria}>{c.materia}</Text>
                    <Text style={styles.claseDetalle}>{formatFecha(c.fecha)} · {labelTurno(c.turnoHorario)}</Text>
                    <Text style={styles.claseAlumno}>{c.alumno}</Text>
                  </View>
                  <Text style={[
                    styles.estadoBadge,
                    c.estado === 'confirmado' ? styles.estadoConfirmado : styles.estadoRechazado,
                  ]}>
                    {c.estado === 'confirmado' ? 'Dictada' : c.estado === 'cancelado' ? 'Cancelada' : 'Rechazada'}
                  </Text>
                </View>
              ))
            )}
          </>
        )}
      </ScrollView>

      {/* Modal del día seleccionado */}
      <Modal visible={modalVisible} animationType="fade" transparent onRequestClose={() => setModalVisible(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setModalVisible(false)}>
          <View style={styles.modalContent} onStartShouldSetResponder={() => true}>
            <Text style={styles.modalTitle}>
              {fechaSeleccionada ? formatFecha(fechaSeleccionada) : ''}
            </Text>

            {turnosDelDiaSeleccionado.length === 0 ? (
              <Text style={styles.modalVacioText}>Sin clases asignadas</Text>
            ) : (
              <ScrollView style={{ maxHeight: verticalScale(300) }}>
                {turnosDelDiaSeleccionado.map(t => (
                  <TouchableOpacity
                    key={t.id}
                    style={styles.modalClaseCard}
                    activeOpacity={t.estado === 'confirmado' ? 0.7 : 1}
                    onPress={() => {
                      if (t.estado !== 'confirmado') return;
                      setModalVisible(false);
                      router.push({
                        pathname: '/profesor/detalle-turno',
                        params: {
                          turnoId: String(t.id),
                          materia: t.materia,
                          fecha: String(t.fecha),
                          turnoHorario: t.turnoHorario,
                          modalidad: t.modalidad,
                          alumnoNombre: t.alumno,
                          alumnoId: String(t.alumnoId ?? ''),
                          alumnoFoto: t.alumnoFoto ?? '',
                        },
                      });
                    }}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={styles.claseMateria}>{t.materia}</Text>
                      <Text style={styles.claseDetalle}>{labelTurno(t.turnoHorario)}</Text>
                      <Text style={styles.claseAlumno}>{t.alumno}</Text>
                    </View>
                    {t.estado === 'pendiente_pago' ? (
                      <View style={styles.claseActions}>
                        <TouchableOpacity style={[styles.actionBtn, styles.acceptBtn]} onPress={() => handleAccept(t.id)}>
                          <Ionicons name="checkmark-sharp" size={16} color={Colors.blanco} />
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.actionBtn, styles.rejectBtn]} onPress={() => handleReject(t.id)}>
                          <Ionicons name="close-sharp" size={16} color={Colors.blanco} />
                        </TouchableOpacity>
                      </View>
                    ) : (
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                        <Text style={[styles.estadoBadge, styles.estadoConfirmado]}>Confirmada</Text>
                        <Ionicons name="chevron-forward" size={14} color="#aaa" />
                      </View>
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}

            <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setModalVisible(false)}>
              <Text style={styles.modalCloseBtnText}>Cerrar</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
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
    fontSize: moderateScale(32),
    color: '#3455ff',
    textAlign: 'center',
    marginBottom: verticalScale(4),
  },
  titulo: {
    fontFamily: Fonts.spaceGroteskMedium,
    fontSize: moderateScale(16),
    color: Colors.blanco,
    textAlign: 'center',
    marginBottom: verticalScale(20),
  },
  sectionTitle: {
    fontFamily: Fonts.spaceGroteskBold,
    color: Colors.blanco,
    fontSize: moderateScale(14),
    letterSpacing: 0.5,
    marginTop: verticalScale(24),
    marginBottom: verticalScale(12),
  },
  vacioText: {
    fontFamily: Fonts.rubikRegular,
    color: '#aaa',
    fontSize: moderateScale(13),
  },
  claseCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.superficieA,
    borderRadius: 8,
    padding: scale(14),
    marginBottom: verticalScale(10),
    borderWidth: 1,
    borderColor: '#1e295d',
  },
  claseCardPasada: {
    opacity: 0.75,
  },
  claseCardLeft: {
    flex: 1,
  },
  claseMateria: {
    fontFamily: Fonts.spaceGroteskBold,
    color: Colors.blanco,
    fontSize: moderateScale(14),
    marginBottom: 4,
  },
  claseDetalle: {
    fontFamily: Fonts.rubikRegular,
    color: '#aaa',
    fontSize: moderateScale(11),
    marginBottom: 4,
  },
  claseAlumno: {
    fontFamily: Fonts.rubikRegular,
    color: Colors.blanco,
    fontSize: moderateScale(12),
  },
  claseActions: {
    flexDirection: 'row',
    gap: 10,
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
  estadoBadge: {
    fontFamily: Fonts.rubikMedium,
    fontSize: moderateScale(10),
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    overflow: 'hidden',
  },
  estadoConfirmado: {
    color: '#4cd964',
    backgroundColor: 'rgba(76, 217, 100, 0.15)',
  },
  estadoRechazado: {
    color: Colors.error,
    backgroundColor: 'rgba(255, 68, 68, 0.15)',
  },
  filtroBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: verticalScale(16),
    paddingVertical: scale(10),
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.cian,
  },
  filtroBtnText: {
    fontFamily: Fonts.rubikMedium,
    color: Colors.cian,
    fontSize: moderateScale(12),
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: scale(20),
  },
  modalContent: {
    backgroundColor: Colors.superficieA,
    width: '100%',
    maxHeight: '80%',
    borderRadius: 12,
    padding: scale(20),
  },
  modalTitle: {
    fontFamily: Fonts.spaceGroteskBold,
    color: Colors.blanco,
    fontSize: moderateScale(16),
    marginBottom: verticalScale(14),
    textAlign: 'center',
  },
  modalVacioText: {
    fontFamily: Fonts.rubikRegular,
    color: '#aaa',
    fontSize: moderateScale(13),
    textAlign: 'center',
    marginBottom: verticalScale(10),
  },
  modalClaseCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.superficieB,
    borderRadius: 8,
    padding: scale(12),
    marginBottom: verticalScale(8),
  },
  modalCloseBtn: {
    backgroundColor: Colors.cian,
    borderRadius: 20,
    paddingVertical: scale(10),
    alignItems: 'center',
    marginTop: verticalScale(10),
  },
  modalCloseBtnText: {
    fontFamily: Fonts.spaceGroteskBold,
    color: Colors.background,
    fontSize: moderateScale(13),
  },
});
