/**
 * ========================================
 *  VISTA: DASHBOARD PRINCIPAL
 * ========================================
 *
 * Componente React que actúa como layout principal de la app con:
 *   - Barra lateral (sidebar) con navegación entre módulos
 *   - Panel de bienvenida con accesos rápidos por íconos
 *   - Tarjetas de estadísticas en tiempo real (totales de cada colección)
 *   - Botón de logout con nombre del usuario actual
 *   - Renderizado dinámico del contenido según la vista activa
 *
 * Flujo:
 *   1. Al montar: fetchStats carga estadísticas desde /api/statistics
 *   2. Sidebar: botones cambian la vista activa via setView
 *   3. Si view === 'dashboard': muestra bienvenida + accesos + stats
 *   4. Si view !== 'dashboard': muestra botón "volver" + children
 *
 * Props:
 *   - view: String con la vista activa ('dashboard','categories','products',etc)
 *   - setView: Función para cambiar la vista activa
 *   - user: Objeto usuario autenticado { username, role, _id }
 *   - onLogout: Callback para cerrar sesión y limpiar estado global
 *   - children: Componente hijo a renderizar según la vista seleccionada
 */

import React, { useEffect, useState } from 'react'; // useEffect para cargar stats al montar; useState para manejar estado local
import styles from './Dashboard.module.css'; // CSS Modules con estilos del layout: sidebar, content, botones de navegación
import { apiFetch } from '../utils/authUtils'; // Wrapper de fetch que agrega JWT automáticamente para llamar la API de estadísticas

// Array de accesos rápidos del dashboard: cada objeto define un módulo del sistema
const quickAccess = [ // Configuración estática de los 4 módulos principales para renderizar los botones de acceso rápido
  {
    label: 'Categorías', // Texto visible en el botón de acceso rápido
    icon: 'https://cdn.jsdelivr.net/npm/bootstrap-icons@1.10.5/icons/tags.svg', // URL del ícono SVG de Bootstrap Icons
    color: '#6610f2', // Color morado asignado al módulo categorías (consistente con toda la app)
    view: 'categories', // Nombre de la vista que se activa al hacer click en este botón
  },
  {
    label: 'Subcategorías', // Texto visible en el botón de acceso rápido
    icon: 'https://cdn.jsdelivr.net/npm/bootstrap-icons@1.10.5/icons/list-ul.svg', // Ícono de lista para subcategorías
    color: '#fd7e14', // Color naranja asignado al módulo subcategorías
    view: 'subcategories', // Nombre de la vista que activa la lista de subcategorías
  },
  {
    label: 'Productos', // Texto visible en el botón de acceso rápido
    icon: 'https://cdn.jsdelivr.net/npm/bootstrap-icons@1.10.5/icons/box-seam.svg', // Ícono de caja para productos
    color: '#0d6efd', // Color azul asignado al módulo productos
    view: 'products', // Nombre de la vista que activa la lista de productos
  },
  {
    label: 'Usuarios', // Texto visible en el botón de acceso rápido
    icon: 'https://cdn.jsdelivr.net/npm/bootstrap-icons@1.10.5/icons/people-fill.svg', // Ícono de personas para usuarios
    color: '#20c997', // Color verde teal asignado al módulo usuarios
    view: 'users', // Nombre de la vista que activa la lista de usuarios
  },
];

