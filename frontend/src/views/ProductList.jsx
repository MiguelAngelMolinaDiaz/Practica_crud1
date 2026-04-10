/**
 * ========================================
 *  VISTA: LISTA DE PRODUCTOS
 * ========================================
 * 
 * Componente React que muestra lista de productos con:
 *   - Tabla responsiva con datos de todos los productos
 *   - Filtros múltiples (búsqueda, stock, categoría, subcategoría)
 *   - Exportación a Excel y PDF
 *   - Acciones CRUD con validación de rol
 *   - Soft delete (desactivación) y hard delete (eliminación permanente)
 *   - Indicadores visuales de stock (disponible/agotado)
 * 
 * Flujo de datos:
 *   1. useEffect → Carga productos, categorías, subcategorías en paralelo
 *   2. Products mapean a objeto Product (modelo de datos)
 *   3. Filtros aplican búsqueda, stock, categoría, subcategoría
 *   4. Tabla renderiza filteredProducts
 *   5. Acciones (Editar, Desactivar, Eliminar) basadas en rol de usuario
 * 
 * Estados principales:
 *   - products: Array de todos los productos cargados
 *   - filteredProducts: Array resultado después de aplicar filtros
 *   - loading: Boolean indicando si se está cargando
 *   - error: String con mensaje de error si ocurre
 *   - searchTerm: Búsqueda por nombre/descripción
 *   - filterStockStatus: 'todos' | 'disponible' | 'agotado'
 *   - filterCategory: ID de categoría seleccionada
 *   - filterSubcategory: ID de subcategoría seleccionada
 * 
 * Props:
 *   - onEdit: Función callback que se llama cuando usuario hace click en editar
 *     Pasa el producto completo como argumento
 * 
 * Seguridad (Control de Acceso):
 *   - Editar: Todos los roles
 *   - Desactivar (Soft Delete): admin, coordinador
 *   - Eliminar (Hard Delete): admin únicamente
 * 
 * Características de exportación:
 *   - Excel: Exporta nombre, descripción, precio, stock, categoría, subcategoría
 *   - PDF: Exporta nombre, precio, stock, categoría (columnas más importantes)
 *   - Ambas incluyen timestamp para evitar sobrescrituras
 * 
 * @prop {Function} onEdit - Callback function when edit button clicked
 */

import React, { useEffect, useState } from 'react';
import { getProducts, deleteProduct } from '../controllers/productController';
import { getCategories } from '../controllers/categoryController';
import { getSubcategories } from '../controllers/subcategoryController';
import { getAuthFromStorage } from '../utils/authUtils';
import { exportToExcel, exportToPDF, formatDataForExport } from '../utils/reportUtils';
import Product from '../models/Product';

/**
 * COMPONENTE: ProductList
 * 
 * Renderiza tabla de productos con filtros y acciones
 * 
 * @param {Object} props - Props del componente
 * @param {Function} props.onEdit - Función para manejar edición
 */
