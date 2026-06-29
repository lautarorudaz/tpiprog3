const BASE_URL = "http://localhost:5000/api";

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

export const obtenerMaterias = async () => {
  const response = await fetch(`${BASE_URL}/materia`);
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