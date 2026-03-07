/**
 * Controlador de estadisticas
 * get /api/statistics
 * Auth Bearer token requerido
 * Estadisticas diponibles:
 * Total de usuarios
 * Total productos
 * Total de categorias
 * Total de subcategorias
 */

const User = require('../models/User');
const Product = require('../models/Product');
const Category = require('../models/Category');
const Subcategory = require('../models/Subcategory');

/**
 * Respuestas
 * 200 Ok estadisticas obtenidas
 * 500 Error de DB
 */

const getStatistics = async (req, res) => {
    try {
        // Ejecuta todas las queries en paralelo
        const [totalUsers, totalProducts, totalCategories, totalSubcategories] = await Promise.all([
            User.countDocuments(), // Contar usuarios
            Product.countDocuments(), // Contar productos
            Category.countDocuments(), // Contar categorias
            Subcategory.countDocuments(), // Contar subcategorias
        ]);

        // Retornar las estadisticas
        res.status(200).json({
            totalUsers,
            totalProducts,
            totalCategories,
            totalSubcategories
        });
    } catch (error) {
        console.error('Error en obtener estadisticas', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener las estadisticas',
            error: error.message
        });
    }
};
module.exports = { getStatistics };