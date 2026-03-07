/**
 * Archivo de configuracion central del backend,
 * Este archivo centraliza todas las configuraciones princupales de la aplicacion
 * configuracion de conexion a MongoDB
 * definicion de roles del sistema
 * 
 * Las variables de entorno tienen prioridad sobre los valores por defecto
 */

module.exports = {
    // configuracion de jwt
    SECRET: process.env.JWT_SECRET || 'tu_clave_secreta_para_token',
    TOKEN_EXPIRATION: process.env.JWT_EXPIRATION || '24h',

    // configuracion de DB
    DB_URI: process.env.MONGO_URI || 'mongodb://localhost:27017/crud-mongo',
    DB: {
        URL: process.env.MONGO_URI || 'mongodb://localhost:27017/crud-mongo',
        OPTIONS: {
            useNewUrlParser: true,
            useUnifiedTopology: true
        }
    },

    // Roles del sistema
    ROLES: {
        ADMIN: 'admin',
        COORDINADOR: 'coordinador',
        AUXILIAR: 'auxiliar'
    }
};
