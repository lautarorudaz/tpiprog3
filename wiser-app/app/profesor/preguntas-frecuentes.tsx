import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { scale, verticalScale, moderateScale } from 'react-native-size-matters';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { Fonts } from '../../constants/fonts';

const PREGUNTAS = [
  {
    pregunta: '¿Cuánto duran las clases?',
    respuesta: 'Cada clase se agenda dentro de una franja horaria (mañana, tarde o noche) que vos mismo definís en tus horarios disponibles. La duración exacta de la clase la acordás directamente con el alumno por el chat.',
  },
  {
    pregunta: '¿Puedo cambiar mi modalidad?',
    respuesta: 'Sí. Entrá a Ajustes > Mi perfil y elegí entre Virtual, Presencial o Híbrida. El cambio se aplica de inmediato para los alumnos que busquen profesores.',
  },
  {
    pregunta: '¿Cómo cancelo un turno?',
    respuesta: 'Si el turno todavía está pendiente de confirmación, podés rechazarlo desde el Dashboard o tu Agenda con el botón ✕. Si ya estaba confirmado, contactate con el alumno por el chat para coordinar la cancelación.',
  },
  {
    pregunta: '¿Cómo funciona el pago?',
    respuesta: 'El alumno elige transferencia o efectivo al reservar. Si es transferencia, vas a ver el comprobante cargado en el turno; una vez que lo confirmás, la clase queda agendada.',
  },
];

export default function PreguntasFrecuentes() {
  const router = useRouter();
  const [abierta, setAbierta] = useState<number | null>(null);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color={Colors.blanco} />
        </TouchableOpacity>
        <Text style={styles.wiser}>Wiser</Text>
        <View style={{ width: 24 }} />
      </View>
      <Text style={styles.titulo}>Preguntas Frecuentes</Text>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {PREGUNTAS.map((item, idx) => {
          const estaAbierta = abierta === idx;
          return (
            <View key={idx} style={styles.card}>
              <TouchableOpacity
                style={styles.preguntaRow}
                onPress={() => setAbierta(estaAbierta ? null : idx)}
              >
                <Text style={styles.preguntaText}>{item.pregunta}</Text>
                <Ionicons name={estaAbierta ? 'chevron-down' : 'chevron-forward'} size={18} color={Colors.cian} />
              </TouchableOpacity>
              {estaAbierta && (
                <Text style={styles.respuestaText}>{item.respuesta}</Text>
              )}
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    paddingHorizontal: scale(24),
    paddingTop: verticalScale(50),
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  wiser: {
    fontFamily: Fonts.spaceGroteskBold,
    fontSize: moderateScale(24),
    color: '#3455ff',
  },
  titulo: {
    fontFamily: Fonts.spaceGroteskBold,
    color: Colors.blanco,
    fontSize: moderateScale(16),
    textAlign: 'center',
    marginTop: verticalScale(8),
    marginBottom: verticalScale(24),
  },
  scrollContent: {
    paddingBottom: verticalScale(40),
  },
  card: {
    backgroundColor: Colors.superficieA,
    borderRadius: 8,
    padding: scale(16),
    marginBottom: verticalScale(14),
    borderWidth: 1,
    borderColor: '#1e295d',
  },
  preguntaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  preguntaText: {
    flex: 1,
    fontFamily: Fonts.rubikMedium,
    color: Colors.blanco,
    fontSize: moderateScale(14),
  },
  respuestaText: {
    fontFamily: Fonts.rubikRegular,
    color: '#aaa',
    fontSize: moderateScale(12),
    marginTop: verticalScale(12),
    lineHeight: moderateScale(18),
  },
});
