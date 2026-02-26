/**
 * MIDDLEWARE DE VERIFICACION JWT
 * middleware para verificar y validar tokens JWT en las solicitudes
 * Se usa en todas las rutas protegidas para autenticar usuarios 
 * Caracteristicas: 
 * Soporta dos formatos de token
 * 1 - Authorization: Bearer <token> (Estandar REST)
 * 2 x-access-token (Header personalizado)
 * Extrae informacion del token (id role email)
 * La adjunta a req.user req.userRole, req.userEmail para uso de controladores
 * Manejo de errores con codigos 403/401 apropiados
 * Flujo:
 * 1. Leer el header authorization o x-access-token
 * 2. Extrae el token (quita el bearer si es necesario)
 * 3. verifica el token JTW_SECRET
 * 4. si es valido continua con el siguiente middleware
 * 5. Si es invalido retorna 401 Unauthorized
 * si falta retorna 403 Forbidden
 * Validacion del token:
 * 1 - Verifica firma criptografica con JWT_SECRET
 * 2 - Comprueba que no haya expirado
 * 3 - Extrae payload (id, role, email) 
*/

const jwt = require("jsonwebtoken");
const config = require("../config/auth.config.js");

/**
 * Verificar token
 * Funcionalidad
 * Busca el token en la ubicaciones posibles (Orden de procedencia)
 * 1 - Header Authorization con formato Bearer <token>
 * 2. Header x-access-token 
 * Si encuentra el token verifica su validez
 * Si no encuentra retorna 403 Forbidden
 * Si token es invalido/ expirado retorna 401 Unauthorized
 * Si es valido adjunta datos del usuario a req y continua
 * 
 * Headers soportados:
 * Authorization: Bearer <dfhgkjfdshgrgnjklsfg...>
* x-access-token: <wqemwquimaslkdasfjh...> id, role, email
* Propiedades del request despues del middleware:
* req.userId = (string) Id del usuario MongoDB
* req.userRole = (string) Role del usuario (admin, coordinador, auxiliar)
* req.userEmail = (string) Email del usuario
*/ 

const verifyToken = (req, res, next) => {
    try {
        // Soportar dos formatos authorization: bearer o access-token
        let token = null;

        // Formmato Authorization
        if (req.headers.authorization && req.headers.authorization.startsWith("Bearer ")) {
            // Extraer token quitando el bearer
            token = req.headers.authorization.substring(7);
        }

        // Formato access-token
        else if (req.headers["x-access-token"]) {
            token = req.headers["x-access-token"];
        }

        // Si no encontramos token  rechza la solicitud 
        if (!token) {
                return res.status(403).json({
                success: false,
                message: "Token no proporcionado",
                });
        }

        // Verificar el token con la clave secreta
        const decoded = jwt.verify(token, config.secret);

        // Adjuntar informacion del usuario a request para que otros middlewares y rutas puedan  acceder a ella
        req.userId = decoded.id; // id de mondgoDB
        req.userRole = decoded.role; //Rol de usuario
        req.userEmail = decoded.email; // Email del usuario

        // Token es valudo continuar  siguieente middleware o ruta
        next();
    }  catch (error) {
        // No token invalido o expirado

        return res.status(401).json({
            success: false,
            message: "Token invalido o expirado",
            error: error.message,
        });
    }
};

/**
 * Validacion de funciona para mejor seguridad y manejo de errores
 * Verifica que verifyToken sea una fnucion valida
 * Esto es una validacion de seguriddad para que el middleware se exporte correctamente
 * SI algo sale mal en su definicion lanzara un error en tiempo de carga del modulo 
 */

if (typeof verifyToken !== "function") {
    console.error("Error: verifyToken no es una función valida");
    throw new Error("verifyToken debe ser una función");
}

// Exportar el middleware
module.exports = {
    auth: verifyToken,
};