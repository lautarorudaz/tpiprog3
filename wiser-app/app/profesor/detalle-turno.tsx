import { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  Alert, ActivityIndicator, Modal, TextInput, Image
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { scale, verticalScale, moderateScale } from 'react-native-size-matters';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { Fonts } from '../../constants/fonts';
import { cancelarTurno } from '../../services/apiService';
import { TURNOS } from '../../components/disponibilidad-grid';

function labelTurno(key: string) {
  const t = TURNOS.find(t => t.key === key);
  return t ? `${t.label} (${t.rango})` : key;
}

function labelModalidad(m: string) {
  if (m === 'presencial') return 'Presencial';
  if (m === 'Virtual') return 'Virtual';
  if (m === 'hibrida') return 'Híbrida';
  return m;
}

function formatFecha(fechaISO: string) {
  const [y, m, d] = fechaISO.split('-');
  return `${d}/${m}/${y}`;
}

export default function ProfesorDetalleTurno() {
  const router = useRouter();
  const {
    turnoId, materia, fecha, turnoHorario, modalidad,
    alumnoNombre, alumnoId, alumnoFoto,
  } = useLocalSearchParams<{
    turnoId: string; materia: string; fecha: string;
    turnoHorario: string; modalidad: string;
    alumnoNombre: string; alumnoId: string; alumnoFoto?: string;
  }>();

  const [modalCancelar, setModalCancelar] = useState(false);
  const [motivo, setMotivo] = useState('');
  const [cancelando, setCancelando] = useState(false);

  const handleCancelar = async () => {
    setCancelando(true);
    try {
      await cancelarTurno(Number(turnoId), motivo.trim() || null);
      setModalCancelar(false);
      Alert.alert('Clase cancelada', 'La clase fue cancelada correctamente.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch {
      Alert.alert('Error', 'No se pudo cancelar la clase.');
    } finally {
      setCancelando(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color={Colors.blanco} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Detalles de la Clase</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Datos de la clase */}
      <Text style={styles.sectionTitle}>DATOS DE LA CLASE</Text>
      <View style={styles.card}>
        <View style={styles.dataRow}>
          <Text style={styles.dataLabel}>Materia</Text>
          <Text style={styles.dataValue}>{materia}</Text>
        </View>
        <View style={styles.separator} />
        <View style={styles.dataRow}>
          <Text style={styles.dataLabel}>Fecha</Text>
          <Text style={styles.dataValue}>{fecha ? formatFecha(fecha) : '—'}</Text>
        </View>
        <View style={styles.separator} />
        <View style={styles.dataRow}>
          <Text style={styles.dataLabel}>Horario</Text>
          <Text style={styles.dataValue}>{turnoHorario ? labelTurno(turnoHorario) : '—'}</Text>
        </View>
        <View style={styles.separator} />
        <View style={styles.dataRow}>
          <Text style={styles.dataLabel}>Modalidad</Text>
          <Text style={styles.dataValue}>{modalidad ? labelModalidad(modalidad) : '—'}</Text>
        </View>
      </View>

      {/* Alumno */}
      <Text style={styles.sectionTitle}>ALUMNO</Text>
      <View style={styles.alumnoCard}>
        <View style={styles.alumnoAvatar}>
          {alumnoFoto ? (
            <Image source={{ uri: alumnoFoto }} style={{ width: '100%', height: '100%', resizeMode: 'cover' }} />
          ) : (
            <Ionicons name="person-outline" size={scale(22)} color="#aaa" />
          )}
        </View>
        <Text style={styles.alumnoNombre}>{alumnoNombre}</Text>
        {alumnoId ? (
          <TouchableOpacity
            style={styles.btnVerPerfil}
            onPress={() => router.push({ pathname: '/profesor/perfil-alumno', params: { alumnoId } })}
          >
            <Text style={styles.btnVerPerfilText}>VER PERFIL</Text>
            <Ionicons name="chevron-forward" size={12} color={Colors.cian} />
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Cancelar */}
      <TouchableOpacity style={styles.btnCancelar} onPress={() => setModalCancelar(true)}>
        <Ionicons name="close-circle-outline" size={18} color={Colors.blanco} />
        <Text style={styles.btnCancelarText}>Cancelar clase</Text>
      </TouchableOpacity>

      {/* Modal cancelar */}
      <Modal visible={modalCancelar} transparent animationType="fade" onRequestClose={() => setModalCancelar(false)}>
        <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={() => setModalCancelar(false)}>
          <View style={styles.modalBox} onStartShouldSetResponder={() => true}>
            <Text style={styles.modalTitle}>Cancelar clase</Text>
            <Text style={styles.modalSubtitle}>¿Por qué cancelás la clase? (opcional)</Text>
            <TextInput
              style={styles.motivoInput}
              value={motivo}
              onChangeText={setMotivo}
              placeholder="Ej: tengo un compromiso"
              placeholderTextColor="#777"
              multiline
              numberOfLines={3}
            />
            <TouchableOpacity style={styles.btnConfirmar} onPress={handleCancelar} disabled={cancelando}>
              {cancelando
                ? <ActivityIndicator color={Colors.blanco} />
                : <Text style={styles.btnConfirmarText}>Confirmar cancelación</Text>
              }
            </TouchableOpacity>
            <TouchableOpacity style={styles.btnVolver} onPress={() => setModalCancelar(false)}>
              <Text style={styles.btnVolverText}>Volver</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { paddingHorizontal: scale(24), paddingTop: verticalScale(50), paddingBottom: 40 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: verticalScale(24) },
  headerTitle: { fontFamily: Fonts.spaceGroteskBold, color: Colors.blanco, fontSize: moderateScale(16) },
  sectionTitle: {
    fontFamily: Fonts.spaceGroteskBold, color: '#aaa',
    fontSize: moderateScale(11), letterSpacing: 1,
    marginBottom: verticalScale(10), marginTop: verticalScale(20),
  },
  card: {
    backgroundColor: Colors.superficieA, borderRadius: 10,
    borderWidth: 1, borderColor: '#1e295d', overflow: 'hidden',
  },
  dataRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: scale(16), paddingVertical: scale(12) },
  dataLabel: { fontFamily: Fonts.rubikRegular, color: '#aaa', fontSize: moderateScale(13) },
  dataValue: { fontFamily: Fonts.rubikMedium, color: Colors.blanco, fontSize: moderateScale(13) },
  separator: { height: 1, backgroundColor: '#1e295d' },
  alumnoCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.superficieA, borderRadius: 10,
    borderWidth: 1, borderColor: '#1e295d', padding: scale(16), gap: 12,
  },
  alumnoAvatar: {
    width: scale(40), height: scale(40), borderRadius: scale(20),
    backgroundColor: Colors.superficieB, justifyContent: 'center', alignItems: 'center',
    overflow: 'hidden',
  },
  alumnoNombre: { fontFamily: Fonts.rubikMedium, color: Colors.blanco, fontSize: moderateScale(14), flex: 1 },
  btnVerPerfil: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  btnVerPerfilText: { fontFamily: Fonts.spaceGroteskBold, color: Colors.cian, fontSize: moderateScale(11) },
  btnCancelar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: Colors.error, borderRadius: 10, paddingVertical: scale(16),
    marginTop: verticalScale(32),
  },
  btnCancelarText: { fontFamily: Fonts.spaceGroteskBold, color: Colors.blanco, fontSize: moderateScale(14) },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: scale(24) },
  modalBox: { backgroundColor: Colors.superficieA, borderRadius: 12, padding: scale(24), width: '100%', borderWidth: 1, borderColor: '#1e295d' },
  modalTitle: { fontFamily: Fonts.spaceGroteskBold, color: Colors.blanco, fontSize: moderateScale(16), marginBottom: 6 },
  modalSubtitle: { fontFamily: Fonts.rubikRegular, color: '#aaa', fontSize: moderateScale(12), marginBottom: verticalScale(14) },
  motivoInput: {
    backgroundColor: Colors.superficieB, borderRadius: 8, padding: scale(12),
    color: Colors.blanco, fontFamily: Fonts.rubikRegular, fontSize: moderateScale(13),
    borderWidth: 1, borderColor: '#1e295d', textAlignVertical: 'top',
    minHeight: verticalScale(70), marginBottom: verticalScale(16),
  },
  btnConfirmar: {
    backgroundColor: Colors.error, borderRadius: 8,
    paddingVertical: scale(14), alignItems: 'center', marginBottom: verticalScale(10),
  },
  btnConfirmarText: { fontFamily: Fonts.spaceGroteskBold, color: Colors.blanco, fontSize: moderateScale(13) },
  btnVolver: { alignItems: 'center', paddingVertical: scale(10) },
  btnVolverText: { fontFamily: Fonts.rubikMedium, color: '#aaa', fontSize: moderateScale(13) },
});
