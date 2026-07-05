import { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  ActivityIndicator, Alert, Modal, Image, TextInput
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { scale, verticalScale, moderateScale } from 'react-native-size-matters';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { Fonts } from '../../constants/fonts';
import { obtenerTurnosAlumno, crearValoracion, subirComprobante } from '../../services/apiService';
import * as ImagePicker from 'expo-image-picker';
import { useAlumno } from '../../hooks/use-alumno';
import { TURNOS } from '../../components/disponibilidad-grid';

function formatFecha(iso: string) {
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

function EstrellaInteractiva({ puntaje, onSelect }: { puntaje: number; onSelect: (n: number) => void }) {
  return (
    <View style={{ flexDirection: 'row', gap: 8 }}>
      {[1, 2, 3, 4, 5].map(i => (
        <TouchableOpacity key={i} onPress={() => onSelect(i)}>
          <Ionicons name={puntaje >= i ? 'star' : 'star-outline'} size={scale(32)} color="#FFD700" />
        </TouchableOpacity>
      ))}
    </View>
  );
}

export default function DetalleTurno() {
  const router = useRouter();
  const { turnoId } = useLocalSearchParams<{ turnoId: string }>();
  const { alumnoId, loading: loadingAlumno } = useAlumno();

  const [turno, setTurno] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [ratingVisible, setRatingVisible] = useState(false);
  const [puntaje, setPuntaje] = useState(0);
  const [comentario, setComentario] = useState('');
  const [enviandoRating, setEnviandoRating] = useState(false);
  const [yaCalificado, setYaCalificado] = useState(false);
  const [subiendoComp, setSubiendoComp] = useState(false);
  const [yaCalificadoCargado, setYaCalificadoCargado] = useState(false);

  useEffect(() => {
    const load = async () => {
      if (!alumnoId) return;
      try {
        const turnos = await obtenerTurnosAlumno(alumnoId);
        const t = turnos.find((t: any) => String(t.id) === turnoId);
        setTurno(t || null);
        if (t?.yaCalificado) {
          setYaCalificado(true);
        }
        setYaCalificadoCargado(true);
      } catch {
        Alert.alert('Error', 'No se pudo cargar el detalle del turno.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [alumnoId, turnoId]);

  const hoy = new Date().toISOString().split('T')[0];
  const esRealizada = turno?.estado === 'confirmado' && turno?.fecha < hoy;
  const labelTurno = TURNOS.find(t => t.key === turno?.turnoHorario)?.rango || turno?.turnoHorario;

  const handleEnviarRating = async () => {
    if (puntaje === 0) {
      Alert.alert('Seleccioná una puntuación', 'Por favor tocá una estrella antes de enviar.');
      return;
    }
    setEnviandoRating(true);
    try {
      await crearValoracion({
        turnoId: Number(turnoId),
        alumnoId: alumnoId!,
        profesorId: turno.profesorId,
        puntaje,
        comentario: comentario.trim() || null,
      });
      setYaCalificado(true);
      setRatingVisible(false);
      Alert.alert('¡Gracias!', 'Tu calificación fue enviada correctamente.');
    } catch (err: any) {
      if (err.message.includes('409') || err.message.toLowerCase().includes('ya tiene')) {
        setYaCalificado(true);
        setRatingVisible(false);
        Alert.alert('Ya calificaste', 'Esta clase ya tiene una calificación enviada.');
      } else {
        Alert.alert('Error', 'No se pudo enviar la calificación.');
      }
    } finally {
      setEnviandoRating(false);
    }
  };

  const handleSubirComprobante = async () => {
    if (!turno?.id) return;
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) { Alert.alert('Permiso requerido', 'Necesitamos acceso a tus fotos.'); return; }
    setSubiendoComp(true);
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'], quality: 0.7, base64: true,
      });
      if (result.canceled || !result.assets[0]?.base64) { setSubiendoComp(false); return; }
      const dataUri = `data:image/jpeg;base64,${result.assets[0].base64}`;
      await subirComprobante(turno.id, dataUri);
      setTurno((prev: any) => ({ ...prev, pago: { ...prev?.pago, comprobanteUrl: dataUri } }));
      Alert.alert('Comprobante enviado ✓', 'El profesor va a revisar tu pago y confirmar la clase.');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'No se pudo subir el comprobante.');
    } finally {
      setSubiendoComp(false);
    }
  };

  const handleMensaje = () => {
    if (!turno?.conversacionId) {
      Alert.alert('Sin conversación', 'No hay un chat con este profesor todavía.');
      return;
    }
    router.push({
      pathname: '/alumno/chat-detail',
      params: { conversacionId: String(turno.conversacionId), interlocutorNombre: turno.profesor },
    });
  };

  if (loading || loadingAlumno) {
    return <View style={styles.loading}><ActivityIndicator size="large" color={Colors.cian} /></View>;
  }

  if (!turno) {
    return (
      <View style={styles.loading}>
        <Text style={{ color: Colors.blanco, fontFamily: Fonts.rubikRegular }}>Turno no encontrado.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color={Colors.blanco} />
        </TouchableOpacity>
        <Text style={styles.wiser}>Wiser</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.titulo}>DATOS DE TU CLASE</Text>

        <View style={styles.datosCard}>
          <View style={styles.datoRow}>
            <Text style={styles.datoLabel}>MATERIA</Text>
            <Text style={styles.datoVal}>{turno.materia}</Text>
          </View>
          <View style={styles.datoRow}>
            <Text style={styles.datoLabel}>FECHA</Text>
            <Text style={styles.datoVal}>{formatFecha(turno.fecha)}</Text>
          </View>
          <View style={styles.datoRow}>
            <Text style={styles.datoLabel}>HORA</Text>
            <Text style={styles.datoVal}>{labelTurno}</Text>
          </View>
          <View style={styles.datoRow}>
            <Text style={styles.datoLabel}>MODALIDAD</Text>
            <Text style={styles.datoVal}>{(turno.modalidad || '').toUpperCase()}</Text>
          </View>
          <View style={[styles.datoRow, { borderBottomWidth: 0 }]}>
            <Text style={styles.datoLabel}>ESTADO</Text>
            <Text style={[
              styles.datoVal,
              turno.estado === 'confirmado' ? { color: '#4cd964' } : { color: '#ffb020' }
            ]}>
              {turno.estado === 'confirmado' ? 'CONFIRMADO' : turno.estado.toUpperCase().replace('_', ' ')}
            </Text>
          </View>
        </View>

        {/* Profesor info */}
        <TouchableOpacity
          style={styles.profesorCard}
          onPress={() => turno.profesorId && router.push({
            pathname: '/alumno/perfil-profesor',
            params: { profesorId: String(turno.profesorId) }
          })}
          activeOpacity={turno.profesorId ? 0.7 : 1}
        >
          <View style={styles.avatarSmall}>
            {turno.profesorFoto ? (
              <Image source={{ uri: turno.profesorFoto }} style={{ width: '100%', height: '100%', resizeMode: 'cover' }} />
            ) : (
              <Ionicons name="person" size={scale(22)} color="#aaa" />
            )}
          </View>
          <Text style={styles.profesorNombre}>{turno.profesor}</Text>
          <TouchableOpacity style={styles.btnMensaje} onPress={handleMensaje}>
            <Text style={styles.btnMensajeText}>MENSAJE</Text>
          </TouchableOpacity>
        </TouchableOpacity>

        {/* Sección de pago / comprobante */}
        {turno.pago?.metodo === 'transferencia' && (
          <View style={{ marginTop: verticalScale(18) }}>
            <Text style={styles.sectionLabel}>PAGO POR TRANSFERENCIA</Text>
            {turno.pago?.comprobanteUrl ? (
              <View style={styles.comprobanteCard}>
                <Image
                  source={{ uri: turno.pago.comprobanteUrl }}
                  style={styles.comprobanteImg}
                  resizeMode="contain"
                />
                <Text style={styles.comprobanteLegend}>Comprobante adjunto</Text>
              </View>
            ) : (
              <View>
                <View style={styles.comprobantePendCard}>
                  <Ionicons name="alert-circle-outline" size={scale(20)} color="#ffb020" />
                  <Text style={styles.comprobantePendText}>
                    Aún no subiste el comprobante de pago.
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.btnSubirComp}
                  onPress={handleSubirComprobante}
                  disabled={subiendoComp}
                >
                  {subiendoComp ? (
                    <ActivityIndicator color={Colors.background} />
                  ) : (
                    <>
                      <Ionicons name="cloud-upload-outline" size={16} color={Colors.background} />
                      <Text style={styles.btnSubirCompText}>Cargar comprobante</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

        {esRealizada && yaCalificadoCargado && !yaCalificado && (
          <TouchableOpacity style={styles.btnCalificar} onPress={() => setRatingVisible(true)}>
            <Ionicons name="star-outline" size={18} color={Colors.background} />
            <Text style={styles.btnCalificarText}>Dejar calificación</Text>
          </TouchableOpacity>
        )}

        {esRealizada && yaCalificadoCargado && yaCalificado && (
          <View style={styles.calificadoBadge}>
            <Ionicons name="checkmark-circle" size={16} color="#4cd964" />
            <Text style={styles.calificadoText}>Ya calificaste esta clase</Text>
          </View>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.btnListo} onPress={() => router.back()}>
          <Text style={styles.btnListoText}>LISTO</Text>
        </TouchableOpacity>
      </View>

      <Modal visible={ratingVisible} animationType="fade" transparent onRequestClose={() => setRatingVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>¿Cómo estuvo la clase?</Text>
            <EstrellaInteractiva puntaje={puntaje} onSelect={setPuntaje} />
            <Text style={styles.comentarioLabel}>Comentario (opcional)</Text>
            <TextInput
              style={styles.comentarioInput}
              value={comentario}
              onChangeText={setComentario}
              placeholder="Escribí un comentario sobre la clase..."
              placeholderTextColor="#777"
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
            <View style={styles.modalBtns}>
              <TouchableOpacity style={styles.modalBtnCancel} onPress={() => setRatingVisible(false)}>
                <Text style={{ fontFamily: Fonts.rubikMedium, color: Colors.blanco, fontSize: moderateScale(13) }}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalBtnEnviar} onPress={handleEnviarRating} disabled={enviandoRating}>
                {enviandoRating
                  ? <ActivityIndicator color={Colors.background} />
                  : <Text style={{ fontFamily: Fonts.spaceGroteskBold, color: Colors.background, fontSize: moderateScale(13) }}>Enviar</Text>
                }
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  loading: { flex: 1, backgroundColor: Colors.background, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: scale(24), paddingTop: verticalScale(50), paddingBottom: verticalScale(14),
    borderBottomWidth: 1, borderBottomColor: '#1e295d',
  },
  wiser: { fontFamily: Fonts.spaceGroteskBold, fontSize: moderateScale(22), color: '#3455ff' },
  scrollContent: { paddingHorizontal: scale(24), paddingTop: verticalScale(20), paddingBottom: verticalScale(100) },
  titulo: {
    fontFamily: Fonts.spaceGroteskBold, color: Colors.blanco, fontSize: moderateScale(16),
    letterSpacing: 1.5, textAlign: 'center', marginBottom: verticalScale(20),
  },
  datosCard: {
    backgroundColor: Colors.superficieA, borderRadius: 10, paddingHorizontal: scale(18),
    borderWidth: 1, borderColor: '#1e295d', marginBottom: verticalScale(20),
  },
  datoRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    paddingVertical: verticalScale(12), borderBottomWidth: 1, borderBottomColor: '#1e295d',
  },
  datoLabel: { fontFamily: Fonts.rubikMedium, color: '#aaa', fontSize: moderateScale(12), letterSpacing: 0.5 },
  datoVal: { fontFamily: Fonts.spaceGroteskBold, color: Colors.blanco, fontSize: moderateScale(13), textAlign: 'right' },
  profesorCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: Colors.superficieA, borderRadius: 8, padding: scale(14),
    borderWidth: 1, borderColor: '#1e295d', marginBottom: verticalScale(20),
  },
  avatarSmall: {
    width: scale(48), height: scale(48), borderRadius: scale(24),
    backgroundColor: Colors.superficieB, justifyContent: 'center', alignItems: 'center',
    overflow: 'hidden',
  },
  profesorNombre: { flex: 1, fontFamily: Fonts.rubikMedium, color: Colors.blanco, fontSize: moderateScale(14) },
  btnMensaje: {
    borderWidth: 1, borderColor: Colors.cian, borderRadius: 4,
    paddingVertical: 6, paddingHorizontal: 12,
  },
  btnMensajeText: { fontFamily: Fonts.spaceGroteskBold, color: Colors.cian, fontSize: moderateScale(10) },
  sectionLabel: {
    fontFamily: Fonts.spaceGroteskBold, color: '#aaa',
    fontSize: moderateScale(10), letterSpacing: 1.5,
    marginBottom: verticalScale(8),
  },
  comprobanteCard: {
    backgroundColor: Colors.superficieA, borderRadius: 10,
    borderWidth: 1, borderColor: Colors.cian, overflow: 'hidden',
  },
  comprobanteImg: {
    width: '100%', height: verticalScale(200),
  },
  comprobanteLegend: {
    fontFamily: Fonts.rubikRegular, color: '#8b93b8',
    fontSize: moderateScale(11), textAlign: 'center', paddingVertical: scale(8),
  },
  comprobantePendCard: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: Colors.superficieA, borderRadius: 8,
    borderWidth: 1, borderColor: '#ffb020', padding: scale(14),
    marginBottom: verticalScale(10),
  },
  comprobantePendText: {
    flex: 1, fontFamily: Fonts.rubikRegular, color: '#ffb020',
    fontSize: moderateScale(12),
  },
  btnSubirComp: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: Colors.cian, borderRadius: 8, paddingVertical: scale(12),
  },
  btnSubirCompText: {
    fontFamily: Fonts.spaceGroteskBold, color: Colors.background, fontSize: moderateScale(13),
  },
  btnCalificar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: '#FFD700', borderRadius: 8, paddingVertical: scale(14),
  },
  btnCalificarText: { fontFamily: Fonts.spaceGroteskBold, color: Colors.background, fontSize: moderateScale(13) },
  calificadoBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, justifyContent: 'center', marginTop: 8 },
  calificadoText: { fontFamily: Fonts.rubikMedium, color: '#4cd964', fontSize: moderateScale(12) },
  footer: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    padding: scale(20), backgroundColor: Colors.background, borderTopWidth: 1, borderTopColor: '#1e295d',
  },
  btnListo: {
    backgroundColor: Colors.superficieB, borderRadius: 8, paddingVertical: scale(14),
    alignItems: 'center', borderWidth: 1, borderColor: '#aaa',
  },
  btnListoText: { fontFamily: Fonts.spaceGroteskBold, color: Colors.blanco, fontSize: moderateScale(13), letterSpacing: 1 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.65)', justifyContent: 'center', alignItems: 'center', padding: scale(24) },
  modalContent: { backgroundColor: Colors.superficieA, borderRadius: 12, padding: scale(24), width: '100%', alignItems: 'center', borderWidth: 1, borderColor: '#1e295d' },
  modalTitle: { fontFamily: Fonts.spaceGroteskBold, color: Colors.blanco, fontSize: moderateScale(16), marginBottom: verticalScale(16) },
  comentarioLabel: { fontFamily: Fonts.rubikMedium, color: Colors.blanco, fontSize: moderateScale(12), alignSelf: 'flex-start', marginTop: verticalScale(16), marginBottom: 6 },
  comentarioInput: {
    width: '100%', backgroundColor: Colors.superficieB, borderRadius: 8,
    padding: scale(12), minHeight: verticalScale(70), borderWidth: 1, borderColor: '#1e295d',
    color: Colors.blanco, fontFamily: Fonts.rubikRegular, fontSize: moderateScale(13),
    marginBottom: verticalScale(16),
  },
  modalBtns: { flexDirection: 'row', gap: 10, width: '100%' },
  modalBtnCancel: {
    flex: 1, paddingVertical: scale(12), borderRadius: 8,
    backgroundColor: Colors.superficieB, alignItems: 'center', borderWidth: 1, borderColor: '#1e295d',
  },
  modalBtnEnviar: {
    flex: 1, paddingVertical: scale(12), borderRadius: 8, backgroundColor: Colors.cian, alignItems: 'center',
  },
});
