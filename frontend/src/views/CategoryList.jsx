/**
 * ========================================
 *  VISTA: LISTA DE CATEGORÍAS
 * ========================================
 * 
 * Componente React que muestra lista de categorías con:
 *   - Tabla responsiva con todas las categorías disponibles
 *   - Búsqueda por nombre o descripción
 *   - Exportación a Excel y PDF
 *   - Acciones CRUD restringidas a rol admin
 *   - Soft delete (desactivación) con cascada a subcategorías y productos
 *   - Hard delete (eliminación permanente) con cascada completa
 * 
 * Características especiales:
 *   - Las operaciones de eliminación afectan categoría Y todas sus dependencias
 *   - Soft delete desactiva: categoria → subcategorías → productos
 *   - Hard delete elimina: categoria → subcategorías → productos (permanente)
 *   - Acceso: Editar (todos), Desactivar/Eliminar (admin)
 * 
 * Flujo de datos:
 *   1. useEffect → Carga categorías de API al montar
 *   2. Categories mapean a modelo Category
 *   3. Filtro aplica búsqueda por término
 *   4. Tabla renderiza categorías filtradas
 *   5. Acciones limitadas a rol admin
 * 
 * Estados principales:
 *   - categories: Array de todas las categorías
 *   - filteredCategories: Array después de aplicar búsqueda
 *   - loading: Boolean indicando carga en progreso
 *   - error: String con mensaje de error
 *   - searchTerm: Término de búsqueda
 * 
 * Props:
 *   - onEdit: Callback función cuando usuario click en editar
 *     Pasa la categoría completa como argumento
 * 
 * Seguridad (Control de Acceso):
 *   - Editar: Todos los roles
 *   - Desactivar (Soft Delete): admin únicamente
 *   - Eliminar (Hard Delete): admin únicamente
 * 
 * Importancia del control de cascada:
 *   Una categoría puede tener:
 *   - N subcategorías
 *   - N productos (en esas subcategorías)
 *   
 *   Por eso las eliminaciones son con cascada:
 *   - Soft delete: Solo marca isActive=false en toda la cadena
 *   - Hard delete: Elimina permanentemente toda la cadena
 * 
 * @prop {Function} onEdit - Callback cuando se clickea editar
 */

import React, { useEffect, useState } from 'react';
import { getCategories, deleteCategory } from '../controllers/categoryController';
import { getAuthFromStorage } from '../utils/authUtils';
import { exportToExcel, exportToPDF, formatDataForExport } from '../utils/reportUtils';
import Category from '../models/Category';

/**
 * COMPONENTE: CategoryList
 * 
 * Renderiza tabla de categorías con búsqueda y acciones
 * 
 * @param {Object} props
 * @param {Function} props.onEdit - Función para manejar edición
 */
