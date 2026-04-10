/**
 * ========================================
 *  VISTA: LISTA DE SUBCATEGORÍAS
 * ========================================
 * 
 * Componente React que muestra lista de subcategorías con:
 *   - Tabla responsiva mostrando todas las subcategorías
 *   - Búsqueda por nombre o descripción
 *   - Filtro por categoría padre
 *   - Exportación a Excel y PDF
 *   - Acciones CRUD con control de rol admin
 *   - Soft delete (desactivación) con cascada a productos
 *   - Hard delete (eliminación permanente) con cascada
 * 
 * Características especiales:
 *   - Maneja category como objeto poblado o como string (_id)
 *   - getCategoryName() helper normaliza ambos casos
 *   - Las eliminaciones afectan: subcategoría → productos
 *   - Soft delete desactiva ambas; Hard delete elimina ambas
 * 
 * Flujo de datos:
 *   1. useEffect → Carga subcategorías y categorías en paralelo
 *   2. Subcategorías mapean a modelo Subcategory
 *   3. Aplica filtros: búsqueda + categoría padre
 *   4. Tabla renderiza subcategorías filtradas
 *   5. Acciones limitadas a rol admin
 * 
 * Estados principales:
 *   - subcategories: Array de todas las subcategorías
 *   - filteredSubcategories: Array después de aplicar filtros
 *   - categories: Array de categorías padre (para dropdown + lookup)
 *   - loading: Boolean indicando carga
 *   - error: String con mensaje de error
 *   - searchTerm: búsqueda por nombre/descripción
 *   - filterCategory: ID de categoría padre seleccionada
 * 
 * Props:
 *   - onEdit: Callback cuando usuario click en editar
 *     Pasa la subcategoría completa
 * 
 * Seguridad (Control de Acceso):
 *   - Editar: Todos los roles
 *   - Desactivar (Soft Delete): admin únicamente
 *   - Eliminar (Hard Delete): admin únicamente
 * 
 * Helper function importante:
 *   getCategoryName(category): 
 *   - Si category es objeto con .name → retorna .name
 *   - Si category es string (_id) → busca en array y retorna .name
 *   - Si no encuentra → retorna string vacío
 *   
 *   Esto es necesario porque subcategories a veces vienen con category
 *   poblado (objeto completo) y a veces solo con el ID
 * 
 * @prop {Function} onEdit - Callback para editar
 */

import React, { useEffect, useState } from 'react';
import { getSubcategories, deleteSubcategory } from '../controllers/subcategoryController';
import { getAuthFromStorage } from '../utils/authUtils';
import { exportToExcel, exportToPDF, formatDataForExport } from '../utils/reportUtils';
import Subcategory from '../models/Subcategory';
import { getCategories } from '../controllers/categoryController';

/**
 * COMPONENTE: SubcategoryList
 * 
 * Renderiza tabla de subcategorías con búsqueda, filtros y acciones
 * 
 * @param {Object} props
 * @param {Function} props.onEdit - Función para editar subcategoría
 */
