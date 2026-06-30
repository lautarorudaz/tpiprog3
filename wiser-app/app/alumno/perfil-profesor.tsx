import { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Image, Alert
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { scale, verticalScale, moderateScale } from 'react-native-size-matters';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { Fonts } from '../../constants/fonts';
import { obtenerPerfilProfesor, obtenerValoracionesProfesor } from '../../services/apiService';

function EstrellaRating({ puntaje, size = 16 }: { puntaje: number; size?: number }) {
  return (
    <View style={{ flexDirection: 'row', gap: 3 }}>
      {[1, 2, 3, 4, 5].map(i => (
        <Ionicons
          key={i}
          name={puntaje >= i ? 'star' : puntaje >= i - 0.5 ? 'star-half' : 'star-outline'}
          size={size}
          color="#FFD700"
        />
      ))}
    </View>
  );
}

export default function PerfilProfesor() {
  const router = useRouter();
  const { profesorId } = useLocalSearchParams<{ profesorId: string }>();

  const [perfil, setPerfil] = useState<any>(null);
  const [valoraciones, setValoraciones] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [p, v] = await Promise.all([
          obtenerPerfilProfesor(Number(profesorId)),
          obtenerValoracionesProfesor(Number(profesorId)),
        ]);
        setPerfil(p);
        setValoraciones(v);
      } catch (err) {
        Alert.alert('Error', 'No se pudo cargar el perfil.');
      } finally {
        setLoading(false);
      }
    };
    if (profesorId) load();
  }, [profesorId]);

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={Colors.cian} />
      </View>
    );
  }

  if (!perfil) return null;

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
        {/* Foto + nombre + título + rating */}
        <View style={styles.heroSection}>
          <View style={styles.avatarBorder}>
            {perfil.fotoPerfil ? (
              <Image source={{ uri: perfil.fotoPerfil }} style={styles.avatarImg} />
            ) : (
              <Ionicons name="person-outline" size={scale(42)} color="#aaa" />
            )}
          </View>
          <View style={styles.heroInfo}>
            <Text style={styles.profesorNombre}>{perfil.nombre} {perfil.apellido}</Text>
            <Text style={styles.profesorTitulo}>{perfil.titulo || 'Profesor'}</Text>
            <View style={styles.ratingRow}>
              <EstrellaRating puntaje={perfil.valoracionPromedio || 0} />
              <Text style={styles.ratingNum}>{(perfil.valoracionPromedio || 0).toFixed(1)}</Text>
              <Text style={styles.ratingCount}>({valoraciones.length} reseñas)</Text>
            </View>
          </View>
        </View>

        {/* Sobre mí */}
        {perfil.descripcion && (
          <>
            <Text style={styles.seccionTitle}>Sobre mí</Text>
            <Text style={styles.descripcion}>{perfil.descripcion}</Text>
          </>
        )}

        {/* Materias */}
        <Text style={styles.seccionTitle}>Materias</Text>
        <View style={styles.chipsRow}>
          {(perfil.materias || []).map((m: any) => (
            <View key={m.id} style={styles.chip}>
              <Text style={styles.chipText}>{m.nombre}</Text>
            </View>
          ))}
        </View>

        {/* Modalidad */}
        <Text style={styles.seccionTitle}>Modalidad</Text>
        <View style={styles.chipsRow}>
          {perfil.modalidad === 'hibrida' ? (
            <>
              <View style={styles.chip}><Text style={styles.chipText}>Virtual</Text></View>
              <View style={styles.chip}><Text style={styles.chipText}>Presencial</Text></View>
            </>
          ) : (
            <View style={styles.chip}>
              <Text style={styles.chipText}>{perfil.modalidad === 'Virtual' ? 'Virtual' : 'Presencial'}</Text>
            </View>
          )}
        </View>

        {/* Precio por hora */}
        <Text style={styles.seccionTitle}>Precio por hora</Text>
        <View style={styles.precioBox}>
          <Text style={styles.precioText}>${Number(perfil.precioHora).toLocaleString('es-AR')}</Text>
        </View>

        {/* Reseñas (últimas 3) */}
        {valoraciones.length > 0 && (
          <>
            <Text style={styles.seccionTitle}>Reseñas</Text>
            {valoraciones.slice(0, 3).map(v => (
              <View key={v.id} style={styles.resenaCard}>
                <View style={styles.resenaHeader}>
                  <Text style={styles.resenaAlumno}>{v.alumno}</Text>
                  <EstrellaRating puntaje={v.puntaje} size={12} />
                </View>
                {v.comentario && <Text style={styles.resenaComentario}>{v.comentario}</Text>}
              </View>
            ))}
          </>
        )}
      </ScrollView>

      {/* CTA */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.btnAgendar}
          onPress={() => router.push({
            pathname: '/alumno/agendar-clase',
            params: { profesorId: String(perfil.id), profesorNombre: `${perfil.nombre} ${perfil.apellido}` }
          })}
        >
          <Text style={styles.btnAgendarText}>Agendar clase</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  loading: { flex: 1, backgroundColor: Colors.background, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: scale(24), paddingTop: verticalScale(50), paddingBottom: verticalScale(10),
  },
  wiser: { fontFamily: Fonts.spaceGroteskBold, fontSize: moderateScale(22), color: '#3455ff' },
  scrollContent: { paddingHorizontal: scale(24), paddingBottom: verticalScale(100) },
  heroSection: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    marginTop: verticalScale(10), marginBottom: verticalScale(24),
  },
  avatarBorder: {
    width: scale(80), height: scale(80), borderRadius: scale(40),
    backgroundColor: Colors.superficieA, justifyContent: 'center', alignItems: 'center',
    overflow: 'hidden', borderWidth: 2, borderColor: Colors.cian,
  },
  avatarImg: { width: '100%', height: '100%', resizeMode: 'cover' },
  heroInfo: { flex: 1 },
  profesorNombre: { fontFamily: Fonts.spaceGroteskBold, color: Colors.blanco, fontSize: moderateScale(15) },
  profesorTitulo: { fontFamily: Fonts.rubikRegular, color: '#aaa', fontSize: moderateScale(12), marginTop: 2 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 },
  ratingNum: { fontFamily: Fonts.spaceGroteskBold, color: Colors.blanco, fontSize: moderateScale(13) },
  ratingCount: { fontFamily: Fonts.rubikRegular, color: '#aaa', fontSize: moderateScale(11) },
  seccionTitle: {
    fontFamily: Fonts.spaceGroteskBold, color: Colors.blanco,
    fontSize: moderateScale(14), marginTop: verticalScale(18), marginBottom: verticalScale(8),
  },
  descripcion: { fontFamily: Fonts.rubikRegular, color: '#ccc', fontSize: moderateScale(13), lineHeight: moderateScale(20) },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    backgroundColor: Colors.superficieA, borderRadius: 6, borderWidth: 1, borderColor: '#1e295d',
    paddingHorizontal: scale(14), paddingVertical: scale(8),
  },
  chipText: { fontFamily: Fonts.rubikMedium, color: Colors.blanco, fontSize: moderateScale(12) },
  precioBox: {
    backgroundColor: Colors.superficieB, borderRadius: 6, borderWidth: 1, borderColor: '#1e295d',
    paddingHorizontal: scale(14), paddingVertical: scale(10), alignSelf: 'flex-start',
  },
  precioText: { fontFamily: Fonts.spaceGroteskBold, color: Colors.blanco, fontSize: moderateScale(14) },
  resenaCard: {
    backgroundColor: Colors.superficieA, borderRadius: 8, padding: scale(12),
    marginBottom: verticalScale(8), borderWidth: 1, borderColor: '#1e295d',
  },
  resenaHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  resenaAlumno: { fontFamily: Fonts.rubikMedium, color: Colors.blanco, fontSize: moderateScale(12) },
  resenaComentario: { fontFamily: Fonts.rubikRegular, color: '#aaa', fontSize: moderateScale(12) },
  footer: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    padding: scale(20), backgroundColor: Colors.background,
    borderTopWidth: 1, borderTopColor: '#1e295d',
  },
  btnAgendar: {
    backgroundColor: '#4cd964', borderRadius: 10, paddingVertical: scale(16), alignItems: 'center',
  },
  btnAgendarText: { fontFamily: Fonts.spaceGroteskBold, color: Colors.background, fontSize: moderateScale(15) },
});
