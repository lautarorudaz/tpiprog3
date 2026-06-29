import { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ScrollView, Modal, Alert, ActivityIndicator, Image
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { scale, verticalScale, moderateScale } from 'react-native-size-matters';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { Fonts } from '../../constants/fonts';
import { obtenerMaterias, actualizarPerfilProfesor, obtenerUsuarioPorFirebase } from '../../services/apiService';
import { auth } from '../../services/firebase';

const DAYS = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'];
const DAY_LABELS: { [key: string]: string } = {
  lunes: 'LUN',
  martes: 'MAR',
  miercoles: 'MIE',
  jueves: 'JUE',
  viernes: 'VIE',
  sabado: 'SAB',
  domingo: 'DOM'
};

const TURNS = [
  { id: 'manana', label: '9hs A 12hs', hours: ['09:00', '10:00', '11:00', '12:00'] },
  { id: 'tarde', label: '13hs A 17hs', hours: ['13:00', '14:00', '15:00', '16:00', '17:00'] },
  { id: 'noche', label: '18hs A 22hs', hours: ['18:00', '19:00', '20:00', '21:00', '22:00'] }
];

export default function ProfesorSetupProfile() {
  const router = useRouter();
  const { firebaseUid } = useLocalSearchParams<{ firebaseUid: string }>();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [loading, setLoading] = useState(true);
  const [profesorId, setProfesorId] = useState<number | null>(null);

  // Database models list
  const [materiasDisponibles, setMateriasDisponibles] = useState<any[]>([]);

  // Step 1 State
  const [nombreCompleto, setNombreCompleto] = useState('');
  const [lugarDictado, setLugarDictado] = useState('');
  const [fotoPerfil, setFotoPerfil] = useState<string | null>(null);

  // Step 2 State
  const [modalMateriasOpen, setModalMateriasOpen] = useState(false);
  const [selectedMateriaNames, setSelectedMateriaNames] = useState<string[]>([]);
  const [selectedModalidad, setSelectedModalidad] = useState<'presencial' | 'Virtual' | 'hibrida'>('presencial');
  const [selectedNiveles, setSelectedNiveles] = useState({
    primario: true,
    secundario: true,
    universitario: false, // "Avanzado" in UI maps to "universitario"
  });
  const [precioHora, setPrecioHora] = useState('');

  // Step 3 State
  const [currentTurnIndex, setCurrentTurnIndex] = useState(0); // 0: manana, 1: tarde, 2: noche
  // Detailed slots availability tracking: { [day]: { [hour]: boolean } }
  const [selectedSlots, setSelectedSlots] = useState<{ [day: string]: { [hour: string]: boolean } }>(() => {
    const initial: any = {};
    DAYS.forEach(day => {
      initial[day] = {};
    });
    return initial;
  });

  // Fetch initial profile and subjects
  useEffect(() => {
    const init = async () => {
      try {
        const uid = firebaseUid || auth.currentUser?.uid;
        if (!uid) {
          Alert.alert('Error', 'Usuario no autenticado.');
          router.replace('/');
          return;
        }

        const userObj = await obtenerUsuarioPorFirebase(uid);
        if (userObj && userObj.profesor) {
          setProfesorId(userObj.profesor.id);
          setNombreCompleto(`${userObj.nombre} ${userObj.apellido}`.trim());
          if (userObj.profesor.zona) setLugarDictado(userObj.profesor.zona);
          if (userObj.fotoPerfil) setFotoPerfil(userObj.fotoPerfil);
        }

        const mats = await obtenerMaterias();
        setMateriasDisponibles(mats);
      } catch (err: any) {
        console.error(err);
        Alert.alert('Error', 'No se pudieron cargar los datos de inicio.');
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [firebaseUid]);

  // Unique subject names for the modal selection list
  const uniqueSubjectNames = Array.from(new Set(materiasDisponibles.map(m => m.nombre)));

  const handleNextStep1 = () => {
    if (!nombreCompleto.trim()) {
      Alert.alert('Completá tus datos', 'Por favor ingresá tu nombre y apellido.');
      return;
    }
    if (!lugarDictado.trim()) {
      Alert.alert('Completá tus datos', 'Por favor ingresá el lugar de dictado.');
      return;
    }
    setStep(2);
  };

  const handleNextStep2 = () => {
    if (selectedMateriaNames.length === 0) {
      Alert.alert('Preferencias', 'Por favor seleccioná al menos una materia.');
      return;
    }
    if (!precioHora.trim()) {
      Alert.alert('Preferencias', 'Por favor ingresá tu precio por hora.');
      return;
    }
    setStep(3);
  };

  const toggleSubjectInModal = (name: string) => {
    if (selectedMateriaNames.includes(name)) {
      setSelectedMateriaNames(selectedMateriaNames.filter(n => n !== name));
    } else {
      setSelectedMateriaNames([...selectedMateriaNames, name]);
    }
  };

  const toggleSlot = (day: string, hour: string) => {
    setSelectedSlots(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        [hour]: !prev[day]?.[hour]
      }
    }));
  };

  const handleGuardarCambios = async () => {
    if (!profesorId) return;
    setLoading(true);

    try {
      // 1. Map Subject Names + Level checkboxes to database Materia IDs
      const mappedMateriaIds: number[] = [];
      selectedMateriaNames.forEach(subjectName => {
        if (selectedNiveles.primario) {
          const mat = materiasDisponibles.find(m => m.nombre === subjectName && m.nivel === 'primario');
          if (mat) mappedMateriaIds.push(mat.id);
        }
        if (selectedNiveles.secundario) {
          const mat = materiasDisponibles.find(m => m.nombre === subjectName && m.nivel === 'secundario');
          if (mat) mappedMateriaIds.push(mat.id);
        }
        if (selectedNiveles.universitario) {
          const mat = materiasDisponibles.find(m => m.nombre === subjectName && m.nivel === 'universitario');
          if (mat) mappedMateriaIds.push(mat.id);
        }
      });

      // 2. Map Hour slots selection to simple Turno availability (manana, tarde, noche) for each day
      const disponibilidadesPayload: { diaSemana: string; turno: string }[] = [];
      DAYS.forEach(day => {
        const slotsForDay = selectedSlots[day] || {};
        
        // If any of the morning hours are selected, mark 'manana' as available
        const morningHours = TURNS[0].hours;
        if (morningHours.some(h => slotsForDay[h])) {
          disponibilidadesPayload.push({ diaSemana: day, turno: 'manana' });
        }
        
        // If any of the afternoon hours are selected, mark 'tarde' as available
        const afternoonHours = TURNS[1].hours;
        if (afternoonHours.some(h => slotsForDay[h])) {
          disponibilidadesPayload.push({ diaSemana: day, turno: 'tarde' });
        }
        
        // If any of the night hours are selected, mark 'noche' as available
        const nightHours = TURNS[2].hours;
        if (nightHours.some(h => slotsForDay[h])) {
          disponibilidadesPayload.push({ diaSemana: day, turno: 'noche' });
        }
      });

      // Split name
      const nameParts = nombreCompleto.trim().split(' ');
      const nombre = nameParts[0] || '';
      const apellido = nameParts.slice(1).join(' ') || '';

      // Clean price string (e.g. Remove $ or dots/commas)
      const cleanPrice = precioHora.replace(/[^0-9]/g, '');

      const payload = {
        nombre,
        apellido,
        fotoPerfil: fotoPerfil,
        descripcion: "Profesor de Wiser",
        modalidad: selectedModalidad,
        precioHora: parseFloat(cleanPrice) || 0,
        zona: lugarDictado,
        latitud: null,
        longitud: null,
        materiaIds: mappedMateriaIds,
        disponibilidades: disponibilidadesPayload
      };

      await actualizarPerfilProfesor(profesorId, payload);

      router.replace({
        pathname: '/profesor/dashboard',
        params: { firebaseUid }
      });
    } catch (err: any) {
      console.error(err);
      Alert.alert('Error', err.message || 'No se pudo guardar el perfil.');
    } finally {
      setLoading(false);
    }
  };

  const handlePrevTurn = () => {
    setCurrentTurnIndex(prev => (prev === 0 ? TURNS.length - 1 : prev - 1));
  };

  const handleNextTurn = () => {
    setCurrentTurnIndex(prev => (prev === TURNS.length - 1 ? 0 : prev + 1));
  };

  if (loading && step === 1) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.cian} />
      </View>
    );
  }

  const currentTurn = TURNS[currentTurnIndex];

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer} style={styles.container}>
      {/* STEP 1: DATOS PERSONALES */}
      {step === 1 && (
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.wiser}>Wiser</Text>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>PROFESIONAL</Text>
            </View>
          </View>

          <Text style={styles.subtitle}>
            Los siguientes datos son los que percibirán los alumnos
          </Text>

          {/* Profile photo container */}
          <View style={styles.avatarContainer}>
            <View style={styles.avatarBorder}>
              {fotoPerfil ? (
                <Image source={{ uri: fotoPerfil }} style={styles.avatarImage} />
              ) : (
                <Ionicons name="person-outline" size={scale(64)} color="#aaa" />
              )}
            </View>
            <TouchableOpacity onPress={() => Alert.alert('Foto', 'Funcionalidad de carga próximamente.')} style={styles.photoButton}>
              <Text style={styles.photoButtonText}>Carga tu foto de perfil</Text>
            </TouchableOpacity>
          </View>

          {/* Form */}
          <View style={styles.form}>
            <Text style={styles.label}>Nombre y apellido</Text>
            <TextInput
              style={styles.input}
              placeholder="Ingresa tu nombre"
              placeholderTextColor="#aaa"
              value={nombreCompleto}
              onChangeText={setNombreCompleto}
            />

            <Text style={styles.label}>Lugar de dictado</Text>
            <View style={styles.inputIconContainer}>
              <Ionicons name="location-outline" size={20} color={Colors.cian} style={styles.inputIcon} />
              <TextInput
                style={styles.inputWithIcon}
                placeholder="Zona UTN, Resistencia"
                placeholderTextColor="#aaa"
                value={lugarDictado}
                onChangeText={setLugarDictado}
              />
            </View>

            <TouchableOpacity style={styles.btnContinuar} onPress={handleNextStep1}>
              <Text style={styles.btnContinuarText}>Continuar</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* STEP 2: PREFERENCIAS (MATERIAS, MODALIDAD, NIVEL, PRECIO) */}
      {step === 2 && (
        <View style={styles.content}>
          <Text style={styles.wiserCenter}>Wiser</Text>
          <Text style={styles.stepTitle}>RELLENA CON TUS PREFERENCIAS</Text>

          {/* Subject selector */}
          <Text style={styles.sectionLabel}>Selecciona materias que dicta</Text>
          <View style={styles.materiasBadgeContainer}>
            {selectedMateriaNames.map((name) => (
              <View key={name} style={styles.materiaBadge}>
                <Text style={styles.materiaBadgeText}>{name}</Text>
                <TouchableOpacity onPress={() => toggleSubjectInModal(name)}>
                  <Ionicons name="close-circle" size={16} color={Colors.cian} style={{ marginLeft: 6 }} />
                </TouchableOpacity>
              </View>
            ))}
            <TouchableOpacity style={styles.btnAddMateria} onPress={() => setModalMateriasOpen(true)}>
              <Ionicons name="add" size={16} color={Colors.background} />
              <Text style={styles.btnAddMateriaText}>Agregar materias</Text>
            </TouchableOpacity>
          </View>

          {/* Modality selector */}
          <Text style={styles.sectionLabel}>Selecciona la/s modalidad/es</Text>
          <View style={styles.rowContainer}>
            {(['Virtual', 'presencial', 'hibrida'] as const).map((mod) => (
              <TouchableOpacity
                key={mod}
                style={styles.radioOption}
                onPress={() => setSelectedModalidad(mod)}
              >
                <View style={styles.radioOutline}>
                  {selectedModalidad === mod && <View style={styles.radioDot} />}
                </View>
                <Text style={styles.radioText}>
                  {mod === 'Virtual' ? 'Virtual' : mod === 'presencial' ? 'Presencial' : 'Hibrida'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Level selector */}
          <Text style={styles.sectionLabel}>Selecciona nivel</Text>
          <View style={styles.rowContainer}>
            <TouchableOpacity
              style={styles.checkboxOption}
              onPress={() => setSelectedNiveles({ ...selectedNiveles, primario: !selectedNiveles.primario })}
            >
              <Ionicons
                name={selectedNiveles.primario ? "checkbox" : "square-outline"}
                size={20}
                color={Colors.cian}
              />
              <Text style={styles.checkboxText}>Primario</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.checkboxOption}
              onPress={() => setSelectedNiveles({ ...selectedNiveles, secundario: !selectedNiveles.secundario })}
            >
              <Ionicons
                name={selectedNiveles.secundario ? "checkbox" : "square-outline"}
                size={20}
                color={Colors.cian}
              />
              <Text style={styles.checkboxText}>Secundario</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.checkboxOption}
              onPress={() => setSelectedNiveles({ ...selectedNiveles, universitario: !selectedNiveles.universitario })}
            >
              <Ionicons
                name={selectedNiveles.universitario ? "checkbox" : "square-outline"}
                size={20}
                color={Colors.cian}
              />
              <Text style={styles.checkboxText}>Avanzado</Text>
            </TouchableOpacity>
          </View>

          {/* Price selector */}
          <Text style={styles.sectionLabel}>Precio por hora</Text>
          <TextInput
            style={styles.priceInput}
            keyboardType="numeric"
            placeholder="$8.000"
            placeholderTextColor="#aaa"
            value={precioHora}
            onChangeText={setPrecioHora}
          />

          <TouchableOpacity style={styles.btnContinuarPill} onPress={handleNextStep2}>
            <Text style={styles.btnContinuarPillText}>CONTINUAR</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* STEP 3: HORARIOS */}
      {step === 3 && (
        <View style={styles.content}>
          <Text style={styles.wiserCenter}>Wiser</Text>
          <Text style={styles.stepTitle}>RELLENA CON TUS PREFERENCIAS</Text>

          {/* Week & Turn selection header */}
          <View style={styles.availabilityHeaders}>
            <View style={styles.availabilityHeaderCol}>
              <Text style={styles.availabilityHeaderTitle}>SEMANA</Text>
              <Text style={styles.availabilityHeaderSubtitle}>Actual</Text>
            </View>

            <View style={styles.availabilityHeaderCol}>
              <Text style={styles.availabilityHeaderTitle}>HORARIOS</Text>
              <View style={styles.turnSelectorRow}>
                <TouchableOpacity onPress={handlePrevTurn}>
                  <Ionicons name="chevron-back" size={16} color={Colors.cian} />
                </TouchableOpacity>
                <Text style={styles.turnSelectorLabel}>{currentTurn.label}</Text>
                <TouchableOpacity onPress={handleNextTurn}>
                  <Ionicons name="chevron-forward" size={16} color={Colors.cian} />
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Availability Grid */}
          <ScrollView horizontal contentContainerStyle={{ flexDirection: 'column' }} style={{ marginTop: 20 }}>
            {/* Days header */}
            <View style={styles.gridRow}>
              <View style={styles.gridHeaderCellEmpty} />
              {DAYS.map(day => (
                <View key={day} style={styles.gridHeaderCell}>
                  <Text style={styles.gridHeaderCellText}>{DAY_LABELS[day]}</Text>
                </View>
              ))}
            </View>

            {/* Hour Rows */}
            {currentTurn.hours.map(hour => (
              <View key={hour} style={styles.gridRow}>
                <View style={styles.gridHourCell}>
                  <Text style={styles.gridHourCellText}>{hour}</Text>
                </View>
                {DAYS.map(day => {
                  const isActive = selectedSlots[day]?.[hour] || false;
                  return (
                    <TouchableOpacity
                      key={day}
                      style={[styles.gridCell, isActive && styles.gridCellActive]}
                      onPress={() => toggleSlot(day, hour)}
                    />
                  );
                })}
              </View>
            ))}
          </ScrollView>

          {/* Action buttons */}
          <View style={{ width: '100%', marginTop: 30, alignItems: 'center' }}>
            <TouchableOpacity style={styles.btnContinuarPill} onPress={handleGuardarCambios} disabled={loading}>
              {loading ? (
                <ActivityIndicator color={Colors.background} />
              ) : (
                <Text style={styles.btnContinuarPillText}>GUARDAR CAMBIOS</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* MODAL PARA SELECCIONAR MATERIAS */}
      <Modal visible={modalMateriasOpen} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Selecciona materias</Text>
            
            <ScrollView contentContainerStyle={styles.modalGrid}>
              {uniqueSubjectNames.map(name => {
                const isSelected = selectedMateriaNames.includes(name);
                return (
                  <TouchableOpacity
                    key={name}
                    style={[styles.modalCard, isSelected && styles.modalCardActive]}
                    onPress={() => toggleSubjectInModal(name)}
                  >
                    <Text style={[styles.modalCardText, isSelected && styles.modalCardTextActive]}>
                      {name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <TouchableOpacity
              style={styles.modalCloseBtn}
              onPress={() => setModalMateriasOpen(false)}
            >
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
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: scale(24),
    paddingTop: verticalScale(30),
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: verticalScale(16),
  },
  wiser: {
    fontFamily: Fonts.spaceGroteskBold,
    fontSize: moderateScale(36),
    color: '#3455ff', // Deep bluish purple text as seen in screenshot
    fontWeight: 'bold',
  },
  wiserCenter: {
    fontFamily: Fonts.spaceGroteskBold,
    fontSize: moderateScale(36),
    color: '#3455ff',
    textAlign: 'center',
    marginBottom: verticalScale(8),
    fontWeight: 'bold',
  },
  badge: {
    backgroundColor: '#b8c6e2',
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  badgeText: {
    fontFamily: Fonts.spaceGroteskBold,
    fontSize: moderateScale(10),
    color: Colors.background,
    letterSpacing: 1,
  },
  subtitle: {
    fontFamily: Fonts.rubikRegular,
    fontSize: moderateScale(12),
    color: '#aaa',
    marginBottom: verticalScale(30),
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: verticalScale(30),
  },
  avatarBorder: {
    width: scale(110),
    height: scale(110),
    borderRadius: scale(55),
    backgroundColor: Colors.blanco,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#aaa',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  photoButton: {
    marginTop: verticalScale(10),
  },
  photoButtonText: {
    fontFamily: Fonts.rubikMedium,
    color: Colors.blanco,
    fontSize: moderateScale(12),
    textDecorationLine: 'underline',
  },
  form: {
    width: '100%',
  },
  label: {
    fontFamily: Fonts.rubikMedium,
    color: Colors.blanco,
    fontSize: moderateScale(13),
    marginBottom: verticalScale(6),
  },
  input: {
    backgroundColor: Colors.superficieB,
    borderRadius: 6,
    padding: scale(12),
    color: Colors.blanco,
    fontFamily: Fonts.rubikRegular,
    fontSize: moderateScale(14),
    marginBottom: verticalScale(20),
  },
  inputIconContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.superficieB,
    borderRadius: 6,
    paddingHorizontal: scale(12),
    marginBottom: verticalScale(30),
  },
  inputIcon: {
    marginRight: scale(8),
  },
  inputWithIcon: {
    flex: 1,
    paddingVertical: scale(12),
    color: Colors.blanco,
    fontFamily: Fonts.rubikRegular,
    fontSize: moderateScale(14),
  },
  btnContinuar: {
    backgroundColor: '#c5cbd3', // Light gray button in mockup 1
    borderRadius: 4,
    paddingVertical: scale(14),
    alignItems: 'center',
    width: '50%',
    alignSelf: 'center',
  },
  btnContinuarText: {
    fontFamily: Fonts.spaceGroteskBold,
    color: Colors.background,
    fontSize: moderateScale(14),
    fontWeight: 'bold',
  },
  stepTitle: {
    fontFamily: Fonts.spaceGroteskBold,
    color: Colors.blanco,
    fontSize: moderateScale(14),
    textAlign: 'center',
    letterSpacing: 1.5,
    marginBottom: verticalScale(24),
  },
  sectionLabel: {
    fontFamily: Fonts.rubikMedium,
    color: Colors.blanco,
    fontSize: moderateScale(14),
    marginTop: verticalScale(16),
    marginBottom: verticalScale(10),
  },
  materiasBadgeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    marginBottom: verticalScale(14),
    gap: 8,
  },
  materiaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.superficieA,
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
    justifyContent: 'space-between',
    marginBottom: verticalScale(20),
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  radioOutline: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: Colors.cian,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 6,
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.cian,
  },
  radioText: {
    fontFamily: Fonts.rubikRegular,
    color: Colors.blanco,
    fontSize: moderateScale(13),
  },
  checkboxOption: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  checkboxText: {
    fontFamily: Fonts.rubikRegular,
    color: Colors.blanco,
    fontSize: moderateScale(13),
    marginLeft: 6,
  },
  priceInput: {
    backgroundColor: Colors.superficieB,
    borderRadius: 4,
    padding: scale(12),
    color: Colors.blanco,
    fontFamily: Fonts.rubikRegular,
    fontSize: moderateScale(14),
    width: '40%',
    marginBottom: verticalScale(40),
  },
  btnContinuarPill: {
    backgroundColor: '#b8c6e2', // Light grayish purple pill button in mockup 2
    borderRadius: 25,
    paddingVertical: scale(14),
    paddingHorizontal: scale(48),
    alignItems: 'center',
    alignSelf: 'center',
  },
  btnContinuarPillText: {
    fontFamily: Fonts.spaceGroteskBold,
    color: Colors.background,
    fontSize: moderateScale(14),
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  availabilityHeaders: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: verticalScale(16),
  },
  availabilityHeaderCol: {
    flex: 1,
    alignItems: 'center',
  },
  availabilityHeaderTitle: {
    fontFamily: Fonts.spaceGroteskMedium,
    color: Colors.cian,
    fontSize: moderateScale(11),
    letterSpacing: 1,
    marginBottom: 4,
  },
  availabilityHeaderSubtitle: {
    fontFamily: Fonts.rubikRegular,
    color: Colors.blanco,
    fontSize: moderateScale(13),
  },
  turnSelectorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  turnSelectorLabel: {
    fontFamily: Fonts.rubikRegular,
    color: Colors.blanco,
    fontSize: moderateScale(13),
    minWidth: 80,
    textAlign: 'center',
  },
  gridRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  gridHeaderCellEmpty: {
    width: scale(55),
  },
  gridHeaderCell: {
    width: scale(42),
    alignItems: 'center',
  },
  gridHeaderCellText: {
    fontFamily: Fonts.spaceGroteskBold,
    color: Colors.blanco,
    fontSize: moderateScale(11),
  },
  gridHourCell: {
    width: scale(55),
    paddingRight: 8,
    alignItems: 'flex-end',
  },
  gridHourCellText: {
    fontFamily: Fonts.rubikRegular,
    color: Colors.blanco,
    fontSize: moderateScale(12),
  },
  gridCell: {
    width: scale(36),
    height: scale(28),
    backgroundColor: Colors.superficieB,
    borderColor: '#11223e',
    borderWidth: 1,
    marginHorizontal: 3,
    borderRadius: 4,
  },
  gridCellActive: {
    backgroundColor: '#4cd964', // Bright green slot as in Screenshot 3
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
    height: scale(90),
    backgroundColor: Colors.superficieB,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10,
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
