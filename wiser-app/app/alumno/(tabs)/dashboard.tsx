import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  FlatList, ScrollView, ActivityIndicator, Image, Alert,
  Dimensions
} from 'react-native';
import { useRouter } from 'expo-router';
import { scale, verticalScale, moderateScale } from 'react-native-size-matters';
import { Ionicons } from '@expo/vector-icons';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import { Colors } from '../../../constants/colors';
import { Fonts } from '../../../constants/fonts';
import { buscarProfesores, obtenerMaterias } from '../../../services/apiService';
import { useAlumno } from '../../../hooks/use-alumno';

const SCREEN_HEIGHT = Dimensions.get('window').height;
const UTN_RESISTENCIA = { latitude: -27.4516, longitude: -58.9877 };

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
  const { nombre, loading: loadingUsuario } = useAlumno();

  const [profesores, setProfesores] = useState<any[]>([]);
  const [materias, setMaterias] = useState<string[]>([]);
  const [loadingProfesores, setLoadingProfesores] = useState(false);

  const [searchText, setSearchText] = useState('');
  const [materiaSeleccionada, setMateriaSeleccionada] = useState<string | null>(null);

  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const mapRef = useRef<MapView>(null);

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

      // Request location permission
      const perm = await Location.requestForegroundPermissionsAsync();
      if (perm.status === 'granted') {
        const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        const loc = { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
        setUserLocation(loc);
        mapRef.current?.animateToRegion({ ...loc, latitudeDelta: 0.05, longitudeDelta: 0.05 }, 800);
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
        <View style={styles.mapaSection}>
          <Text style={[styles.seccionLabel, { paddingHorizontal: scale(24) }]}>Explorá la zona</Text>
          <MapView
            ref={mapRef}
            style={styles.mapa}
            provider={PROVIDER_GOOGLE}
            initialRegion={{
              ...(userLocation || UTN_RESISTENCIA),
              latitudeDelta: 0.08,
              longitudeDelta: 0.08,
            }}
            showsUserLocation
          >
            {profesoresConUbicacion.map(prof => (
              <Marker
                key={prof.id}
                coordinate={{ latitude: Number(prof.latitud), longitude: Number(prof.longitud) }}
                title={`${prof.nombre} ${prof.apellido}`}
                description={prof.materias?.map((m: any) => m.nombre).join(', ')}
                onCalloutPress={() =>
                  router.push({ pathname: '/alumno/perfil-profesor', params: { profesorId: String(prof.id) } })
                }
              />
            ))}
          </MapView>
        </View>
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
  mapa: {
    flex: 1,
  },
});
