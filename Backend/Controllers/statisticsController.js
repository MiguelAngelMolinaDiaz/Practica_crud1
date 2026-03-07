/**
 * Controlador de estadisticas
 * Get api/statistics
 * Auth Bearer token requerido
 * Estadisticas disponibles:
 * - Total de usuarios
 * - Total de proyectos
 * - Total de productos
 * - Total de categorias
 * - Total de subcategorias
 */

const User = require("../models/User");
const Product = require("../models/Product");
const Category = require("../models/Category");
const Subcategory = require("../models/Subcategory");

/**
 * Respuestas:
 * 200 Estadisticas obtenidas
 * 500 Error del servidor
 */

const getStatistics = async (req, res) => {
    try {
        // Ejecutar todas las queries en paralelo
        const [ totalUsers, totalProducts, totalCategories, totalSubcategories] = await Promise.all([
            User.countDocuments(), // Contar total de usuarios
            Product.countDocuments(), // Contar total de productos
            Category.countDocuments(), // Contar total de categorias
            Subcategory.countDocuments() // Contar total de subcategorias
        ]);
        // Retornar las estadisticas
        res.status(200).json({
            success: true,
            statistics: {
                totalUsers,
                totalProducts,
                totalCategories,
                totalSubcategories
            }
        });
    } catch (error) {
        console.error("Error al obtener estadisticas", error);
        res.status(500).json({
            success: false,
            message: "Error al obtener las estadísticas",
            error: error.message
        });
    }
}

module.exports = { getStatistics };