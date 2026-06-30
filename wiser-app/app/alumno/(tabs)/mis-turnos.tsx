import { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { scale, verticalScale, moderateScale } from 'react-native-size-matters';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../../constants/colors';
import { Fonts } from '../../../constants/fonts';
import { obtenerTurnosAlumno } from '../../../services/apiService';
import { useAlumno } from '../../../hooks/use-alumno';
import { TURNOS } from '../../../components/disponibilidad-grid';

type Filtro = 'confirmados' | 'pendientes' | 'realizadas';

function formatFecha(iso: string) {
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

function labelTurno(key: string) {
  return TURNOS.find(t => t.key === key)?.rango || key;
}

export default function MisTurnos() {
  const router = useRouter();
  const { alumnoId, loading: loadingAlumno } = useAlumno();

  const [turnos, setTurnos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState<Filtro>('confirmados');

  const loadTurnos = useCallback(async () => {
    if (!alumnoId) return;
    try {
      const data = await obtenerTurnosAlumno(alumnoId);
      setTurnos(data);
    } catch {
      Alert.alert('Error', 'No se pudieron cargar tus turnos.');
    } finally {
      setLoading(false);
    }
  }, [alumnoId]);

  useEffect(() => {
    loadTurnos();
  }, [loadTurnos]);

  const hoy = new Date().toISOString().split('T')[0];

  const turnosFiltrados = useMemo(() => {
    return turnos.filter(t => {
      if (filtro === 'confirmados') return t.estado === 'confirmado' && t.fecha >= hoy;
      if (filtro === 'pendientes') return t.estado === 'pendiente_pago';
      if (filtro === 'realizadas') return t.estado === 'confirmado' && t.fecha < hoy;
      return true;
    }).sort((a, b) => a.fecha.localeCompare(b.fecha));
  }, [turnos, filtro, hoy]);

  if (loadingAlumno || loading) {
    return <View style={styles.loading}><ActivityIndicator size="large" color={Colors.cian} /></View>;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.titulo}>MIS TURNOS</Text>

      <View style={styles.filtrosRow}>
        {([
          { key: 'confirmados', label: 'Confirmados' },
          { key: 'pendientes', label: 'Pendientes de Pago' },
          { key: 'realizadas', label: 'Clases realizadas' },
        ] as { key: Filtro; label: string }[]).map(f => (
          <TouchableOpacity
            key={f.key}
            style={[styles.filtroChip, filtro === f.key && styles.filtroChipActivo]}
            onPress={() => setFiltro(f.key)}
          >
            <Text style={[styles.filtroText, filtro === f.key && styles.filtroTextActivo]}>
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={turnosFiltrados}
        keyExtractor={item => String(item.id)}
        contentContainerStyle={styles.listContent}
        onRefresh={loadTurnos}
        refreshing={loading}
        ListEmptyComponent={
          <Text style={styles.vacioText}>No tenés {
            filtro === 'realizadas' ? 'clases realizadas' :
            filtro === 'pendientes' ? 'clases pendientes de pago' :
            'clases confirmadas'
          }.</Text>
        }
        renderItem={({ item }) => (
          <View style={styles.turnoCard}>
            <View style={styles.turnoLeft}>
              <Text style={styles.turnoMateria}>{item.materia}</Text>
              <Text style={styles.turnoInfo}>Fecha: {formatFecha(item.fecha)} - Hora: {labelTurno(item.turnoHorario)}</Text>
              <Text style={styles.turnoProfesor}>{item.profesor}</Text>
            </View>
            <TouchableOpacity
              style={styles.btnDetalle}
              onPress={() => router.push({
                pathname: '/alumno/detalle-turno',
                params: { turnoId: String(item.id) }
              })}
            >
              <Text style={styles.btnDetalleText}>VER DETALLES</Text>
            </TouchableOpacity>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background, paddingHorizontal: scale(24), paddingTop: verticalScale(30) },
  loading: { flex: 1, backgroundColor: Colors.background, justifyContent: 'center', alignItems: 'center' },
  titulo: {
    fontFamily: Fonts.spaceGroteskBold, color: Colors.blanco,
    fontSize: moderateScale(18), letterSpacing: 1.5, textAlign: 'center', marginBottom: verticalScale(20),
  },
  filtrosRow: { flexDirection: 'row', gap: 8, marginBottom: verticalScale(16), flexWrap: 'wrap' },
  filtroChip: {
    paddingHorizontal: scale(12), paddingVertical: scale(8), borderRadius: 20,
    backgroundColor: Colors.superficieA, borderWidth: 1, borderColor: '#1e295d',
  },
  filtroChipActivo: { backgroundColor: Colors.cian, borderColor: Colors.cian },
  filtroText: { fontFamily: Fonts.rubikMedium, color: Colors.blanco, fontSize: moderateScale(11) },
  filtroTextActivo: { color: Colors.background },
  listContent: { paddingBottom: verticalScale(30) },
  vacioText: { fontFamily: Fonts.rubikRegular, color: '#aaa', fontSize: moderateScale(13), textAlign: 'center', marginTop: 20 },
  turnoCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: Colors.superficieA, borderRadius: 8, padding: scale(14),
    marginBottom: verticalScale(12), borderWidth: 1, borderColor: '#1e295d',
  },
  turnoLeft: { flex: 1 },
  turnoMateria: { fontFamily: Fonts.spaceGroteskBold, color: Colors.blanco, fontSize: moderateScale(14), marginBottom: 4 },
  turnoInfo: { fontFamily: Fonts.rubikRegular, color: '#aaa', fontSize: moderateScale(11), marginBottom: 2 },
  turnoProfesor: { fontFamily: Fonts.rubikRegular, color: Colors.blanco, fontSize: moderateScale(12) },
  btnDetalle: {
    borderWidth: 1, borderColor: '#aaa', borderRadius: 4,
    paddingVertical: 6, paddingHorizontal: 10, marginLeft: 8,
  },
  btnDetalleText: { fontFamily: Fonts.spaceGroteskBold, color: '#aaa', fontSize: moderateScale(9) },
});
