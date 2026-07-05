// Cambiá esta IP por la de tu máquina cuando estés en otra red.
// Encontrala con: ipconfig (Windows) o ifconfig (Mac/Linux)
// El celular y la PC deben estar en la misma red WiFi.
const API_IP = "192.168.100.24";
const API_PORT = "5000";

export const BASE_URL = `http://${API_IP}:${API_PORT}/api`;
