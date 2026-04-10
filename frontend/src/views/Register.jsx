/**
 * ========================================
 *  VISTA: FORMULARIO DE REGISTRO
 * ========================================
 *
 * Componente React para registrar nuevos usuarios con:
 *   - Campos: username, email, contraseña, rol
 *   - Mensaje de éxito al registrar correctamente
 *   - Manejo de errores del servidor
 *
 * Flujo:
 *   1. Usuario completa los campos del formulario
 *   2. handleSubmit llama register() del authController
 *   3. Si OK: muestra alerta verde de éxito y llama onRegister
 *   4. Si error: muestra mensaje de error
 *
 * Props:
 *   - onRegister: Callback opcional que se ejecuta tras registro exitoso
 */

import React, { useState } from 'react'; // Importa React y hook useState para manejar estado del formulario
import { register } from '../controllers/authController'; // Importa función register que llama a POST /api/auth/signup

export default function Register({ onRegister }) { // Componente Register; onRegister es callback opcional del padre
  // Estado inicial del formulario con todos los campos vacíos y rol por defecto 'auxiliar'
  const [form, setForm] = useState({ username: '', email: '', password: '', role: 'auxiliar' }); // Inicializa form con valores seguros; role preseleccionado como auxiliar (menor privilegio)
  const [error, setError] = useState(null); // Mensaje de error a mostrar; null cuando no hay errores
  const [loading, setLoading] = useState(false); // true mientras espera respuesta del servidor; bloquea el botón
  const [success, setSuccess] = useState(false); // true cuando el registro fue exitoso; muestra alerta verde

  // Actualizar campo del formulario al escribir
  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value }); // Actualiza solo el campo modificado manteniendo los demás valores del form
  };

  // Manejar envío del formulario de registro
  const handleSubmit = async e => {
    e.preventDefault(); // Previene recarga de página al enviar el formulario HTML
    setLoading(true); // Activa estado de carga para bloquear el botón y dar feedback visual
    try {
      await register(form); // Llama al controller que hace POST /api/auth/signup con todos los campos del form
      setError(null); // Limpia errores anteriores si el registro fue exitoso
      setSuccess(true); // Activa el estado de éxito para mostrar la alerta verde al usuario
      onRegister && onRegister(); // Llama al callback del padre si existe (ej: redirigir al login)
    } catch (err) {
      setError('Error al registrar usuario'); // Muestra error genérico; puede ser email/username duplicado
    }
    setLoading(false); // Desactiva el estado de carga independientemente del resultado
  };

  return (
    <div className="container mt-4" style={{maxWidth: 400}}> {/* Contenedor centrado con ancho máximo de 400px */}
      <h2>Registro</h2> {/* Título del formulario */}
      {error && <div className="alert alert-danger">{error}</div>} {/* Alerta roja Bootstrap; se muestra solo si hay error */}
      {success && <div className="alert alert-success">Registro exitoso. Ahora puedes iniciar sesión.</div>} {/* Alerta verde; se muestra solo al registrar con éxito */}
      <form onSubmit={handleSubmit}> {/* Formulario HTML; onSubmit conecta con handleSubmit */}
        <div className="mb-3"> {/* Grupo campo username */}
          <label className="form-label">Usuario</label> {/* Etiqueta del campo de nombre de usuario */}
          <input type="text" className="form-control" name="username" value={form.username} onChange={handleChange} required /> {/* Input controlado; required exige que no esté vacío */}
        </div>
        <div className="mb-3"> {/* Grupo campo email */}
          <label className="form-label">Email</label> {/* Etiqueta del campo de correo electrónico */}
          <input type="email" className="form-control" name="email" value={form.email} onChange={handleChange} required /> {/* Input tipo email; el navegador valida el formato automáticamente */}
        </div>
        <div className="mb-3"> {/* Grupo campo contraseña */}
          <label className="form-label">Contraseña</label> {/* Etiqueta del campo de contraseña */}
          <input type="password" className="form-control" name="password" value={form.password} onChange={handleChange} required minLength={6} /> {/* minLength=6 exige mínimo 6 caracteres; type=password oculta el texto */}
        </div>
        <div className="mb-3"> {/* Grupo campo rol */}
          <label className="form-label">Rol</label> {/* Etiqueta del selector de rol */}
          <select className="form-select" name="role" value={form.role} onChange={handleChange} required> {/* Selector controlado; por defecto 'auxiliar' definido en useState */}
            <option value="auxiliar">Auxiliar</option> {/* Rol de menor privilegio; acceso limitado a lectura */}
            <option value="coordinador">Coordinador</option> {/* Rol intermedio; puede gestionar pero no eliminar */}
            <option value="admin">Admin</option> {/* Rol máximo; acceso completo a todas las operaciones */}
          </select>
        </div>
        <button type="submit" className="btn btn-success w-100" disabled={loading}>Registrarse</button> {/* Botón verde de ancho completo; disabled durante carga */}
      </form>
    </div>
  );
}