export default function CategoryList({ onEdit }) {
  // ===== ESTADOS =====
  
  // Lista completa de categorías de API
  const [categories, setCategories] = useState([]);
  
  // Lista filtrada por criteria de búsqueda
  const [filteredCategories, setFilteredCategories] = useState([]);
  
  // Indica si se está cargando desde API
  const [loading, setLoading] = useState(true);
  
  // Mensaje de error si falla la carga
  const [error, setError] = useState(null);
  
  // Término de búsqueda (por nombre o descripción)
  const [searchTerm, setSearchTerm] = useState('');
  
  // Información de autenticación del usuario actual
  const auth = getAuthFromStorage();

  /**
   * FUNCIÓN: Cargar categorías de API
   * 
   * Obtiene todas las categorías y las mapea a instancias de Category
   * Normaliza respuesta (puede ser array o { data: [] })
   * Limpia errores previos si carga es exitosa
   * 
   * @async
   */
  const fetchCategories = async () => {
    setLoading(true);
    try {
      const response = await getCategories();
      const arr = Array.isArray(response) ? response : response.data;
      setCategories(arr.map(c => new Category(c)));
      setError(null);
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  };

  /**
   * HOOK: Filtrar categorías cuando cambian datos o término de búsqueda
   * 
   * Filtra por búsqueda en nombre Y descripción (case-insensitive)
   * 
   * Dependencies: categories, searchTerm
   * Se ejecuta automáticamente cuando cambian
   */
  useEffect(() => {
    let filtered = categories;
    if (searchTerm) {
      filtered = filtered.filter(c =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    setFilteredCategories(filtered);
  }, [categories, searchTerm]);

  /**
   * HOOK: Carga inicial de categorías
   * 
   * Se ejecuta una sola vez cuando componente monta
   * Dependencies: [] (sin dependencias)
   */
  useEffect(() => {
    fetchCategories();
  }, []);

  /**
   * FUNCIÓN: Desactivar categoría (Soft Delete con cascada)
   * 
   * Soft delete = cambiar isActive a false SIN eliminar documento
   * 
   * CASCADA: Cuando desactivas una categoría:
   *   1. Categoría se marca como isActive=false
   *   2. Todas sus subcategorías se marcan como isActive=false
   *   3. Todos sus productos se marcan como isActive=false
   * 
   * Los datos permanecen en base de datos (recuperables)
   * Las vistas no muestran items con isActive=false
   * 
   * Acceso: admin únicamente
   * Requiere confirmación del usuario
   * 
   * @param {String} id - ID de la categoría a desactivar
   * @async
   */
  const handleDeactivate = async (id) => {
    if (window.confirm('¿Seguro? Esto desactivará todas sus subcategorías y productos.')) {
      await deleteCategory(id);
      fetchCategories();
    }
  };

  /**
   * FUNCIÓN: Eliminar categoría permanentemente (Hard Delete con cascada)
   * 
   * Hard delete = parámetro ?hardDelete=true en URL
   * 
   * CASCADA COMPLETA: Elimina permanentemente:
   *   1. Categoría (documento eliminado)
   *   2. Todas sus subcategorías (documentos eliminados)
   *   3. Todos sus productos (documentos eliminados)
   * 
   * NO SE PUEDE RECUPERAR - Eliminación permanente
   * 
   * Acceso: admin únicamente
   * Requiere confirmación muy fuerte con advertencia ⚠️
   * 
   * @param {String} id - ID de la categoría a eliminar
   * @async
   */
  const handleDelete = async (id) => {
    if (window.confirm('⚠️ ¡ADVERTENCIA! Esto eliminará permanentemente la categoría y sus datos. ¿Estás seguro?')) {
      try {
        await fetch(`http://localhost:3000/api/categories/${id}?hardDelete=true`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${auth?.token}` }
        });
        fetchCategories();
      } catch (err) {
        alert('Error al eliminar: ' + err.message);
      }
    }
  };

  /**
   * FUNCIÓN: Exportar categorías a Excel
   * 
   * Mapea a estructura de exportación: Nombre, Descripción
   * Usa timestamp en nombre para evitar sobrescrituras
   * 
   * @async
   */
  const handleExportExcel = async () => {
    const dataToExport = formatDataForExport(filteredCategories, [
      { key: 'name', label: 'Nombre' },
      { key: 'description', label: 'Descripción' },
    ]);
    await exportToExcel(dataToExport, 'categorias.xlsx', 'Categorías');
  };

  /**
   * FUNCIÓN: Exportar categorías a PDF
   * 
   * Crea tabla con columnas: Categoría, Descripción
   * Incluye nombre de usuario en el reporte
   * Incluye timestamp en nombre
   */
  const handleExportPDF = () => {
    const columns = [
      { key: 'name', label: 'Categoría', width: 40 },
      { key: 'description', label: 'Descripción', width: 90 },
    ];
    exportToPDF(filteredCategories, 'categorias.pdf', 'Reporte de Categorías', columns, auth?.user?.username);
  };

  // ===== RENDERIZADO =====
  
  // Mostrar loading spinner mientras se cargan datos
  if (loading) return <div className="text-center p-4"><div className="spinner-border text-purple" role="status"><span className="visually-hidden">Cargando...</span></div></div>;
  
  // Mostrar error si ocurre problema
  if (error) return <div className="alert alert-danger">{error}</div>;

  return (
    <div className="container-fluid mt-4">
      <div className="card shadow p-4" style={{borderTop:'5px solid #6610f2'}}>
        {/* SECCIÓN: ENCABEZADO */}
        <h2 className="mb-4 text-center" style={{color:'#6610f2', fontWeight:700}}>
          📂 Gestión de Categorías
        </h2>

        {/* SECCIÓN: FILTROS Y EXPORTACIÓN */}
        <div className="row mb-4 g-3">
          {/* Filtro: Búsqueda por texto libre */}
          <div className="col-md-6">
            <input
              type="text"
              className="form-control"
              placeholder="🔍 Buscar por nombre o descripción..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          {/* Exportación: Botones para Excel y PDF */}
          <div className="col-md-6">
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
          📌 Mostrando <strong>{filteredCategories.length}</strong> de <strong>{categories.length}</strong> categorías
        </div>

        {/* SECCIÓN: TABLA DE DATOS */}
        <div className="table-responsive">
          <table className="table table-hover table-striped">
            {/* ENCABEZADO DE TABLA */}
            <thead className="table-light">
              <tr>
                <th>Nombre</th>
                <th>Descripción</th>
                <th>Acciones</th>
              </tr>
            </thead>
            
            {/* CUERPO DE TABLA */}
            <tbody>
              {filteredCategories.length > 0 ? (
                // Renderizar cada categoría
                filteredCategories.map(category => (
                  <tr key={category._id}>
                    <td><strong>{category.name}</strong></td>
                    <td>{category.description}</td>
                    
                    {/* Columna de acciones: Editar, Desactivar (admin), Eliminar (admin) */}
                    <td>
                      {/* Botón EDITAR: Todos los roles */}
                      <button 
                        className="btn btn-primary btn-sm me-1" 
                        onClick={() => onEdit(category)} 
                        title="Editar"
                      >
                        ✏️
                      </button>
                      
                      {/* Botones DESACTIVAR y ELIMINAR: admin únicamente */}
                      {auth?.user?.role === 'admin' && (
                        <>
                          {/* Botón DESACTIVAR: Cascada a subcategorías y productos */}
                          <button 
                            className="btn btn-warning btn-sm me-1" 
                            onClick={() => handleDeactivate(category._id)} 
                            title="Desactivar (cascada)"
                          >
                            ⚠️
                          </button>
                          
                          {/* Botón ELIMINAR: Eliminación permanente con cascada */}
                          <button 
                            className="btn btn-danger btn-sm" 
                            onClick={() => handleDelete(category._id)} 
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
                  <td colSpan="3" className="text-center text-muted p-4">
                    😕 No se encontraron categorías con los filtros aplicados
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
