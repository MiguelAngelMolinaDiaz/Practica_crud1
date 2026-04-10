/**
 * ========================================
 *  COMPONENTE RAÍZ DE LA APLICACIÓN REACT
 * ========================================
 * 
 * App.js es el componente principal que:
 *   - Gestiona el estado global de autenticación
 *   - Controla la navegación entre vistas (productos, categorías, usuarios)
 *   - Maneja la edición y creación de entidades
 *   - Sincroniza cambios mediante contadores de refresco
 * 
 * Estructura de estado:
 *   - view: Vista activa (dashboard, products, categories, subcategories, users)
 *   - auth: Datos de usuario autenticado (token, usuario)
 *   - editing*: Entidades en modo edición
 *   - refresh*Counter: Contadores para forzar refresco de listados
 * 
 * Flujo de autenticación:
 *   1. Si no hay auth → Mostrar Login
 *   2. Si hay auth → Mostrar Dashboard
 *   3. Logout limpia auth y localStorage
 * 
 * Vistas disponibles:
 *   - dashboard: Menú principal + estadísticas
 *   - products: Gestión de productos
 *   - categories: Gestión de categorías
 *   - subcategories: Gestión de subcategorías
 *   - users: Gestión de usuarios
 */

import React, { useState } from 'react'; // Importa React y el hook useState para manejar el estado global de la aplicación
// Componentes de vistas
import ProductList from './views/ProductList'; // Lista de productos con búsqueda, exportación y acciones CRUD
import ProductForm from './views/ProductForm'; // Formulario para crear y editar productos
import CategoryList from './views/CategoryList'; // Lista de categorías con búsqueda y acciones admin
import CategoryForm from './views/CategoryForm'; // Formulario para crear y editar categorías
import SubcategoryList from './views/SubcategoryList'; // Lista de subcategorías vinculadas a sus categorías padre
import SubcategoryForm from './views/SubcategoryForm'; // Formulario para crear y editar subcategorías con selector de categoría
import UserList from './views/UserList'; // Lista de usuarios del sistema con gestión de roles
import UserForm from './views/UserForm'; // Formulario para crear y editar usuarios con asignación de rol
import Login from './views/Login'; // Formulario de autenticación; punto de entrada cuando no hay sesión
import DashboardMenu from './views/DashboardMenu'; // Layout principal con sidebar, navegación y estadísticas
// Utilidades
import { getAuthFromStorage } from './utils/authUtils'; // Lee datos de autenticación (token + user) desde localStorage al iniciar
// Estilos
import './styles/main.css'; // Estilos globales personalizados de la aplicación
import 'bootstrap/dist/css/bootstrap.min.css'; // Framework CSS Bootstrap para componentes UI responsivos

/**
 * COMPONENTE PRINCIPAL APP
 * 
 * Responsabilidades:
 *   1. Renderizar Login si no hay autenticación
 *   2. Renderizar Dashboard si hay autenticación
 *   3. Manejar navegación entre vistas
 *   4. Gestionar estado de edición para cada entidad
 *   5. Proporcionar mecanismo de refresco a componentes hijos
 */
