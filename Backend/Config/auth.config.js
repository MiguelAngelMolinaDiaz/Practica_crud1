// Carga la variables de entorno desde el archivo .env
require('dotenv').config();

module.exports = {
  // Clave para firmar los tokens jwt
  secret: process.env.JWT_SECRET || "tu_clave_secreta_para_token",
  // Tiempo de expiración del token en segundos
  jwtExpiration: process.env.JWT_EXPIRATION || 86400, // 24 horas 86400segundos
  // Tiempo de expiración del token para refrescar 
  jwtRefresh: 6048000, // 7 días
  // Numero de rondas para encriptar las contraseña
  slatRounds: process.env.SALT_ROUNDS || 8
}