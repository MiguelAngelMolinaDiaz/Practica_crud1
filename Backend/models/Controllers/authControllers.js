/**
 * Controlador de autenticacion
 * Maneja el registro login y generacion de tokens JWT
 */

const User = require("../models/User");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const config = require("../config/auth.config");

/**
 * Singup - Crear nuevo usuario
 * Post /api/auth/signup
 * Body { username, email, password, role }
 * Crea usuario en la base de datos
 * Encripta contraseña antes de guardar con bcrypt
 * Genera token JWT
 * Retorna usuario sin mostrar la contraseña
 */

exports.singup = async (req, res) => {
    try  {
        // CRear nuevo usuario
        const user = new User({
            username: req.body.username,
            email: req.body.email,
            password: req.body.password,
            role: req.body.role || "auxiliar" // Por defecto el rol es 'auxiliar'
        });

        // Guardar usuario en la base de datos
        // La contraseña se encripta automáticamente en el middleware del modelo

        const savedUser = await user.save();

        //Genera token JWT
        
        const token = jwt.sign(
            {
                id: savedUser._id,
                role: savedUser.role,
                email: savedUser.email,
            },

            config.secret,
            { expiresIn: config.jwtExpiration }
        );

        // Preparando respuesta sin mostrar la contraseña
        const userResponse = {
            id: savedUser._id,
            username: savedUser.username,
            email: savedUser.email,
            role: savedUser.role,
        };

        res.status(200).json({
            success: true,
            message: "Usuario registrado correctamente",
            token: token,
            user: userResponse,
        });
    } catch (err)  {
        res.status(500).json({
            success: false,
            mesage: "Error al registrar usuario",
            error: err.message,
        });
    }
};

/**
 * SINGIN; Iniciar sesion
 * Post /api/auth/singin
 * Body { email o usuario, password }
 * Busca el usuario por email o username
 * Valida la contraseña con bcrypt
 * si es correcto el token JTW
 * Token se usa para autenticar futuras solicitudes
 */

exports.singin = async (req, res) => {
    try {
        // Validar que se envie el email o username
        if (!req.body.email && !req.body.username) {
            return res.status(400).json({
                success: false,
                message: "email o username es requerido",
            });
        }

        //Validar que se envie la contraseña
        if (!req.body.password) {
            return res.status(400).json({
                success: false,
                message: "Password es requerido",
            });
        }

        // Buscar usuario por email o username
        const user = await User.findOne({
            $or: [
                {username: req.body.username },
                { email: req.body.email },
            ]
        }).select("+password"); // Incluye password field

        // si no existe el usuario con este email o username
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "Usuario no encontrado"
            });
        }

        // Verificar que el usuario tenga constraseña
        if (!user.password) {
            return res.status(400).json({
                success: false,
                message: "Error interno: Usuario no tiene contraseña"
            });
        }

        // Comparar contrasela enviada con el hasteado almacenado
        const passwordIsValid = await bcrypt.compare
            (req.body.password, user.password);

        if (!passwordIsValid) {
            return res.status(401).json({
                success: false,
                message: "Contraseña incorrecta"
            });
        }

        // Generar token JWT 24 horas
        const token = jwt.sign(
            {
                id: user._id,
                role: user.role,
                email: user.email,
            },
            config.secret,
            { expiresIn: config.jwtExpiration}
        );

        // Preparar respuesta sin mostrar la contraseña
        const userResponse = {
            id: user._id,
            username: user.username,
            email: user.email,
            role: user.role,
        };

        res.status(200).json({
            success: true,
            message: "Inicio de sesión exitoso",
            token: token,
            user: userResponse,
        });
        

    } catch (err) {
        res.status(500).json({
            success: false,
            message: "Error al iniciar sesion",
            error: err.message,
        });
    }
};