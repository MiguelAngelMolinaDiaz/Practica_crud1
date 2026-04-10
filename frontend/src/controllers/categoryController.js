
import { apiFetch } from '../utils/authUtils'; // Importa el wrapper de fetch que inyecta el JWT y maneja errores HTTP automáticamente

const API_URL = 'http://localhost:3000/api/categories'; // URL base del backend para el recurso categorías; apunta al servidor Express en puerto 3000

export const getCategories = async () => { // Función exportada para obtener todas las categorías activas del servidor
  return apiFetch(API_URL, { method: 'GET' }); // GET /api/categories — retorna array de categorías; el JWT se agrega en el header Authorization
}; // Fin de getCategories

export const getCategoryById = async (id) => { // Función exportada para obtener una categoría específica por su ID de MongoDB
  return apiFetch(`${API_URL}/${id}`, { method: 'GET' }); // GET /api/categories/:id — retorna un objeto categoría o 404 si no existe
}; // Fin de getCategoryById

export const createCategory = async (category) => { // Función exportada para crear una nueva categoría; recibe objeto con { name, description }
  return apiFetch(API_URL, { // Llama a POST /api/categories con los datos de la nueva categoría
    method: 'POST', // Método POST porque estamos creando un nuevo documento en la base de datos
    body: category // El objeto category se serializa a JSON; el servidor valida nombre único antes de guardar
  }); // apiFetch retorna la categoría recién creada con su _id asignado por MongoDB
}; // Fin de createCategory

export const updateCategory = async (id, category) => { // Función exportada para actualizar una categoría existente; recibe el id y los campos a modificar
  return apiFetch(`${API_URL}/${id}`, { // Llama a PUT /api/categories/:id con los datos actualizados
    method: 'PUT', // Método PUT porque estamos reemplazando/actualizando un recurso existente
    body: category // Objeto con los campos actualizados; solo se modifican los campos enviados
  }); // apiFetch retorna la categoría actualizada o error si el id no existe
}; // Fin de updateCategory

export const deleteCategory = async (id) => { // Función exportada para eliminar (o desactivar) una categoría por su id
  return apiFetch(`${API_URL}/${id}`, { // Llama a DELETE /api/categories/:id
    method: 'DELETE' // Método DELETE; el backend puede hacer soft delete (active: false) o hard delete
  }); // apiFetch retorna mensaje de confirmación o error si la categoría no existe
}; // Fin de deleteCategory
