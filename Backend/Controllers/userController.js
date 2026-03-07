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
const bcrypt = require('bcryptjs');

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
        const user = await User.findById(req.params.id).select('-password');

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
        console.error('Error en getUserById:', error);
        res.status(500).json({
            success: false,
            message: 'Error al encontrar al ususario especificado',
            error: error.message
        });
    }
};

/**
 * CREATE Crear un nuevo usuario
 * POST /api/users
 * Auth Bearer token requerido
 * Role admin y coordinador (con restricciones)
 * Validaciones
 * 201 Usuario creado
 * 400 Validacion fallida
 * 500 Error de servidor
 */

exports.createUser = async (req, res) => {
    try {
        const { username, email, password, role } = req.body;
        
        // Crear suario nuevo
        const user = new User({
            username,
            email,
            password,
            role
        });

        // Guardar en DB
        const savedUser = await user.save();

        res.status(201).json({
            success: true,
            message: 'Usuario creado',
            user: {
                id: savedUser._id,
                username: savedUser.username,
                email: savedUser.email,
                role: savedUser.role
            }
        });
    } catch (error) {
        console.error('Error en createUser', error);
        res.status(500).json({
            success: false,
            message: 'Error al crear el usuario',
            error: error.message
        });
    }
};

/**
 * UPDATE actualizar un usuario existente
 * PUT /api/users/:id
 * Auth Bearer token requerido
 * Validaciones:
 * Auxiliar solo puede actualizar su propio perfil
 * Auxiliar no puede cambiar su rol
 * Admin, Coordinador pueden actualizar otros usuarios
 * 200 Usuario actualizado
 * 403 Sin permiso para actualizar
 * 404 Usuario no encontrado
 * 500 Error del servidor
 */

exports.updateUser = async (req, res) => {
    try {
        // Restriccion: auxiliar solo puede actualizar su propio perfil
        if (req.userRole === 'auxiliar' && req.userId.toString() !== req.params.id) {
            return res.status(403).json({
                success: false,
                message: 'No tienes permiso para actualizar este usuario'
            });
        }

        // Restriccion: auxiliar no puede cambiar su rol
        if (req.userRole === 'auxiliar' && req.body.role) {
            return res.status(403).json({
                success: false,
                message: 'No tienes permiso para cambiar de rol'
            });
        }

        // Actualizar usuario
        const updatedUser = await User.findByIdAndUpdate(
            req.params.id,
            { $set: req.body },
            { new: true } // Retorna documento actualizado
        ).select('-password'); // No retorna constraseña

        if (!updatedUser) {
            return res.status(404).json({
                success: false,
                message: 'Usuario no encontrado'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Usuario actualizado con exito',
            user: updatedUser
        });

    } catch (error) {
        console.error('Error en updateUser', error);
        res.status(500).json({
            success: false,
            message: 'Error al actualizar el usuario'
        });
    }
};

/**
 * DELETE eliminar usuario
 * delete /api/users/:id
 * Roles: admin
 * Query params:
 * hardDelete=true eliminar permanentemente
 * Default soft delete desactivar
 *
 * El admin solo puede desactivar otro admin
 * Retorna
 * 200 Usuario eliminado o desactivado
 * 403 Sin permiso
 * 404 Usuario no encontrado
 * 500 Error de servidor
 */

exports.deleteUser = async (req, res) => {
    try {
        const ishardDelete = req.query.hardDelete === 'true';
        const userToDelete = await User.findById(req.params.id);

        // Usuario no encontrado
        if (!userToDelete) {
            return res.status(404).json({
                success: false,
                message: 'Usuario no encontrado'
            })
        }

        // Proteccion: Admin no puede eliminar otro admin
        // Solo el mismo admin puede eliminar otro admin
        if (userToDelete.role === 'admin' && userToDelete._id.toString() !== req.userId.toString()) {
            return res.status(403).json({
                success: false,
                message: 'No tienes permiso para eliminar o desactivar administradores'
            });
        }

        // Elimnar permanentemente o desactivar
        if (ishardDelete) {
            await User.findByIdAndDelete(userToDelete._id);
            res.status(200).json({
                success: true,
                message: 'Usuario eliminado permanentemente',
                data: userToDelete
            });
        } else {
            // Desactivar usuario (soft delete)
            userToDelete.active = false;
            await userToDelete.save();

            res.status(200).json({
                success: true,
                message: 'Usuario desactivado',
                data: userToDelete
            });
        }
    } catch (error) {
        console.error('Error en deleteUser', error);
        res.status(500).json({
            success: false,
            message: 'Error al desactivar usuario',
            error: error.message
        });
    }
};