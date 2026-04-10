/**
 * ========================================
 *  VISTA: FORMULARIO DE USUARIO
 * ========================================
 *
 * Componente React para crear y editar usuarios con:
 *   - Modo crear (nuevo) o editar (existente)
 *   - Campos: username, email, contraseña, rol
 *   - Contraseña vacía al editar (opcional en modo editar)
 *
 * Flujo:
 *   1. Recibe prop user (null=crear, objeto=editar)
 *   2. En modo editar: password vacío (no se muestra el hash)
 *   3. handleSubmit detecta modo por form._id
 *   4. Llama createUser o updateUser según corresponda
 *
 * Props:
 *   - user: Objeto usuario (null para crear, objeto para editar)
 *   - onSuccess: Callback cuando se guarda correctamente
 *   - onCancel: Callback para cancelar y volver a la lista
 */

import React, { useState } from 'react'; // Importa React y hook useState para manejar el estado del formulario
import { createUser, updateUser } from '../controllers/userController'; // Importa funciones CRUD de usuarios que llaman al backend
import User from '../models/User'; // Clase modelo para inicializar el form con valores por defecto seguros

export default function UserForm({ user, onSuccess, onCancel }) { // Props: user=null(crear) u objeto(editar), callbacks onSuccess y onCancel
  // En modo editar: spread del user pero password vacío (no exponer el hash ni forzar cambio)
  // En modo crear: new User() inicializa todos los campos con defaults seguros
  const [form, setForm] = useState(user ? { ...user, password: '' } : new User()); // Estado del formulario; password siempre empieza vacío al editar
  const [error, setError] = useState(null); // Mensaje de error del servidor; null cuando no hay errores
  const [loading, setLoading] = useState(false); // true mientras la petición al servidor está en progreso

  // Actualizar campo del formulario al escribir o seleccionar
  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value }); // Actualiza solo el campo modificado manteniendo el resto del form intacto
  };

  // Manejar envío del formulario (crear o actualizar)
  const handleSubmit = async e => {
    e.preventDefault(); // Previene recarga de página al enviar el formulario HTML
    setLoading(true); // Activa estado de carga para dar feedback visual y evitar doble envío
    try {
      if (form._id) {
        // EDITAR: el usuario ya existe en DB, actualizar sus datos por _id
        await updateUser(form._id, form); // Llama PUT /api/users/:id; si password está vacío el backend no lo actualiza
      } else {
        // CREAR: no tiene _id, insertar nuevo usuario en la base de datos
        await createUser(form); // Llama POST /api/users; el backend hashea la contraseña con bcryptjs antes de guardar
      }
      setError(null); // Limpia errores anteriores si la operación fue exitosa
      onSuccess(); // Notifica al padre para refrescar la lista de usuarios y cerrar el formulario
    } catch (err) {
      setError(err.message); // Muestra error del servidor (ej: username/email duplicado, contraseña muy corta)
    }
    setLoading(false); // Desactiva estado de carga independientemente del resultado
  };

  return (
    <div className="d-flex justify-content-center align-items-center" style={{minHeight:'70vh'}}> {/* Centra el card vertical y horizontalmente en la pantalla */}
      <div className="card shadow p-4" style={{maxWidth:480, width:'100%', borderTop:'5px solid #20c997'}}> {/* Card con sombra y borde verde teal (color de usuarios) */}
        <h3 className="mb-4 text-center" style={{fontWeight:700, color:'#20c997'}}> {/* Título dinámico que cambia según el modo crear/editar */}
          {form._id ? 'Editar Usuario' : 'Crear Usuario'} {/* Modo editar si tiene _id, modo crear si no */}
        </h3>
        {error && <div className="alert alert-danger">{error}</div>} {/* Alerta roja Bootstrap; visible solo cuando hay error del servidor */}
        <form onSubmit={handleSubmit}> {/* Formulario controlado; onSubmit conecta con handleSubmit */}
          <div className="mb-3"> {/* Grupo campo username */}
            <label className="form-label">Usuario</label> {/* Etiqueta del campo nombre de usuario */}
            <input type="text" className="form-control" name="username" value={form.username} onChange={handleChange} required autoFocus /> {/* Input controlado; autoFocus coloca el cursor aquí al abrir el formulario */}
          </div>
          <div className="mb-3"> {/* Grupo campo email */}
            <label className="form-label">Email</label> {/* Etiqueta del campo correo electrónico */}
            <input type="email" className="form-control" name="email" value={form.email} onChange={handleChange} required /> {/* Input tipo email; el navegador valida formato antes de enviar */}
          </div>
          <div className="mb-3"> {/* Grupo campo contraseña */}
            <label className="form-label">Contraseña</label> {/* Etiqueta del campo contraseña */}
            <input type="password" className="form-control" name="password" value={form.password} onChange={handleChange} required={!form._id} minLength={6} /> {/* required solo en modo crear; en editar es opcional para no forzar cambio de contraseña */}
          </div>
          <div className="mb-3"> {/* Grupo selector de rol */}
            <label className="form-label">Rol</label> {/* Etiqueta del selector de rol */}
            <select className="form-select" name="role" value={form.role} onChange={handleChange} required> {/* Selector controlado; value vinculado a form.role */}
              <option value="auxiliar">Auxiliar</option> {/* Rol de menor privilegio; solo lectura y operaciones básicas */}
              <option value="coordinador">Coordinador</option> {/* Rol intermedio; puede gestionar pero sin permisos de eliminación */}
              <option value="admin">Admin</option> {/* Rol máximo; acceso completo incluyendo eliminación y gestión de usuarios */}
            </select>
          </div>
          <div className="d-flex justify-content-end mt-4 gap-2"> {/* Botones alineados a la derecha con separación entre ellos */}
            <button type="button" className="btn btn-outline-secondary" onClick={onCancel} disabled={loading}>Cancelar</button> {/* Botón cancelar: descarta cambios y llama onCancel */}
            <button type="submit" className="btn btn-primary" disabled={loading}> {/* Botón guardar: deshabilitado durante carga para evitar doble envío */}
              {loading ? 'Guardando...' : (form._id ? 'Actualizar' : 'Crear')} {/* Texto dinámico: spinner textual durante carga, acción según modo */}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
