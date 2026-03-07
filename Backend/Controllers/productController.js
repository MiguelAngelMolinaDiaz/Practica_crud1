/** 
 * Controlador de productos 
 * maneja todas las operaciones (CRUD) relacionadas con productos
 * Estructura: una producto depende de una subcategoria, depende de una categoria padre, una categoria puede tener varias subcategorias, una subcategoria puede tener varios productos relacionados
 * Cuando una producto se elimina o las subcategorias relacionados se desactivan 
*/

const Product = require('../models/Product');
const Subcategory = require('../models/Subcategory');
const Category = require('../models/Category');

/**
 * Create: crear nuevo producto
 * POST /api/products
 * Auth Bearer token requerido
 * Roles: admin y coordinador
 * 
 * name nombre del producto
 * description: descripcion del producto
 * producto: id de la subcategoria padre a la que pertenece
 * retorna:
 * 201: producto creado en MongoDB
 * 400: validacion fallida o nombre duplicado
 * 404: categoria padre no existe
 * 500: Error en base de datos
 */

exports.createProduct = async (req, res) => {
    try {
        const { name, description, price, stock, category, subcategory } = req.body;

        // Verificar que todos los campos requeridos esten presentes
        if (!name || !description || !price || !stock || !category || !subcategory) {
            return res.status(400).json({
                success: false,
                message: 'Todos los campos son obligatorios',
                requiredFields: ['name', 'description', 'price', 'stock', 'category', 'subcategory']
            });
        }
        // Validar que la categoria padre exista PEDIENTE
        const categoryExist = await Category.findById(category);
        if (!categoryExist) {
            return res.status(404).json({
                success: false,
                message: 'La categoria solicitada no existe',
                categoryId: category
            });
        }
        // Validar que la subcategoria padre exista y pertenece a la categoria especificada
        const subcategoryExist = await Subcategory.findById({
                _id: subcategory,
                category: category
        });
        if (!subcategoryExist) {
            return res.status(404).json({
                success: false,
                message: 'La subcategoria no existe o no pertenece a la categoria especificada'
            });
        }

        // Crear nuevo producto 
        const product = new Product({
            name,
            description,
            price,
            stock,
            category,
            subcategory
        });

       // Si hay usuario autenticado, registrado  quien creo el producto
        if (req.user && req.user_id) {
            product.createdBy = req.user_id;
        }

       // Guardar el producto en la base de datos
        const savedProduct = await product.save();

        // Obtener producto poblado con datos relacionado (populate)
        const productWithRelations = await Product.findById(savedProduct._id)
            .populate('category', 'name')
            .populate('subcategory', 'name')
            .populate('createdBy', 'username email');

        return res.status(201).json({
            success: true,
            message: 'Producto creado exitosamente',
            data: productWithRelations // En consola muestra la informacion del producto creado
        });

    } catch (error) {
        console.error('Error en crear el producto:', error);

        // Manejar error de duplicado (campo unico )
        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                message: 'Ya existe un productocon ese nombre'
            });
        }

        res.status(500).json({
            success: false,
            message: 'Error al crear el producto',
            error: error.message
        });
    }
};

/**
 * READ: Obtener productos (con filtro de activos/inactivos)
 * 
 * GET /api/products
 * Query params:
 *  -includeInactive=true: Mostrar tambien productos inactivos (desactivados)
 *  -Default: Solo productos activos (active: true)
 * 
 * Retorna: Array de productos poblados con categoria y subcategoria
 */

exports.getProducts = async (req, res) => {
    try {
        // Determinar si incluir productos inactivos
        const includeInactive = req.query.includeInactive === 'true';
        const activeFilter = includeInactive ? {} : { active: { $ne: false } };

        // Obtener productos con datos relacionados
        const products = await Product.find(activeFilter)
            .populate('category', 'name')
            .populate('subcategory', 'name')
            .sort({ createdAt: -1 });
        
        // Si el usuario es auxiliar, no mostrar informacion de quien lo creo
        if (req.user && req.user.role === 'auxiliar') {
            // Ocultar campos de createdBy para usuarios auxiliares
            products.forEach(product => {
                product.createdBy = undefined;
            });
        }

        res.status(200).json({
            success: true,
            count: products.length,
            data: products
        });

    } catch (error) {
        console.error('Error en getProducts', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener productos',
            error: error.message
        })
    }
};

