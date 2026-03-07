/**
 * Servidor principal
 * Punto de entrada a la apliacion backend
 * Configura express, cors, concecta MongoDB, define  rutas y concecta con el frondend
 */

require('dotenv').config();
const express = require('express');
const moongose = require('mongoose');
const cors = require('cors');
const morgan = require('morgan');
const config = require('config');

/**
 * Vlidaciones iniciales
 * Verifica que las variables de entorno requeridas esten definidas
 */

if (!process.env.MONGODB_URI) {
    console.error(" X Error: MONGO_URI no está definida");
    process.exit(1); // Salir del proceso con error
}

if (!process.env.JWT_SECRET) {
    console.error(" X Error: JWT_SECRET no está definida");
    process.exit(1); // Salir del proceso con error
}

 // Importar todas las rutas
    const authRoutes = require('./Routes/authRoutes');
    const userRoutes = require('./Routes/userRoutes');
    const postRoutes = require('./Routes/productRoutes');
    const categoryRoutes = require('./Routes/categoryRoutes');
    const subcategoryRoutes = require('./Routes/subcategoryRoutes');
    const statisticsRoutes = require('./Routes/statisticsRoutes');
    

    // Iniciar express
    const app = express();

    // Cors permite las solicitudes desde el frontend
    app.use(cors({
        origin: 'http://localhost:3001',
        credentials: true
    }));

// Morgan registra todas las solicitudes http en consola
app.use(morgan('dev'));

// Express JSON parsea bodies en formato JSON
app.use(express.json());

// Express URL encoded soporta datos form-urlencoded
app.use(express.urlencoded({ extended: true }));

// Conexion a MongoDB

moongose.connect(process.env.MONGO_URI)
    .then(() => console.log("MongoDB conectado"))
    .catch((error) => {
        console.error("Error de conexion a MongoDB:", error);
        process.exit(1);
    });

// Registrar rutas

// Rutas de autenticacion
app.use('/api/auth', authRoutes);

// Rutas de usuarios CRUD
app.use('/api/user', userRoutes);

// Rutas de productos CRUD
app.use('/api/product', postRoutes);

// Rutas de categorias CRUD
app.use('/api/category', categoryRoutes);

// Rutas de subcategorias CRUD
app.use('/api/subcategory', subcategoryRoutes);

// Rutas de estadisticas
app.use('/api/statistics', statisticsRoutes);


// Manejo de errores globales
app.use((req, res,) => {
    res.status(404).json({
        success: false, 
        message: "Ruta no encontrada" });
});

// Iniciar el servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(` Servidor corriendo en http://localhost:${PORT}`);
});