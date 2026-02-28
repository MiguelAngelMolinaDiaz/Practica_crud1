/**
 * Rutas de productos:
 * Define los endpoints CRUD para la gestion de productos
 * Los productos son contenedores hijos de subcategorias y categorias
 * Endpoints:
 * POST api/products/ - Crear nuevo producto
 * GET api/products/ - Obtener todos los productos
 * GET api/products/:id - Obtener producto por id
 * PUT api/products/:id - Actualizar producto por id
 * DELETE api/products/:id - Eliminar producto por id/desactivar
 */

const express = require('express');
const router = express.Router();
const productController = require('../Controllers/productController');
const { verifyToken } = require('../middleswares/auth');
const { checkRole } = require('../middleswares/role');

const validateProduct = [
    check('name')
        .notEmpty().isEmpty()
        .withMessage('El nombre es obligatorio'),

    check('description')
        .notEmpty().isEmpty()
        .withMessage('La descripción es obligatoria'),

    check('price')
        .notEmpty().isEmpty()
        .withMessage('El precio es obligatorio')
        .isFloat({ gt: 0 })
        .withMessage('El precio debe ser un número positivo'),

    check('category')
        .notEmpty().isEmpty()
        .withMessage('La categoría es obligatoria'),

    check('subcategory')
        .notEmpty().isEmpty()
        .withMessage('La subcategoría es obligatoria'),

    check('stock')
        .notEmpty().isEmpty()
        .withMessage('El stock es obligatorio')
        .isInt({ gt: 0 })
        .withMessage('El stock debe ser un número entero positivo')
]

// Rutas CRUD

router.post("/", verifyToken,
checkRole(['admin', 'coordinador']), 
productController.createProduct
);

router.get("/", productController.getAllProducts);

router.get("/:id", productController.getProductById);

router.put("/:id", verifyToken, 
checkRole(['admin', 'coordinador']), 
productController.updateProduct
);

router.delete("/:id", verifyToken, 
checkRole(['admin']), 
productController.deleteProduct
);

module.exports = router;