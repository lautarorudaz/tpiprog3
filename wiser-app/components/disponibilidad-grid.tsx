import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { scale, verticalScale, moderateScale } from 'react-native-size-matters';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import { Fonts } from '../constants/fonts';

export type TurnoKey = 'manana' | 'tarde' | 'noche';
export type DisponibilidadValue = Record<string, Record<TurnoKey, boolean>>;

// Días en orden lunes-domingo (índice 0 = lunes en DIAS, pero en JS getDay() 0=domingo)
export const DIAS: { key: string; label: string }[] = [
  { key: 'lunes', label: 'Lun' },
  { key: 'martes', label: 'Mar' },
  { key: 'miercoles', label: 'Mié' },
  { key: 'jueves', label: 'Jue' },
  { key: 'viernes', label: 'Vie' },
  { key: 'sabado', label: 'Sáb' },
  { key: 'domingo', label: 'Dom' },
];

export const TURNOS: { key: TurnoKey; label: string; rango: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: 'manana', label: 'Mañana', rango: '9-12hs', icon: 'sunny-outline' },
  { key: 'tarde', label: 'Tarde', rango: '13-17hs', icon: 'partly-sunny-outline' },
  { key: 'noche', label: 'Noche', rango: '18-22hs', icon: 'moon-outline' },
];

export function crearDisponibilidadVacia(): DisponibilidadValue {
  const inicial: DisponibilidadValue = {};
  DIAS.forEach(({ key }) => {
    inicial[key] = { manana: false, tarde: false, noche: false };
  });
  return inicial;
}

// Devuelve el lunes de la semana que está `offset` semanas después de la semana actual
function getLunesDeLaSemana(offset: number): Date {
  const hoy = new Date();
  const diaSemana = hoy.getDay(); // 0=Dom, 1=Lun,...,6=Sáb
  const diasHastaLunes = diaSemana === 0 ? -6 : 1 - diaSemana;
  const lunes = new Date(hoy);
  lunes.setDate(hoy.getDate() + diasHastaLunes + offset * 7);
  lunes.setHours(0, 0, 0, 0);
  return lunes;
}

function formatDiaMes(date: Date): string {
  return `${date.getDate()}/${date.getMonth() + 1}`;
}

interface Props {
  value: DisponibilidadValue;
  onToggle: (day: string, turno: TurnoKey) => void;
  isLocked?: (day: string, turno: TurnoKey) => boolean;
}