export default function SubcategoryList({ onEdit }) {
  // ===== ESTADOS =====
  
  // Lista completa de subcategorías de API
  const [subcategories, setSubcategories] = useState([]);
  
  // Lista filtrada después de aplicar criterios de búsqueda
  const [filteredSubcategories, setFilteredSubcategories] = useState([]);
  
  // Lista de categorías padre (para dropdown de filtro y lookup de nombres)
  const [categories, setCategories] = useState([]);
  
  // Indica si se está cargando desde API
  const [loading, setLoading] = useState(true);
  
  // Mensaje de error si falla la carga
  const [error, setError] = useState(null);
  
  // Término de búsqueda (nombre o descripción)
  const [searchTerm, setSearchTerm] = useState('');
  
  // ID de categoría padre seleccionada en filtro (vacío = todas)
  const [filterCategory, setFilterCategory] = useState('');
  
  // Información de usuario actual
  const auth = getAuthFromStorage();

  /**
   * FUNCIÓN: Cargar subcategorías y categorías
   * 
   * Carga ambas en paralelo con Promise.all
   * Mapea subcategorías a modelo Subcategory
   * Normaliza respuestas (array o { data: [] })
   * 
   * @async
   */
  const fetchAll = async () => {
    setLoading(true);
    try {
      const [subcatResponse, catResponse] = await Promise.all([
        getSubcategories(),
        getCategories()
      ]);
      const subcatArr = Array.isArray(subcatResponse) ? subcatResponse : subcatResponse.data;
      const catArr = Array.isArray(catResponse) ? catResponse : catResponse.data;
      setSubcategories(subcatArr.map(s => new Subcategory(s)));
      setCategories(catArr);
      setError(null);
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  };

  /**
   * HOOK: Filtrar subcategorías cuando cambian datos o filtros
   * 
   * Aplicar filtros secuencialmente:
   *   1. Búsqueda por término en nombre Y descripción
   *   2. Filtro por categoría padre
   * 
   * Dependencies: subcategories, searchTerm, filterCategory
   */
  useEffect(() => {
    let filtered = subcategories;
    
    // FILTRO 1: Búsqueda por término
    if (searchTerm) {
      filtered = filtered.filter(s =>
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // FILTRO 2: Por categoría padre
    if (filterCategory) {
      filtered = filtered.filter(s => {
        // Manejar tanto objeto como string en s.category
        const catId = (s.category && typeof s.category === 'object') ? s.category._id : s.category;
        return catId === filterCategory;
      });
    }
    
    setFilteredSubcategories(filtered);
  }, [subcategories, searchTerm, filterCategory]);

  /**
   * HOOK: Carga inicial
   * 
   * Se ejecuta una sola vez al montar componente
   * Dependencies: [] (sin dependencias)
   */
  useEffect(() => {
    fetchAll();
  }, []);

  /**
   * FUNCIÓN: Desactivar subcategoría (Soft Delete con cascada a productos)
   * 
   * Soft delete: cambiar isActive a false SIN eliminar
   * 
   * CASCADA: Desactivar subcategoría → desactiva todos sus productos
   * Los datos permanecen en DB (recuperables)
   * Las vistas no muestran items con isActive=false
   * 
   * Acceso: admin únicamente
   * Requiere confirmación
   * 
   * @param {String} id - ID de subcategoría a desactivar
   * @async
   */
  const handleDeactivate = async (id) => {
    if (window.confirm('¿Seguro? Esto desactivará todos sus productos.')) {
      await deleteSubcategory(id);
      fetchAll();
    }
  };

  /**
   * FUNCIÓN: Eliminar subcategoría permanentemente (Hard Delete con cascada)
   * 
   * Hard delete: parámetro ?hardDelete=true elimina el documento
   * 
   * CASCADA COMPLETA: 
   *   - Subcategoría eliminada (permanente)
   *   - Todos sus productos eliminados (permanente)
   * 
   * NO SE PUEDE RECUPERAR
   * 
   * Acceso: admin únicamente
   * Requiere confirmación con advertencia fuerte ⚠️
   * 
   * @param {String} id - ID de subcategoría a eliminar
   * @async
   */
  const handleDelete = async (id) => {
    if (window.confirm('⚠️ ¡ADVERTENCIA! Esto eliminará permanentemente la subcategoría y sus datos. ¿Estás seguro?')) {
      try {
        await fetch(`http://localhost:3000/api/subcategories/${id}?hardDelete=true`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${auth?.token}` }
        });
        fetchAll();
      } catch (err) {
        alert('Error al eliminar: ' + err.message);
      }
    }
  };

  /**
   * FUNCIÓN HELPER: Obtener nombre de categoría
   * 
   * Maneja dos casos:
   *   1. category es objeto poblado: { _id, name, ... } → retorna .name
   *   2. category es string (_id): busca en array categories → retorna .name
   *   3. No encuentra: retorna string vacío
   * 
   * Necesaria porque algunas respuestas incluyen category poblado
   * y otras solo incluyen el ID reference
   * 
   * @param {Object|String} category - Category object o ID string
   * @returns {String} Nombre de la categoría o vacío si no existe
   */
  const getCategoryName = (category) => {
    if (category && typeof category === 'object' && category.name) return category.name;
    const cat = categories.find(c => c._id === category);
    return cat ? cat.name : '';
  };

  /**
   * FUNCIÓN: Exportar a Excel
   * 
   * Mapea a estructura: Nombre, Descripción, Categoría
   * Usa helper getCategoryName para resolver nombres
   * 
   * @async
   */
  const handleExportExcel = async () => {
    const dataToExport = formatDataForExport(filteredSubcategories, [
      { key: 'name', label: 'Nombre' },
      { key: 'description', label: 'Descripción' },
      { key: 'category', label: 'Categoría', transform: (val) => getCategoryName(val) },
    ]);
    await exportToExcel(dataToExport, 'subcategorias.xlsx', 'Subcategorías');
  };

  /**
   * FUNCIÓN: Exportar a PDF
   * 
   * Mapea subcategorías y resuelve nombres de categoría
   * Columnas: Subcategoría, Descripción, Categoría
   */
  const handleExportPDF = () => {
    const dataForPDF = filteredSubcategories.map(s => ({
      ...s,
      category: getCategoryName(s.category)
    }));
    const columns = [
      { key: 'name', label: 'Subcategoría', width: 35 },
      { key: 'description', label: 'Descripción', width: 55 },
      { key: 'category', label: 'Categoría', width: 30 },
    ];
    exportToPDF(dataForPDF, 'subcategorias.pdf', 'Reporte de Subcategorías', columns, auth?.user?.username);
  };

  // ===== RENDERIZADO =====
  
  // Mostrar loading spinner
  if (loading) return <div className="text-center p-4"><div className="spinner-border text-warning" role="status"><span className="visually-hidden">Cargando...</span></div></div>;
  
  // Mostrar error si ocurre
  if (error) return <div className="alert alert-danger">{error}</div>;

  return (
    <div className="container-fluid mt-4">
      <div className="card shadow p-4" style={{borderTop:'5px solid #fd7e14'}}>
        {/* SECCIÓN: ENCABEZADO */}
        <h2 className="mb-4 text-center" style={{color:'#fd7e14', fontWeight:700}}>
          🏷️ Gestión de Subcategorías
        </h2>

        {/* SECCIÓN: FILTROS Y EXPORTACIÓN */}
        <div className="row mb-4 g-3">
          {/* Filtro 1: Búsqueda por texto libre */}
          <div className="col-md-4">
            <input
              type="text"
              className="form-control"
              placeholder="🔍 Buscar por nombre o descripción..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          {/* Filtro 2: Por categoría padre */}
          <div className="col-md-4">
            <select
              className="form-select"
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
            >
              <option value="">📂 Todas las categorías</option>
              {categories.map(cat => (
                <option key={cat._id} value={cat._id}>{cat.name}</option>
              ))}
            </select>
          </div>
          
          {/* Exportación: Botones para Excel y PDF */}
          <div className="col-md-4">
            <div className="btn-group w-100" role="group">
              <button className="btn btn-success btn-sm" onClick={handleExportExcel} title="Descargar en Excel">
                📊 Excel
              </button>
              <button className="btn btn-danger btn-sm" onClick={handleExportPDF} title="Descargar en PDF">
                📄 PDF
              </button>
            </div>
          </div>
        </div>

        {/* SECCIÓN: INFORMACIÓN DE RESULTADOS */}
        <div className="alert alert-info mb-3" role="alert">
          📌 Mostrando <strong>{filteredSubcategories.length}</strong> de <strong>{subcategories.length}</strong> subcategorías
        </div>

        {/* SECCIÓN: TABLA DE DATOS */}
        <div className="table-responsive">
          <table className="table table-hover table-striped">
            {/* ENCABEZADO DE TABLA */}
            <thead className="table-light">
              <tr>
                <th>Nombre</th>
                <th>Descripción</th>
                <th>Categoría</th>
                <th>Acciones</th>
              </tr>
            </thead>
            
            {/* CUERPO DE TABLA */}
            <tbody>
              {filteredSubcategories.length > 0 ? (
                // Renderizar cada subcategoría
                filteredSubcategories.map(subcategory => (
                  <tr key={subcategory._id}>
                    <td><strong>{subcategory.name}</strong></td>
                    <td>{subcategory.description}</td>
                    
                    {/* Categoría padre mostrada en badge azul */}
                    <td>
                      <span className="badge bg-info">{getCategoryName(subcategory.category)}</span>
                    </td>
                    
                    {/* Columna de acciones: Editar, Desactivar (admin), Eliminar (admin) */}
                    <td>
                      {/* Botón EDITAR: Todos los roles */}
                      <button 
                        className="btn btn-primary btn-sm me-1" 
                        onClick={() => onEdit(subcategory)} 
                        title="Editar"
                      >
                        ✏️
                      </button>
                      
                      {/* Botones DESACTIVAR y ELIMINAR: admin únicamente */}
                      {auth?.user?.role === 'admin' && (
                        <>
                          {/* Botón DESACTIVAR: Cascada a productos */}
                          <button 
                            className="btn btn-warning btn-sm me-1" 
                            onClick={() => handleDeactivate(subcategory._id)} 
                            title="Desactivar (cascada)"
                          >
                            ⚠️
                          </button>
                          
                          {/* Botón ELIMINAR: Eliminación permanente con cascada */}
                          <button 
                            className="btn btn-danger btn-sm" 
                            onClick={() => handleDelete(subcategory._id)} 
                            title="Eliminar"
                          >
                            🗑️
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                // Mensaje cuando no hay resultados
                <tr>
                  <td colSpan="4" className="text-center text-muted p-4">
                    😕 No se encontraron subcategorías con los filtros aplicados
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
