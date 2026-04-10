
import { apiFetch } from '../utils/authUtils'; // Importa el wrapper de fetch que agrega el JWT y centraliza el manejo de errores HTTP

const API_URL = 'http://localhost:3000/api/products'; // URL base del backend para el recurso productos; el servidor Express corre en puerto 3000

export const getProducts = async () => { // Función exportada para obtener todos los productos activos del servidor
  return apiFetch(API_URL, { method: 'GET' }); // GET /api/products — retorna array de productos; el JWT del usuario se adjunta automáticamente
}; // Fin de getProducts

export const getProductById = async (id) => { // Función exportada para obtener un producto específico usando su ID de MongoDB
  return apiFetch(`${API_URL}/${id}`, { method: 'GET' }); // GET /api/products/:id — retorna objeto producto con sus datos o 404 si no existe
}; // Fin de getProductById

export const createProduct = async (product) => { // Función exportada para crear un nuevo producto; recibe objeto con { name, price, category, subcategory, etc. }
  return apiFetch(API_URL, { // Llama a POST /api/products con los datos del nuevo producto
    method: 'POST', // Método POST porque estamos insertando un nuevo documento en MongoDB
    body: product // El objeto producto se serializa a JSON; el servidor valida nombre único y referencias de categoría
  }); // apiFetch retorna el producto recién creado con _id asignado por MongoDB
}; // Fin de createProduct

export const updateProduct = async (id, product) => { // Función exportada para actualizar un producto existente; recibe el id y los campos modificados
  return apiFetch(`${API_URL}/${id}`, { // Llama a PUT /api/products/:id con los datos actualizados
    method: 'PUT', // Método PUT para reemplazar/modificar los campos del producto en la base de datos
    body: product // Objeto con los campos a actualizar; campos no incluidos conservan su valor anterior
  }); // apiFetch retorna el producto actualizado o error si el id no corresponde a ningún documento
}; // Fin de updateProduct

export const deleteProduct = async (id) => { // Función exportada para eliminar o desactivar un producto por su id
  return apiFetch(`${API_URL}/${id}`, { // Llama a DELETE /api/products/:id
    method: 'DELETE' // Método DELETE; el backend aplica soft delete (active: false) o hard delete según el query param
  }); // apiFetch retorna mensaje de confirmación del servidor o error si el producto no existe
}; // Fin de deleteProduct
