/**
 * Archivo de configuracion central del backend
 * Este archivo centraliza todas las configuraciones principales de la aplicacion
 * Configuraciones de JTW tokens de autenticacion
 * Configuracion de conexion a MongoDB
 * Deficinicion de roles del sistema
 * 
 * Las variables de entorno tienen prioridad sobre los valores por defecto.
 */

module.exports = {
    // Configuracion de JWT
    SECRET: process.env.JWT_SECRET || "tusecretoparalostokens",
    TOKEN_EXPIRATION: process.env.JWT_EXPIRATION || "24h",

    // Configuracion de base de datos
    DB_URI: process.env.MONGO_URI || "mongodb://localhost:27017/tu_base_de_datos",
    DB: {
        URL: process.env.MONGO_URI || "mongodb://localhost:27017/tu_base_de_datos",
        OPTIONS: {
            useNewUrlParser: true,
            useUnifiedTopology: true
        },
    },

    // Roles del sistema
        ROLES: {
            ADMIN: "admin",
            USER: "user",
            GUEST: "guest"
        }
};