import { useEffect, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, Modal, Alert, ActivityIndicator
} from 'react-native';
import { useRouter } from 'expo-router';
import { scale, verticalScale, moderateScale } from 'react-native-size-matters';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { Fonts } from '../../constants/fonts';
import { obtenerMaterias, obtenerPerfilProfesor, actualizarPerfilProfesor } from '../../services/apiService';
import { useProfesor } from '../../hooks/use-profesor';

type Materia = { id: number; nombre: string; nivel: string };

export default function MiPerfil() {
  const router = useRouter();
  const { profesorId, loading: loadingUsuario } = useProfesor();

  const [loading, setLoading] = useState(true);
  const [guardando, setGuardando] = useState(false);

  const [titulo, setTitulo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [modalidad, setModalidad] = useState<'presencial' | 'Virtual' | 'hibrida'>('presencial');
  const [precioHora, setPrecioHora] = useState('');
  const [materiasSeleccionadas, setMateriasSeleccionadas] = useState<Materia[]>([]);
  const [disponibilidadesActuales, setDisponibilidadesActuales] = useState<{ diaSemana: string; turno: string }[]>([]);

  const [materiasDisponibles, setMateriasDisponibles] = useState<Materia[]>([]);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    const init = async () => {
      if (!profesorId) return;
      try {
        const [perfil, materias] = await Promise.all([
          obtenerPerfilProfesor(profesorId),
          obtenerMaterias(),
        ]);
        setTitulo(perfil.titulo || '');
        setDescripcion(perfil.descripcion || '');
        setModalidad(perfil.modalidad || 'presencial');
        setPrecioHora(perfil.precioHora ? String(perfil.precioHora) : '');
        setMateriasSeleccionadas(perfil.materias || []);
        setDisponibilidadesActuales(perfil.disponibilidades || []);
        setMateriasDisponibles(materias);
      } catch (err) {
        console.error(err);
        Alert.alert('Error', 'No se pudo cargar tu perfil.');
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [profesorId]);

  const toggleMateria = (materia: Materia) => {
    const yaSeleccionada = materiasSeleccionadas.some(m => m.id === materia.id);
    if (yaSeleccionada) {
      setMateriasSeleccionadas(materiasSeleccionadas.filter(m => m.id !== materia.id));
    } else {
      setMateriasSeleccionadas([...materiasSeleccionadas, materia]);
    }
  };

  const handleGuardar = async () => {
    if (!profesorId) return;
    if (materiasSeleccionadas.length === 0) {
      Alert.alert('Faltan datos', 'Seleccioná al menos una materia.');
      return;
    }
    setGuardando(true);
    try {
      const perfilActual = await obtenerPerfilProfesor(profesorId);
      const cleanPrice = precioHora.replace(/[^0-9]/g, '');

      await actualizarPerfilProfesor(profesorId, {
        nombre: perfilActual.nombre,
        apellido: perfilActual.apellido,
        fotoPerfil: perfilActual.fotoPerfil,
        titulo,
        descripcion,
        modalidad,
        precioHora: parseFloat(cleanPrice) || 0,
        zona: perfilActual.zona,
        latitud: perfilActual.latitud,
        longitud: perfilActual.longitud,
        materiaIds: materiasSeleccionadas.map(m => m.id),
        disponibilidades: disponibilidadesActuales,
      });

      Alert.alert('Listo', 'Tu perfil se actualizó correctamente.', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (err: any) {
      console.error(err);
      Alert.alert('Error', err.message || 'No se pudo guardar el perfil.');
    } finally {
      setGuardando(false);
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
        <Text style={styles.headerTitle}>Modifica tu perfil</Text>
        <View style={{ width: 24 }} />
      </View>

      <Text style={styles.label}>Título:</Text>
      <TextInput
        style={styles.input}
        placeholder="Ej: Profesor de Matemática"
        placeholderTextColor="#aaa"
        value={titulo}
        onChangeText={setTitulo}
      />

      <Text style={styles.label}>Sobre mí:</Text>
      <TextInput
        style={[styles.input, styles.textArea]}
        placeholder="Contales a tus alumnos sobre tu experiencia"
        placeholderTextColor="#aaa"
        value={descripcion}
        onChangeText={setDescripcion}
        multiline
      />

      <Text style={styles.label}>Materias a enseñar:</Text>
      <View style={styles.materiasContainer}>
        {materiasSeleccionadas.map((m) => (
          <View key={m.id} style={styles.materiaBadge}>
            <Text style={styles.materiaBadgeText}>{m.nombre} ({m.nivel})</Text>
            <TouchableOpacity onPress={() => toggleMateria(m)}>
              <Ionicons name="close-circle" size={16} color={Colors.cian} style={{ marginLeft: 6 }} />
            </TouchableOpacity>
          </View>
        ))}
        <TouchableOpacity style={styles.btnAddMateria} onPress={() => setModalOpen(true)}>
          <Ionicons name="add" size={16} color={Colors.background} />
          <Text style={styles.btnAddMateriaText}>Agregar materias</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.label}>Modalidad:</Text>
      <View style={styles.rowContainer}>
        {(['Virtual', 'presencial', 'hibrida'] as const).map((mod) => (
          <TouchableOpacity
            key={mod}
            style={[styles.modalidadOption, modalidad === mod && styles.modalidadOptionActiva]}
            onPress={() => setModalidad(mod)}
          >
            <Text style={[styles.modalidadOptionText, modalidad === mod && styles.modalidadOptionTextActiva]}>
              {mod === 'Virtual' ? 'Virtual' : mod === 'presencial' ? 'Presencial' : 'Híbrida'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>Precio por hora:</Text>
      <TextInput
        style={styles.input}
        keyboardType="numeric"
        placeholder="$5000"
        placeholderTextColor="#aaa"
        value={precioHora}
        onChangeText={setPrecioHora}
      />

      <TouchableOpacity style={styles.btnListo} onPress={handleGuardar} disabled={guardando}>
        {guardando ? (
          <ActivityIndicator color={Colors.background} />
        ) : (
          <Text style={styles.btnListoText}>Listo</Text>
        )}
      </TouchableOpacity>

      <Modal visible={modalOpen} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Seleccioná materias</Text>
            <ScrollView contentContainerStyle={styles.modalGrid}>
              {materiasDisponibles.map((m) => {
                const isSelected = materiasSeleccionadas.some(sel => sel.id === m.id);
                return (
                  <TouchableOpacity
                    key={m.id}
                    style={[styles.modalCard, isSelected && styles.modalCardActive]}
                    onPress={() => toggleMateria(m)}
                  >
                    <Text style={[styles.modalCardText, isSelected && styles.modalCardTextActive]}>
                      {m.nombre} ({m.nivel})
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
            <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setModalOpen(false)}>
              <Text style={styles.modalCloseBtnText}>Aceptar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
    paddingBottom: verticalScale(40),
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
    marginBottom: verticalScale(24),
  },
  headerTitle: {
    fontFamily: Fonts.spaceGroteskBold,
    color: Colors.blanco,
    fontSize: moderateScale(16),
  },
  label: {
    fontFamily: Fonts.rubikMedium,
    color: Colors.blanco,
    fontSize: moderateScale(13),
    marginBottom: verticalScale(8),
    marginTop: verticalScale(16),
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
  textArea: {
    minHeight: verticalScale(90),
    textAlignVertical: 'top',
  },
  materiasContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.superficieA,
    borderRadius: 8,
    padding: scale(12),
    borderWidth: 1,
    borderColor: '#1e295d',
  },
  materiaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.superficieB,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.cian,
  },
  materiaBadgeText: {
    fontFamily: Fonts.rubikRegular,
    color: Colors.blanco,
    fontSize: moderateScale(12),
  },
  btnAddMateria: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.cian,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  btnAddMateriaText: {
    fontFamily: Fonts.rubikMedium,
    color: Colors.background,
    fontSize: moderateScale(12),
    marginLeft: 4,
  },
  rowContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  modalidadOption: {
    flex: 1,
    paddingVertical: scale(10),
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#1e295d',
    backgroundColor: Colors.superficieA,
    alignItems: 'center',
  },
  modalidadOptionActiva: {
    backgroundColor: Colors.cian,
    borderColor: Colors.cian,
  },
  modalidadOptionText: {
    fontFamily: Fonts.rubikMedium,
    color: Colors.blanco,
    fontSize: moderateScale(12),
  },
  modalidadOptionTextActiva: {
    color: Colors.background,
  },
  btnListo: {
    backgroundColor: '#4cd964',
    borderRadius: 8,
    paddingVertical: scale(16),
    alignItems: 'center',
    marginTop: verticalScale(30),
  },
  btnListoText: {
    fontFamily: Fonts.spaceGroteskBold,
    color: Colors.background,
    fontSize: moderateScale(15),
    fontWeight: 'bold',
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
    alignItems: 'center',
  },
  modalTitle: {
    fontFamily: Fonts.spaceGroteskBold,
    color: Colors.blanco,
    fontSize: moderateScale(18),
    marginBottom: verticalScale(16),
  },
  modalGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: scale(12),
    paddingBottom: 20,
  },
  modalCard: {
    width: '45%',
    paddingVertical: scale(14),
    backgroundColor: Colors.superficieB,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  modalCardActive: {
    borderColor: Colors.cian,
  },
  modalCardText: {
    fontFamily: Fonts.rubikMedium,
    color: Colors.blanco,
    fontSize: moderateScale(13),
    textAlign: 'center',
  },
  modalCardTextActive: {
    color: Colors.cian,
  },
  modalCloseBtn: {
    backgroundColor: Colors.cian,
    borderRadius: 20,
    paddingVertical: scale(10),
    paddingHorizontal: scale(30),
    marginTop: 10,
  },
  modalCloseBtnText: {
    fontFamily: Fonts.spaceGroteskBold,
    color: Colors.background,
    fontSize: moderateScale(13),
  },
});
