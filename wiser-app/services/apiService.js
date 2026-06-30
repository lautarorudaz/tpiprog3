const BASE_URL = "http://192.168.100.24:5000/api";

export const registrarUsuarioEnBD = async (firebaseUid, email, nombre, apellido, rol) => {
  const response = await fetch(`${BASE_URL}/usuario/registro`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ firebaseUid, email, nombre, apellido, rol })
  });
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Error ${response.status}: ${errorText}`);
  }
  return response.json();
};

export const obtenerUsuarioPorFirebase = async (firebaseUid) => {
  const response = await fetch(`${BASE_URL}/usuario/firebase/${firebaseUid}`);
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Error ${response.status}: ${errorText}`);
  }
  return response.json();
};

export const editarCuentaUsuario = async (usuarioId, data) => {
  const response = await fetch(`${BASE_URL}/usuario/${usuarioId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Error ${response.status}: ${errorText}`);
  }
  return response.json();
};

export const obtenerMaterias = async () => {
  const response = await fetch(`${BASE_URL}/materia`);
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Error ${response.status}: ${errorText}`);
  }
  return response.json();
};

export const obtenerPerfilProfesor = async (profesorId) => {
  const response = await fetch(`${BASE_URL}/profesor/${profesorId}`);
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Error ${response.status}: ${errorText}`);
  }
  return response.json();
};

export const actualizarPerfilProfesor = async (profesorId, data) => {
  const response = await fetch(`${BASE_URL}/profesor/${profesorId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Error ${response.status}: ${errorText}`);
  }
  return response.json();
};

export const obtenerTurnosProfesor = async (profesorId) => {
  const response = await fetch(`${BASE_URL}/turno/profesor/${profesorId}`);
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Error ${response.status}: ${errorText}`);
  }
  return response.json();
};

export const actualizarEstadoTurno = async (turnoId, estado) => {
  const response = await fetch(`${BASE_URL}/turno/${turnoId}/estado`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ estado })
  });
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Error ${response.status}: ${errorText}`);
  }
  return response.json();
};

export const obtenerChats = async (profesorId) => {
  const response = await fetch(`${BASE_URL}/chat/profesor/${profesorId}`);
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Error ${response.status}: ${errorText}`);
  }
  return response.json();
};

export const obtenerMensajes = async (conversacionId) => {
  const response = await fetch(`${BASE_URL}/chat/${conversacionId}/mensajes`);
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Error ${response.status}: ${errorText}`);
  }
  return response.json();
};

export const enviarMensaje = async (conversacionId, remitenteId, contenido) => {
  const response = await fetch(`${BASE_URL}/chat/mensaje`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ conversacionId, remitenteId, contenido })
  });
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Error ${response.status}: ${errorText}`);
  }
  return response.json();
};

// ── Alumno ────────────────────────────────────────────────────────────────

export const obtenerPerfilAlumno = async (alumnoId) => {
  const response = await fetch(`${BASE_URL}/alumno/${alumnoId}`);
  if (!response.ok) throw new Error(`Error ${response.status}: ${await response.text()}`);
  return response.json();
};

export const editarPerfilAlumno = async (alumnoId, data) => {
  const response = await fetch(`${BASE_URL}/alumno/${alumnoId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });
  if (!response.ok) throw new Error(`Error ${response.status}: ${await response.text()}`);
  return response.json();
};

export const obtenerTurnosAlumno = async (alumnoId) => {
  const response = await fetch(`${BASE_URL}/turno/alumno/${alumnoId}`);
  if (!response.ok) throw new Error(`Error ${response.status}: ${await response.text()}`);
  return response.json();
};

export const obtenerChatsAlumno = async (alumnoId) => {
  const response = await fetch(`${BASE_URL}/chat/alumno/${alumnoId}`);
  if (!response.ok) throw new Error(`Error ${response.status}: ${await response.text()}`);
  return response.json();
};

// ── Profesores ────────────────────────────────────────────────────────────

export const buscarProfesores = async (params = {}) => {
  const query = new URLSearchParams(
    Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== ''))
  ).toString();
  const url = `${BASE_URL}/profesor${query ? `?${query}` : ''}`;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Error ${response.status}: ${await response.text()}`);
  return response.json();
};

export const obtenerDatosBancariosProfesor = async (profesorId) => {
  const response = await fetch(`${BASE_URL}/profesor/${profesorId}/datosbancarios`);
  if (response.status === 404) return null;
  if (!response.ok) throw new Error(`Error ${response.status}: ${await response.text()}`);
  return response.json();
};

export const obtenerValoracionesProfesor = async (profesorId) => {
  const response = await fetch(`${BASE_URL}/valoracion/profesor/${profesorId}`);
  if (!response.ok) throw new Error(`Error ${response.status}: ${await response.text()}`);
  return response.json();
};

// ── Turno / Agendamiento ──────────────────────────────────────────────────

export const obtenerDisponiblesProfesor = async (profesorId) => {
  const response = await fetch(`${BASE_URL}/turno/disponibles/${profesorId}`);
  if (!response.ok) throw new Error(`Error ${response.status}: ${await response.text()}`);
  return response.json();
};

export const crearTurno = async (data) => {
  const response = await fetch(`${BASE_URL}/turno`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });
  if (!response.ok) throw new Error(`Error ${response.status}: ${await response.text()}`);
  return response.json();
};

export const subirComprobante = async (turnoId, comprobanteUrl) => {
  const response = await fetch(`${BASE_URL}/turno/${turnoId}/comprobante`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ comprobanteUrl })
  });
  if (!response.ok) throw new Error(`Error ${response.status}: ${await response.text()}`);
  return response.json();
};

export const crearValoracion = async (data) => {
  const response = await fetch(`${BASE_URL}/valoracion`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });
  if (!response.ok) throw new Error(`Error ${response.status}: ${await response.text()}`);
  return response.json();
};