/**
 * READ:  Obtener un producto especifico por id
 * GET /api/products/:id
 * Retorna: Producto poblado con categoria y subcategoria
 */

exports.getProductById = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id)
            .populate('category', 'name description')
            .populate('subcategory', 'name description');

        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Producto no encontrado'
            });
        }

        // Ocultar createdBy para usuarios auxiliares
        if (req.user && req.user.role === 'auxiliar') {
            product.createdBy = undefined;
        }

        res.status(200).json({
            success: true,
            data: product
        });

    } catch (error) {
        console.error('Error en getProductById: ', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener producto por id',
            error: error.message
        })
    }
};

/**
 * UPDATE Actualizar un producto
 * 
 * PUT /api/products/:id
 * Body: { cualquier campo a actualizar }
 * 
 * - Solo actualiza campos enviados
 * - Valida relaciones si se evian category o subcategory
 * - Retorna el producto actualizado
 */
exports.updateProduct = async (req, res) => {
    try {
        const { name, description, price, stock, category, subcategory } = req.body;
        const updateData = {};

        // Agregar solo los campos que fueron enviados
        if (name) updateData.name = name;
        if (description) updateData.description = description;
        if (price) updateData.price = price;
        if (stock) updateData.stock = stock;
        if (category) updateData.category = category;
        if (subcategory) updateData.subcategory = subcategory;

        // Validar relaciones si se actualizan
        if (category || subcategory) {
            if (category) {
                const categoryExist = await Category.findById(category);
                if (!categoryExist) {
                    return res.status(404).json({
                        success: false,
                        message: 'La categoria solicitada no existe'
                    });
                }
            }
            if (subcategory) {
                const subcategoryExist = await Subcategory.findOne({
                    _id: subcategory,
                    category: category || updateData.category
                });
                if (!subcategoryExist) {
                    return res.status(404).json({
                        success: false,
                        message: 'La subcategoria no existe o no pertenece a la categoria especificada'
                    });
                }
            }

        }

        // Actualizar producto en DB
        const updateProduct = await Product.findByIdAndUpdate(req.params.id, updateData, {
            new: true,
            runValidators: true
        }).populate('category', 'name')
            .populate('subcategory', 'name')
            .populate('createdBy', 'username email');

        if (!updateProduct) {
            return res.status(404).json({
                success: false,
                message: 'Producto no encontrado'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Producto actualizado exitosamente',
            data: updateProduct
        });
        
    } catch (error) {
        console.error('Error en updateProduct: ', error);
        res.status(500).json({
            success: false,
            message: 'Error al actualizar el producto',
            error: error.message
        });
    }
};

/**
 * DELETE:  eliminar o desactivar un producto
 * DELETE /api/products/:id
 * 
 * Query params:
 * - hardDelete=true: Elimina permanentemente el producto de la DB
 * - Default: Soft delete, (marcar como inactivo)
 * 
 * SOFT DELETE: Solo marca active: false
 * HARD DELETE: elimina permanetemente el documento
 */

exports.deleteProduct = async (req, res) => {
    try {
        const isHardDelete = req.query.hardDelete === 'true';
        const product = await Product.findById(req.params.id);
        
        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Producto no encontrado'
            });
        }

        if (isHardDelete) {
            // ==== HARD DELETE: eliminar permanentemente de la DB =====
            await Product.findByIdAndDelete(req.params.id);

            res.status(200).json({
                success: true,
                message: 'Producto eliminado permanentemente de la DB',
                data: {
                    data: product
                }
            });
        } else {
            // ==== SOFT DELETE: Solo marcar con inactivo ====
            product.active = false;
            await product.save();

            res.status(200).json({
                success: true,
                message: 'Producto desactivado exitosamente (soft delete)',
                data: product
            });
        }
        
    } catch (error) {
        console.error('Error en deleteProduct: ', error);
        res.status(500).json({
            success: false,
            message: 'Error al eliminar el producto',
            error: error.message
        });
    }
};