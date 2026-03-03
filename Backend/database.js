/**
 * Modulo de conexion a la base de datos MongoDB 
 * Este archivo maneja la conexion de la base de datos MongoDB utilizando Mongoose
 * Establece la conexion con la base de datos
 * Configura las opciones de conexion
 * Maneja los errores de conexion
 * Exporta la funcion connectDB para usarla en server.js
 */

const mongoose = require('mongoose');
const { DB_URI } = process.env;

const connectDB = async () => {
    try {
        await mongoose.connect(DB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log("ok MongoDB conectado");
    } catch (error) {
        console.error(" X Error de conexion a MongoDB:", error);
        process.exit(1); // Salir del proceso con error
    }
};
module.exports = connectDB;