//carga la variable de entorno desde .env
require('dotenv').config();

module.exports = {
    //clave para afirmar token de jtw
    secret: process.env.JWT_SECRET || "tusecretoparalostokens",
    // tiempo de expiracion del token en segundos
    jtwExpiration: process.env.JTW_EXPIRATION  ||
    86400, // 24 horas
    // tiempo de expiracion de refrscar el token
    jtwRefresh: 6048000, // 7 dias
    // numero de rondas para encriptar la contraseña
    slatRounds: process.env.SALT_ROUNDS || 8
};