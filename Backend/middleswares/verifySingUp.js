/**
 * middleware de validacion de singup
 * middleware para validar datos durante el proceso de registro de nuevos usuarios
 * Se ejecuta en la ruta post /api/auth/signup Despues de verificar el token 
 * Validaciones:
 * 1. checkDuplicateUsernameOrEmail: Verifica inicio del username y email
 * 2. checkRolesExisted: Valida que el rol solicitado sea valido 
 * 
 * Flujo de singup:
 * 1. Cliente envia post a /api/auth/signup con datos
 * 2. verifyToken confirma que usuairio autenticado admin
 * 3. checkRole("admin") verifica que es admin 
 * 4. checkDuplicateUsernameOrEmail valida unicidad
 * 5. checkRolesExisted valida rol
 * 6. authController.signup crea nuevo usuario su todo es valido
 * 
 * Errores retornados:
 * 400 Username / email duplicado o rol invalido
 * 500 Error de bases de datos
 */

const User = require("../models/User");

/**
 * Verificar que username y email sean unicos
 * Validaciones:
 * username no debe existir en la base de datos
 * email no debe existir en la base de datos
 * Ambos campos deben estar presentes en el request
 * Busqueda: Usa MongoDB $or para verificar ambas condiciones en una sola query
 * @param {Object} request object con req.body{username, email
 * @param {object} res responde object para enviar errores
 * @param {Funciton} next Callback al siguiente middleware
 * 
 * Respuestas:
 * 400 si username/email falta o ya existe
 * 500 error de base de datos
 * next() si la validacion pasa
 */

const checkDuplicateUsernameOrEmail = async (req, res, next) => {
    try {
        // Validar que ambos estan presentes
        if (!req.body.username || !req.body.email) {
            return res.status(400).json({ 
                message: "Username y email son requeridos" 
            });
        }

        // Buscar usuario existente con igual username o email
        const user = await User.findOne({
            $or: [
                { username: req.body.username },
                { email: req.body.email }
            ]
        }) .exec();

        // SI encuentra un usuario retornar error
        if (user) {
            return res.status(400).json({
                success: false,
                message: "Username o email ya existe"
            });
        }

        // NO hay duplicados
        next();
    } catch (err) {
        console.error("[verifySingUp] Error en checkDuplicateUsernameOrEmail:", err);
        return res.status(500).json({
            success: false,
            message: "Error del servidor al verificar username/email",
            error: err.message
        });
    }
};

/**
 * MIDDLEWARE verificar que el rol solicitado sea valido
 * roles validos del sistema:
 * admin: Administrador total
 * coordinador: Gesto de datos
 * auxiliar: usuario baisco
 * caracteristicas
 * permite pasar solo un rol
 * 
 * filtrar y rechazar roles invalidos
 * si algun rol es invalido rechazar todo el request
 * si campo role no esta presente permite continuar default a rol auxiliar
 * @param {Object} req request object con req.body.{role....}
 * @param {Object} res response object
 * @param {Function} next callback al siguiente middleware
 * Respuestas:
 * 400 si algun rol es invalido
 * next() si todos los roles son valido o role no esta especificado
 */

const checkRolesExisted = (req, res, next) => {
    //Lista blanca de roles validos en el sitema
    const validRoles = ["admin", "coordinador", "auxiliar"];

    // Si roles esta presente en el request
    if (req.body.role) {
        // Convertir a array si es un string(soporta ambos formatos)
        const rolesToCheck = Array.isArray(req.body.role) ? req.body.role : [req.body.role];

        // Filtrar roles que no estan en la lista valida
        const invalidRoles = rolesFilter(role => !validRoles.includes(role));

        // Si hay roles invalidos rechazar 
        if (invalidRoles.length > 0) {
            return res.status(400).json({
                success: false,
                message: `Rol(es) no validos: ${invalidRoles.join(", ")}`
            });
        }
    }

    // Todos los roles son validos o no especifico continuar
    next();
};

/**
 * Exportar middlewares 
 * Uso de rutas:
 * router.post("/singup....)
 */
module.exports = {
    checkDuplicateUsernameOrEmail,
    checkRolesExisted
};