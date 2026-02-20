/**
 * Contolador de usuarios
 * Este modulo maneja todas las operaciones del CRUD para gestion de usuarios
 * Incluye control de acceso basado en roles
 * Roles permitidos: admin, coordinador, auxiliar
 * Seguridad
 * Las contraseñas se devuelven en respuestas
 * Los auxiliares no pueden ver y actualizar otros usuarios
 * Los coordinadores no pueden ver los administradores
 * activar y desactivar usuarios
 * eliminar permanentemente un usuario solo admin
 * 
 * Operaciones
 * getAllUsers: Listar usuarios con filtro por rol
 * getUserById: Obtener usuario especificado
 * createUser: Crear nuevo usuario con validacion
 * updateUser: Actualizar usuario con restricciones de rol
 * deleteUser: Eliminar usuario con restricciones de rol
 */

const User = require('../models/User');
const bcrypt = require('bcrypt');

/**
 * Obtener lista de usuarios 
 * GET api/users
 * Auth token requerido
 * Query params incluir activo o desactivados
 * 
 * Retorna
 * 200: array de usuarios filtrados
 * 500: Error del servidor
 */

exports.getAllUsers = async (req, res) => {
    try {
        // Por defecto solo mostrar usuarios activos
        const includeInactive = req.query.includeInactive === 'true';
        const activeFilter = includeInactive ? {} : { active: { $ne: false } };

        let users;
        //Control de acceso basado en rol
        if (req.userRole === 'auxiliar') {
            // Los auxiliares solo pueden ver su propio perfil
            users = await User.find({ _id: req.userId, ...activeFilter }).select('-password');
        } else {
            // Los admin y coordinadores ven todos los usuarios
            users = await User.find(activeFilter).select('-password');
        }
        res.status(200).json({ 
            success: true,
            data: users
        });
    } catch (error) { 
        console.error('[CONTROLLER] Error en getAllUsers:', error.message);
        res.status(500).json({
            success: false,
            message: 'Error al obtener todos los usuarios'
        });
    }
};

/**
 * READ Optener un usuario especifico por id
 * GET api/users/:id
 * Auth token requerido
 * Respuestas
 * 200 Usuario encontrado
 * 403 Sin permiso para ver el usuario
 * 404 Usuario no encontrado
 * 500 Error del servidor
 */

exports.getUserById = async (req, res) => {
    try {
        // Por defecto solo mostrar usuarios activos
        const user = await user.findById(req.params.id).select('-password');

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Usuario no encontrado'
            });
        } 

        // Validaciones de acceso
        // Los auxiliares solo pueden ver su propio perfil
        if (req.userRole === 'auxiliar' && req.userId!== user.id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'No tienes permiso para ver este usuario'
            });
        }

        // Los coordinadores no pueden ver administradores
        if (req.userRole === 'coordinador' && user.role === 'admin') {
            return res.status(403).json({
                success: false,
                message: 'No puedes ver usuarios admin'
            });
        }

        res.status(200).json({
            success: true,
            user
        });

    } catch (error) { 
        console.error('Error en getUserById:', error.message);
        res.status(500).json({
            success: false,
            message: 'Error al encontrar al ususario especificado',
            error: error.message
        });
    }
};