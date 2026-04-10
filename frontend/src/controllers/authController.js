import { apiFetch } from '../utils/authUtils'; // Importa el wrapper de fetch que agrega el JWT automáticamente en cada petición

const API_URL = 'http://localhost:3000/api/auth'; // URL base del backend para rutas de autenticación; puerto 3000 es el servidor Express

export const login = async (credentials) => { // Función exportada para iniciar sesión; recibe { username, password }
  return apiFetch(`${API_URL}/signin`, { // Llama a POST /api/auth/signin con las credenciales del usuario
    method: 'POST', // Método HTTP POST porque estamos enviando datos al servidor
    body: credentials // El objeto credentials se serializa a JSON automáticamente en apiFetch
  }); // apiFetch retorna la respuesta parseada del servidor (incluye token y datos del usuario)
}; // Fin de la función login

export const register = async (user) => { // Función exportada para registrar un nuevo usuario; recibe datos del formulario
  return apiFetch(`${API_URL}/signup`, { // Llama a POST /api/auth/signup con los datos del nuevo usuario
    method: 'POST', // Método HTTP POST porque estamos creando un nuevo recurso en el servidor
    body: user // El objeto user (username, email, password, role) se serializa a JSON en apiFetch
  }); // apiFetch retorna la respuesta del servidor con el mensaje de éxito o error
}; // Fin de la función register
