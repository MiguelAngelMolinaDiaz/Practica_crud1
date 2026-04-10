/**
 * ========================================
 *  VISTA: FORMULARIO DE SUBCATEGORÍA
 * ========================================
 *
 * Componente React para crear y editar subcategorías con:
 *   - Modo crear (nuevo) o editar (existente)
 *   - Selector de categoría padre cargado desde el backend
 *   - Validación de campos requeridos
 *
 * Flujo:
 *   1. useEffect carga las categorías disponibles al montar
 *   2. handleChange sincroniza cambios en el estado del form
 *   3. handleSubmit detecta si es crear o editar por form._id
 *   4. Llama createSubcategory o updateSubcategory según el caso
 *
 * Props:
 *   - subcategory: Objeto subcategoría (null para crear, objeto para editar)
 *   - onSuccess: Callback cuando se guarda correctamente
 *   - onCancel: Callback para cancelar y volver a la lista
 */

import React, { useEffect, useState } from 'react'; // useEffect para cargar categorías al montar; useState para manejar estado del form
import { createSubcategory, updateSubcategory } from '../controllers/subcategoryController'; // Importa funciones CRUD de subcategorías
import { getCategories } from '../controllers/categoryController'; // Importa función para cargar las categorías del selector
import Subcategory from '../models/Subcategory'; // Clase modelo para inicializar el form con valores por defecto

export default function SubcategoryForm({ subcategory, onSuccess, onCancel }) { // Props: subcategory=null(crear) u objeto(editar), onSuccess y onCancel callbacks
  // Si viene subcategory (editar): copia sus datos. Si no (crear): instancia Subcategory vacía con defaults
  const [form, setForm] = useState(subcategory ? { ...subcategory } : new Subcategory()); // Estado del formulario; spread evita mutar el prop original
  const [categories, setCategories] = useState([]); // Array de categorías disponibles para el selector
  const [error, setError] = useState(null); // Mensaje de error del servidor; null cuando no hay errores
  const [loading, setLoading] = useState(false); // true mientras la petición al servidor está en progreso

  // Cargar lista de categorías al montar el componente para poblar el selector
  useEffect(() => {
    getCategories().then(response => { // Llama GET /api/categories para obtener todas las categorías activas
      const arr = Array.isArray(response) ? response : response.data; // Normaliza respuesta: puede ser array directo o { data: [] }
      setCategories(arr); // Actualiza el estado con el array de categorías para renderizar el selector
    });
  }, []); // Array vacío: solo se ejecuta al montar el componente, no en cada render

  // Actualizar campo del formulario al escribir o seleccionar
  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value }); // Actualiza solo el campo modificado manteniendo el resto del form
  };

  // Manejar envío del formulario (crear o actualizar)
  const handleSubmit = async e => {
    e.preventDefault(); // Previene recarga de página al enviar el formulario HTML
    setLoading(true); // Activa estado de carga para dar feedback visual y bloquear doble envío
    try {
      if (form._id) {
        // EDITAR: la subcategoría ya existe en DB, actualizar por su _id
        await updateSubcategory(form._id, form); // Llama PUT /api/subcategories/:id con los datos actualizados
      } else {
        // CREAR: no tiene _id, insertar nueva subcategoría en la base de datos
        await createSubcategory(form); // Llama POST /api/subcategories con los datos del form
      }
      setError(null); // Limpia errores anteriores si la operación fue exitosa
      onSuccess(); // Notifica al componente padre para refrescar la lista y cerrar el formulario
    } catch (err) {
      setError(err.message); // Muestra el mensaje de error devuelto por el servidor (ej: nombre duplicado)
    }
    setLoading(false); // Desactiva estado de carga independientemente del resultado
  };

  return (
    <div className="d-flex justify-content-center align-items-center" style={{minHeight:'70vh'}}> {/* Centra el card vertical y horizontalmente en la pantalla */}
      <div className="card shadow p-4" style={{maxWidth:480, width:'100%', borderTop:'5px solid #fd7e14'}}> {/* Card con sombra y borde naranja (color de subcategorías) */}
        <h3 className="mb-4 text-center" style={{fontWeight:700, color:'#fd7e14'}}> {/* Título dinámico que cambia según el modo crear/editar */}
          {form._id ? 'Editar Subcategoría' : 'Crear Subcategoría'} {/* Modo editar si tiene _id, modo crear si no */}
        </h3>
        {error && <div className="alert alert-danger">{error}</div>} {/* Alerta roja Bootstrap; visible solo cuando hay error del servidor */}
        <form onSubmit={handleSubmit}> {/* Formulario controlado; onSubmit conecta con handleSubmit */}
          <div className="mb-3"> {/* Grupo campo nombre */}
            <label className="form-label">Nombre</label> {/* Etiqueta del campo nombre */}
            <input type="text" className="form-control" name="name" value={form.name} onChange={handleChange} required autoFocus /> {/* Input controlado; autoFocus pone cursor aquí al abrir */}
          </div>
          <div className="mb-3"> {/* Grupo campo descripción */}
            <label className="form-label">Descripción</label> {/* Etiqueta del campo descripción */}
            <input type="text" className="form-control" name="description" value={form.description} onChange={handleChange} required /> {/* Input controlado; required exige que no esté vacío */}
          </div>
          <div className="mb-3"> {/* Grupo selector de categoría padre */}
            <label className="form-label">Categoría</label> {/* Etiqueta del selector */}
            <select className="form-select" name="category" value={form.category} onChange={handleChange} required> {/* Selector controlado; value vinculado a form.category */}
              <option value="">Seleccione una categoría</option> {/* Opción placeholder vacía; required impide enviar sin seleccionar */}
              {categories.map(cat => ( // Itera el array de categorías cargadas desde el backend
                <option key={cat._id} value={cat._id}>{cat.name}</option> // Cada opción usa _id como value y name como texto visible
              ))}
            </select>
          </div>
          <div className="d-flex justify-content-end mt-4 gap-2"> {/* Botones alineados a la derecha con separación */}
            <button type="button" className="btn btn-outline-secondary" onClick={onCancel} disabled={loading}>Cancelar</button> {/* Botón cancelar: llama onCancel sin guardar cambios */}
            <button type="submit" className="btn btn-primary" disabled={loading}> {/* Botón guardar: deshabilitado durante carga para evitar doble envío */}
              {loading ? 'Guardando...' : (form._id ? 'Actualizar' : 'Crear')} {/* Texto dinámico según estado de carga y modo del formulario */}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
