
import { apiFetch } from '../utils/authUtils'; // Importa el wrapper de fetch que inyecta el JWT y centraliza el manejo de errores y sesiones expiradas

const API_URL = 'http://localhost:3000/api/users'; // URL base del backend para el recurso usuarios; el servidor Express escucha en puerto 3000

export const getUsers = async () => { // Función exportada para obtener la lista de todos los usuarios; requiere rol admin o coordinador
  return apiFetch(API_URL, { method: 'GET' }); // GET /api/users — retorna array de usuarios; el JWT se adjunta automáticamente en el header Authorization
}; // Fin de getUsers

export const getUserById = async (id) => { // Función exportada para obtener un usuario específico por su ID de MongoDB
  return apiFetch(`${API_URL}/${id}`, { method: 'GET' }); // GET /api/users/:id — retorna el objeto usuario sin la contraseña, o 404 si no existe
}; // Fin de getUserById

export const createUser = async (user) => { // Función exportada para crear un nuevo usuario desde el panel admin; recibe { username, email, password, role }
  return apiFetch(API_URL, { // Llama a POST /api/users con los datos del nuevo usuario
    method: 'POST', // Método POST porque estamos insertando un nuevo documento en la colección users de MongoDB
    body: user // El objeto user se serializa a JSON; el servidor hashea la contraseña con bcryptjs antes de guardar
  }); // apiFetch retorna el usuario creado (sin contraseña) con su _id, o error si el email/username ya existe
}; // Fin de createUser

export const updateUser = async (id, user) => { // Función exportada para actualizar datos de un usuario existente; recibe el id y los campos a modificar
  return apiFetch(`${API_URL}/${id}`, { // Llama a PUT /api/users/:id con los datos actualizados
    method: 'PUT', // Método PUT para modificar el documento del usuario en la base de datos
    body: user // Objeto con campos a actualizar; si incluye password, el servidor la re-hashea con bcryptjs
  }); // apiFetch retorna el usuario actualizado o error si el id no existe o hay conflicto de username/email
}; // Fin de updateUser

export const deleteUser = async (id) => { // Función exportada para eliminar o desactivar un usuario por su id
  return apiFetch(`${API_URL}/${id}`, { // Llama a DELETE /api/users/:id
    method: 'DELETE' // Método DELETE; el backend aplica soft delete (active: false) para preservar historial
  }); // apiFetch retorna mensaje de confirmación o error si el usuario no existe o no se tienen permisos
}; // Fin de deleteUser
