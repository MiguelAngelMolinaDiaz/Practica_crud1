/**
 * Archivo indice de middlewares
 * Centraliza la importacion de todos los middlewares de autenticacion y autorizacion
 * Permite importar multiples middleswares de forma concisa en las rutas
 */

const authJTW = require("./authJWT");
const verifySingUp = require("./verifySingUp");

// Exportar los middlewares agrupados por modulo
module.exports = {
    authJTW: require("./authJWT"),
    verifySingUp: require("./verifySingUp"),
    role: require("./role") 
};
  