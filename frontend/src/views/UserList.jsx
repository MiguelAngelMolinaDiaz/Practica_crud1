/**
 * ========================================
 *  VISTA: LISTA DE USUARIOS
 * ========================================
 * 
 * Componente React que muestra lista de usuarios con:
 *   - Tabla responsiva con todos los usuarios del sistema
 *   - Búsqueda por usuario o email
 *   - Filtro por rol (admin, coordinador, auxiliar)
 *   - Exportación a Excel y PDF
 *   - Acciones CRUD con control de rol
 *   - Soft delete (desactivación) con validaciones
 *   - Hard delete (eliminación permanente) solo para admin
 * 
 * Roles y acceso:
 *   - Admin: Acceso total (editar, desactivar, eliminar)
 *   - Coordinador: Puede desactivar usuarios (excepto admins)
 *   - Auxiliar: Solo ver usuarios (sin acciones de eliminación)
 * 
 * Características especiales:
 *   - Badges de rol con colores y emojis (👑, 👔, 👤)
 *   - Email clickeable (enlace mailto)
 *   - Validaciones de rol antes de mostrar botones
 * 
 * Flujo de datos:
 *   1. useEffect → Carga usuarios de API
 *   2. Usuarios mapean a modelo User
 *   3. Filtros aplican búsqueda + rol
 *   4. Tabla renderiza usuarios filtrados
 *   5. Acciones limitadas por rol del usuario actual
 * 
 * Estados principales:
 *   - users: Array de todos los usuarios
 *   - filteredUsers: Array después de aplicar filtros
 *   - loading: Boolean indicando carga
 *   - error: String con mensaje de error
 *   - searchTerm: Búsqueda por usuario/email
 *   - filterRole: 'todos' | 'admin' | 'coordinador' | 'auxiliar'
 * 
 * Props:
 *   - onEdit: Callback cuando usuario click en editar
 *     Pasa el usuario completo
 * 
 * Seguridad (Control de Acceso):
 *   - Editar: Todos los roles
 *   - Desactivar: admin, coordinador
 *   - Eliminar: admin únicamente
 * 
 * Roles del sistema:
 *   - admin (👑): Acceso total, super usuario
 *   - coordinador (👔): Gestiona usuarios y reportes
 *   - auxiliar (👤): Acceso limitado, solo consulta
 * 
 * @prop {Function} onEdit - Callback para editar usuario
 */

import React, { useEffect, useState } from 'react';
import { getUsers, deleteUser } from '../controllers/userController';
import { getAuthFromStorage } from '../utils/authUtils';
import { exportToExcel, exportToPDF, formatDataForExport } from '../utils/reportUtils';
import User from '../models/User';

/**
 * COMPONENTE: UserList
 * 
 * Renderiza tabla de usuarios con búsqueda, filtro por rol y acciones
 * 
 * @param {Object} props
 * @param {Function} props.onEdit - Función para editar usuario
 */
