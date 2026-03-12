/**
 * Controlador de autenticación
 * Maneja el registro login y generacion de token JWT
 */

const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('../Config/auth.config');

/**
 * SINGUP: crear nuevo usuario
 * POST /api/auth/signup
 * Body { username, email, password, role}
 * Crea usuario en la base de datos
 * encripta contraseña antes de guardar con bcrypt
 * genera token JWT
 * Retorna usuario sin monstrar la contraseña
 */

exports.signup = async (req, res) => {
    try {
        // Crear nuevo usuario
        const user = new User({
            username: req.body.username,
            email: req.body.email,
            password: req.body.password,
            role: req.body.role || 'auxiliar' // Por defecto el rol es auxiliar
        });

        // Guardar en base de datos
        // La contraseña se encripta automaticamente en el middllware del modelo
        const saveUser = await user.save();

        // Generar token jwt que expira  en 24 horas
        const token = jwt.sign(
            {
                id: saveUser._id,
                role: saveUser.role,
                email: saveUser.email
            },
            config.secret,
            { expiresIn: config.jwtExpiration }
        );

        // Preparando respuesta sin mostrar la contraseña
        const UserResponse = {
            id: saveUser._id,
            username: saveUser.username,
            email: saveUser.email,
            role: saveUser.role,
        };

        res.status(200).json({
            success: true,
            message: 'Usuario reguistrado correctamente',
            token: token,
            user: UserResponse
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Error al registrar usuario',
            error: error.message
        });
    }
};

/**
 * SIGNIN: iniciar sesion
 * POST /api/auth/signin
 * body { email o usuario, password}
 * busca el usuario por el email o username
 * valida la contraseña con bcrypt 
 * si es correcto el token JWt
 * Token  se usa  para autneticar futuras solicitudes
 */

exports.signin = async (req, res) => {
    try {
        // Validar que se envie el email o username
        if (!req.body.email && !req.body.username) {
            return res.status(400).json({
                success: false,
                message: 'email o username requerido'
            });
        }

        // Validar que se envie la contraseña
        if (!req.body.password) {
            return res.status(400).json({
                success: false,
                message: 'password requerido'
            });
        }

        // Buscar usuario por email o username
        const user = await User.findOne({
            $or: [
                { username: req.body.username },
                { email: req.body.email }
            ] // $or guarda datos directamente en una array
        }).select('+password'); // include password field

        // si no existe el usuario con este email o username
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Usuario no encontrado'
            });
        }

        // Verificar que el usuario tenga contraseña
        if (!user.password) {
            return res.status(500).json({
                success: false,
                message: 'Error interno: usuario sin contraseña'
            });
        }

        // Comparar contraseña enviada con el hash(contraseña encriptada) almacenado
        const isPasswordValid= await bcrypt.compare(req.body.password, user.password);

        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: 'Contraseña incorrecta'
            });
        }

        // Generar token JWT 24 horas
        const token = jwt.sign(
            {
                id: user._id,
                role: user.role,
                email: user.email
            },
            config.secret,
            { expiresIn: config.jwtExpiration }
        );

        // Prepara respuesta sin mostrar la contraseña
        const UserResponse = {
            id: user._id,
            username: user.username,
            email: user.email,
            role: user.role
        };

        res.status(200).json({
            success: true,
            message: 'Inicio de sesion exitoso',
            token: token,
            user: UserResponse
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Error al iniciar sesion',
            error: error.message
        });
    }
};