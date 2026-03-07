/**
 * Archivo indice de middlewares
 * centraliza la importancia de todos los middlewares de autenticacion y autorizacion
 * Permite importar multiples middlewares de forma concisa en las rutas
 */

const authJWT = require('./authJwt');
const verifySignup = require('./verifySignUp');

//Exportar los middlewares agrupados or modulo

module.exports = {
    authJWT: require('./authJwt'),
    verifySignup: require('./verifySignUp'),
    role: require('./role')
};