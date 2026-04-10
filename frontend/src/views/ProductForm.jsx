/**
 * ========================================
 *  VISTA: FORMULARIO DE PRODUCTO
 * ========================================
 * 
 * Componente React para crear y editar productos con:
 *   - Modo doble: crear nuevo o editar existente
 *   - Validación de campos requeridos
 *   - Cascading dropdowns (categoría → subcategoría)
 *   - Reset automático de subcategoría al cambiar categoría
 *   - Estado de carga durante envío del formulario
 *   - Manejo de errores con mensajes amigables
 * 
 * Campos del formulario:
 *   - Nombre: texto requerido
 *   - Descripción: texto requerido
 *   - Precio: número, mín 0, requerido
 *   - Stock: número, mín 0, requerido
 *   - Categoría: dropdown requerido
 *   - Subcategoría: dropdown requerido, habilitado solo si hay categoría
 * 
 * Flujo de datos:
 *   1. Componente recibe product prop (null para crear, objeto para editar)
 *   2. useEffect carga categorías y subcategorías en paralelo
 *   3. Cambios en form se sincronizan al estado local
 *   4. onSubmit → llama createProduct o updateProduct según modo
 *   5. onSuccess callback indica al padre que se guardó exitosamente
 * 
 * Estado del formulario:
 *   - form: Objeto del producto con todos los campos
 *   - categories: Array de categorías disponibles
 *   - subcategories: Array de todas las subcategorías (se filtran por categoría)
 *   - error: String con mensaje de error si falla
 *   - loading: Boolean indicando si se está guardando
 * 
 * Props:
 *   - product: Objeto producto (null para crear, objeto para editar)
 *   - onSuccess: Callback cuando se guarda exitosamente
 *   - onCancel: Callback cuando usuario hace click en Cancelar
 * 
 * Características especiales:
 *   - Si se edita categoría: subcategoría se resetea automáticamente
 *   - Subcategoría deshabilitada si no hay categoría seleccionada
 *   - Bottón submit muestra texto diferente según modo (Crear/Actualizar)
 *   - Botones deshabilitados mientras se guarda (loading)
 * 
 * Validación:
 *   - Campos requeridos con atributo HTML5 required
 *   - Input type validaciones (number para precio/stock)
 *   - Min value validaciones (min="0")
 *   - Campo nombre tiene autofocus para mejor UX
 * 
 * @prop {Object|null} product - Producto a editar (null si es crear)
 * @prop {Function} onSuccess - Callback cuando se guarda
 * @prop {Function} onCancel - Callback para cancelar
 */

import React, { useState, useEffect } from 'react';
import { createProduct, updateProduct } from '../controllers/productController';
import { getCategories } from '../controllers/categoryController';
import { getSubcategories } from '../controllers/subcategoryController';
import Product from '../models/Product';

/**
 * COMPONENTE: ProductForm
 * 
 * Renderiza formulario para crear/editar productos
 * 
 * @param {Object} props
 * @param {Object|null} props.product - Producto a editar (null para crear)
 * @param {Function} props.onSuccess - Callback cuando se guarda
 * @param {Function} props.onCancel - Callback para cancelar edición
 */