export default function DashboardMenu({ view, setView, user, onLogout, children }) { // Layout principal; recibe vista activa, función cambio de vista, usuario, logout y children
  const [stats, setStats] = useState(null); // Estadísticas del sistema (total categorías, productos, etc.); null mientras carga
  const [loadingStats, setLoadingStats] = useState(true); // true mientras se carga las estadísticas desde el backend
  const [errorStats, setErrorStats] = useState(null); // Mensaje de error si falla la carga de estadísticas

  // Cargar estadísticas del sistema al montar el componente
  useEffect(() => {
    async function fetchStats() { // Función asíncrona interna para cargar estadísticas de la API
      setLoadingStats(true); // Activa estado de carga antes de la petición
      setErrorStats(null); // Limpia errores anteriores antes de intentar nueva carga
      try {
        const data = await apiFetch('http://localhost:3000/api/statistics', { method: 'GET' }); // Llama GET /api/statistics; retorna { totalCategories, totalSubcategories, totalProducts, totalUsers }
        setStats(data); // Guarda las estadísticas en estado para renderizar las tarjetas del dashboard
      } catch (err) {
        setErrorStats('No se pudieron cargar las estadísticas'); // Muestra mensaje amigable si el backend no responde
      } finally {
        setLoadingStats(false); // Desactiva carga independientemente del resultado (éxito o error)
      }
    }
    fetchStats(); // Ejecuta la carga de estadísticas inmediatamente al montar
  }, []); // Array vacío: solo se ejecuta una vez al montar el componente

  return (
    <div className={styles['dashboard-layout']}> {/* Layout principal con sidebar + área de contenido definidos en Dashboard.module.css */}
      <aside className={styles['dashboard-sidebar']}> {/* Barra lateral izquierda con navegación y datos del usuario */}
        <div className={styles['sidebar-title']}>Menú</div> {/* Título de la barra lateral con estilo del módulo CSS */}
        {/* Botones de navegación: clase 'active' se agrega al botón de la vista actualmente seleccionada */}
        <button className={styles['sidebar-link'] + (view === 'dashboard' ? ' active' : '')} onClick={() => setView('dashboard')}>Dashboard</button> {/* Botón inicio: lleva al panel principal con estadísticas */}
        <button className={styles['sidebar-link'] + (view === 'categories' ? ' active' : '')} onClick={() => setView('categories')}>Categorías</button> {/* Botón módulo categorías: activa CategoryList */}
        <button className={styles['sidebar-link'] + (view === 'subcategories' ? ' active' : '')} onClick={() => setView('subcategories')}>Subcategorías</button> {/* Botón módulo subcategorías: activa SubcategoryList */}
        <button className={styles['sidebar-link'] + (view === 'products' ? ' active' : '')} onClick={() => setView('products')}>Productos</button> {/* Botón módulo productos: activa ProductList */}
        <button className={styles['sidebar-link'] + (view === 'users' ? ' active' : '')} onClick={() => setView('users')}>Usuarios</button> {/* Botón módulo usuarios: activa UserList */}
        <div style={{flex: 1}}></div> {/* Espaciador flexible que empuja el bloque de usuario al fondo del sidebar */}
        <div className="mt-4 text-center" style={{fontSize: '1.08rem', color:'#fff', fontWeight:600, letterSpacing:0.2}}> {/* Bloque inferior del sidebar con nombre de usuario y botón de logout */}
          <span style={{display:'block', fontSize:'1.15rem', marginBottom:2}}>👤 {user?.username || 'Usuario'}</span> {/* Muestra el nombre del usuario autenticado; fallback 'Usuario' si no está disponible */}
          <button className="btn btn-danger btn-sm mt-2" onClick={onLogout}>Salir</button> {/* Botón logout: llama onLogout que limpia estado y localStorage en App.js */}
        </div>
      </aside>
      <main className={styles['dashboard-content']}> {/* Área de contenido principal a la derecha del sidebar */}
        {view === 'dashboard' && ( // Solo renderiza el panel de bienvenida cuando la vista activa es 'dashboard'
          <>
            {/* Sección de bienvenida con nombre del usuario */}
            <div className="d-flex flex-column align-items-center" style={{marginTop:'2.5rem', marginBottom:'2.5rem'}}> {/* Centra el contenido de bienvenida */}
              <h2 style={{fontWeight:700, color:'#2c3e50', marginBottom:10, fontSize:'2.1rem'}}>Bienvenido al Panel de Administración</h2> {/* Título principal del dashboard */}
              <div style={{fontSize:'1.18rem', color:'#2c3e50', fontWeight:600, marginBottom:24}}>
                Usuario actual: <span style={{color:'#007bff'}}>{user?.username || 'Usuario'}</span> {/* Muestra el username en azul; viene del estado global de App.js */}
              </div>
            </div>
            {/* Grid de accesos rápidos: botones grandes con ícono y nombre de cada módulo */}
            <div className={styles['quick-access']} style={{justifyContent:'center', gap:'2.5rem', marginBottom:'2.5rem'}}> {/* Contenedor flex de botones de acceso rápido */}
              {quickAccess.map(q => ( // Itera el array quickAccess para renderizar un botón por módulo
                <button
                  key={q.view} // Key única usando el nombre de vista para la reconciliación de React
                  className={styles['quick-btn']} // Estilo del botón de acceso rápido definido en Dashboard.module.css
                  onClick={() => setView(q.view)} // Al click cambia la vista activa al módulo correspondiente
                >
                  <span style={{
                    display:'inline-flex',alignItems:'center',justifyContent:'center',
                    background:q.color+'22',borderRadius:'50%',padding:18, marginBottom:10 // Fondo circular semitransparente con el color del módulo (22 = 13% opacidad en hex)
                  }}>
                    <img src={q.icon} alt={q.label} style={{
                      width:48, height:48,
                      filter:`invert(1) sepia(1) saturate(5) hue-rotate(${q.color === '#0d6efd' ? 200 : q.color === '#6610f2' ? 270 : q.color === '#fd7e14' ? 20 : q.color === '#20c997' ? 140 : 50}deg) brightness(1.1)`, // Filtro CSS para colorear el SVG blanco con el color del módulo
                      color:q.color
                    }} />
                  </span>
                  <div style={{fontSize:'1.18rem', fontWeight:500, marginTop: '0.5rem'}}>{q.label}</div> {/* Nombre del módulo debajo del ícono */}
                </button>
              ))}
            </div>
            {/* Sección de estadísticas en tiempo real: se muestran 4 tarjetas con los totales */}
            <div style={{width:'100%', marginTop:'3rem', display:'flex', justifyContent:'center'}}>
              <div style={{display:'flex', gap:'2rem', flexWrap:'wrap', justifyContent:'center', width:'100%'}}>
                {loadingStats ? ( // Estado de carga: mientras espera respuesta de /api/statistics
                  <div style={{background:'#fffbe6', borderRadius:16, boxShadow:'0 2px 12px rgba(0,0,0,0.07)', padding:'2rem 3rem', minWidth:220, minHeight:120, display:'flex', flexDirection:'column', alignItems:'center'}}>
                    <div style={{fontWeight:700, fontSize:'1.2rem', color:'#856404'}}>Estadísticas</div>
                    <div style={{fontSize:'1.05rem', color:'#856404', marginTop:6}}>Cargando estadísticas...</div> {/* Mensaje de carga mientras espera respuesta del backend */}
                  </div>
                ) : errorStats ? ( // Estado de error: si el backend no responde o retorna error
                  <div style={{background:'#fffbe6', borderRadius:16, boxShadow:'0 2px 12px rgba(0,0,0,0.07)', padding:'2rem 3rem', minWidth:220, minHeight:120, display:'flex', flexDirection:'column', alignItems:'center'}}>
                    <div style={{fontWeight:700, fontSize:'1.2rem', color:'#856404'}}>Estadísticas</div>
                    <div style={{fontSize:'1.05rem', color:'#dc3545', marginTop:6}}>{errorStats}</div> {/* Muestra el mensaje de error en rojo */}
                  </div>
                ) : stats ? ( // Estado exitoso: renderiza las 4 tarjetas con los totales reales
                  <>
                    {/* Tarjeta Categorías */}
                    <div style={{background:'#e3f2fd', borderRadius:16, boxShadow:'0 2px 12px rgba(0,0,0,0.07)', padding:'1.5rem 2.2rem', minWidth:180, minHeight:120, display:'flex', flexDirection:'column', alignItems:'center'}}>
                      <img src="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.10.5/icons/tags.svg" alt="Categorías" style={{width:36, height:36, marginBottom:8, filter:'invert(17%) sepia(97%) saturate(7492%) hue-rotate(270deg) brightness(97%) contrast(101%)'}} />
                      <div style={{fontWeight:700, fontSize:'1.1rem', color:'#6610f2'}}>Categorías</div>
                      <div style={{fontSize:'2rem', fontWeight:700, color:'#6610f2', marginTop:4}}>{stats.totalCategories}</div> {/* Total de categorías devuelto por /api/statistics */}
                    </div>
                    {/* Tarjeta Subcategorías */}
                    <div style={{background:'#fff3e0', borderRadius:16, boxShadow:'0 2px 12px rgba(0,0,0,0.07)', padding:'1.5rem 2.2rem', minWidth:180, minHeight:120, display:'flex', flexDirection:'column', alignItems:'center'}}>
                      <img src="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.10.5/icons/list-ul.svg" alt="Subcategorías" style={{width:36, height:36, marginBottom:8, filter:'invert(63%) sepia(97%) saturate(7492%) hue-rotate(20deg) brightness(97%) contrast(101%)'}} />
                      <div style={{fontWeight:700, fontSize:'1.1rem', color:'#fd7e14'}}>Subcategorías</div>
                      <div style={{fontSize:'2rem', fontWeight:700, color:'#fd7e14', marginTop:4}}>{stats.totalSubcategories}</div> {/* Total de subcategorías devuelto por /api/statistics */}
                    </div>
                    {/* Tarjeta Productos */}
                    <div style={{background:'#e3f2fd', borderRadius:16, boxShadow:'0 2px 12px rgba(0,0,0,0.07)', padding:'1.5rem 2.2rem', minWidth:180, minHeight:120, display:'flex', flexDirection:'column', alignItems:'center'}}>
                      <img src="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.10.5/icons/box-seam.svg" alt="Productos" style={{width:36, height:36, marginBottom:8, filter:'invert(24%) sepia(98%) saturate(7492%) hue-rotate(202deg) brightness(97%) contrast(101%)'}} />
                      <div style={{fontWeight:700, fontSize:'1.1rem', color:'#0d6efd'}}>Productos</div>
                      <div style={{fontSize:'2rem', fontWeight:700, color:'#0d6efd', marginTop:4}}>{stats.totalProducts}</div> {/* Total de productos devuelto por /api/statistics */}
                    </div>
                    {/* Tarjeta Usuarios */}
                    <div style={{background:'#e6fcf5', borderRadius:16, boxShadow:'0 2px 12px rgba(0,0,0,0.07)', padding:'1.5rem 2.2rem', minWidth:180, minHeight:120, display:'flex', flexDirection:'column', alignItems:'center'}}>
                      <img src="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.10.5/icons/people-fill.svg" alt="Usuarios" style={{width:36, height:36, marginBottom:8, filter:'invert(62%) sepia(97%) saturate(7492%) hue-rotate(140deg) brightness(97%) contrast(101%)'}} />
                      <div style={{fontWeight:700, fontSize:'1.1rem', color:'#20c997'}}>Usuarios</div>
                      <div style={{fontSize:'2rem', fontWeight:700, color:'#20c997', marginTop:4}}>{stats.totalUsers}</div> {/* Total de usuarios devuelto por /api/statistics */}
                    </div>
                  </>
                ) : null} {/* null: no renderiza nada si stats es null (estado inicial antes de cargar) */}
              </div>
            </div>
          </>
        )}
        {/* Contenedor del contenido dinámico: aquí se monta el componente hijo según la vista activa */}
        <div style={{width: '100%'}}>
          {view !== 'dashboard' && ( // Solo muestra el botón "volver" cuando NO estamos en la vista dashboard
            <div style={{margin:'2rem 0 1.5rem 0', textAlign:'left'}}>
              <button className="btn btn-outline-primary" onClick={() => setView('dashboard')}> {/* Botón volver: regresa al panel principal con estadísticas */}
                ← Volver al Dashboard
              </button>
            </div>
          )}
          {children} {/* Renderiza el componente hijo pasado desde App.js según la vista activa (CategoryList, ProductList, etc.) */}
        </div>
      </main>
    </div>
  );
}
