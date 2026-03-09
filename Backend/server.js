/**
 * SERVIDOR PRINCIPAL
 * Punto de entrada de la aplicación backend
 */

require('dotenv').config(); // Variables de entorno
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const morgan = require('morgan');
require('./models');

// Importar configuraciones y rutas
const config = require('./config');
const authRoutes = require('./Routes/authRoutes');
const userRoutes = require('./Routes/userRoutes');
const productRoutes = require('./Routes/productRoutes');
const categoryRoutes = require('./Routes/categoryRoutes');
const subcategoryRoutes = require('./Routes/subcategoryRoutes');
const statisticsRoutes = require('./Routes/statisticsRouter');

// Validaciones iniciales
if (!process.env.MONGODB_URI) {
    console.error('Error: MONGODB_URI no está definida en .env');
    process.exit(1);
}
if (!process.env.JWT_SECRET) {
    console.error('Error: JWT_SECRET no está definida en .env');
    process.exit(1);
}

// Iniciar express
const app = express();

// Cors permite solicitudes desde el frontend
app.use(cors({
    origin: 'http://localhost:3001',
    credentials: true,
}));

// Morgan registra solicitudes en consola
app.use(morgan('dev'));

// Parsear bodies en formato JSON y URL encoded
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Conexión a MongoDB
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('MongoDB conectado correctamente'))
    .catch((error) => {
        console.error('Error de conexión a MongoDB:', error);
        process.exit(1);
    });

// Registrar rutas
app.use('/api/auth', authRoutes);          // Rutas de autenticación
app.use('/api/users', userRoutes);         // Rutas de usuarios
app.use('/api/products', productRoutes);   // Rutas de productos
app.use('/api/categories', categoryRoutes); // Rutas de categorías
app.use('/api/subcategories', subcategoryRoutes); // Rutas de subcategorías
app.use('/api/statistics', statisticsRoutes); // Rutas de estadísticas

// Manejo de rutas no encontradas
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Ruta no encontrada'
    });
});

// Iniciar servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});