export default function DisponibilidadGrid({ value, onToggle, isLocked }: Props) {
  const [weekOffset, setWeekOffset] = useState(0);

  const lunesActual = getLunesDeLaSemana(weekOffset);
  const domingoActual = new Date(lunesActual);
  domingoActual.setDate(lunesActual.getDate() + 6);

  const fechasPorDia = DIAS.map((_, i) => {
    const fecha = new Date(lunesActual);
    fecha.setDate(lunesActual.getDate() + i);
    return fecha;
  });

  const rangoSemana = `${formatDiaMes(lunesActual)} al ${formatDiaMes(domingoActual)}`;

  return (
    <View style={styles.container}>
      {/* Navegador de semana */}
      <View style={styles.weekNav}>
        <TouchableOpacity
          style={styles.weekNavBtn}
          onPress={() => setWeekOffset(prev => prev - 1)}
        >
          <Ionicons name="chevron-back" size={18} color={Colors.cian} />
        </TouchableOpacity>
        <View style={styles.weekNavCenter}>
          <Text style={styles.weekNavLabel}>SEMANA</Text>
          <Text style={styles.weekNavRango}>{rangoSemana}</Text>
        </View>
        <TouchableOpacity
          style={styles.weekNavBtn}
          onPress={() => setWeekOffset(prev => prev + 1)}
        >
          <Ionicons name="chevron-forward" size={18} color={Colors.cian} />
        </TouchableOpacity>
      </View>

      {/* Encabezado de turnos */}
      <View style={styles.headerRow}>
        <View style={styles.dayLabelCell} />
        {TURNOS.map((turno) => (
          <View key={turno.key} style={styles.headerCell}>
            <Ionicons name={turno.icon} size={scale(15)} color={Colors.cian} />
            <Text style={styles.headerLabel}>{turno.label}</Text>
            <Text style={styles.headerRango}>{turno.rango}</Text>
          </View>
        ))}
      </View>

      {/* Filas por día con fecha real */}
      {DIAS.map(({ key: day, label }, i) => {
        const fechaDia = fechasPorDia[i];
        const activo = (turnoKey: TurnoKey) => value[day]?.[turnoKey] ?? false;
        const bloqueado = (turnoKey: TurnoKey) => isLocked?.(day, turnoKey) ?? false;

        return (
          <View key={day} style={styles.dayRow}>
            <View style={styles.dayLabelCell}>
              <Text style={styles.dayLabelText}>{label}</Text>
              <Text style={styles.dayFecha}>{formatDiaMes(fechaDia)}</Text>
            </View>
            {TURNOS.map((turno) => {
              const isActive = activo(turno.key);
              const isBlocked = bloqueado(turno.key);
              return (
                <TouchableOpacity
                  key={turno.key}
                  style={[
                    styles.cell,
                    isActive && styles.cellActiva,
                    isBlocked && styles.cellBloqueada,
                  ]}
                  disabled={isBlocked}
                  onPress={() => onToggle(day, turno.key)}
                  activeOpacity={0.7}
                >
                  {isBlocked ? (
                    <Ionicons name="lock-closed" size={scale(13)} color="#aaa" />
                  ) : isActive ? (
                    <Ionicons name="checkmark" size={scale(17)} color={Colors.background} />
                  ) : null}
                </TouchableOpacity>
              );
            })}
          </View>
        );
      })}

      {isLocked && (
        <View style={styles.legendRow}>
          <Ionicons name="lock-closed" size={scale(12)} color="#aaa" />
          <Text style={styles.legendText}>Tenés una clase confirmada en ese horario</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  weekNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.superficieA,
    borderRadius: 10,
    paddingHorizontal: scale(10),
    paddingVertical: scale(8),
    marginBottom: verticalScale(14),
    borderWidth: 1,
    borderColor: '#1e295d',
  },
  weekNavBtn: {
    padding: scale(4),
  },
  weekNavCenter: {
    alignItems: 'center',
  },
  weekNavLabel: {
    fontFamily: Fonts.spaceGroteskMedium,
    color: Colors.cian,
    fontSize: moderateScale(10),
    letterSpacing: 1,
  },
  weekNavRango: {
    fontFamily: Fonts.spaceGroteskBold,
    color: Colors.blanco,
    fontSize: moderateScale(13),
    marginTop: 2,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: verticalScale(8),
  },
  headerCell: {
    flex: 1,
    alignItems: 'center',
    paddingBottom: 4,
  },
  headerLabel: {
    fontFamily: Fonts.spaceGroteskMedium,
    color: Colors.blanco,
    fontSize: moderateScale(10),
    marginTop: 2,
  },
  headerRango: {
    fontFamily: Fonts.rubikRegular,
    color: '#8b93b8',
    fontSize: moderateScale(9),
  },
  dayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: verticalScale(8),
  },
  dayLabelCell: {
    width: scale(54),
  },
  dayLabelText: {
    fontFamily: Fonts.rubikMedium,
    color: Colors.blanco,
    fontSize: moderateScale(12),
  },
  dayFecha: {
    fontFamily: Fonts.rubikRegular,
    color: '#8b93b8',
    fontSize: moderateScale(10),
  },
  cell: {
    flex: 1,
    height: verticalScale(40),
    marginHorizontal: 3,
    borderRadius: 8,
    backgroundColor: Colors.superficieB,
    borderWidth: 1,
    borderColor: '#1e295d',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cellActiva: {
    backgroundColor: Colors.cian,
    borderColor: Colors.cian,
  },
  cellBloqueada: {
    backgroundColor: '#1c2238',
    borderColor: '#1c2238',
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: verticalScale(8),
  },
  legendText: {
    fontFamily: Fonts.rubikRegular,
    color: '#aaa',
    fontSize: moderateScale(11),
  },
});
