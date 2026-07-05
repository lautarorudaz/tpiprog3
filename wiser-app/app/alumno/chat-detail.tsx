import { useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, ActivityIndicator, Alert
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { scale, verticalScale, moderateScale } from 'react-native-size-matters';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { Fonts } from '../../constants/fonts';
import { obtenerMensajes, enviarMensaje } from '../../services/apiService';
import { useAlumno } from '../../hooks/use-alumno';

export default function AlumnoChatDetail() {
  const router = useRouter();
  const { conversacionId, interlocutorNombre } = useLocalSearchParams<{ conversacionId: string; interlocutorNombre: string }>();
  const { usuarioId, loading: loadingAlumno } = useAlumno();

  const [mensajes, setMensajes] = useState<any[]>([]);
  const [texto, setTexto] = useState('');
  const [loading, setLoading] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const listRef = useRef<FlatList>(null);

  const loadMensajes = async (silent = false) => {
    try {
      const data = await obtenerMensajes(Number(conversacionId), usuarioId ?? null);
      setMensajes(data);
    } catch {
      if (!silent) Alert.alert('Error', 'No se pudieron cargar los mensajes.');
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    if (conversacionId) loadMensajes();
  }, [conversacionId]);

  useEffect(() => {
    if (!conversacionId) return;
    const interval = setInterval(() => loadMensajes(true), 5000);
    return () => clearInterval(interval);
  }, [conversacionId, usuarioId]);

  const handleEnviar = async () => {
    const contenido = texto.trim();
    if (!contenido || !usuarioId) return;
    setEnviando(true);
    setTexto('');
    try {
      const nuevo = await enviarMensaje(Number(conversacionId), usuarioId, contenido);
      setMensajes(prev => [...prev, nuevo]);
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
    } catch {
      Alert.alert('Error', 'No se pudo enviar el mensaje.');
    } finally {
      setEnviando(false);
    }
  };

  if (loading || loadingAlumno) {
    return <View style={styles.loading}><ActivityIndicator size="large" color={Colors.cian} /></View>;
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color={Colors.blanco} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{interlocutorNombre}</Text>
        <View style={{ width: 24 }} />
      </View>
      <FlatList
        ref={listRef}
        data={mensajes}
        keyExtractor={item => String(item.id)}
        contentContainerStyle={styles.listContent}
        onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
        renderItem={({ item }) => {
          const esPropio = item.remitenteId === usuarioId;
          return (
            <View style={[styles.burbuja, esPropio ? styles.burbujaPropia : styles.burbujaAjena]}>
              <Text style={styles.burbujaTexto}>{item.contenido}</Text>
              <Text style={styles.burbujaHora}>
                {new Date(item.enviadoEn).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
              </Text>
            </View>
          );
        }}
      />
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          placeholder="Escribí un mensaje..."
          placeholderTextColor="#aaa"
          value={texto}
          onChangeText={setTexto}
          multiline
        />
        <TouchableOpacity style={styles.sendBtn} onPress={handleEnviar} disabled={enviando || !texto.trim()}>
          <Ionicons name="send" size={18} color={Colors.background} />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  loading: { flex: 1, backgroundColor: Colors.background, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: scale(16), paddingTop: verticalScale(50), paddingBottom: verticalScale(14), borderBottomWidth: 1, borderBottomColor: '#1e295d' },
  headerTitle: { fontFamily: Fonts.spaceGroteskBold, color: Colors.blanco, fontSize: moderateScale(16) },
  listContent: { padding: scale(16), gap: 8 },
  burbuja: { maxWidth: '78%', borderRadius: 12, paddingHorizontal: scale(12), paddingVertical: scale(8), marginBottom: 8 },
  burbujaPropia: { backgroundColor: Colors.cian, alignSelf: 'flex-end', borderBottomRightRadius: 2 },
  burbujaAjena: { backgroundColor: Colors.superficieA, alignSelf: 'flex-start', borderBottomLeftRadius: 2 },
  burbujaTexto: { fontFamily: Fonts.rubikRegular, color: Colors.blanco, fontSize: moderateScale(13) },
  burbujaHora: { fontFamily: Fonts.rubikRegular, color: 'rgba(255,255,255,0.6)', fontSize: moderateScale(9), marginTop: 4, textAlign: 'right' },
  inputRow: { flexDirection: 'row', alignItems: 'flex-end', paddingHorizontal: scale(16), paddingVertical: verticalScale(10), borderTopWidth: 1, borderTopColor: '#1e295d', gap: 10 },
  input: { flex: 1, backgroundColor: Colors.superficieB, borderRadius: 20, paddingHorizontal: scale(14), paddingVertical: scale(10), color: Colors.blanco, fontFamily: Fonts.rubikRegular, fontSize: moderateScale(13), maxHeight: verticalScale(100) },
  sendBtn: { width: scale(38), height: scale(38), borderRadius: scale(19), backgroundColor: Colors.cian, justifyContent: 'center', alignItems: 'center' },
});
