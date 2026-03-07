/**
 * SERVIDOR PRINCIPAL
 * 
 * Punto de entrada a la aplicacion backend
 * configura Express, cors, conecta MongoDB, define rutas y conecta con el frontend
 */

require('dotenv').config(); // Se encarga de las var de entorno, el primero que se llama
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors'); // Permite conectar directamente con el front-end
const morgan = require('morgan'); // Monitorea desde consola
const config = require('./config');

/**
 * Validaciones iniciales
 * verifica que las variables de entorno requeridas esten definidas
 */

if (!process.env.MONGODB_URI) {
    console.error('Error: MONGO_URI no esta definida en .env');
    process.exit(1);
}

if (!process.env.JWT_SECRET) {
    console.error('Error: JWT_SECRET no esta definida en .env');
    process.exit(1);
}
    // importar todas las rutas
    const authRoutes = require('./routes/authRoutes');
    const userRoutes = require('./routes/userRoutes');
    const productRoutes = require('./routes/productRoutes');
    const categoryRoutes = require('./routes/categoryRoutes');
    const subcategoryRoutes = require('./routes/subcategoryRoutes');
    const statisticsRoutes = require('./routes/statisticsRoutes');

    // Iniciara express
    const app = express();

    // Cors permite las solicitudes desde el frontend
    app.use(cors({
        origin: 'http://localhost:3001',
        credentials: true,
    }));

    //Morgan registra todas las solicitudes
    app.use(morgan('dev'));

    // Express JSON parsea bodies en formato JSON
    app.use(express.json());

    // Express JSON parsea bodies en formato  JSON
    app.use(express.urlencoded({ extended: true }));

    // Conexion a mongoDB
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('MongoDB conectado correctamente'))
    .catch((error) => {
        console.error('Error de conexion a mongoDB:', error);
        process.exit(1);
    });

// Registra rutas

// Rutas de autenticaion (login, registrer)
app.use('api/authRoutes', authRoutes);

app.use('api/users', userRoutes);

// Rutas de productos CRUD
app.use('api/products', productRoutes);

// Rutas de categorias
app.use('api/categories', categoryRoutes);

// Rutas de subcategorias
app.use('api/subcategories', subcategoryRoutes);

// Rutas de estadisticas
app.use('api/statistics', statisticsRoutes);

// Manejo de errores globales
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Ruta no encontrada'
    });
});

// iniciar el servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`servidor corriendo en http://localhost:${PORT}`);
});