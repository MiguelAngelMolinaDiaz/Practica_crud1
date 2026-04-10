/**
 * ========================================
 *  UTILIDADES DE AUTENTICACIÓN
 * ========================================
 * 
 * Proporciona funciones centralizadas para:
 *   - Leer/escribir token JWT desde localStorage
 *   - Construir headers HTTP con autenticación
 *   - Manejar sesiones expiradas (401)
 *   - Wrapper de fetch con manejo automático de errores
 * 
 * Características de seguridad:
 *   - Manejo de corrupción de datos en localStorage
 *   - Limpieza de sesión en caso de 401
 *   - Redirección a login si token expira
 *   - Manejo centralizado de errores
 * 
 * Flujo de autenticación:
 *   1. Usuario hace login, recibe token
 *   2. Token se guarda en localStorage
 *   3. En cada request, se agrega el token como Bearer header
 *   4. Si servidor retorna 401, se limpia sesión y redirige a login
 *   5. Todos los errores pasan por handleResponse
 */

/**
 * FUNCIÓN: Obtener autenticación desde localStorage
 * 
 * Lee los datos de autenticación guardados en localStorage de forma segura.
 * Si los datos están corrupto s (JSON inválido), los limpia y retorna null.
 * 
 * Formato del dato guardado:
 *   {
 *     "user": {
 *       "_id": "123abc",
 *       "username": "admin",
 *       "email": "admin@example.com",
 *       "role": "admin"
 *     },
 *     "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *   }
 * 
 * Casos de uso:
 *   - App.js lo usa en useState inicial para persistencia de sesión
 *   - Otros componentes lo usan para acceder al token actual
 * 
 * @returns {Object|null}
 *   - Object: Datos de autenticación válidos
 *   - null: No hay datos o están corrupto s
 * 
 * Manejo de errores:
 *   - Si JSON es inválido: Registra error y limpia localStorage
 *   - Retorna null permitiendo aplicación continuar sin crash
 */
export const getAuthFromStorage = () => {
    try {
        const data = localStorage.getItem('auth');
        return data ? JSON.parse(data) : null;
    } catch (error) {
        console.error('Auth data corrupted, clearing storage');
        localStorage.removeItem('auth');
        return null;
    }
};

/**
 * FUNCIÓN: Generar headers HTTP con autenticación
 * 
 * Construye un objeto de headers que incluye el token JWT en formato Bearer.
 * Se usa automáticamente en apiFetch() para todas las solicitudes.
 * 
 * Formato del header:
 *   Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 * 
 * Comportamiento:
 *   - Si hay token: Retorna {Authorization: "Bearer <token>"}
 *   - Sin token: Retorna objeto vacío {}
 *   - Llamadas públicas (login, etc) no incluyen este header
 * 
 * @returns {Object}
 *   {Authorization: "Bearer <token>"} | {}
 * 
 * Ejemplo:
 *   const headers = authHeaders();
 *   const response = await fetch('/api/products', {
 *       headers: { ...headers }
 *   });
 */
export const authHeaders = () => {
    const auth = getAuthFromStorage();
    if (!auth || !auth.token) return {};
    return { 'Authorization': `Bearer ${auth.token}` };
};

/**
 * FUNCIÓN: Manejar respuestas HTTP
 * 
 * Procesa respuestas HTTP y maneja:
 *   1. Sesiones expiradas (código 401)
 *   2. Parseo de JSON de respuesta
 *   3. Mensajes de error descriptivos
 * 
 * Flujo:
 *   1. Si status 401: Limpia localStorage, redirige a login, lanza error
 *   2. Intenta parsear JSON de respuesta
 *   3. Si response.ok: Retorna data parseada
 *   4. Si !response.ok: Lanza error con mensaje personalizado
 * 
 * @param {Response} response - Objeto Response de fetch API
 * @returns {Object} Datos JSON parseados de la respuesta
 * @throws {Error} Si hay error HTTP (con mensaje descriptivo)
 * 
 * Códigos especiales:
 *   - 401: Sesión expirada → Limpia y redirige a /
 *   - Otros: Retorna mensaje de error del servidor o genérico
 * 
 * Ejemplo:
 *   const response = await fetch('/api/products');
 *   const data = await handleResponse(response);
 *   // Si 401 → Redirige a login automáticamente
 *   // Si 400+ → Lanza error con mensaje
 *   // Si 200-299 → Retorna data
 */
export const handleResponse = async (response) => {
    // MANEJO DE 401 - SESIÓN EXPIRADA
    // Esto permite al usuario saber que su sesión está expirada
    if (response.status === 401) {
        // Limpiar datos de sesión
        localStorage.removeItem('auth');
        // Redirigir a home page (muestra login)
        window.location.href = '/';
        // Lanzar error para que el componente lo pueda manejar
        throw new Error('Sesión expirada. Por favor inicia sesión nuevamente.');
    }

    // PARSEO DE RESPUESTA JSON
    // Intentar parsear respuesta, si falla usar objeto vacío
    let data;
    try {
        data = await response.json();
    } catch (error) {
        data = {};
    }

    // VALIDACIÓN DE STATUS
    // Si no es respuesta exitosa (2xx), lanzar error
    if (!response.ok) {
        throw new Error(data.message || `Error: ${response.status}`);
    }

    // Retornar datos si todo es exitoso
    return data;
};

/**
 * FUNCIÓN: Wrapper de fetch con autenticación
 * 
 * Función conveniente que:
 *   - Agrega headers de autenticación automáticamente
 *   - Serializa body a JSON si es necesario
 *   - Maneja errores HTTP con handleResponse
 *   - Centraliza lógica de API calls
 * 
 * @param {string} url - URL del endpoint
 * @param {Object} options - Opciones de fetch (método, body, etc)
 * @returns {Promise<Object>} Datos de la respuesta
 * @throws {Error} Si hay error HTTP
 * 
 * Ejemplos de uso:
 *   // GET con autenticación
 *   const products = await apiFetch('/api/products');
 *   
 *   // POST con body
 *   const newProduct = await apiFetch('/api/products', {
 *       method: 'POST',
 *       body: { name: 'Laptop', price: 999 }
 *   });
 *   
 *   // PUT para actualizar
 *   const updated = await apiFetch('/api/products/123', {
 *       method: 'PUT',
 *       body: { name: 'Nuevo nombre' }
 *   });
 *   
 *   // DELETE
 *   await apiFetch('/api/products/123', {
 *       method: 'DELETE'
 *   });
 * 
 * Ventajas sobre fetch directo:
 *   - Token se agrega automáticamente
 *   - JSON se serializa automáticamente
 *   - Errores se manejan de forma consistente
 *   - Sesiones expiradas se detectan automáticamente
 */
export const apiFetch = async (url, options = {}) => {
    // Opciones por defecto con autenticación incluida
    const defaultOptions = {
        headers: {
            'Content-Type': 'application/json',
            ...authHeaders()  // Agrega Authorization si hay token
        },
        ...options  // Sobrescribe con opciones del usuario
    };

    // Serializar body si es un objeto
    if (options.body && typeof options.body === 'object') {
        defaultOptions.body = JSON.stringify(options.body);
    }

    // Hacer el fetch y manejar respuesta
    const response = await fetch(url, defaultOptions);
    return handleResponse(response);
};