export default function ProductList({ onEdit }) {
  // ===== ESTADOS =====
  
  // Lista completa de productos obtenida de API
  const [products, setProducts] = useState([]);
  
  // Lista filtrada según criterios de búsqueda y filtros
  const [filteredProducts, setFilteredProducts] = useState([]);
  
  // Categorías para dropdown de filtro
  const [categories, setCategories] = useState([]);
  
  // Subcategorías para dropdown de filtro (depende de categoría seleccionada)
  const [subcategories, setSubcategories] = useState([]);
  
  // Indica si se está cargando datos de API
  const [loading, setLoading] = useState(true);
  
  // Mensaje de error si ocurre problema al cargar
  const [error, setError] = useState(null);
  
  // Término de búsqueda (búsqueda libre por nombre/descripción)
  const [searchTerm, setSearchTerm] = useState('');
  
  // Filtro de stock: 'todos' | 'disponible' (>0) | 'agotado' (0)
  const [filterStockStatus, setFilterStockStatus] = useState('todos');
  
  // ID de categoría seleccionada en filtro (vacío significa todas)
  const [filterCategory, setFilterCategory] = useState('');
  
  // ID de subcategoría seleccionada en filtro (vacío significa todas)
  const [filterSubcategory, setFilterSubcategory] = useState('');
  
  // Obtener datos de usuario actual del localStorage
  const auth = getAuthFromStorage();

  /**
   * FUNCIÓN: Cargar productos, categorías y subcategorías
   * 
   * Ejecuta llamadas en paralelo (Promise.all) para optimizar:
   *   1. Carga productos de API
   *   2. Carga categorías de API
   *   3. Carga subcategorías de API
   * 
   * Mapea productos a instancias de modelo Product para validación
   * Convierte respuestas a arrays (algunos endpoints retornan { data: [] })
   * 
   * Limpia errores previos si carga es exitosa
   * 
   * @async
   */
  const fetchProducts = async () => {
    setLoading(true);
    try {
      // Ejecutar 3 llamadas API en paralelo
      const [productsResponse, categoriesResponse, subcategoriesResponse] = await Promise.all([
        getProducts(),
        getCategories(),
        getSubcategories()
      ]);
      
      // Normalizar respuestas (pueden ser array o { data: [] })
      const productsArr = Array.isArray(productsResponse) ? productsResponse : productsResponse.data;
      const categoriesArr = Array.isArray(categoriesResponse) ? categoriesResponse : categoriesResponse.data;
      const subcategoriesArr = Array.isArray(subcategoriesResponse) ? subcategoriesResponse : subcategoriesResponse.data;
      
      // Mapear a instancias de Product para aprovechar métodos del modelo
      setProducts(productsArr.map(p => new Product(p)));
      setCategories(categoriesArr);
      setSubcategories(subcategoriesArr);
      setError(null);
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  };

  /**
   * HOOK: Aplicar filtros cuando cambian los datos o criterios
   * 
   * Lógica de filtrado secuencial:
   *   1. Buscar por nombre o descripción (case-insensitive)
   *   2. Filtrar por estado de stock
   *   3. Filtrar por categoría (manejar objeto/string en p.category)
   *   4. Filtrar por subcategoría (manejar objeto/string en p.subcategory)
   * 
   * Características especiales:
   *   - Búsqueda funciona en nombre Y descripción (OR logic)
   *   - Stock disponible = > 0, agotado = === 0
   *   - Maneja formato tanto de objeto ({ _id, name }) como string (_id)
   * 
   * Dependencies: products, todos los filtros
   * Ejecuta automáticamente cuando cualquier dependencia cambia
   */
  useEffect(() => {
    let filtered = products;

    // FILTRO 1: Búsqueda por término (nombre o descripción)
    if (searchTerm) {
      filtered = filtered.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // FILTRO 2: Estado de stock
    if (filterStockStatus === 'disponible') {
      filtered = filtered.filter(p => p.stock > 0);
    } else if (filterStockStatus === 'agotado') {
      filtered = filtered.filter(p => p.stock === 0);
    }

    // FILTRO 3: Categoría
    if (filterCategory) {
      filtered = filtered.filter(p => {
        // Manejar caso donde category es objeto con _id vs string con _id
        const catId = (p.category && typeof p.category === 'object') ? p.category._id : p.category;
        return catId === filterCategory;
      });
    }

    // FILTRO 4: Subcategoría
    if (filterSubcategory) {
      filtered = filtered.filter(p => {
        // Manejar caso donde subcategory es objeto con _id vs string con _id
        const subcatId = (p.subcategory && typeof p.subcategory === 'object') ? p.subcategory._id : p.subcategory;
        return subcatId === filterSubcategory;
      });
    }

    setFilteredProducts(filtered);
  }, [products, searchTerm, filterStockStatus, filterCategory, filterSubcategory]);

  /**
   * HOOK: Carga inicial de datos
   * 
   * Se ejecuta una sola vez cuando componente monta
   * Dependencies: [] (vacío = sin dependencias)
   */
  useEffect(() => {
    fetchProducts();
  }, []);

  /**
   * FUNCIÓN: Desactivar producto (Soft Delete)
   * 
   * Cambiar isActive a false sin eliminar registro
   * Requiere confirmación del usuario
   * 
   * Acceso: admin, coordinador
   * 
   * @param {String} id - ID del producto a desactivar
   * @async
   */
  const handleDeactivate = async (id) => {
    if (window.confirm('¿Seguro que deseas desactivar este producto?')) {
      await deleteProduct(id);
      fetchProducts();
    }
  };

  /**
   * FUNCIÓN: Eliminar producto (Hard Delete)
   * 
   * Parámetro ?hardDelete=true en URL indica eliminación permanente
   * Requiere confirmación con fuerte advertencia ⚠️
   * 
   * Acceso: admin únicamente
   * 
   * @param {String} id - ID del producto a eliminar permanentemente
   * @async
   */
  const handleDelete = async (id) => {
    if (window.confirm('⚠️ ¡ADVERTENCIA! Esto eliminará permanentemente el producto. ¿Estás seguro?')) {
      try {
        await fetch(`http://localhost:3000/api/products/${id}?hardDelete=true`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${auth?.token}` }
        });
        fetchProducts();
      } catch (err) {
        alert('Error al eliminar: ' + err.message);
      }
    }
  };

  /**
   * FUNCIÓN: Exportar a Excel
   * 
   * Mapea producto a estructura para exportación:
   *   - Nombre, Descripción, Precio, Stock
   *   - Categoría (extrae .name de objeto)
   *   - Subcategoría (extrae .name de objeto)
   * 
   * Llama a reportUtils.exportToExcel()
   * Incluye timestamp automático en nombre de archivo
   * 
   * @async
   */
  const handleExportExcel = async () => {
    const dataToExport = formatDataForExport(filteredProducts, [
      { key: 'name', label: 'Nombre' },
      { key: 'description', label: 'Descripción' },
      { key: 'price', label: 'Precio' },
      { key: 'stock', label: 'Stock' },
      { key: 'category', label: 'Categoría' },
      { key: 'subcategory', label: 'Subcategoría' },
    ]);
    await exportToExcel(dataToExport, 'productos.xlsx', 'Productos');
  };

  /**
   * FUNCIÓN: Exportar a PDF
   * 
   * Mapea productos a estructura de tabla PDF (solo columnas principales)
   * Definir columnas: name, price, stock, category
   * Formato de precio incluye símbolo $ 
   * 
   * Llama a reportUtils.exportToPDF() con nombre de usuario
   * 
   * Parámetros:
   *   - dataForPDF: Array de objetos con datos formateados
   *   - filename: 'productos.pdf'
   *   - title: 'Reporte de Productos'
   *   - columns: Definición de columnas para tabla
   *   - userName: Obtenido de auth.user.username
   */
  const handleExportPDF = () => {
    const columns = [
      { key: 'name', label: 'Nombre', width: 35 },
      { key: 'price', label: 'Precio', width: 20 },
      { key: 'stock', label: 'Stock', width: 15 },
      { key: 'category', label: 'Categoría', width: 30 },
    ];
    const dataForPDF = filteredProducts.map(p => ({
      name: p.name,
      price: `$${p.price}`,
      stock: p.stock,
      category: p.category?.name || 'N/A'
    }));
    exportToPDF(dataForPDF, 'productos.pdf', 'Reporte de Productos', columns, auth?.user?.username);
  };

  // ===== RENDERIZADO =====
  
  // Mostrar loading mientras se cargan datos
  if (loading) return <div className="text-center p-4"><div className="spinner-border text-primary" role="status"><span className="visually-hidden">Cargando...</span></div></div>;
  
  // Mostrar error si ocurre problema
  if (error) return <div className="alert alert-danger">{error}</div>;

  return (
    <div className="container-fluid mt-4">
      <div className="card shadow p-4" style={{borderTop:'5px solid #0d6efd'}}>
        {/* SECCIÓN: ENCABEZADO */}
        <h2 className="mb-4 text-center" style={{color:'#0d6efd', fontWeight:700}}>
          📦 Gestión de Productos
        </h2>

        {/* SECCIÓN: FILTROS */}
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
          
          {/* Filtro 2: Estado de stock */}
          <div className="col-md-2">
            <select
              className="form-select"
              value={filterStockStatus}
              onChange={(e) => setFilterStockStatus(e.target.value)}
            >
              <option value="todos">📊 Todos</option>
              <option value="disponible">✅ Disponibles</option>
              <option value="agotado">❌ Agotados</option>
            </select>
          </div>
          
          {/* Filtro 3: Categoría */}
          <div className="col-md-2">
            <select
              className="form-select"
              value={filterCategory}
              onChange={(e) => {
                setFilterCategory(e.target.value);
                setFilterSubcategory(''); // Reset subcategoría cuando cambia categoría
              }}
            >
              <option value="">📂 Todas las categorías</option>
              {categories.map(cat => (
                <option key={cat._id} value={cat._id}>{cat.name}</option>
              ))}
            </select>
          </div>
          
          {/* Filtro 4: Subcategoría (depende de categoría seleccionada) */}
          <div className="col-md-2">
            <select
              className="form-select"
              value={filterSubcategory}
              onChange={(e) => setFilterSubcategory(e.target.value)}
              disabled={!filterCategory}
            >
              <option value="">🏷️ Todas las subcategorías</option>
              {subcategories
                .filter(sub => {
                  if (!filterCategory) return true;
                  const catId = (sub.category && typeof sub.category === 'object') ? sub.category._id : sub.category;
                  return catId === filterCategory;
                })
                .map(sub => (
                  <option key={sub._id} value={sub._id}>{sub.name}</option>
                ))}
            </select>
          </div>
          
          {/* Exportación: Botones para Excel y PDF */}
          <div className="col-md-2">
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
          📌 Mostrando <strong>{filteredProducts.length}</strong> de <strong>{products.length}</strong> productos
        </div>

        {/* SECCIÓN: TABLA DE DATOS */}
        <div className="table-responsive">
          <table className="table table-hover table-striped">
            {/* ENCABEZADO DE TABLA */}
            <thead className="table-light">
              <tr>
                <th>Nombre</th>
                <th>Descripción</th>
                <th>Precio</th>
                <th>Stock</th>
                <th>Categoría</th>
                <th>Subcategoría</th>
                <th>Acciones</th>
              </tr>
            </thead>
            
            {/* CUERPO DE TABLA */}
            <tbody>
              {filteredProducts.length > 0 ? (
                // Renderizar cada producto en una fila
                filteredProducts.map(product => (
                  <tr key={product._id}>
                    <td><strong>{product.name}</strong></td>
                    <td><small>{product.description.substring(0, 50)}...</small></td>
                    
                    {/* Precio con badge verde */}
                    <td><span className="badge bg-success">${product.price}</span></td>
                    
                    {/* Stock: Verde si disponible, Rojo si agotado */}
                    <td>
                      <span className={`badge ${product.stock > 0 ? 'bg-primary' : 'bg-danger'}`}>
                        {product.stock} unidades
                      </span>
                    </td>
                    
                    {/* Categoría: Mostrar nombre o 'N/A' si no existe */}
                    <td>{product.category?.name || 'N/A'}</td>
                    
                    {/* Subcategoría: Mostrar nombre o 'N/A' si no existe */}
                    <td>{product.subcategory?.name || 'N/A'}</td>
                    
                    {/* Columna de acciones: Editar, Desactivar (coord+), Eliminar (admin+) */}
                    <td>
                      {/* Botón EDITAR: Todos los roles */}
                      <button 
                        className="btn btn-primary btn-sm me-1" 
                        onClick={() => onEdit(product)} 
                        title="Editar"
                      >
                        ✏️
                      </button>
                      
                      {/* Botón DESACTIVAR: admin y coordinador */}
                      {(auth?.user?.role === 'admin' || auth?.user?.role === 'coordinador') && (
                        <button 
                          className="btn btn-warning btn-sm me-1" 
                          onClick={() => handleDeactivate(product._id)} 
                          title="Desactivar"
                        >
                          ⚠️
                        </button>
                      )}
                      
                      {/* Botón ELIMINAR: admin únicamente */}
                      {auth?.user?.role === 'admin' && (
                        <button 
                          className="btn btn-danger btn-sm" 
                          onClick={() => handleDelete(product._id)} 
                          title="Eliminar"
                        >
                          🗑️
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                // Mensaje cuando no hay resultados después de filtrar
                <tr>
                  <td colSpan="7" className="text-center text-muted p-4">
                    😕 No se encontraron productos con los filtros aplicados
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
