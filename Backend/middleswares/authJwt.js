/**
 * MIDDLEWARE DE VERIFICACION JWT
 * middleware para verificar y validar tokens JWT en las solicitudes
 * se usa en todas las rutas protegidas para autenticar usuarios
 * caracteristicas:
 * soporta dos formatos de token
 * 1 Authorization: Bearer <token> (Estandar REST)
 * 2 x-access-token (header personalizado)
 * extrae informacion del token (id role email)
 * la adjunta a req.userId, req.userRole, req.userEmail para uso en los controladores
 * manejo de errores con codigos 403/401 apropiados
 * flujo:
 * 1. lee el header Authorization o x-access-token
 * 2. Extrae el token (quita el Bearer si es necesario)
 * 3. Verifica el token con JWR_SECRET
 * 4. Si es valido continua al siguiente middleware
 * 5. Si es invalido retorna 401 Unauthorized
 * 6. si falta retorna 403 Forbiden
 * 
 * Validacion del token
 * 1. Verifica firma criptografica con JWT_SECRET
 * 2. Comprueba que no haya expirado
 * 3. Extrae payload {id, role, email}
 */
const jwt = require('jsonwebtoken');
const config = require('../config/auth.config');

/**
 * Verificar token
 * funcionalidad
 * busca el token en las ubicaciones posibles (orden de procedencia)
 * 1. header Authorization con formato Bearer <token>
 * 2. header x-access-token
 * si encuentra el token verifica su validez
 * si no encuentra retorna 403 Forbiden
 * si token es invalido  / expirado retorna 401 Unauthorized
 * si es valido adjunta datos del usuario a req y continua
 * 
 * Headers soportados
 * 1. Authorization bearer <lñajdslkñfjasfñl...>
 * 2. x-access-token: <kjaoiewjaoijgoialk...> id, role, email
 * Propiedades del request despues del middleware:
 * req.userId = (string) Id del usuario MongoDB
 * req.userRole = (string) Role del usuario (admin, coordinador, auxiliar)
 * req.userEmail = (string) Email del usuario
 */
const verifyTokenFn = (req, res, next) => {
    try {
        // Sopotar dos formatos Authorization o access-token
        let token = null;

        // Formato Authorization
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
            // Extraer token quitando el Bearer
            token = req.headers.authorization.substring(7);
        }

        // Formato access-token
        else if (req.headers['x-access-token']) {
            token = req.headers['x-access-token'];
        }

        // Si no encontro token rechaza la solicitud
        if (!token) {
            return res.status(403).json({
                success: false,
                message: 'Token no proporcionado'
            });
        }

        // Verificar el token con la clave secreta
        const decoded = jwt.verify(token, config.secret);

        // Adjuntar informacion del usuario al request object para que otros middlewares y rutas puedan acceder a ella
        req.userId = decoded.id; // id de mongoDB
        req.userRole = decoded.role; // Rol de usuario
        req.userEmail = decoded.email; // email de usuario

        // token es valido continuar siguiente middleware o ruta
        next();
    } catch (error) {
        // n token invalido o expirado
        return res.status(401).json({
            success: false,
            message: 'Token invalido o expirado',
            error: error.message
        })
    }
};

/**
 * Validacion de funcion para mejor seguridad y manejo de errores
 * Verificar que verifyTokenFn sea una funcion valida
 * esto es una validacion de seguridad para que el middleware se exporte correctamente
 * si algo sale mal en su definicion lanzara un error en tiempo de carga del modulo
*/
if (typeof verifyTokenFn !== 'function') {
    console.error('[AuthJWT] ERROR: verifyTokenFn no es una funcion valida');
    throw new Error('verifyTokenFn debe ser una funcion');
}
// Exportar el middleware
module.exports = {
    verifyToken: verifyTokenFn,
};