function App() {
  // ===== ESTADO DE AUTENTICACIÓN =====
  /**
   * view: Vista activa actualmente
   * Opciones: 'dashboard', 'products', 'categories', 'subcategories', 'users'
   */
  const [view, setView] = useState('dashboard'); // Vista por defecto al iniciar; 'dashboard' muestra el panel de estadísticas
  
  /**
   * auth: Datos del usuario autenticado
   * Estructura: { user: {_id, username, email, role}, token: "jwt..." }
   * Se obtiene de localStorage al cargar la app
   */
  const [auth, setAuth] = useState(() => getAuthFromStorage()); // Inicializa auth desde localStorage; función lazy evita leer storage en cada render

  // ===== ESTADO DE EDICIÓN Y REFRESCO POR ENTIDAD =====
  /**
   * Productos
   * - editingProduct: Producto siendo editado (null si modo creación)
   * - refreshProductCounter: Número que cambia para forzar refresco de lista
   */
  const [editingProduct, setEditingProduct] = useState(null); // null = no hay producto en edición; objeto = abre el formulario con sus datos
  const [refreshProductCounter, setRefreshProductCounter] = useState(0); // Contador que cambia al guardar/eliminar; ProductList usa este valor como key para remontarse
  
  /**
   * Categorías
   */
  const [editingCategory, setEditingCategory] = useState(null); // null = modo crear; objeto = modo editar con los datos de la categoría seleccionada
  const [refreshCategoryCounter, setRefreshCategoryCounter] = useState(0); // Contador de refresco para CategoryList; se incrementa tras cada operación exitosa
  
  /**
   * Subcategorías
   */
  const [editingSubcategory, setEditingSubcategory] = useState(null); // null = modo crear; objeto = modo editar con los datos de la subcategoría seleccionada
  const [refreshSubcategoryCounter, setRefreshSubcategoryCounter] = useState(0); // Contador de refresco para SubcategoryList; fuerza remount al cambiar
  
  /**
   * Usuarios
   */
  const [editingUser, setEditingUser] = useState(null); // null = modo crear; objeto = modo editar con los datos del usuario seleccionado
  const [refreshUserCounter, setRefreshUserCounter] = useState(0); // Contador de refresco para UserList; se incrementa tras crear, editar o eliminar

  // ===== HANDLERS DE EDICIÓN - PRODUCTOS =====
  /**
   * Abre el formulario de edición con la entidad seleccionada
   */
  const handleEditProduct = (product) => setEditingProduct(product); // Recibe el objeto producto desde ProductList y lo guarda en estado para abrir el formulario de edición
  
  /**
   * Cierra el formulario y incrementa contador para refresco
   * El "key" del ProductList cambia, forzando que se vuelva a montar
   */
  const handleSuccessProduct = () => { 
    setEditingProduct(null); // Cierra el formulario de producto limpiando el estado de edición
    setRefreshProductCounter(c => c + 1); // Incrementa contador para que ProductList se remonte y recargue datos del backend
  };
  
  /**
   * Cierra el formulario sin guardar
   */
  const handleCancelProduct = () => setEditingProduct(null); // Limpia el estado de edición para volver a la lista sin guardar cambios

  // ===== HANDLERS DE EDICIÓN - CATEGORÍAS =====
  const handleEditCategory = (category) => setEditingCategory(category); // Guarda la categoría seleccionada en estado para abrir el formulario de edición
  const handleSuccessCategory = () => { 
    setEditingCategory(null); // Cierra el formulario de categoría tras guardar exitosamente
    setRefreshCategoryCounter(c => c + 1); // Fuerza remount de CategoryList para mostrar los datos actualizados
  };
  const handleCancelCategory = () => setEditingCategory(null); // Cierra el formulario de categoría sin guardar cambios

  // ===== HANDLERS DE EDICIÓN - SUBCATEGORÍAS =====
  const handleEditSubcategory = (subcategory) => setEditingSubcategory(subcategory); // Guarda la subcategoría en estado para abrir el formulario de edición
  const handleSuccessSubcategory = () => { 
    setEditingSubcategory(null); // Cierra el formulario de subcategoría tras guardar exitosamente
    setRefreshSubcategoryCounter(c => c + 1); // Fuerza remount de SubcategoryList para reflejar los cambios en la tabla
  };
  const handleCancelSubcategory = () => setEditingSubcategory(null); // Cierra el formulario de subcategoría sin guardar cambios

  // ===== HANDLERS DE EDICIÓN - USUARIOS =====
  const handleEditUser = (user) => setEditingUser(user); // Guarda el usuario seleccionado en estado para abrir el formulario de edición
  const handleSuccessUser = () => { 
    setEditingUser(null); // Cierra el formulario de usuario tras guardar exitosamente
    setRefreshUserCounter(c => c + 1); // Fuerza remount de UserList para mostrar la lista actualizada con el nuevo usuario
  };
  const handleCancelUser = () => setEditingUser(null); // Cierra el formulario de usuario sin guardar cambios

  // ===== HANDLERS DE AUTENTICACIÓN =====
  /**
   * Logout: Limpia estado y localStorage
   * Si un token expira, authUtils llamas a esto automáticamente
   */
  const handleLogout = () => { 
    setAuth(null); // Limpia el estado de autenticación; React re-renderiza mostrando el Login
    localStorage.removeItem('auth'); // Elimina el token y datos del usuario de localStorage para cerrar sesión completamente
  };
  
  /**
   * Login: Guarda datos de autenticación en estado y localStorage
   * @param {Object} data - Objeto {user, token} del servidor
   */
  const handleLogin = (data) => { 
    setAuth(data); // Guarda { user, token } en estado; React re-renderiza mostrando el Dashboard
    localStorage.setItem('auth', JSON.stringify(data)); // Persiste la sesión en localStorage para que sobreviva recargas de página
  };

  // ===== RENDERIZACIÓN CONDICIONAL =====
  /**
   * Si no está autenticado, mostrar solo Login
   */
  if (!auth) { // Si no hay sesión activa (no hay token en localStorage), mostrar solo la pantalla de login
    return (
      <div className="container mt-4"> {/* Contenedor Bootstrap centrado con margen superior */}
        <Login onLogin={handleLogin} /> {/* Componente Login; llama handleLogin al autenticar exitosamente */}
      </div>
    );
  }

  // ===== CONTENIDO POR VISTA =====
  /**
   * Determina qué componente mostrar según la vista activa
   * Cada vista tiene:
   *   - Un botón "Crear" que abre formulario con entidad vacía
   *   - Una lista de entidades
   *   - Un formulario que aparece si hay edición activa
   * 
   * El "key" de la lista se cambia para simular re-render
   * cuando se actualiza con éxito una entidad
   */
  let dashboardContent = null; // Variable que almacenará el JSX del módulo activo; null en dashboard ya que DashboardMenu renderiza su propio contenido
  
  if (view === 'dashboard') {
    // Dashboard muestra estadísticas y accesos rápidos
    dashboardContent = null; // DashboardMenu se encarga de mostrar el contenido del dashboard (estadísticas y accesos rápidos)
  } 
  else if (view === 'products') { // Vista de gestión de productos
    dashboardContent = editingProduct ? ( // Si hay un producto en edición, muestra el formulario; si no, muestra la lista
      <ProductForm 
        product={editingProduct} // Pasa el producto a editar; {} vacío significa crear nuevo
        onSuccess={handleSuccessProduct} // Callback para cerrar formulario y refrescar lista tras guardar
        onCancel={handleCancelProduct} // Callback para cerrar formulario sin guardar cambios
      />
    ) : (
      <>
        <div className="d-flex justify-content-between align-items-center mb-3"> {/* Barra superior con botón crear */}
          <button 
            className="btn btn-success" 
            onClick={() => setEditingProduct({})} // {} vacío indica modo crear (sin _id); ProductForm lo detecta
          >
            Crear Producto
          </button>
        </div>
        {/* key fuerza remount cuando cambia el contador */}
        <ProductList 
          key={refreshProductCounter} // Cambiar key fuerza remount completo de ProductList recargando datos del backend
          onEdit={handleEditProduct} // Callback que recibe el producto a editar y abre el formulario
        />
      </>
    );
  } 
  else if (view === 'categories') { // Vista de gestión de categorías
    dashboardContent = editingCategory ? ( // Si hay categoría en edición muestra formulario; si no, muestra la lista
      <CategoryForm 
        category={editingCategory} // Categoría a editar; {} vacío para crear nueva
        onSuccess={handleSuccessCategory} // Cierra formulario e incrementa contador para refrescar la lista
        onCancel={handleCancelCategory} // Cierra formulario sin guardar
      />
    ) : (
      <>
        <div className="d-flex justify-content-between align-items-center mb-3"> {/* Barra superior con botón crear */}
          <button 
            className="btn btn-success" 
            onClick={() => setEditingCategory({})} // {} vacío activa modo crear en CategoryForm
          >
            Crear Categoría
          </button>
        </div>
        <CategoryList 
          key={refreshCategoryCounter} // key que cambia para forzar remount y recargar categorías desde el backend
          onEdit={handleEditCategory} // Callback que recibe la categoría seleccionada y abre el formulario de edición
        />
      </>
    );
  } 
  else if (view === 'subcategories') { // Vista de gestión de subcategorías
    dashboardContent = editingSubcategory ? ( // Si hay subcategoría en edición muestra formulario; si no, la lista
      <SubcategoryForm 
        subcategory={editingSubcategory} // Subcategoría a editar; {} vacío para crear nueva
        onSuccess={handleSuccessSubcategory} // Cierra formulario e incrementa contador para refrescar la lista
        onCancel={handleCancelSubcategory} // Cierra formulario sin guardar
      />
    ) : (
      <>
        <div className="d-flex justify-content-between align-items-center mb-3"> {/* Barra superior con botón crear */}
          <button 
            className="btn btn-success" 
            onClick={() => setEditingSubcategory({})} // {} vacío activa modo crear en SubcategoryForm
          >
            Crear Subcategoría
          </button>
        </div>
        <SubcategoryList 
          key={refreshSubcategoryCounter} // key cambiante que fuerza remount de SubcategoryList para recargar datos
          onEdit={handleEditSubcategory} // Callback que recibe la subcategoría a editar y la pasa al formulario
        />
      </>
    );
  } 
  else if (view === 'users') { // Vista de gestión de usuarios
    dashboardContent = editingUser ? ( // Si hay usuario en edición muestra formulario; si no, la lista
      <UserForm 
        user={editingUser} // Usuario a editar; {} vacío para crear nuevo
        onSuccess={handleSuccessUser} // Cierra formulario e incrementa contador para refrescar la lista
        onCancel={handleCancelUser} // Cierra formulario sin guardar
      />
    ) : (
      <>
        <div className="d-flex justify-content-between align-items-center mb-3"> {/* Barra superior con botón crear */}
          <button 
            className="btn btn-success" 
            onClick={() => setEditingUser({})} // {} vacío activa modo crear en UserForm
          >
            Crear Usuario
          </button>
        </div>
        <UserList 
          key={refreshUserCounter} // key cambiante que fuerza remount de UserList para reflejar cambios recientes
          onEdit={handleEditUser} // Callback que recibe el usuario a editar y lo pasa al formulario
        />
      </>
    );
  }

  // ===== RENDERIZACIÓN FINAL =====
  /**
   * Si estamos en dashboard, no mostrar contenido adicional
   * Si estamos en otra vista, mostrar el contenido con background
   */
  return (
    <DashboardMenu  // Componente layout que envuelve toda la app con sidebar y área de contenido
      view={view}  // Vista activa para que DashboardMenu resalte el botón correcto en el sidebar
      setView={setView}  // Función para cambiar de vista desde los botones del sidebar
      user={auth.user}  // Datos del usuario autenticado para mostrar el nombre y gestionar el logout
      onLogout={handleLogout} // Callback que limpia estado y localStorage al hacer click en "Salir"
    >
      {view === 'dashboard' ? null : ( // Si es dashboard, no pasa children (DashboardMenu muestra su propio contenido)
        <div className="container mt-4">{dashboardContent}</div> // Para otras vistas, envuelve el módulo activo en un contenedor Bootstrap
      )}
    </DashboardMenu>
  );
}

export default App; // Exporta App como default para que index.js pueda importarlo y montarlo en el DOM