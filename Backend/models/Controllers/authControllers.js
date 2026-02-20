/**
 * Controlador de autenticación
 * Maneja el registro login y generacion de token JWT
 */

const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('../config/auth.config');

/** SINGUP : crear nuevo usuario
* POST /api/auth/signup
*Body {username, email, password, role}
*crea un nuevo usuario en la base de datos
*emcripta la contraseña antes de guardar con bcrypt
*genera un token JWT 
*retorna el usuario sin mostrar la contraseña
*/

exports.signup = async (req, res) => {
    try{
        ///Crear nuevo usuario
        const user = new User({
            username: req.body.username,
            email: req.body.email,
            password: req.body.password,
            role: req.body.role || 'auxiliar' // rol por defecto
        });
        
        //Guardar usuario en la base de datos
        //la contraaseña se encripta automatizamente en el middleware del modelo
        const savedUser = await user.save();

        //Generar token JWT que expira en 24 horas
        const token = jwt.sign(
            { 
                id: savedUser._id,
                role: savedUser.role,
                email: savedUser.email
            },
            config.secret,
            { expiresIn: config.jwtExpiration }
        );
            //preparando respuesta sin la contraseña
            const userResponse = {
                id: savedUser._id,
                username: savedUser.username,
                email: savedUser.email,
                role: savedUser.role,
            };

            res.status(201).json({
                sucess: true,
                message: 'Usuario registrado exitosamente',
                token: token,
                user: userResponse
            });
    } catch (error){
        return res.status(500).json({
            sucess: false,
            message: 'Error en el registro del usuario',
            error: error.message
            });
    }
};

/** 
 * SIGNIN : iniciar sesion
 * POST /api/auth/signin
 * Body {email o usuario, password}
 * busca el usuario por email o username
 * valida la contraseña con bcrypt
 * si es correcto el token JWT 
 * token se usa para autenticar futuras solicitudes
 */

exports.signin = async (req, res) => {
    try{
        //valida que se envie el email o username
        if (!req.body.email && !req.body.username){
            return res.status(400).json({
                sucess: false,
                message: 'email o username requerido'
            });
        }

        //validar que se envie la contraseña
        if (!req.body.password){
            return res.status(400).json({
                sucess: false,
                message: 'pasword requerido'
            });
        }

        //buscar el usuario por email o username
        const user = await User.findOne({
            $or: [
                { username: req.body.username },
                { email: req.body.email }
            ]
        }).select('+password'); // incluye password field
    
        //si no enxiste el uduario con este email o username
        if (!user){
            return res.status(404).json({
                sucess: false,
                message: 'Usuario no encontrado'
            });
        }

        //verificar que el usuario tenga contraseña
        if (!user.password){
            return res.status(500).json({
                sucess: false,
                message: 'Error interno: usuario sin contraseña'
            });
        }

        //comparar la contraseña enviada con el hash almacenado
        const passwordIsValid = await bcrypt.compare
        (req.body.password, user.password);

        if(!passwordIsValid){
            return res.status(401).json({
                sucess: false,
                message: 'Contraseña incorrecta'
            });
        }

        //generar token JWT 24 horas
        const token = jwt.sign(
            { 
                id: user._id,
                role: user.role,
                email: user.email
            },
            config.secret,
            { expiresIn: config.jwtExpiration }
        );

        //preparar respuesta sin mostrar la contraseña
        const userResponse = {
            id: user._id,
            username: user.username,
            email: user.email,
            role: user.role,
        };

        res.status(200).json({
            sucess: true,
            message: 'Inicio de sesión exitoso',
            token: token,
            user: userResponse
        });
    }  catch (error){
        return res.status(500).json({
            sucess: false,
            message: 'Error al iniciar sesión',
            error: error.message
        });
    }
};