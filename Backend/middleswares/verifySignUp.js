/**
 * Middleware de validacion de signup
 * 
 * middleware para validar datos durante el proceso de registro de nuevos usuarios
 * se ejecuta en la ruta post /api/auth/singup Despues de verificar el token
 * Validaciones:
 * 1. checkDuplicateUsernameOrEmail: verifica inicidad del username y email
 * 2. checkRolesExisted: valida que el rol solicitado sea valido
 * 
 * Flujo de signup:
 * 1. cliente envia post /api/auth/signup con datos
 * 2. verifyToken confirma que usuario autenticado admin
 * 3. checkRole('admin') verifica que es admin
 * 4. checkDuplicateUsernameOrEmail valida inicidad
 * 5. checkRolesExisted valida rol
 * 6. authController.signup crea usuario si todo es valido
 * 
 * Errores retornados:
 * 400 Username / email duplicado o rol invalido
 * 500 error de base de datos
 */
const User = require('../models/User');

/**
 * Verifica que username y email sean unicos
 * Validaciones
 * username no debe existir en la base de datos
 * email no debe existir en la base de datos
 * ambos campos debe estar presente en el request
 * 
 * Busqueda: usa MongoDB $or para verificar ambas condiciones en usa sola query
 * @param {Object} req request object con req.body{username, email}
 * @param {Object} res response object  para enviar errores
 * @param {Function} next Callback al siguiente middleware
 * 
 * Respuestas:
 * 400 si username/email falta o ya existe
 * 500 error de base de datos
 * next() si la validación pasa
 */

const checkDuplicateUsernameOrEmail = async (req, res, next) => {
    try {
        // Validar que ambos campos estan presentes
        if (!req.body.username || !req.body.email) {
            return res.status(400).json({
                message: 'Username y email son requeridos'
            });
        }
        // Buscar usuario existente con igual username o email
        const user = await User.findOne({
            $or: [
                { username: req.body.username },
                { email: req.body.email }
            ]
        }).exec(); // .exec ejecuta el req y retorna los datos
        // Si encuentra un suario retornar error
        if (user) {
            return res.status(400).json({
                success: false,
                message: 'Username o email ya existen'
            });
        }
        // No hay duplicados continuar 
        next();
    } catch (err) {
        console.error("[verifiSignUp] Error en checkDuplicateUsernameOrEmail:", err);
        return res.status(500).json({
            success: false,
            message: "Error al verificar credenciales",
            error: err.message
        });
    }
};
/**
 * MIDDLEWARE verificar que el rol solicitado sea valido
 * roles validos en sistema:
 * admin: Administrador total
 * coordinador: Gestor de datos
 * Auxiliar: usuario basico
 * caracteristicas
 * permite pasar solo un rol
 * filtrar y rechazar roles invalidos
 * si algun rol es invalido rechaza todo el request
 * si campo role no está presente permite continuar default a rol auxiliar
 * @param {Object} req request object con req.body.{role...}
 * @param {Object} res response object
 * @param {Function} next callback al siguiente middleware
 * respuestas: 
 * 400 si algun rol es invalido
 * next() si todos los roles son validos o role no está especificado
 */
const checkRolesExisted = (req, res, next) => {
    // Lista blanca de roles validos en el sistema
    const validRoles = ['admin', 'coordinador', 'auxiliar'];

    // Si roles está presente en el request
    if (req.body.role) {
        // Guardar los roles  en un array, soporta un solo rol o multiples en el caso que un usuario tenga varios roles asignados
        const roles = Array.isArray(req.body.role) ? req.body.role : [req.body.role];

        // Filtrar roles que no están en la lista valida 
        const invalidRoles = roles.filter(role => !validRoles.includes(role));

        // Si hay roles invalido rechazar
        if (invalidRoles.length > 0) {
            return res.status(400).json({
                success: false,
                message: `Rol(es) no validos: ${invalidRoles.join(', ')}`
            });
        }
    }
    // Todos los roles son validos o no se especifico role, continuar
    next();
};

/**
 * Exportar middlewares
 * uso de rutas:
 * router.post('/signup...)
 */
module.exports = {
    checkDuplicateUsernameOrEmail,
    checkRolesExisted
};