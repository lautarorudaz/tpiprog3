import { useEffect, useMemo, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Alert
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { scale, verticalScale, moderateScale } from 'react-native-size-matters';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { Fonts } from '../../constants/fonts';
import { obtenerPerfilProfesor, obtenerDisponiblesProfesor } from '../../services/apiService';
import { useAlumno } from '../../hooks/use-alumno';
import MonthCalendar, { MarcaDia } from '../../components/month-calendar';
import { TURNOS } from '../../components/disponibilidad-grid';

const DIA_POR_JS = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];

function labelTurno(key: string) {
  return TURNOS.find(t => t.key === key)?.label ?? key;
}

export default function AgendarClase() {
  const router = useRouter();
  const { profesorId, profesorNombre } = useLocalSearchParams<{ profesorId: string; profesorNombre: string }>();
  const { alumnoId, loading: loadingAlumno } = useAlumno();

  const [loading, setLoading] = useState(true);
  const [perfil, setPerfil] = useState<any>(null);
  const [disponibles, setDisponibles] = useState<{ disponibilidades: any[]; turnosConfirmados: any[] }>({ disponibilidades: [], turnosConfirmados: [] });

  const [materiaSeleccionada, setMateriaSeleccionada] = useState<any | null>(null);
  const [mes, setMes] = useState(new Date());
  const [fechaSeleccionada, setFechaSeleccionada] = useState<string | null>(null);
  const [turnoSeleccionado, setTurnoSeleccionado] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const [p, d] = await Promise.all([
          obtenerPerfilProfesor(Number(profesorId)),
          obtenerDisponiblesProfesor(Number(profesorId)),
        ]);
        setPerfil(p);
        setDisponibles(d);
        if (p.materias?.length > 0) setMateriaSeleccionada(p.materias[0]);
      } catch {
        Alert.alert('Error', 'No se pudieron cargar los datos del profesor.');
      } finally {
        setLoading(false);
      }
    };
    if (profesorId) load();
  }, [profesorId]);

  // Compute marks: green for days the professor has availability
  const marcas: Record<string, MarcaDia> = useMemo(() => {
    if (!disponibles.disponibilidades.length) return {};
    const map: Record<string, MarcaDia> = {};
    const hoy = new Date();
    for (let i = 0; i < 60; i++) {
      const fecha = new Date(hoy);
      fecha.setDate(hoy.getDate() + i);
      const diaSemana = DIA_POR_JS[fecha.getDay()];
      const tieneDisp = disponibles.disponibilidades.some(d => d.diaSemana === diaSemana);
      if (tieneDisp) {
        const iso = fecha.toISOString().split('T')[0];
        map[iso] = 'confirmado';
      }
    }
    return map;
  }, [disponibles]);

  // Available turnos for the selected date
  const turnosDisponiblesParaDia = useMemo(() => {
    if (!fechaSeleccionada) return [];
    const diaSemana = DIA_POR_JS[new Date(fechaSeleccionada).getDay()];
    const dispParaDia = disponibles.disponibilidades
      .filter(d => d.diaSemana === diaSemana)
      .map(d => d.turno as string);

    const confirmadosParaDia = disponibles.turnosConfirmados
      .filter(t => t.fecha === fechaSeleccionada)
      .map(t => t.turnoHorario as string);

    return dispParaDia.filter(t => !confirmadosParaDia.includes(t));
  }, [fechaSeleccionada, disponibles]);

  const handleSeleccionarFecha = (fecha: string) => {
    const hoy = new Date().toISOString().split('T')[0];
    if (fecha < hoy) return;
    setFechaSeleccionada(fecha);
    setTurnoSeleccionado(null);
  };

  const handleContinuar = () => {
    if (!materiaSeleccionada || !fechaSeleccionada || !turnoSeleccionado || !alumnoId) {
      Alert.alert('Faltan datos', 'Elegí una materia, fecha y horario disponible.');
      return;
    }
    router.push({
      pathname: '/alumno/confirmar-turno',
      params: {
        profesorId: String(perfil.id),
        profesorNombre: profesorNombre || `${perfil.nombre} ${perfil.apellido}`,
        alumnoId: String(alumnoId),
        materiaId: String(materiaSeleccionada.id),
        materiaNombre: materiaSeleccionada.nombre,
        fecha: fechaSeleccionada,
        turnoHorario: turnoSeleccionado,
        precioHora: String(perfil.precioHora),
        modalidad: perfil.modalidad,
      }
    });
  };

  if (loading || loadingAlumno) {
    return <View style={styles.loading}><ActivityIndicator size="large" color={Colors.cian} /></View>;
  }

  return (
    <View style={styles.container}>
      {/* Progress header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={22} color={Colors.blanco} />
        </TouchableOpacity>
        <View style={styles.steps}>
          <View style={styles.step}>
            <View style={[styles.stepCircle, styles.stepActivo]}><Text style={styles.stepNum}>1</Text></View>
            <Text style={styles.stepLabel}>FECHA Y HORA</Text>
          </View>
          <View style={styles.stepLine} />
          <View style={styles.step}>
            <View style={styles.stepCircle}><Text style={styles.stepNum}>2</Text></View>
            <Text style={[styles.stepLabel, { color: '#8b93b8' }]}>CONFIRMAR</Text>
          </View>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Materia picker */}
        <Text style={styles.sectionLabel}>Elige una materia</Text>
        <View style={styles.materiasRow}>
          {(perfil?.materias || []).map((m: any) => (
            <TouchableOpacity
              key={m.id}
              style={[styles.materiaChip, materiaSeleccionada?.id === m.id && styles.materiaChipActivo]}
              onPress={() => setMateriaSeleccionada(m)}
            >
              <Text style={[styles.materiaChipText, materiaSeleccionada?.id === m.id && styles.materiaChipTextActivo]}>
                {m.nombre} ({m.nivel})
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Calendar */}
        <MonthCalendar
          mes={mes}
          onCambiarMes={setMes}
          fechaSeleccionada={fechaSeleccionada}
          onSeleccionarDia={handleSeleccionarFecha}
          marcas={marcas}
        />

        {/* Turnos disponibles */}
        {fechaSeleccionada && (
          <>
            <Text style={styles.sectionLabel}>Elige un horario disponible para tu clase</Text>
            {turnosDisponiblesParaDia.length === 0 ? (
              <Text style={styles.noDisp}>El profesor no tiene disponibilidad en esta fecha.</Text>
            ) : (
              turnosDisponiblesParaDia.map(turno => (
                <TouchableOpacity
                  key={turno}
                  style={[styles.turnoOption, turnoSeleccionado === turno && styles.turnoOptionActivo]}
                  onPress={() => setTurnoSeleccionado(turno)}
                >
                  <View style={styles.turnoRadio}>
                    {turnoSeleccionado === turno && <View style={styles.radioInner} />}
                  </View>
                  <Text style={styles.turnoOptionText}>{TURNOS.find(t => t.key === turno)?.rango || turno}</Text>
                </TouchableOpacity>
              ))
            )}
          </>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.btnContinuar, !(materiaSeleccionada && fechaSeleccionada && turnoSeleccionado) && styles.btnDisabled]}
          onPress={handleContinuar}
          disabled={!(materiaSeleccionada && fechaSeleccionada && turnoSeleccionado)}
        >
          <Text style={styles.btnContinuarText}>Continuar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  loading: { flex: 1, backgroundColor: Colors.background, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: scale(24), paddingTop: verticalScale(50), paddingBottom: verticalScale(16),
    borderBottomWidth: 1, borderBottomColor: '#1e295d',
  },
  steps: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  step: { alignItems: 'center', gap: 4 },
  stepCircle: {
    width: scale(28), height: scale(28), borderRadius: scale(14),
    backgroundColor: Colors.superficieB, borderWidth: 2, borderColor: '#1e295d',
    justifyContent: 'center', alignItems: 'center',
  },
  stepActivo: { borderColor: Colors.cian, backgroundColor: Colors.cian },
  stepNum: { fontFamily: Fonts.spaceGroteskBold, color: Colors.background, fontSize: moderateScale(11) },
  stepLabel: { fontFamily: Fonts.rubikMedium, color: Colors.blanco, fontSize: moderateScale(9), letterSpacing: 0.5 },
  stepLine: { flex: 1, height: 1, backgroundColor: '#1e295d', marginHorizontal: 8, marginBottom: 16 },
  scrollContent: { padding: scale(24), paddingBottom: verticalScale(100) },
  sectionLabel: {
    fontFamily: Fonts.spaceGroteskBold, color: Colors.blanco, fontSize: moderateScale(13),
    marginBottom: verticalScale(10), marginTop: verticalScale(16),
  },
  materiasRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: verticalScale(16) },
  materiaChip: {
    paddingHorizontal: scale(14), paddingVertical: scale(8), borderRadius: 20,
    backgroundColor: Colors.superficieA, borderWidth: 1, borderColor: '#1e295d',
  },
  materiaChipActivo: { backgroundColor: Colors.cian, borderColor: Colors.cian },
  materiaChipText: { fontFamily: Fonts.rubikMedium, color: Colors.blanco, fontSize: moderateScale(12) },
  materiaChipTextActivo: { color: Colors.background },
  noDisp: { fontFamily: Fonts.rubikRegular, color: '#aaa', fontSize: moderateScale(13) },
  turnoOption: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: Colors.superficieA, borderRadius: 8, padding: scale(14),
    marginBottom: verticalScale(10), borderWidth: 1, borderColor: '#1e295d',
  },
  turnoOptionActivo: { borderColor: Colors.cian },
  turnoRadio: {
    width: scale(18), height: scale(18), borderRadius: scale(9),
    borderWidth: 2, borderColor: Colors.cian, justifyContent: 'center', alignItems: 'center',
  },
  radioInner: { width: scale(9), height: scale(9), borderRadius: scale(4.5), backgroundColor: Colors.cian },
  turnoOptionText: { fontFamily: Fonts.rubikMedium, color: Colors.blanco, fontSize: moderateScale(13) },
  footer: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    padding: scale(20), backgroundColor: Colors.background, borderTopWidth: 1, borderTopColor: '#1e295d',
  },
  btnContinuar: {
    backgroundColor: '#162b4e', borderRadius: 8, paddingVertical: scale(16),
    alignItems: 'center', borderWidth: 1, borderColor: Colors.cian,
  },
  btnContinuarText: { fontFamily: Fonts.spaceGroteskBold, color: Colors.blanco, fontSize: moderateScale(14) },
  btnDisabled: { borderColor: '#1e295d', backgroundColor: Colors.superficieB },
});
