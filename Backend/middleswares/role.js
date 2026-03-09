/**
 * MIDDLEWARE control de roles de usuario
 * 
 * sirve para verificar que el usuario autenticado tiene permisos necesarios para acceder a una ruta especifica
 * 
 * funcion factory checkRole() permite especificar los roles permitidos
 * funcion Helper para roles especificos idAdmin, isCoordinador, isAuxiliar
 * Requiere que veryfyToken se haya ejecutado primero
 * flujo:
 * verifica que req.userRole exista
 * compara req.userRole contra lista de roles permitidos
 * si esta en la lista continua
 * si no esta en la lista retorna 403 Forbidden con mensaje descriptivo
 * si no existe userRole retorna 401 (Token corructo)
 * 
 * uso:
 * checkRole('admin') solo admin
 * checkRole('admin','coordinador') admin y coordinador con permisos
 * checkRole('admin, 'coordinador', 'auxiliar') todos con permisos
 * 
 * Roles del sistema:
 * admin acceso total
 * coordinador no puede eliminar ni gestionar usuarios
 * auxiliar acceso limitado a tareas especificas
 */

/**
 * factory funtion checkRole
 * retorna middleware que verifica si el rol usuario tiene uno de los roles permitidos
 * @param {...string} allowedRoles roles permitidos en el sistema
 * @returns {funtion} middleware de express
 */
const checkRole = (...allowedRoles) => {
    return (req, res, next) => {
        const normalizedRoles = allowedRoles
            .flat()
            .map((role) => String(role).trim().toLowerCase());
        const currentRole = Array.isArray(req.userRole)
            ? String(req.userRole[0] || '').trim().toLowerCase()
            : String(req.userRole || '').trim().toLowerCase();

        // Validar que el usuario fue autenticado y verifyToken ejecutado
        // req.userRole es establecido pero verifyToken middleware
        if (!currentRole) {
            return res.status(401).json({
                success: false,
                message: 'Token invalido o expirado'
            });
        }

        // Verificar si el rol del usuario esta en la lista de roles permitidos
        if (!normalizedRoles.includes(currentRole)) {
            return res.status(403).json({
                success: false,
                message: `Permisos insuficientes. Se requiere: ${normalizedRoles.join(',')}`
            });
        }
        // Usuario tiene permiso continuar
        next();
    }
};
// Funciones helper para roles especificos
// Verificar que el usuario es admin
// Uso: router.delete('/admin-only'. verifyToken, isAdmin, controller.method);

// Verificar si el usuario es admin
const isAdmin = (req, res, next) => {
    return checkRole('admin')(req, res, next);
};
// Verificar si el usuario es coordinador
const isCoordinador = (req, res, next) => {
    return checkRole('coordinador')(req, res, next);
};
// Verificar si el usuario es auxiliar
const isAuxiliar = (req, res, next) => {
    return checkRole('auxiliar')(req, res, next);
};
// Modulos a exportar
module.exports = {
    checkRole,
    isAdmin,
    isCoordinador,
    isAuxiliar
}