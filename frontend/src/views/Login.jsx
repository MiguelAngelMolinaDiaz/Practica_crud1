
/**
 * ========================================
 *  VISTA: FORMULARIO DE LOGIN
 * ========================================
 *
 * Componente React para autenticar usuarios con:
 *   - Formulario de username y contraseña
 *   - Manejo de errores de autenticación
 *   - Estado de carga mientras espera respuesta del backend
 *
 * Flujo:
 *   1. Usuario ingresa username y contraseña
 *   2. handleSubmit llama login() del authController
 *   3. Si OK: llama onLogin(data) para actualizar estado global
 *   4. Si error: muestra mensaje de credenciales incorrectas
 *
 * Props:
 *   - onLogin: Callback que recibe { user, token } al autenticar
 */

import React, { useState } from 'react'; // Importa React y hook useState para manejar estado del formulario
import { login } from '../controllers/authController'; // Importa función login que llama a POST /api/auth/signin
import styles from './Login.module.css'; // Importa CSS Modules para estilos encapsulados del componente

export default function Login({ onLogin }) { // Componente Login; recibe callback onLogin que se ejecuta al autenticar con éxito
  // Estado del formulario con username y password vacíos como valores iniciales seguros
  const [form, setForm] = useState({ username: '', password: '' }); // Estado del formulario; se actualiza con cada keystroke del usuario
  const [error, setError] = useState(null); // Mensaje de error a mostrar; null cuando no hay error
  const [loading, setLoading] = useState(false); // true mientras espera respuesta del backend; deshabilita el botón

  // Actualizar campo del formulario cuando el usuario escribe
  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value }); // Spread del form actual + actualiza solo el campo que cambió usando el name del input
  };

  // Manejar envío del formulario de login
  const handleSubmit = async e => {
    e.preventDefault(); // Previene el comportamiento por defecto del form (recarga de página)
    setLoading(true); // Activa el estado de carga para deshabilitar el botón y dar feedback al usuario
    try {
      // Enviar username y email igual para máxima compatibilidad con el backend
      const data = await login({ // Llama al controller que hace POST /api/auth/signin con las credenciales
        username: form.username, // Nombre de usuario ingresado en el formulario
        email: form.username, // Se envía también como email por compatibilidad con el schema del backend
        password: form.password // Contraseña ingresada; el backend la compara con el hash bcrypt almacenado
      });
      setError(null); // Limpia cualquier error anterior si el login fue exitoso
      onLogin(data); // Llama al callback del padre con { user, token }; App.js lo guarda en estado y localStorage
    } catch (err) {
      setError('Usuario o contraseña incorrectos'); // Muestra error genérico al usuario sin revelar detalles de seguridad
    }
    setLoading(false); // Desactiva el estado de carga independientemente del resultado
  };

  return (
    <div className={styles['login-container']}> {/* Contenedor principal con estilos del módulo CSS */}
      <div className="text-center mb-4"> {/* Sección superior centrada con logo y título */}
        <img src="https://cdn-icons-png.flaticon.com/512/3064/3064197.png" alt="Login" width="64" height="64" style={{marginBottom: 10, opacity: 0.85}} /> {/* Ícono decorativo del formulario */}
        <div className={styles['login-title']}>Iniciar Sesión</div> {/* Título del formulario con estilo del módulo CSS */}
      </div>
      {error && <div className="alert alert-danger">{error}</div>} {/* Muestra alerta Bootstrap roja solo cuando hay error */}
      <form className={styles['login-form']} onSubmit={handleSubmit} autoComplete="off"> {/* Formulario; autoComplete off evita autocompletado del navegador */}
        <div className="mb-3"> {/* Grupo de campo username con margen inferior */}
          <label className="form-label">Usuario</label> {/* Etiqueta del campo username */}
          <input type="text" className="form-control" name="username" value={form.username} onChange={handleChange} required autoFocus /> {/* Input controlado; autoFocus pone el cursor aquí al cargar */}
        </div>
        <div className="mb-3"> {/* Grupo de campo contraseña con margen inferior */}
          <label className="form-label">Contraseña</label> {/* Etiqueta del campo password */}
          <input type="password" className="form-control" name="password" value={form.password} onChange={handleChange} required /> {/* Input tipo password; oculta los caracteres ingresados */}
        </div>
        <button type="submit" className="btn btn-primary w-100" disabled={loading}>{loading ? 'Entrando...' : 'Entrar'}</button> {/* Botón deshabilitado durante carga; cambia texto para dar feedback */}
      </form>
    </div>
  );
}
