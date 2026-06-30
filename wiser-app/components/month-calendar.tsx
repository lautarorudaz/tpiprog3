import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { scale, verticalScale, moderateScale } from 'react-native-size-matters';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import { Fonts } from '../constants/fonts';

const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];
const DIAS_SEMANA = ['LUN', 'MAR', 'MIE', 'JUE', 'VIE', 'SAB', 'DOM'];

export type MarcaDia = 'confirmado' | 'pendiente' | null;

interface Props {
  mes: Date;
  onCambiarMes: (nuevoMes: Date) => void;
  fechaSeleccionada: string | null;
  onSeleccionarDia: (fechaISO: string) => void;
  marcas: Record<string, MarcaDia>;
}

function aFechaISO(date: Date) {
  return date.toISOString().split('T')[0];
}

export default function MonthCalendar({ mes, onCambiarMes, fechaSeleccionada, onSeleccionarDia, marcas }: Props) {
  const año = mes.getFullYear();
  const mesIndex = mes.getMonth();

  const primerDiaMes = new Date(año, mesIndex, 1);
  const diasEnMes = new Date(año, mesIndex + 1, 0).getDate();
  // Lunes = 0 ... Domingo = 6
  const offsetInicial = (primerDiaMes.getDay() + 6) % 7;

  const celdas: (number | null)[] = [
    ...Array(offsetInicial).fill(null),
    ...Array.from({ length: diasEnMes }, (_, i) => i + 1),
  ];
  while (celdas.length % 7 !== 0) celdas.push(null);

  const hoyISO = aFechaISO(new Date());

  const irMesAnterior = () => onCambiarMes(new Date(año, mesIndex - 1, 1));
  const irMesSiguiente = () => onCambiarMes(new Date(año, mesIndex + 1, 1));

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={irMesAnterior} style={styles.navBtn}>
          <Ionicons name="chevron-back" size={18} color={Colors.cian} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{MESES[mesIndex]} {año}</Text>
        <TouchableOpacity onPress={irMesSiguiente} style={styles.navBtn}>
          <Ionicons name="chevron-forward" size={18} color={Colors.cian} />
        </TouchableOpacity>
      </View>

      <View style={styles.weekRow}>
        {DIAS_SEMANA.map(d => (
          <Text key={d} style={styles.weekLabel}>{d}</Text>
        ))}
      </View>

      <View style={styles.grid}>
        {celdas.map((dia, idx) => {
          if (dia === null) return <View key={idx} style={styles.cell} />;

          const fechaISO = aFechaISO(new Date(año, mesIndex, dia));
          const marca = marcas[fechaISO];
          const esHoy = fechaISO === hoyISO;
          const esSeleccionado = fechaISO === fechaSeleccionada;

          return (
            <TouchableOpacity
              key={idx}
              style={[
                styles.cell,
                styles.diaCell,
                esHoy && styles.diaHoy,
                esSeleccionado && styles.diaSeleccionado,
              ]}
              onPress={() => onSeleccionarDia(fechaISO)}
            >
              <Text style={[styles.diaTexto, esSeleccionado && styles.diaTextoSeleccionado]}>{dia}</Text>
              {marca && (
                <View
                  style={[
                    styles.puntoMarca,
                    { backgroundColor: marca === 'pendiente' ? '#ffb020' : Colors.cian },
                  ]}
                />
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.superficieA,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1e295d',
    padding: scale(14),
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: verticalScale(12),
  },
  navBtn: {
    padding: scale(4),
  },
  headerTitle: {
    fontFamily: Fonts.spaceGroteskBold,
    color: Colors.blanco,
    fontSize: moderateScale(15),
    textTransform: 'capitalize',
  },
  weekRow: {
    flexDirection: 'row',
    marginBottom: verticalScale(6),
  },
  weekLabel: {
    flex: 1,
    textAlign: 'center',
    fontFamily: Fonts.rubikMedium,
    color: '#8b93b8',
    fontSize: moderateScale(10),
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  cell: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  diaCell: {
    borderRadius: 8,
  },
  diaHoy: {
    borderWidth: 1,
    borderColor: Colors.cian,
  },
  diaSeleccionado: {
    backgroundColor: Colors.cian,
  },
  diaTexto: {
    fontFamily: Fonts.rubikRegular,
    color: Colors.blanco,
    fontSize: moderateScale(13),
  },
  diaTextoSeleccionado: {
    color: Colors.background,
    fontFamily: Fonts.rubikMedium,
  },
  puntoMarca: {
    position: 'absolute',
    bottom: 4,
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
});
