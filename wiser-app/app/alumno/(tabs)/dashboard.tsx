import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  FlatList, ScrollView, ActivityIndicator, Image, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { scale, verticalScale, moderateScale } from 'react-native-size-matters';
import { Ionicons } from '@expo/vector-icons';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { Colors } from '../../../constants/colors';
import { Fonts } from '../../../constants/fonts';
import { buscarProfesores, obtenerMaterias } from '../../../services/apiService';
import { useAlumno } from '../../../hooks/use-alumno';

const UTN_RESISTENCIA = { latitude: -27.4516, longitude: -58.9877 };

const WISER_MAP_STYLE = [
  { elementType: 'geometry', stylers: [{ color: '#0d1232' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#8b93b8' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#0d1232' }] },
  { featureType: 'administrative', elementType: 'geometry', stylers: [{ visibility: 'off' }] },
  { featureType: 'administrative.locality', elementType: 'labels.text.fill', stylers: [{ color: '#d0d8ff' }] },
  { featureType: 'poi', stylers: [{ visibility: 'off' }] },
  { featureType: 'road', elementType: 'geometry.fill', stylers: [{ color: '#1a2560' }] },
  { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#16194f' }] },
  { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#8b93b8' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#253878' }] },
  { featureType: 'road.highway', elementType: 'geometry.stroke', stylers: [{ color: '#1e295d' }] },
  { featureType: 'transit', stylers: [{ visibility: 'off' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#080e28' }] },
  { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#16f0d6' }] },
];

function ProfMarker({ prof, onSelect }: { prof: any; onSelect: (p: any) => void }) {
  const initials = `${prof.nombre?.[0] ?? ''}${prof.apellido?.[0] ?? ''}`.toUpperCase();
  return (
    <Marker
      coordinate={{ latitude: Number(prof.latitud), longitude: Number(prof.longitud) }}
      onPress={() => onSelect(prof)}
      tracksViewChanges={false}
    >
      <View style={markerStyles.wrapper} pointerEvents="none">
        <View style={markerStyles.bubble}>
          {prof.fotoPerfil ? (
            <Image source={{ uri: prof.fotoPerfil }} style={markerStyles.bubbleImg} />
          ) : (
            <Text style={markerStyles.initials}>{initials}</Text>
          )}
        </View>
        <View style={markerStyles.arrow} />
      </View>
    </Marker>
  );
}

const markerStyles = StyleSheet.create({
  wrapper: { alignItems: 'center' },
  bubble: {
    width: scale(38), height: scale(38), borderRadius: scale(19),
    backgroundColor: '#16f0d6', borderWidth: 2, borderColor: '#ffffff',
    overflow: 'hidden', justifyContent: 'center', alignItems: 'center',
  },
  bubbleImg: { width: '100%', height: '100%', resizeMode: 'cover' },
  initials: { fontFamily: 'SpaceGrotesk-Bold', color: '#0d1232', fontSize: 13, fontWeight: 'bold' },
  arrow: {
    width: 0, height: 0,
    borderLeftWidth: 6, borderRightWidth: 6, borderTopWidth: 8,
    borderStyle: 'solid',
    borderLeftColor: 'transparent', borderRightColor: 'transparent',
    borderTopColor: '#16f0d6',
  },
});

function EstrellaRating({ puntaje }: { puntaje: number }) {
  return (
    <View style={{ flexDirection: 'row', gap: 2 }}>
      {[1, 2, 3, 4, 5].map(i => (
        <Ionicons
          key={i}
          name={puntaje >= i ? 'star' : puntaje >= i - 0.5 ? 'star-half' : 'star-outline'}
          size={13}
          color="#FFD700"
        />
      ))}
    </View>
  );
}

export default function AlumnoDashboard() {
  const router = useRouter();
  const { nombre, usuario, loading: loadingUsuario } = useAlumno();

  const [profesores, setProfesores] = useState<any[]>([]);
  const [materias, setMaterias] = useState<string[]>([]);
  const [loadingProfesores, setLoadingProfesores] = useState(false);

  const [searchText, setSearchText] = useState('');
  const [materiaSeleccionada, setMateriaSeleccionada] = useState<string | null>(null);

  const [selectedProf, setSelectedProf] = useState<any>(null);
  const mapRef = useRef<MapView>(null);

  const alumnoLatitud = usuario?.alumno?.latitud ? Number(usuario.alumno.latitud) : null;
  const alumnoLongitud = usuario?.alumno?.longitud ? Number(usuario.alumno.longitud) : null;
  const alumnoLocation = alumnoLatitud && alumnoLongitud
    ? { latitude: alumnoLatitud, longitude: alumnoLongitud }
    : null;

  // Load materias and initial professors list
  useEffect(() => {
    const init = async () => {
      try {
        const mats = await obtenerMaterias();
        const uniqueNombres = Array.from(new Set<string>(mats.map((m: any) => m.nombre)));
        setMaterias(uniqueNombres);

        const profs = await buscarProfesores({});
        setProfesores(profs);
      } catch (err) {
        console.error(err);
      }
    };
    init();
  }, []);

  const handleBuscar = useCallback(async () => {
    setLoadingProfesores(true);
    try {
      const mats = await obtenerMaterias();
      const materiaEncontrada = mats.find((m: any) => m.nombre === materiaSeleccionada);
      const profs = await buscarProfesores({
        nombre: searchText.trim() || undefined,
        materiaId: materiaEncontrada?.id || undefined,
      });
      setProfesores(profs);
    } catch {
      Alert.alert('Error', 'No se pudieron cargar los profesores.');
    } finally {
      setLoadingProfesores(false);
    }
  }, [searchText, materiaSeleccionada]);

  useEffect(() => {
    const timer = setTimeout(handleBuscar, 400);
    return () => clearTimeout(timer);
  }, [searchText, materiaSeleccionada, handleBuscar]);

  const hayFiltro = searchText.trim().length > 0 || materiaSeleccionada !== null;

  const profesoresConUbicacion = useMemo(
    () => profesores.filter(p => p.latitud && p.longitud),
    [profesores]
  );

  if (loadingUsuario) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.cian} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.topSection}>
        <Text style={styles.wiser}>Wiser</Text>
        <Text style={styles.hola}>Hola {nombre} 👋</Text>
        <Text style={styles.subhola}>¿Qué querés aprender hoy?</Text>

        {/* Search bar */}
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={18} color="#8b93b8" />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar profesor o materia"
            placeholderTextColor="#8b93b8"
            value={searchText}
            onChangeText={setSearchText}
          />
          {searchText.length > 0 && (
            <TouchableOpacity onPress={() => setSearchText('')}>
              <Ionicons name="close-circle" size={18} color="#8b93b8" />
            </TouchableOpacity>
          )}
        </View>

        {/* Materia chips */}
        <Text style={styles.seccionLabel}>Explorar Materias</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsScroll}>
          {materias.map(nombre => (
            <TouchableOpacity
              key={nombre}
              style={[styles.chip, materiaSeleccionada === nombre && styles.chipActivo]}
              onPress={() => setMateriaSeleccionada(prev => prev === nombre ? null : nombre)}
            >
              <Text style={[styles.chipText, materiaSeleccionada === nombre && styles.chipTextActivo]}>
                {nombre}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Content: list when filtering, map + list otherwise */}
      {hayFiltro ? (
        <FlatList
          data={profesores}
          keyExtractor={item => String(item.id)}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            loadingProfesores
              ? <ActivityIndicator color={Colors.cian} style={{ marginTop: 20 }} />
              : <Text style={styles.vacioText}>No se encontraron profesores.</Text>
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.profesorCard}
              onPress={() => router.push({ pathname: '/alumno/perfil-profesor', params: { profesorId: String(item.id) } })}
            >
              <View style={styles.profesorAvatar}>
                {item.fotoPerfil ? (
                  <Image source={{ uri: item.fotoPerfil }} style={styles.avatarImg} />
                ) : (
                  <Ionicons name="person" size={scale(22)} color="#aaa" />
                )}
              </View>
              <View style={styles.profesorInfo}>
                <Text style={styles.profesorNombre}>{item.nombre} {item.apellido}</Text>
                <Text style={styles.profesorMaterias} numberOfLines={1}>
                  {item.materias?.map((m: any) => m.nombre).join(' · ') || '—'}
                </Text>
                <View style={styles.profesorRating}>
                  <EstrellaRating puntaje={item.valoracionPromedio || 0} />
                </View>
              </View>
              <TouchableOpacity
                style={styles.btnVerPerfil}
                onPress={() => router.push({ pathname: '/alumno/perfil-profesor', params: { profesorId: String(item.id) } })}
              >
                <Text style={styles.btnVerPerfilText}>VER PERFIL</Text>
              </TouchableOpacity>
            </TouchableOpacity>
          )}
        />
      ) : (
        <ScrollView style={styles.mapaSection} contentContainerStyle={styles.mapaScrollContent}>
          <Text style={styles.seccionLabel}>Explorá la zona</Text>
          <View style={styles.mapaContainer}>
            <MapView
              ref={mapRef}
              style={styles.mapa}
              provider={PROVIDER_GOOGLE}
              customMapStyle={WISER_MAP_STYLE}
              initialRegion={{
                ...(alumnoLocation || UTN_RESISTENCIA),
                latitudeDelta: 0.08,
                longitudeDelta: 0.08,
              }}
              onPress={() => setSelectedProf(null)}
            >
              {profesoresConUbicacion.map(prof => (
                <ProfMarker
                  key={prof.id}
                  prof={prof}
                  onSelect={setSelectedProf}
                />
              ))}
            </MapView>

            {/* Mini card del profesor seleccionado */}
            {selectedProf && (
              <View style={styles.miniCard}>
                <TouchableOpacity
                  style={styles.miniCardClose}
                  onPress={() => setSelectedProf(null)}
                >
                  <Ionicons name="close" size={16} color="#aaa" />
                </TouchableOpacity>
                <View style={styles.miniCardRow}>
                  <View style={styles.miniCardAvatar}>
                    {selectedProf.fotoPerfil ? (
                      <Image source={{ uri: selectedProf.fotoPerfil }} style={{ width: '100%', height: '100%', resizeMode: 'cover' }} />
                    ) : (
                      <Text style={styles.miniCardInitials}>
                        {`${selectedProf.nombre?.[0] ?? ''}${selectedProf.apellido?.[0] ?? ''}`.toUpperCase()}
                      </Text>
                    )}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.miniCardNombre} numberOfLines={1}>
                      {selectedProf.nombre} {selectedProf.apellido}
                    </Text>
                    <Text style={styles.miniCardMaterias} numberOfLines={1}>
                      {selectedProf.materias?.map((m: any) => m.nombre).join(' · ') || '—'}
                    </Text>
                    {selectedProf.valoracionPromedio > 0 && (
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 2 }}>
                        <Ionicons name="star" size={11} color="#FFD700" />
                        <Text style={styles.miniCardRating}>{Number(selectedProf.valoracionPromedio).toFixed(1)}</Text>
                      </View>
                    )}
                  </View>
                  <TouchableOpacity
                    style={styles.miniCardBtn}
                    onPress={() => {
                      setSelectedProf(null);
                      router.push({ pathname: '/alumno/perfil-profesor', params: { profesorId: String(selectedProf.id) } });
                    }}
                  >
                    <Text style={styles.miniCardBtnText}>Ver perfil</Text>
                    <Ionicons name="chevron-forward" size={14} color="#0d1232" />
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>

          {/* Profesores mejor calificados */}
          <Text style={[styles.seccionLabel, { marginTop: verticalScale(20) }]}>
            Profesores mejor calificados
          </Text>
          {[...profesores]
            .filter(p => p.valoracionPromedio > 0)
            .sort((a, b) => b.valoracionPromedio - a.valoracionPromedio)
            .slice(0, 5)
            .map(prof => (
              <TouchableOpacity
                key={prof.id}
                style={styles.topProfCard}
                onPress={() => router.push({ pathname: '/alumno/perfil-profesor', params: { profesorId: String(prof.id) } })}
              >
                <TouchableOpacity
                  style={styles.topProfAvatar}
                  onPress={() => router.push({ pathname: '/alumno/perfil-profesor', params: { profesorId: String(prof.id) } })}
                >
                  {prof.fotoPerfil ? (
                    <Image source={{ uri: prof.fotoPerfil }} style={styles.avatarImg} />
                  ) : (
                    <Ionicons name="person" size={scale(20)} color="#aaa" />
                  )}
                </TouchableOpacity>
                <View style={styles.topProfInfo}>
                  <Text style={styles.topProfNombre}>{prof.nombre} {prof.apellido}</Text>
                  <Text style={styles.topProfMaterias} numberOfLines={1}>
                    {prof.materias?.map((m: any) => m.nombre).join(' · ') || '—'}
                  </Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}>
                    <Ionicons name="star" size={12} color="#FFD700" />
                    <Text style={styles.topProfRating}>{prof.valoracionPromedio.toFixed(1)}</Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#8b93b8" />
              </TouchableOpacity>
            ))}
          {profesores.filter(p => p.valoracionPromedio > 0).length === 0 && (
            <Text style={styles.vacioText}>Aún no hay calificaciones disponibles.</Text>
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  topSection: {
    paddingHorizontal: scale(24),
    paddingTop: verticalScale(30),
  },
  wiser: {
    fontFamily: Fonts.spaceGroteskBold,
    fontSize: moderateScale(32),
    color: '#3455ff',
    textAlign: 'center',
    marginBottom: verticalScale(10),
  },
  hola: {
    fontFamily: Fonts.spaceGroteskBold,
    color: Colors.blanco,
    fontSize: moderateScale(16),
  },
  subhola: {
    fontFamily: Fonts.rubikRegular,
    color: '#aaa',
    fontSize: moderateScale(13),
    marginBottom: verticalScale(14),
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: Colors.superficieA,
    borderRadius: 8,
    paddingHorizontal: scale(12),
    paddingVertical: scale(10),
    borderWidth: 1,
    borderColor: '#1e295d',
    marginBottom: verticalScale(18),
  },
  searchInput: {
    flex: 1,
    color: Colors.blanco,
    fontFamily: Fonts.rubikRegular,
    fontSize: moderateScale(13),
  },
  seccionLabel: {
    fontFamily: Fonts.spaceGroteskBold,
    color: Colors.blanco,
    fontSize: moderateScale(13),
    marginBottom: verticalScale(10),
  },
  chipsScroll: {
    marginBottom: verticalScale(16),
  },
  chip: {
    paddingHorizontal: scale(14),
    paddingVertical: scale(8),
    borderRadius: 20,
    backgroundColor: Colors.superficieA,
    borderWidth: 1,
    borderColor: '#1e295d',
    marginRight: 8,
  },
  chipActivo: {
    backgroundColor: Colors.cian,
    borderColor: Colors.cian,
  },
  chipText: {
    fontFamily: Fonts.rubikMedium,
    color: Colors.blanco,
    fontSize: moderateScale(12),
  },
  chipTextActivo: {
    color: Colors.background,
  },
  listContent: {
    paddingHorizontal: scale(24),
    paddingBottom: verticalScale(20),
  },
  vacioText: {
    fontFamily: Fonts.rubikRegular,
    color: '#aaa',
    fontSize: moderateScale(13),
    textAlign: 'center',
    marginTop: verticalScale(20),
  },
  profesorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.superficieA,
    borderRadius: 8,
    padding: scale(12),
    marginBottom: verticalScale(12),
    borderWidth: 1,
    borderColor: '#1e295d',
  },
  profesorAvatar: {
    width: scale(48),
    height: scale(48),
    borderRadius: scale(24),
    backgroundColor: Colors.superficieB,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    marginRight: scale(10),
  },
  avatarImg: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  profesorInfo: {
    flex: 1,
  },
  profesorNombre: {
    fontFamily: Fonts.spaceGroteskBold,
    color: Colors.blanco,
    fontSize: moderateScale(13),
  },
  profesorMaterias: {
    fontFamily: Fonts.rubikRegular,
    color: '#aaa',
    fontSize: moderateScale(11),
    marginTop: 2,
  },
  profesorRating: {
    marginTop: 4,
  },
  btnVerPerfil: {
    borderWidth: 1,
    borderColor: '#aaa',
    borderRadius: 4,
    paddingVertical: 5,
    paddingHorizontal: 10,
  },
  btnVerPerfilText: {
    fontFamily: Fonts.spaceGroteskBold,
    color: '#aaa',
    fontSize: moderateScale(9),
  },
  mapaSection: {
    flex: 1,
  },
  mapaScrollContent: {
    paddingHorizontal: scale(24),
    paddingBottom: verticalScale(30),
  },
  mapaContainer: {
    position: 'relative',
    marginBottom: verticalScale(4),
  },
  mapa: {
    height: verticalScale(200),
    borderRadius: 12,
    overflow: 'hidden',
  },
  miniCard: {
    position: 'absolute',
    bottom: scale(8),
    left: scale(8),
    right: scale(8),
    backgroundColor: '#162b4e',
    borderRadius: 12,
    padding: scale(12),
    borderWidth: 1,
    borderColor: '#16f0d6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 8,
  },
  miniCardClose: {
    position: 'absolute',
    top: scale(8),
    right: scale(8),
    zIndex: 1,
    padding: 4,
  },
  miniCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(10),
  },
  miniCardAvatar: {
    width: scale(42),
    height: scale(42),
    borderRadius: scale(21),
    backgroundColor: '#16f0d6',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  miniCardInitials: {
    fontFamily: Fonts.spaceGroteskBold,
    color: '#0d1232',
    fontSize: moderateScale(13),
    fontWeight: 'bold',
  },
  miniCardNombre: {
    fontFamily: Fonts.spaceGroteskBold,
    color: Colors.blanco,
    fontSize: moderateScale(13),
  },
  miniCardMaterias: {
    fontFamily: Fonts.rubikRegular,
    color: '#8b93b8',
    fontSize: moderateScale(11),
    marginTop: 1,
  },
  miniCardRating: {
    fontFamily: Fonts.spaceGroteskBold,
    color: '#FFD700',
    fontSize: moderateScale(11),
  },
  miniCardBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: '#16f0d6',
    borderRadius: 8,
    paddingVertical: scale(8),
    paddingHorizontal: scale(10),
  },
  miniCardBtnText: {
    fontFamily: Fonts.spaceGroteskBold,
    color: '#0d1232',
    fontSize: moderateScale(11),
  },
  topProfCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.superficieA,
    borderRadius: 8,
    padding: scale(12),
    marginBottom: verticalScale(10),
    borderWidth: 1,
    borderColor: '#1e295d',
  },
  topProfAvatar: {
    width: scale(44),
    height: scale(44),
    borderRadius: scale(22),
    backgroundColor: Colors.superficieB,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    marginRight: scale(10),
  },
  topProfInfo: {
    flex: 1,
  },
  topProfNombre: {
    fontFamily: Fonts.spaceGroteskBold,
    color: Colors.blanco,
    fontSize: moderateScale(13),
  },
  topProfMaterias: {
    fontFamily: Fonts.rubikRegular,
    color: '#aaa',
    fontSize: moderateScale(11),
    marginTop: 1,
  },
  topProfRating: {
    fontFamily: Fonts.spaceGroteskBold,
    color: '#FFD700',
    fontSize: moderateScale(12),
  },
});
