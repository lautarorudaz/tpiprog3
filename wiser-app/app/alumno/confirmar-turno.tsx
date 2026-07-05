import { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Alert, ActivityIndicator, Modal
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { scale, verticalScale, moderateScale } from 'react-native-size-matters';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Colors } from '../../constants/colors';
import { Fonts } from '../../constants/fonts';
import { crearTurno, subirComprobante, obtenerDatosBancariosProfesor } from '../../services/apiService';
import { TURNOS } from '../../components/disponibilidad-grid';

type MetodoPago = 'transferencia' | 'efectivo';

function formatFecha(iso: string) {
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

export default function ConfirmarTurno() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    profesorId: string; profesorNombre: string; alumnoId: string;
    materiaId: string; materiaNombre: string; fecha: string;
    turnoHorario: string; precioHora: string; modalidad: string;
  }>();

  // Opciones de modalidad válidas según lo que ofrece el profesor
  const opcionesModalidad: ('Virtual' | 'presencial')[] = (() => {
    if (params.modalidad === 'Virtual') return ['Virtual'];
    if (params.modalidad === 'presencial') return ['presencial'];
    return ['Virtual', 'presencial']; // hibrida → ambas
  })();

  const [modalidad, setModalidad] = useState<'Virtual' | 'presencial'>(opcionesModalidad[0]);
  const [metodoPago, setMetodoPago] = useState<MetodoPago>('transferencia');
  const [datosBancarios, setDatosBancarios] = useState<any>(null);
  const [loadingDatos, setLoadingDatos] = useState(false);
  const [turnoCreado, setTurnoCreado] = useState<number | null>(null);
  const [confirmando, setConfirmando] = useState(false);
  const [modalComprobanteVisible, setModalComprobanteVisible] = useState(false);
  const [subiendoComp, setSubiendoComp] = useState(false);

  const labelTurno = TURNOS.find(t => t.key === params.turnoHorario)?.rango || params.turnoHorario;
  const total = parseFloat(params.precioHora || '0');

  const handleMetodoPago = async (metodo: MetodoPago) => {
    setMetodoPago(metodo);
    if (metodo === 'transferencia' && !datosBancarios) {
      setLoadingDatos(true);
      try {
        const datos = await obtenerDatosBancariosProfesor(Number(params.profesorId));
        setDatosBancarios(datos);
      } catch {
        setDatosBancarios(null);
      } finally {
        setLoadingDatos(false);
      }
    }
  };

  const handleConfirmar = async () => {
    setConfirmando(true);
    try {
      const result = await crearTurno({
        profesorId: Number(params.profesorId),
        alumnoId: Number(params.alumnoId),
        materiaId: Number(params.materiaId),
        fecha: params.fecha,
        turnoHorario: params.turnoHorario,
        modalidad: modalidad,
        metodoPago: metodoPago,
      });
      setTurnoCreado(result.id);

      if (metodoPago === 'transferencia') {
        setModalComprobanteVisible(true);
      } else {
        Alert.alert('Clase solicitada ✓', 'Tu solicitud fue enviada. El profesor va a confirmarla.', [
          { text: 'OK', onPress: () => router.replace('/alumno/mis-turnos') }
        ]);
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'No se pudo crear el turno.');
    } finally {
      setConfirmando(false);
    }
  };

  const handleSubirComprobante = async () => {
    if (!turnoCreado) return;
    setSubiendoComp(true);
    try {
      // Let user pick an image from gallery
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        Alert.alert('Permiso requerido', 'Necesitamos acceso a tus fotos.');
        setSubiendoComp(false);
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'], quality: 0.7, base64: true,
      });
      if (result.canceled || !result.assets[0]?.base64) {
        setSubiendoComp(false);
        return;
      }
      const dataUri = `data:image/jpeg;base64,${result.assets[0].base64}`;
      await subirComprobante(turnoCreado, dataUri);
      setModalComprobanteVisible(false);
      Alert.alert('Comprobante enviado ✓', 'El profesor va a revisar tu pago y confirmar la clase.', [
        { text: 'OK', onPress: () => router.replace('/alumno/mis-turnos') }
      ]);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'No se pudo subir el comprobante.');
    } finally {
      setSubiendoComp(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Progress header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={22} color={Colors.blanco} />
        </TouchableOpacity>
        <View style={styles.steps}>
          <View style={styles.step}>
            <View style={[styles.stepCircle, styles.stepDone]}>
              <Ionicons name="checkmark" size={14} color={Colors.background} />
            </View>
            <Text style={[styles.stepLabel, { color: '#8b93b8' }]}>FECHA Y HORA</Text>
          </View>
          <View style={styles.stepLine} />
          <View style={styles.step}>
            <View style={[styles.stepCircle, styles.stepActivo]}><Text style={styles.stepNum}>2</Text></View>
            <Text style={styles.stepLabel}>CONFIRMAR</Text>
          </View>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Modalidad */}
        <Text style={styles.sectionLabel}>Elige una modalidad</Text>
        <View style={styles.modalidadRow}>
          {opcionesModalidad.map(mod => (
            <TouchableOpacity
              key={mod}
              style={styles.radioOption}
              onPress={() => setModalidad(mod)}
            >
              <View style={[styles.radioCircle, modalidad === mod && styles.radioCircleActivo]}>
                {modalidad === mod && <View style={styles.radioDot} />}
              </View>
              <Text style={styles.radioText}>{mod === 'Virtual' ? 'Virtual' : 'Presencial'}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Resumen del turno */}
        <View style={styles.resumenCard}>
          <Text style={styles.resumenTitle}>RESUMEN DEL TURNO</Text>
          <View style={styles.resumenRow}>
            <Text style={styles.resumenKey}>Profesor</Text>
            <Text style={styles.resumenVal}>{params.profesorNombre}</Text>
          </View>
          <View style={styles.resumenRow}>
            <Text style={styles.resumenKey}>Fecha</Text>
            <Text style={styles.resumenVal}>{formatFecha(params.fecha)}</Text>
          </View>
          <View style={styles.resumenRow}>
            <Text style={styles.resumenKey}>Horario</Text>
            <Text style={styles.resumenVal}>{labelTurno}</Text>
          </View>
          <View style={styles.resumenRow}>
            <Text style={styles.resumenKey}>Modalidad</Text>
            <Text style={styles.resumenVal}>{modalidad === 'Virtual' ? 'Virtual' : 'Presencial'}</Text>
          </View>
          <View style={[styles.resumenRow, styles.resumenRowTotal]}>
            <Text style={styles.resumenKeyTotal}>Total</Text>
            <Text style={styles.resumenValTotal}>${total.toLocaleString('es-AR')}</Text>
          </View>
        </View>

        {/* Método de pago */}
        <Text style={styles.sectionLabel}>Método de Pago</Text>
        <TouchableOpacity
          style={[styles.pagoOption, metodoPago === 'transferencia' && styles.pagoOptionActivo]}
          onPress={() => handleMetodoPago('transferencia')}
        >
          <View style={[styles.pagoRadio, metodoPago === 'transferencia' && styles.pagoRadioActivo]}>
            {metodoPago === 'transferencia' && <View style={styles.pagoRadioDot} />}
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.pagoTitulo}>Transferencia bancaria</Text>
            <Text style={styles.pagoSubtitulo}>Pagá antes de la sesión y enviá el comprobante</Text>
          </View>
        </TouchableOpacity>

        {metodoPago === 'transferencia' && (
          <View style={styles.datosBancariosCard}>
            {loadingDatos ? (
              <ActivityIndicator color={Colors.cian} />
            ) : datosBancarios ? (
              <>
                <Text style={styles.datosTitle}>Datos bancarios del profesor</Text>
                {datosBancarios.cbu && <Text style={styles.datoRow}>CBU: {datosBancarios.cbu}</Text>}
                {datosBancarios.alias && <Text style={styles.datoRow}>Alias: {datosBancarios.alias}</Text>}
                {datosBancarios.banco && <Text style={styles.datoRow}>Banco: {datosBancarios.banco}</Text>}
                {datosBancarios.titular && <Text style={styles.datoRow}>Titular: {datosBancarios.titular}</Text>}
              </>
            ) : (
              <Text style={styles.datoRow}>El profesor no cargó sus datos bancarios. Podés pagarle en efectivo en la clase.</Text>
            )}
          </View>
        )}

        <TouchableOpacity
          style={[styles.pagoOption, metodoPago === 'efectivo' && styles.pagoOptionActivo]}
          onPress={() => handleMetodoPago('efectivo')}
        >
          <View style={[styles.pagoRadio, metodoPago === 'efectivo' && styles.pagoRadioActivo]}>
            {metodoPago === 'efectivo' && <View style={styles.pagoRadioDot} />}
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.pagoTitulo}>Efectivo</Text>
            <Text style={styles.pagoSubtitulo}>Abonás al inicio de la sesión, en el lugar</Text>
          </View>
        </TouchableOpacity>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.btnConfirmar} onPress={handleConfirmar} disabled={confirmando}>
          {confirmando ? (
            <ActivityIndicator color={Colors.background} />
          ) : (
            <Text style={styles.btnConfirmarText}>CONFIRMAR TURNO</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Modal comprobante */}
      <Modal visible={modalComprobanteVisible} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Ionicons name="document-outline" size={scale(48)} color="#aaa" />
            <Text style={styles.modalText}>
              Descargá el comprobante de la transacción y cargalo para que el sistema valide que abonaste la clase
            </Text>
            <TouchableOpacity style={styles.btnSubir} onPress={handleSubirComprobante} disabled={subiendoComp}>
              {subiendoComp ? (
                <ActivityIndicator color={Colors.background} />
              ) : (
                <Text style={styles.btnSubirText}>Cargar Comprobante</Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity style={{ marginTop: 12 }} onPress={() => {
              setModalComprobanteVisible(false);
              router.replace('/alumno/mis-turnos');
            }}>
              <Text style={{ color: '#aaa', fontFamily: Fonts.rubikRegular, fontSize: moderateScale(12) }}>
                Cargar después
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
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
  stepDone: { borderColor: '#4cd964', backgroundColor: '#4cd964' },
  stepNum: { fontFamily: Fonts.spaceGroteskBold, color: Colors.background, fontSize: moderateScale(11) },
  stepLabel: { fontFamily: Fonts.rubikMedium, color: Colors.blanco, fontSize: moderateScale(9), letterSpacing: 0.5 },
  stepLine: { flex: 1, height: 1, backgroundColor: '#1e295d', marginHorizontal: 8, marginBottom: 16 },
  scrollContent: { padding: scale(24), paddingBottom: verticalScale(110) },
  sectionLabel: {
    fontFamily: Fonts.spaceGroteskBold, color: Colors.blanco, fontSize: moderateScale(13),
    marginBottom: verticalScale(12), marginTop: verticalScale(8),
  },
  modalidadRow: { flexDirection: 'row', gap: 20, marginBottom: verticalScale(20) },
  radioOption: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  radioCircle: {
    width: scale(18), height: scale(18), borderRadius: scale(9),
    borderWidth: 2, borderColor: '#8b93b8', justifyContent: 'center', alignItems: 'center',
  },
  radioCircleActivo: { borderColor: Colors.cian },
  radioDot: { width: scale(8), height: scale(8), borderRadius: scale(4), backgroundColor: Colors.cian },
  radioText: { fontFamily: Fonts.rubikMedium, color: Colors.blanco, fontSize: moderateScale(13) },
  resumenCard: {
    backgroundColor: Colors.superficieA, borderRadius: 8, padding: scale(16),
    borderWidth: 1, borderColor: Colors.cian, marginBottom: verticalScale(20),
  },
  resumenTitle: {
    fontFamily: Fonts.spaceGroteskBold, color: '#8b93b8', fontSize: moderateScale(10),
    letterSpacing: 1.5, marginBottom: verticalScale(12),
  },
  resumenRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: verticalScale(8) },
  resumenKey: { fontFamily: Fonts.rubikRegular, color: '#aaa', fontSize: moderateScale(12) },
  resumenVal: { fontFamily: Fonts.rubikMedium, color: Colors.blanco, fontSize: moderateScale(12) },
  resumenRowTotal: { marginTop: verticalScale(8), paddingTop: verticalScale(8), borderTopWidth: 1, borderTopColor: '#1e295d' },
  resumenKeyTotal: { fontFamily: Fonts.spaceGroteskBold, color: Colors.blanco, fontSize: moderateScale(14) },
  resumenValTotal: { fontFamily: Fonts.spaceGroteskBold, color: Colors.cian, fontSize: moderateScale(16) },
  pagoOption: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: Colors.superficieA, borderRadius: 8, padding: scale(14),
    marginBottom: verticalScale(12), borderWidth: 1, borderColor: '#1e295d',
  },
  pagoOptionActivo: { borderColor: '#4cd964' },
  pagoRadio: {
    width: scale(18), height: scale(18), borderRadius: scale(9),
    borderWidth: 2, borderColor: '#8b93b8', justifyContent: 'center', alignItems: 'center',
  },
  pagoRadioActivo: { borderColor: '#4cd964' },
  pagoRadioDot: { width: scale(8), height: scale(8), borderRadius: scale(4), backgroundColor: '#4cd964' },
  pagoTitulo: { fontFamily: Fonts.rubikMedium, color: Colors.blanco, fontSize: moderateScale(13) },
  pagoSubtitulo: { fontFamily: Fonts.rubikRegular, color: '#aaa', fontSize: moderateScale(11), marginTop: 3 },
  datosBancariosCard: {
    backgroundColor: Colors.superficieB, borderRadius: 8, padding: scale(14),
    marginBottom: verticalScale(12), borderWidth: 1, borderColor: '#1e295d',
  },
  datosTitle: { fontFamily: Fonts.spaceGroteskBold, color: Colors.cian, fontSize: moderateScale(12), marginBottom: 8 },
  datoRow: { fontFamily: Fonts.rubikRegular, color: Colors.blanco, fontSize: moderateScale(12), marginBottom: 4 },
  footer: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    padding: scale(20), backgroundColor: Colors.background, borderTopWidth: 1, borderTopColor: '#1e295d',
  },
  btnConfirmar: {
    backgroundColor: '#162b4e', borderRadius: 8, paddingVertical: scale(16),
    alignItems: 'center', borderWidth: 1, borderColor: Colors.blanco,
  },
  btnConfirmarText: { fontFamily: Fonts.spaceGroteskBold, color: Colors.blanco, fontSize: moderateScale(13), letterSpacing: 1 },
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.65)', justifyContent: 'center', alignItems: 'center', padding: scale(28),
  },
  modalContent: {
    backgroundColor: Colors.superficieA, borderRadius: 12, padding: scale(24),
    alignItems: 'center', width: '100%',
  },
  modalText: {
    fontFamily: Fonts.rubikRegular, color: '#ccc', fontSize: moderateScale(13),
    textAlign: 'center', marginTop: verticalScale(14), marginBottom: verticalScale(20), lineHeight: moderateScale(20),
  },
  btnSubir: {
    backgroundColor: Colors.superficieB, borderRadius: 8, paddingVertical: scale(12),
    paddingHorizontal: scale(24), borderWidth: 1, borderColor: Colors.blanco,
  },
  btnSubirText: { fontFamily: Fonts.spaceGroteskBold, color: Colors.blanco, fontSize: moderateScale(13) },
});
