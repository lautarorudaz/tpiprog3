import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'expo-router';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../services/firebase';
import { obtenerUsuarioPorFirebase } from '../services/apiService';

export function useAlumno() {
  const router = useRouter();
  const [usuario, setUsuario] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    const data = await obtenerUsuarioPorFirebase(uid);
    setUsuario(data);
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        setLoading(false);
        router.replace('/');
        return;
      }
      try {
        const data = await obtenerUsuarioPorFirebase(currentUser.uid);
        setUsuario(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    });
    return unsubscribe;
  }, [router]);

  return {
    usuario,
    alumnoId: usuario?.alumno?.id ?? null,
    usuarioId: usuario?.id ?? null,
    nombre: usuario?.nombre || 'Alumno',
    fotoPerfil: usuario?.fotoPerfil ?? null,
    loading,
    reload,
  };
}
