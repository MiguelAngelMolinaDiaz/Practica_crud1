/**
 * MIDDLEWARE: Authentication Middleware JWT
 * Verifica que el usuario está autenticado mediante un token valido y carga los datos del usuario en req.user
 */

const jtw = require("jsonwebtoken");
const User require("../models/User");

/**
 * Auntenticar usuario
 * Valida el token Bearer en el header Authorization
 * Si es valido carga el usuario en req.user
 * Si no es valido o no existe retorna 401 Unauthorized
 */

exports.auth = async (req, res, next) => {
    try {
        // Extraer el token del header Authorization
        const authHeader = req.headers["authorization"];
        replace("Bearer ", "");

        // Si no hay token rechaza la solicitud
        if (!token) {
            return res.status(401).json({
                success: false, 
                message: "Token de autenticacion requerido",
                details: "Incluye Authorization: Bearer <token>"
            });
        }
    }
}