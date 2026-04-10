
import { apiFetch } from '../utils/authUtils'; // Importa el wrapper de fetch que agrega JWT automáticamente y maneja respuestas HTTP de forma centralizada

const API_URL = 'http://localhost:3000/api/subcategories'; // URL base del backend para el recurso subcategorías; puerto 3000 donde corre el servidor Express

export const getSubcategories = async () => { // Función exportada para obtener todas las subcategorías activas del servidor
  return apiFetch(API_URL, { method: 'GET' }); // GET /api/subcategories — retorna array de subcategorías con su categoría padre; JWT se adjunta en el header
}; // Fin de getSubcategories

export const getSubcategoryById = async (id) => { // Función exportada para obtener una subcategoría específica por su ID de MongoDB
  return apiFetch(`${API_URL}/${id}`, { method: 'GET' }); // GET /api/subcategories/:id — retorna el objeto subcategoría con la referencia a su categoría padre
}; // Fin de getSubcategoryById

export const createSubcategory = async (subcategory) => { // Función exportada para crear una nueva subcategoría; recibe objeto con { name, category (id), description }
  return apiFetch(API_URL, { // Llama a POST /api/subcategories con los datos de la nueva subcategoría
    method: 'POST', // Método POST porque estamos creando un nuevo documento en la colección subcategorías de MongoDB
    body: subcategory // El objeto subcategory se serializa a JSON; el servidor valida que la categoría padre exista
  }); // apiFetch retorna la subcategoría creada con su _id asignado, o error si la categoría padre no existe
}; // Fin de createSubcategory

export const updateSubcategory = async (id, subcategory) => { // Función exportada para actualizar una subcategoría; recibe el id y los campos a modificar
  return apiFetch(`${API_URL}/${id}`, { // Llama a PUT /api/subcategories/:id con los nuevos datos
    method: 'PUT', // Método PUT para modificar los campos del documento en la base de datos
    body: subcategory // Objeto con los campos actualizados; puede incluir cambio de categoría padre
  }); // apiFetch retorna la subcategoría actualizada o error si el id no existe en la base de datos
}; // Fin de updateSubcategory

export const deleteSubcategory = async (id) => { // Función exportada para eliminar o desactivar una subcategoría por su id
  return apiFetch(`${API_URL}/${id}`, { // Llama a DELETE /api/subcategories/:id
    method: 'DELETE' // Método DELETE; el backend puede realizar soft delete (active: false) según la lógica del servidor
  }); // apiFetch retorna mensaje de confirmación o error 404 si la subcategoría no existe
}; // Fin de deleteSubcategory