export default function UserList({ onEdit }) {
  // ===== ESTADOS =====
  
  // Lista completa de usuarios de API
  const [users, setUsers] = useState([]);
  
  // Lista filtrada después de aplicar criterios
  const [filteredUsers, setFilteredUsers] = useState([]);
  
  // Indica si se está cargando desde API
  const [loading, setLoading] = useState(true);
  
  // Mensaje de error si falla la carga
  const [error, setError] = useState(null);
  
  // Término de búsqueda (usuario o email)
  const [searchTerm, setSearchTerm] = useState('');
  
  // Filtro por rol: 'todos' | 'admin' | 'coordinador' | 'auxiliar'
  const [filterRole, setFilterRole] = useState('todos');
  
  // Información de usuario actual (para determinar permisos)
  const auth = getAuthFromStorage();

  /**
   * FUNCIÓN: Cargar usuarios de API
   * 
   * Obtiene todos los usuarios y los mapea a instancias de User
   * Normaliza respuesta (puede ser array o { data: [] })
   * Limpia errores previos si carga es exitosa
   * 
   * @async
   */
  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await getUsers();
      const arr = Array.isArray(response) ? response : response.data;
      setUsers(arr.map(u => new User(u)));
      setError(null);
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  };

  /**
   * HOOK: Filtrar usuarios cuando cambian datos o criterios
   * 
   * Aplicar filtros secuencialmente:
   *   1. Búsqueda por término en usuario Y email (case-insensitive)
   *   2. Filtro por rol (si no es 'todos')
   * 
   * Dependencies: users, searchTerm, filterRole
   */
  useEffect(() => {
    let filtered = users;

    // FILTRO 1: Búsqueda por término
    if (searchTerm) {
      filtered = filtered.filter(u =>
        u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // FILTRO 2: Por rol
    if (filterRole !== 'todos') {
      filtered = filtered.filter(u => u.role === filterRole);
    }

    setFilteredUsers(filtered);
  }, [users, searchTerm, filterRole]);

  /**
   * HOOK: Carga inicial de usuarios
   * 
   * Se ejecuta una sola vez cuando componente monta
   * Dependencies: [] (sin dependencias)
   */
  useEffect(() => {
    fetchUsers();
  }, []);

  /**
   * FUNCIÓN: Desactivar usuario (Soft Delete)
   * 
   * Soft delete: cambiar isActive a false SIN eliminar documento
   * Los datos permanecen en BD pero el usuario no puede acceder
   * 
   * Acceso: admin, coordinador
   * Requiere confirmación
   * 
   * @param {String} id - ID del usuario a desactivar
   * @async
   */
  const handleDeactivate = async (id) => {
    if (window.confirm('¿Seguro que deseas desactivar este usuario?')) {
      await deleteUser(id);
      fetchUsers();
    }
  };

  /**
   * FUNCIÓN: Eliminar usuario permanentemente (Hard Delete)
   * 
   * Hard delete: parámetro ?hardDelete=true elimina el documento
   * 
   * NO SE PUEDE RECUPERAR - Eliminación permanente
   * Acceso: admin únicamente
   * Requiere confirmación con advertencia ⚠️
   * 
   * @param {String} id - ID del usuario a eliminar
   * @async
   */
  const handleDelete = async (id) => {
    if (window.confirm('⚠️ ¡ADVERTENCIA! Esto eliminará permanentemente el usuario. ¿Estás seguro?')) {
      try {
        await fetch(`http://localhost:3000/api/users/${id}?hardDelete=true`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${auth?.token}` }
        });
        fetchUsers();
      } catch (err) {
        alert('Error al eliminar: ' + err.message);
      }
    }
  };

  /**
   * FUNCIÓN: Exportar usuarios a Excel
   * 
   * Mapea a estructura: Usuario, Email, Rol
   * Usa timestamp en nombre de archivo
   * 
   * @async
   */
  const handleExportExcel = async () => {
    const dataToExport = formatDataForExport(filteredUsers, [
      { key: 'username', label: 'Usuario' },
      { key: 'email', label: 'Email' },
      { key: 'role', label: 'Rol' },
    ]);
    await exportToExcel(dataToExport, 'usuarios.xlsx', 'Usuarios');
  };

  /**
   * FUNCIÓN: Exportar usuarios a PDF
   * 
   * Mapea usuarios y capitaliza el rol para mejor presentación
   * Columnas: Usuario, Email, Rol
   * Incluye nombre de usuario en reporte
   */
  const handleExportPDF = () => {
    const columns = [
      { key: 'username', label: 'Usuario', width: 35 },
      { key: 'email', label: 'Email', width: 40 },
      { key: 'role', label: 'Rol', width: 25 },
    ];
    const dataForPDF = filteredUsers.map(u => ({
      username: u.username,
      email: u.email,
      // Capitalizar rol para presentación: 'admin' → 'Admin'
      role: u.role.charAt(0).toUpperCase() + u.role.slice(1)
    }));
    exportToPDF(dataForPDF, 'usuarios.pdf', 'Reporte de Usuarios', columns, auth?.user?.username);
  };

  /**
   * FUNCIÓN HELPER: Generar badge formateado para rol
   * 
   * Retorna un badge Bootstrap con:
   *   - Color específico por rol
   *   - Emoji para identificación visual rápida
   *   - Nombre del rol en lowercase
   * 
   * Mapeo:
   *   - admin → red/danger, emoji 👑
   *   - coordinador → yellow/warning, emoji 👔
   *   - auxiliar → blue/info, emoji 👤
   * 
   * @param {String} role - El rol del usuario
   * @returns {JSX} Elemento span con badge Bootstrap
   */
  const getRoleBadge = (role) => {
    const colors = {
      admin: 'danger',
      coordinador: 'warning',
      auxiliar: 'info'
    };
    const icons = {
      admin: '👑',
      coordinador: '👔',
      auxiliar: '👤'
    };
    return <span className={`badge bg-${colors[role]}`}>{icons[role]} {role}</span>;
  };

  // ===== RENDERIZADO =====
  
  // Mostrar loading spinner
  if (loading) return <div className="text-center p-4"><div className="spinner-border text-success" role="status"><span className="visually-hidden">Cargando...</span></div></div>;
  
  // Mostrar error si ocurre
  if (error) return <div className="alert alert-danger">{error}</div>;

  return (
    <div className="container-fluid mt-4">
      <div className="card shadow p-4" style={{borderTop:'5px solid #20c997'}}>
        {/* SECCIÓN: ENCABEZADO */}
        <h2 className="mb-4 text-center" style={{color:'#20c997', fontWeight:700}}>
          👥 Gestión de Usuarios
        </h2>

        {/* SECCIÓN: FILTROS Y EXPORTACIÓN */}
        <div className="row mb-4 g-3">
          {/* Filtro 1: Búsqueda por texto libre */}
          <div className="col-md-6">
            <input
              type="text"
              className="form-control"
              placeholder="🔍 Buscar por usuario o email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          {/* Filtro 2: Por rol del usuario */}
          <div className="col-md-3">
            <select
              className="form-select"
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
            >
              <option value="todos">📊 Todos los roles</option>
              <option value="admin">👑 Administrador</option>
              <option value="coordinador">👔 Coordinador</option>
              <option value="auxiliar">👤 Auxiliar</option>
            </select>
          </div>
          
          {/* Exportación: Botones para Excel y PDF */}
          <div className="col-md-3">
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
          📌 Mostrando <strong>{filteredUsers.length}</strong> de <strong>{users.length}</strong> usuarios
        </div>

        {/* SECCIÓN: TABLA DE DATOS */}
        <div className="table-responsive">
          <table className="table table-hover table-striped">
            {/* ENCABEZADO DE TABLA */}
            <thead className="table-light">
              <tr>
                <th>Usuario</th>
                <th>Email</th>
                <th>Rol</th>
                <th>Acciones</th>
              </tr>
            </thead>
            
            {/* CUERPO DE TABLA */}
            <tbody>
              {filteredUsers.length > 0 ? (
                // Renderizar cada usuario
                filteredUsers.map(user => (
                  <tr key={user._id}>
                    <td><strong>{user.username}</strong></td>
                    
                    {/* Email como enlace mailto */}
                    <td><a href={`mailto:${user.email}`}>{user.email}</a></td>
                    
                    {/* Rol con badge formateado (color + emoji) */}
                    <td>{getRoleBadge(user.role)}</td>
                    
                    {/* Columna de acciones: Editar, Desactivar (coord+), Eliminar (admin) */}
                    <td>
                      {/* Botón EDITAR: Todos los roles */}
                      <button 
                        className="btn btn-primary btn-sm me-1" 
                        onClick={() => onEdit(user)} 
                        title="Editar"
                      >
                        ✏️
                      </button>
                      
                      {/* Botón DESACTIVAR: admin y coordinador */}
                      {(auth?.user?.role === 'admin' || auth?.user?.role === 'coordinador') && (
                        <button 
                          className="btn btn-warning btn-sm me-1" 
                          onClick={() => handleDeactivate(user._id)} 
                          title="Desactivar"
                        >
                          ⚠️
                        </button>
                      )}
                      
                      {/* Botón ELIMINAR: admin únicamente */}
                      {auth?.user?.role === 'admin' && (
                        <button 
                          className="btn btn-danger btn-sm" 
                          onClick={() => handleDelete(user._id)} 
                          title="Eliminar"
                        >
                          🗑️
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                // Mensaje cuando no hay resultados
                <tr>
                  <td colSpan="4" className="text-center text-muted p-4">
                    😕 No se encontraron usuarios con los filtros aplicados
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
