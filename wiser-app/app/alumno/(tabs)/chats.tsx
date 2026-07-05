import { useCallback, useMemo, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, ActivityIndicator, RefreshControl } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { scale, verticalScale, moderateScale } from 'react-native-size-matters';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../../constants/colors';
import { Fonts } from '../../../constants/fonts';
import { obtenerChatsAlumno } from '../../../services/apiService';
import { useAlumno } from '../../../hooks/use-alumno';

type Filtro = 'todos' | 'sinLeer' | 'solicitudes';

export default function AlumnoChats() {
  const router = useRouter();
  const { alumnoId, loading: loadingAlumno } = useAlumno();
  const [chats, setChats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filtro, setFiltro] = useState<Filtro>('todos');

  const loadChats = useCallback(async (id: number, isRefresh = false) => {
    if (!isRefresh) setLoading(true);
    try {
      const data = await obtenerChatsAlumno(id);
      setChats(data);
    } catch {
      Alert.alert('Error', 'No se pudieron cargar los chats.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (alumnoId) loadChats(alumnoId);
    }, [alumnoId, loadChats])
  );

  const handleRefresh = useCallback(() => {
    if (alumnoId) {
      setRefreshing(true);
      loadChats(alumnoId, true);
    }
  }, [alumnoId, loadChats]);

  const chatsFiltrados = useMemo(() => {
    const ord = [...chats].sort((a, b) =>
      new Date(b.fechaUltimoMensaje).getTime() - new Date(a.fechaUltimoMensaje).getTime()
    );
    if (filtro === 'sinLeer') return ord.filter(c => c.noLeidos > 0);
    if (filtro === 'solicitudes') return ord.filter(c => c.esSolicitud);
    return ord;
  }, [chats, filtro]);

  if (loadingAlumno || loading) {
    return <View style={styles.loading}><ActivityIndicator size="large" color={Colors.cian} /></View>;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.wiser}>Wiser</Text>
      <Text style={styles.titulo}>Chats</Text>

      <View style={styles.filtrosRow}>
        {([
          { key: 'todos', label: 'Todos' },
          { key: 'sinLeer', label: 'Sin leer' },
          { key: 'solicitudes', label: 'Solicitudes' },
        ] as { key: Filtro; label: string }[]).map(f => (
          <TouchableOpacity
            key={f.key}
            style={[styles.chip, filtro === f.key && styles.chipActivo]}
            onPress={() => setFiltro(f.key)}
          >
            <Text style={[styles.chipText, filtro === f.key && styles.chipTextActivo]}>{f.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={chatsFiltrados}
        keyExtractor={item => String(item.conversacionId)}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={<Text style={styles.vacio}>No hay conversaciones para mostrar.</Text>}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={Colors.cian} colors={[Colors.cian]} />
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.chatCard}
            activeOpacity={0.75}
            onPress={() => router.push({
              pathname: '/alumno/chat-detail',
              params: { conversacionId: item.conversacionId, interlocutorNombre: item.profesorNombre }
            })}
          >
            <View style={styles.avatar}>
              <Ionicons name="person" size={scale(20)} color={Colors.cian} />
            </View>
            <View style={styles.chatInfo}>
              <View style={styles.chatTop}>
                <Text style={styles.chatNombre}>{item.profesorNombre}</Text>
                <Text style={styles.chatHora}>
                  {new Date(item.fechaUltimoMensaje).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
                </Text>
              </View>
              <Text style={[styles.ultimoMensaje, item.noLeidos > 0 && styles.ultimoMensajeNoLeido]} numberOfLines={1}>
                {item.ultimoMensaje}
              </Text>
              {item.esSolicitud && <Text style={styles.badgeSolicitud}>Solicitud de clase</Text>}
            </View>
            {item.noLeidos > 0 && (
              <View style={styles.badgeNoLeidos}>
                <Text style={styles.badgeNoLeidosText}>{item.noLeidos}</Text>
              </View>
            )}
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background, paddingHorizontal: scale(24), paddingTop: verticalScale(30) },
  loading: { flex: 1, backgroundColor: Colors.background, justifyContent: 'center', alignItems: 'center' },
  wiser: { fontFamily: Fonts.spaceGroteskBold, fontSize: moderateScale(32), color: '#3455ff', textAlign: 'center', marginBottom: verticalScale(4) },
  titulo: { fontFamily: Fonts.spaceGroteskMedium, fontSize: moderateScale(16), color: Colors.blanco, textAlign: 'center', marginBottom: verticalScale(16) },
  filtrosRow: { flexDirection: 'row', gap: 8, marginBottom: verticalScale(16) },
  chip: { paddingVertical: scale(8), paddingHorizontal: scale(14), borderRadius: 20, borderWidth: 1, borderColor: '#1e295d', backgroundColor: Colors.superficieA },
  chipActivo: { backgroundColor: Colors.cian, borderColor: Colors.cian },
  chipText: { fontFamily: Fonts.rubikMedium, color: Colors.blanco, fontSize: moderateScale(12) },
  chipTextActivo: { color: Colors.background },
  listContent: { paddingBottom: 40 },
  vacio: { fontFamily: Fonts.rubikRegular, color: '#aaa', fontSize: moderateScale(13), textAlign: 'center', marginTop: 20 },
  chatCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.superficieA, borderRadius: 8, padding: scale(12), marginBottom: verticalScale(10), borderWidth: 1, borderColor: '#1e295d' },
  avatar: { width: scale(42), height: scale(42), borderRadius: scale(21), backgroundColor: Colors.superficieB, justifyContent: 'center', alignItems: 'center', marginRight: scale(12) },
  chatInfo: { flex: 1 },
  chatTop: { flexDirection: 'row', justifyContent: 'space-between' },
  chatNombre: { fontFamily: Fonts.spaceGroteskBold, color: Colors.blanco, fontSize: moderateScale(13) },
  chatHora: { fontFamily: Fonts.rubikRegular, color: '#8b93b8', fontSize: moderateScale(10) },
  ultimoMensaje: { fontFamily: Fonts.rubikRegular, color: '#aaa', fontSize: moderateScale(12), marginTop: 2 },
  ultimoMensajeNoLeido: { color: Colors.blanco, fontFamily: Fonts.rubikMedium },
  badgeSolicitud: { fontFamily: Fonts.rubikMedium, color: '#ffb020', fontSize: moderateScale(10), marginTop: 4 },
  badgeNoLeidos: { backgroundColor: Colors.cian, minWidth: scale(20), height: scale(20), borderRadius: scale(10), justifyContent: 'center', alignItems: 'center', paddingHorizontal: 4, marginLeft: scale(8) },
  badgeNoLeidosText: { fontFamily: Fonts.spaceGroteskBold, color: Colors.background, fontSize: moderateScale(10) },
});