export default function ProductForm({ product, onSuccess, onCancel }) {
  // ===== ESTADOS =====
  
  // Objeto del formulario: si edita usa el producto, si crea usa vacío
  const [form, setForm] = useState(product ? { ...product } : new Product());
  
  // Array de todas las categorías disponibles para dropdown
  const [categories, setCategories] = useState([]);
  
  // Array de todas las subcategorías (se filtran por categoría seleccionada)
  const [subcategories, setSubcategories] = useState([]);
  
  // Mensaje de error si falla la operación
  const [error, setError] = useState(null);
  
  // Indica si se está guardando en API
  const [loading, setLoading] = useState(false);

  /**
   * HOOK: Cargar categorías y subcategorías al montar
   * 
   * Se ejecuta una sola vez cuando el componente monta
   * Carga ambas en paralelo con Promise.all (aunque aqué no usamos all)
   * Normaliza respuestas (pueden ser array o { data: [] })
   * 
   * Dependencies: [] (únicamente en montaje)
   */
  useEffect(() => {
    getCategories().then(response => {
      const arr = Array.isArray(response) ? response : response.data;
      setCategories(arr);
    });
    getSubcategories().then(response => {
      const arr = Array.isArray(response) ? response : response.data;
      setSubcategories(arr);
    });
  }, []);

  /**
   * FUNCIÓN: Manejar cambios en campos del formulario
   * 
   * Sincroniza valores de inputs con estado form
   * 
   * Lógica especial para categoría:
   *   - Si cambia categoría → resetea subcategory a vacío
   *   - Esto evita inconsistencias (ej: subcategoría de otra categoría)
   * 
   * Para otros campos:
   *   - Actualiza el campo en form directamente
   * 
   * @param {Object} e - Evento del input (e.target.name, e.target.value)
   */
  const handleChange = e => {
    const { name, value } = e.target;
    // Si categoría cambia, resetear subcategoría
    if (name === 'category') {
      setForm({ ...form, category: value, subcategory: '' });
    } else {
      setForm({ ...form, [name]: value });
    }
  };

  /**
   * FUNCIÓN: Enviar formulario (guardar producto)
   * 
   * Previene envío por defecto (preventDefault)
   * Determina si es crear o editar basado en form._id:
   *   - Si form._id existe → UPDATE (editar)
   *   - Si form._id no existe → CREATE (crear nuevo)
   * 
   * Flujo:
   *   1. Etablece loading = true
   *   2. Llama API (createProduct o updateProduct)
   *   3. Limpia error si es exitoso
   *   4. Llama onSuccess() para que padre se entere
   *   5. Si error: almacena mensaje en error state
   *   6. Establece loading = false
   * 
   * El error se muestra en el formulario al usuario
   * onSuccess típicamente causa que App.jsx recargue la lista
   * 
   * @async
   * @param {Object} e - Event del submit del formulario
   */
  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    try {
      if (form._id) {
        // MODO EDITAR: actualizar producto existente
        await updateProduct(form._id, form);
      } else {
        // MODO CREAR: crear nuevo producto
        await createProduct(form);
      }
      setError(null);
      // Callback al padre indicando éxito
      onSuccess();
    } catch (err) {
      // Mostrar error al usuario
      setError(err.message);
    }
    setLoading(false);
  };

  // ===== RENDERIZADO =====

  // ===== RENDERIZADO =====

  return (
    <div className="d-flex justify-content-center align-items-center" style={{minHeight:'70vh'}}>
      <div className="card shadow p-4" style={{maxWidth:480, width:'100%', borderTop:'5px solid #0d6efd'}}>
        {/* SECCIÓN: ENCABEZADO */}
        <h3 className="mb-4 text-center" style={{fontWeight:700, color:'#0d6efd'}}>
          {form._id ? 'Editar Producto' : 'Crear Producto'}
        </h3>
        
        {/* SECCIÓN: MENSAJE DE ERROR (si ocurre) */}
        {error && <div className="alert alert-danger">{error}</div>}
        
        {/* FORMULARIO */}
        <form onSubmit={handleSubmit}>
          {/* CAMPO: Nombre */}
          <div className="mb-3">
            <label className="form-label">Nombre</label>
            <input 
              type="text" 
              className="form-control" 
              name="name" 
              value={form.name} 
              onChange={handleChange} 
              required 
              autoFocus 
            />
          </div>
          
          {/* CAMPO: Descripción */}
          <div className="mb-3">
            <label className="form-label">Descripción</label>
            <input 
              type="text" 
              className="form-control" 
              name="description" 
              value={form.description} 
              onChange={handleChange} 
              required 
            />
          </div>
          
          {/* FILA: Precio y Stock lado a lado */}
          <div className="row">
            {/* CAMPO: Precio */}
            <div className="col-md-6 mb-3">
              <label className="form-label">Precio</label>
              <input 
                type="number" 
                className="form-control" 
                name="price" 
                value={form.price} 
                onChange={handleChange} 
                required 
                min="0" 
              />
            </div>
            
            {/* CAMPO: Stock */}
            <div className="col-md-6 mb-3">
              <label className="form-label">Stock</label>
              <input 
                type="number" 
                className="form-control" 
                name="stock" 
                value={form.stock} 
                onChange={handleChange} 
                required 
                min="0" 
              />
            </div>
          </div>
          
          {/* CAMPO: Categoría (requerido, controla visibilidad de subcategoría) */}
          <div className="mb-3">
            <label className="form-label">Categoría</label>
            <select 
              className="form-select" 
              name="category" 
              value={form.category} 
              onChange={handleChange} 
              required
            >
              <option value="">Seleccione una categoría</option>
              {categories.map(cat => (
                <option key={cat._id} value={cat._id}>{cat.name}</option>
              ))}
            </select>
          </div>
          
          {/* CAMPO: Subcategoría (cascading, habilitado solo si hay categoría) */}
          <div className="mb-3">
            <label className="form-label">Subcategoría</label>
            <select 
              className="form-select" 
              name="subcategory" 
              value={form.subcategory} 
              onChange={handleChange} 
              required 
              disabled={!form.category}
            >
              <option value="">Seleccione una subcategoría</option>
              {form.category && subcategories
                .filter(sub => {
                  // sub.category puede ser un string (id) o un objeto (poblado)
                  if (!sub.category) return false;
                  if (typeof sub.category === 'object' && sub.category._id) {
                    return String(sub.category._id) === String(form.category);
                  }
                  return String(sub.category) === String(form.category);
                })
                .map(sub => (
                  <option key={sub._id} value={sub._id}>{sub.name}</option>
                ))}
            </select>
          </div>
          
          {/* SECCIÓN: BOTONES DE ACCIÓN */}
          <div className="d-flex justify-content-end mt-4 gap-2">
            {/* Botón CANCELAR */}
            <button 
              type="button" 
              className="btn btn-outline-secondary" 
              onClick={onCancel} 
              disabled={loading}
            >
              Cancelar
            </button>
            
            {/* Botón SUBMIT (Crear o Actualizar) */}
            <button 
              type="submit" 
              className="btn btn-primary" 
              disabled={loading}
            >
              {loading ? 'Guardando...' : (form._id ? 'Actualizar' : 'Crear')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}