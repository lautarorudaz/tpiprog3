import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { scale, verticalScale, moderateScale } from 'react-native-size-matters';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { Fonts } from '../../constants/fonts';

const PREGUNTAS = [
  {
    pregunta: '¿Cómo reservo una clase?',
    respuesta: 'Buscá un profesor desde el inicio, revisá su perfil y tocá "Agendar clase". Elegí la materia, la fecha disponible y el horario. Luego confirmá con el método de pago de tu preferencia.',
  },
  {
    pregunta: '¿Cómo cancelo un turno?',
    respuesta: 'Por el momento, la cancelación se coordina directamente con el profesor por el chat de la app. Si el turno todavía está "Pendiente de pago", comunicate con el profesor para que pueda rechazarlo.',
  },
  {
    pregunta: '¿Cómo funciona el pago por transferencia?',
    respuesta: 'Realizás la transferencia al CBU/alias del profesor, sacás una foto del comprobante y lo cargás en la app desde la pantalla de confirmación. El profesor valida el pago y confirma la clase.',
  },
  {
    pregunta: '¿Puedo calificar a un profesor después de la clase?',
    respuesta: 'Sí. Entrá a Mis Turnos, seleccioná la clase que ya se realizó y tocá "Dejar calificación". Podés puntuar del 1 al 5 y dejar un comentario opcional.',
  },
];

export default function AlumnoPreguntasFrecuentes() {
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
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        {PREGUNTAS.map((item, idx) => {
          const estaAbierta = abierta === idx;
          return (
            <View key={idx} style={styles.card}>
              <TouchableOpacity style={styles.preguntaRow} onPress={() => setAbierta(estaAbierta ? null : idx)}>
                <Text style={styles.preguntaText}>{item.pregunta}</Text>
                <Ionicons name={estaAbierta ? 'chevron-down' : 'chevron-forward'} size={18} color={Colors.cian} />
              </TouchableOpacity>
              {estaAbierta && <Text style={styles.respuestaText}>{item.respuesta}</Text>}
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background, paddingHorizontal: scale(24), paddingTop: verticalScale(50) },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  wiser: { fontFamily: Fonts.spaceGroteskBold, fontSize: moderateScale(24), color: '#3455ff' },
  titulo: { fontFamily: Fonts.spaceGroteskBold, color: Colors.blanco, fontSize: moderateScale(16), textAlign: 'center', marginTop: 8, marginBottom: verticalScale(24) },
  card: { backgroundColor: Colors.superficieA, borderRadius: 8, padding: scale(16), marginBottom: verticalScale(14), borderWidth: 1, borderColor: '#1e295d' },
  preguntaRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  preguntaText: { flex: 1, fontFamily: Fonts.rubikMedium, color: Colors.blanco, fontSize: moderateScale(14) },
  respuestaText: { fontFamily: Fonts.rubikRegular, color: '#aaa', fontSize: moderateScale(12), marginTop: verticalScale(12), lineHeight: moderateScale(18) },
});
