/**
 * ========================================
 *  VISTA: FORMULARIO DE CATEGORÍA
 * ========================================
 * 
 * Componente React para crear y editar categorías con:
 *   - Modo crear (nuevo) o editar (existente)
 *   - Validación de campos requeridos
 *   - Manejo de errores con mensajes
 * 
 * Campos:
 *   - Nombre: texto requerido
 *   - Descripción: texto requerido
 * 
 * Flujo:
 *   1. Recibe category prop (null para crear, objeto para editar)
 *   2. handleChange sincroniza cambios en form state
 *   3. handleSubmit llama createCategory o updateCategory
 *   4. onSuccess callback notifica al padre
 * 
 * Props:
 *   - category: Objeto categoría (null para crear)
 *   - onSuccess: Callback cuando se guarda
 *   - onCancel: Callback para cancelar
 */

import React, { useState } from 'react';
import { createCategory, updateCategory } from '../controllers/categoryController';
import Category from '../models/Category';

export default function CategoryForm({ category, onSuccess, onCancel }) {
  // Estado del formulario: nuevo Category si es crear, copia si es editar
  const [form, setForm] = useState(category ? { ...category } : new Category());
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  // Manejar cambios en los inputs
  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // Manejar envío del formulario (crear o actualizar)
  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    try {
      if (form._id) {
        // EDITAR: actualizar categoría existente
        await updateCategory(form._id, form);
      } else {
        // CREAR: crear nueva categoría
        await createCategory(form);
      }
      setError(null);
      onSuccess();
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  };

  return (
    <div className="d-flex justify-content-center align-items-center" style={{minHeight:'70vh'}}>
      <div className="card shadow p-4" style={{maxWidth:480, width:'100%', borderTop:'5px solid #6610f2'}}>
        <h3 className="mb-4 text-center" style={{fontWeight:700, color:'#6610f2'}}>
          {form._id ? 'Editar Categoría' : 'Crear Categoría'}
        </h3>
        {error && <div className="alert alert-danger">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label">Nombre</label>
            <input type="text" className="form-control" name="name" value={form.name} onChange={handleChange} required autoFocus />
          </div>
          <div className="mb-3">
            <label className="form-label">Descripción</label>
            <input type="text" className="form-control" name="description" value={form.description} onChange={handleChange} required />
          </div>
          <div className="d-flex justify-content-end mt-4 gap-2">
            <button type="button" className="btn btn-outline-secondary" onClick={onCancel} disabled={loading}>Cancelar</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Guardando...' : (form._id ? 'Actualizar' : 'Crear')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
