import { useCallback, useMemo, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, ActivityIndicator, RefreshControl } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { scale, verticalScale, moderateScale } from 'react-native-size-matters';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../../constants/colors';
import { Fonts } from '../../../constants/fonts';
import { obtenerChats } from '../../../services/apiService';
import { useProfesor } from '../../../hooks/use-profesor';

type FiltroChat = 'todos' | 'sinLeer' | 'solicitudes';

function formatHora(fechaIso: string) {
  const fecha = new Date(fechaIso);
  return fecha.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
}

export default function ProfesorChats() {
  const router = useRouter();
  const { profesorId, loading: loadingUsuario } = useProfesor();

  const [loadingChats, setLoadingChats] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [chats, setChats] = useState<any[]>([]);
  const [filtro, setFiltro] = useState<FiltroChat>('todos');

  const loadChats = useCallback(async (id: number, isRefresh = false) => {
    if (!isRefresh) setLoadingChats(true);
    try {
      const data = await obtenerChats(id);
      setChats(data);
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'No se pudieron cargar los chats.');
    } finally {
      setLoadingChats(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (profesorId) loadChats(profesorId);
    }, [profesorId, loadChats])
  );

  const handleRefresh = useCallback(() => {
    if (profesorId) {
      setRefreshing(true);
      loadChats(profesorId, true);
    }
  }, [profesorId, loadChats]);

  const chatsFiltrados = useMemo(() => {
    const ordenados = [...chats].sort((a, b) =>
      new Date(b.fechaUltimoMensaje).getTime() - new Date(a.fechaUltimoMensaje).getTime()
    );
    if (filtro === 'sinLeer') return ordenados.filter(c => c.noLeidos > 0);
    if (filtro === 'solicitudes') return ordenados.filter(c => c.esSolicitud);
    return ordenados;
  }, [chats, filtro]);

  if (loadingUsuario || loadingChats) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.cian} />
      </View>
    );
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
        ] as { key: FiltroChat; label: string }[]).map(f => (
          <TouchableOpacity
            key={f.key}
            style={[styles.filtroChip, filtro === f.key && styles.filtroChipActivo]}
            onPress={() => setFiltro(f.key)}
          >
            <Text style={[styles.filtroChipText, filtro === f.key && styles.filtroChipTextActivo]}>
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={chatsFiltrados}
        keyExtractor={item => String(item.conversacionId)}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={<Text style={styles.vacioText}>No hay conversaciones para mostrar.</Text>}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={Colors.cian} colors={[Colors.cian]} />
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.chatCard}
            activeOpacity={0.75}
            onPress={() => router.push({
              pathname: '/profesor/chat-detail',
              params: { conversacionId: item.conversacionId, alumnoNombre: item.alumnoNombre }
            })}
          >
            <View style={styles.avatar}>
              <Ionicons name="person" size={scale(20)} color={Colors.cian} />
            </View>
            <View style={styles.chatInfo}>
              <View style={styles.chatInfoTop}>
                <Text style={styles.chatNombre}>{item.alumnoNombre}</Text>
                <Text style={styles.chatHora}>{formatHora(item.fechaUltimoMensaje)}</Text>
              </View>
              <Text style={[styles.chatUltimoMensaje, item.noLeidos > 0 && styles.chatUltimoMensajeNoLeido]} numberOfLines={1}>
                {item.ultimoMensaje}
              </Text>
              {item.esSolicitud && (
                <Text style={styles.badgeSolicitud}>Solicitud de clase</Text>
              )}
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
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    paddingHorizontal: scale(24),
    paddingTop: verticalScale(30),
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  wiser: {
    fontFamily: Fonts.spaceGroteskBold,
    fontSize: moderateScale(32),
    color: '#3455ff',
    textAlign: 'center',
    marginBottom: verticalScale(4),
  },
  titulo: {
    fontFamily: Fonts.spaceGroteskMedium,
    fontSize: moderateScale(16),
    color: Colors.blanco,
    textAlign: 'center',
    marginBottom: verticalScale(16),
  },
  filtrosRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: verticalScale(16),
  },
  filtroChip: {
    paddingVertical: scale(8),
    paddingHorizontal: scale(14),
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#1e295d',
    backgroundColor: Colors.superficieA,
  },
  filtroChipActivo: {
    backgroundColor: Colors.cian,
    borderColor: Colors.cian,
  },
  filtroChipText: {
    fontFamily: Fonts.rubikMedium,
    color: Colors.blanco,
    fontSize: moderateScale(12),
  },
  filtroChipTextActivo: {
    color: Colors.background,
  },
  listContent: {
    paddingBottom: verticalScale(40),
  },
  vacioText: {
    fontFamily: Fonts.rubikRegular,
    color: '#aaa',
    fontSize: moderateScale(13),
    textAlign: 'center',
    marginTop: verticalScale(20),
  },
  chatCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.superficieA,
    borderRadius: 8,
    padding: scale(12),
    marginBottom: verticalScale(10),
    borderWidth: 1,
    borderColor: '#1e295d',
  },
  avatar: {
    width: scale(42),
    height: scale(42),
    borderRadius: scale(21),
    backgroundColor: Colors.superficieB,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: scale(12),
  },
  chatInfo: {
    flex: 1,
  },
  chatInfoTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  chatNombre: {
    fontFamily: Fonts.spaceGroteskBold,
    color: Colors.blanco,
    fontSize: moderateScale(13),
  },
  chatHora: {
    fontFamily: Fonts.rubikRegular,
    color: '#8b93b8',
    fontSize: moderateScale(10),
  },
  chatUltimoMensaje: {
    fontFamily: Fonts.rubikRegular,
    color: '#aaa',
    fontSize: moderateScale(12),
    marginTop: 2,
  },
  chatUltimoMensajeNoLeido: {
    color: Colors.blanco,
    fontFamily: Fonts.rubikMedium,
  },
  badgeSolicitud: {
    fontFamily: Fonts.rubikMedium,
    color: '#ffb020',
    fontSize: moderateScale(10),
    marginTop: 4,
  },
  badgeNoLeidos: {
    backgroundColor: Colors.cian,
    minWidth: scale(20),
    height: scale(20),
    borderRadius: scale(10),
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    marginLeft: scale(8),
  },
  badgeNoLeidosText: {
    fontFamily: Fonts.spaceGroteskBold,
    color: Colors.background,
    fontSize: moderateScale(10),
  },
});
