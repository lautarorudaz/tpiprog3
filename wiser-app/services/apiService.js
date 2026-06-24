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
  return response.json();
};