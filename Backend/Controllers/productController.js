/** 
 * Controlador de productos 
 * maneja todas las operaciones (CRUD) relacionadas con productos
 * Estructura: un producto pertenece a una subcategoria y una categoria
 * Cuando se elimina una subcategoria los productos relacionados se desactivan
 * Soporte de imagenes en array de URLs
 */

const Product = require('../models/Product');
const Subcategory = require('../models/Subcategory');
const Category = require('../models/Category');

/**
 * CREATE: crear nuevo producto
 * POST /api/products
 * Auth Bearer token requerido
 * Roles: admin y coordinador
 * body requerido:
 * name: nombre del producto (único)
 * description: descripcion del producto
 * price: precio del producto (≥ 0)
 * stock: cantidad en stock (≥ 0)
 * category: id de la categoria padre
 * subcategory: id de la subcategoria
 * images: array de URLs de imagenes (opcional)
 * retorna:
 * 201: producto creado en MongoDB
 * 400: validacion fallida o nombre duplicado
 * 404: categoria o subcategoria no existe
 * 500: Error en base de datos
 */

exports.createProduct = async (req, res) => {
    try {
        const { name, description, price, stock, category, subcategory, images } = req.body;

        // Validacion de campos obligatorios
        if (!name || typeof name !== 'string' || !name.trim()) {
            return res.status(400).json({
                success: false,
                message: 'El nombre es obligatorio y debe ser texto válido'
            });
        }

        if (!description || typeof description !== 'string' || !description.trim()) {
            return res.status(400).json({
                success: false,
                message: 'La descripción es obligatoria y debe ser texto válido'
            });
        }

        if (price === undefined || typeof price !== 'number' || price < 0) {
            return res.status(400).json({
                success: false,
                message: 'El precio es obligatorio y debe ser un número no negativo'
            });
        }

        if (stock === undefined || typeof stock !== 'number' || stock < 0) {
            return res.status(400).json({
                success: false,
                message: 'El stock es obligatorio y debe ser un número no negativo'
            });
        }

        if (!category) {
            return res.status(400).json({
                success: false,
                message: 'La categoría es obligatoria'
            });
        }

        if (!subcategory) {
            return res.status(400).json({
                success: false,
                message: 'La subcategoría es obligatoria'
            });
        }

        // Verificar que la categoria existe
        const parentCategory = await Category.findById(category);
        if (!parentCategory) {
            return res.status(404).json({
                success: false,
                message: 'La categoría no existe'
            });
        }

        // Verificar que la subcategoria existe
        const parentSubcategory = await Subcategory.findById(subcategory);
        if (!parentSubcategory) {
            return res.status(404).json({
                success: false,
                message: 'La subcategoría no existe'
            });
        }

        // Limpiar espacios en blanco
        const trimmedName = name.trim();
        const trimmedDesc = description.trim();

        // Verificar si ya existe un producto con el mismo nombre
        const existingProduct = await Product.findOne({ name: trimmedName });
        if (existingProduct) {
            return res.status(400).json({
                success: false,
                message: 'Ya existe un producto con ese nombre'
            });
        }

        // Crear nuevo producto
        const newProduct = new Product({
            name: trimmedName,
            description: trimmedDesc,
            price,
            stock,
            category,
            subcategory,
            images: images || [],
            createdBy: req.user ? req.user.id : null // Si hay autenticación
        });

        await newProduct.save();

        res.status(201).json({
            success: true,
            message: 'Producto creado exitosamente',
            data: newProduct
        });
    } catch (error) {
        console.error('Error en createProduct:', error);

        // Manejo de errores de indice único
        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                message: 'Ya existe un producto con ese nombre'
            });
        }

        // Error genérico del servidor
        res.status(500).json({
            success: false,
            message: 'Error al crear producto',
            error: error.message
        });
    }
};

/**
 * GET: consultar listado de productos
 * GET /api/products
 * por defecto retorna solo los productos activos
 * con includeInactive=true retorna todos los productos incluyendo los inactivos
 * Ordena descendente por fecha de creación
 * Parámetros opcionales:
 * category: filtrar por categoria
 * subcategory: filtrar por subcategoria
 * retorna:
 * 200: lista de productos
 * 500: error de base de datos
 */

exports.getProducts = async (req, res) => {
    try {
        // Por defecto solo los productos activos
        // IncludeInactive=true permite ver desactivados
        const includeInactive = req.query.includeInactive === 'true';
        const activeFilter = includeInactive ? {} : {
            active: { $ne: false }
        };

        // Filtros opcionales
        const filters = { ...activeFilter };
        
        if (req.query.category) {
            filters.category = req.query.category;
        }
        
        if (req.query.subcategory) {
            filters.subcategory = req.query.subcategory;
        }

        const products = await Product.find(filters)
            .populate('category', 'name')
            .populate('subcategory', 'name')
            .populate('createdBy', 'name email')
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            data: products
        });
    } catch (error) {
        console.error('Error al obtener productos', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener productos'
        });
    }
};

/**
 * READ: Obtener un producto específico por id
 * GET /api/products/:id
 * retorna:
 * 200: producto encontrado
 * 404: producto no encontrado
 * 500: error de base de datos
 */

exports.getProductById = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id)
            .populate('category', 'name')
            .populate('subcategory', 'name')
            .populate('createdBy', 'name email');

        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Producto no encontrado'
            });
        }

        res.status(200).json({
            success: true,
            data: product
        });
    } catch (error) {
        console.error('Error en obtener producto por id', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener producto por id'
        });
    }
};

/**
 * UPDATE: Actualizar producto existente
 * PUT /api/products/:id
 * Auth Bearer token requerido
 * Roles: admin y coordinador
 * body:
 * name: Nuevo nombre del producto (opcional)
 * description: nueva descripción (opcional)
 * price: nuevo precio (opcional, ≥ 0)
 * stock: nuevo stock (opcional, ≥ 0)
 * category: nuevo id de la categoría (opcional)
 * subcategory: nuevo id de la subcategoría (opcional)
 * images: nuevo array de imágenes (opcional)
 * validaciones:
 * si cambia la categoria verifica que exista
 * si cambia la subcategoria verifica que exista
 * si cambia el nombre verifica que no sea duplicado
 * retorna:
 * 200: producto actualizado
 * 400: validacion fallida
 * 404: producto no encontrado
 * 500: error de base de datos
 */

exports.updateProduct = async (req, res) => {
    try {
        const { name, description, price, stock, category, subcategory, images } = req.body;

        // Construir objeto de actualización solo con campos enviados
        const updateData = {};

        if (name !== undefined) {
            if (typeof name !== 'string' || !name.trim()) {
                return res.status(400).json({
                    success: false,
                    message: 'El nombre debe ser texto válido'
                });
            }
            updateData.name = name.trim();
        }

        if (description !== undefined) {
            if (typeof description !== 'string' || !description.trim()) {
                return res.status(400).json({
                    success: false,
                    message: 'La descripción debe ser texto válido'
                });
            }
            updateData.description = description.trim();
        }

        if (price !== undefined) {
            if (typeof price !== 'number' || price < 0) {
                return res.status(400).json({
                    success: false,
                    message: 'El precio debe ser un número no negativo'
                });
            }
            updateData.price = price;
        }

        if (stock !== undefined) {
            if (typeof stock !== 'number' || stock < 0) {
                return res.status(400).json({
                    success: false,
                    message: 'El stock debe ser un número no negativo'
                });
            }
            updateData.stock = stock;
        }

        if (category !== undefined) {
            const parentCategory = await Category.findById(category);
            if (!parentCategory) {
                return res.status(404).json({
                    success: false,
                    message: 'La categoría no existe'
                });
            }
            updateData.category = category;
        }

        if (subcategory !== undefined) {
            const parentSubcategory = await Subcategory.findById(subcategory);
            if (!parentSubcategory) {
                return res.status(404).json({
                    success: false,
                    message: 'La subcategoría no existe'
                });
            }
            updateData.subcategory = subcategory;
        }

        if (images !== undefined) {
            if (Array.isArray(images)) {
                updateData.images = images;
            } else {
                return res.status(400).json({
                    success: false,
                    message: 'Las imágenes deben ser un array'
                });
            }
        }

        // Actualizar producto
        const updateProduct = await Product.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true, runValidators: true }
        );

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
        console.error('Error en actualizar producto', error);

        // Manejo de errores de indice único
        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                message: 'Ya existe un producto con ese nombre'
            });
        }

        res.status(500).json({
            success: false,
            message: 'Error al actualizar el producto',
            error: error.message
        });
    }
};

/**
 * DELETE: eliminar o desactivar un producto
 * DELETE /api/products/:id
 * Auth Bearer token requerido
 * Roles: admin
 * query param:
 * hardDelete=true elimina permanentemente de la base de datos
 * Default: Soft delete (solo desactivar)
 * 
 * SOFT Delete: marca el producto como inactivo
 * Se puede recuperar activando
 * Al listar por defecto no se muestra
 * 
 * HARD Delete: elimina permanentemente el producto de la base de datos
 * No se puede recuperar
 * 
 * retorna:
 * 200: Producto eliminado o desactivado
 * 404: Producto no encontrado
 * 500: Error de base de datos
 */

exports.deleteProduct = async (req, res) => {
    try {
        const isHardDelete = req.query.hardDelete === 'true';

        // Buscar el producto a eliminar
        const product = await Product.findById(req.params.id);
        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Producto no encontrado'
            });
        }

        if (isHardDelete) {
            // Hard delete: eliminar permanentemente
            await Product.findByIdAndDelete(req.params.id);

            res.status(200).json({
                success: true,
                message: 'Producto eliminado permanentemente',
                data: {
                    product: product
                }
            });
        } else {
            // Soft delete: solo marcar como inactivo
            product.active = false;
            await product.save();

            res.status(200).json({
                success: true,
                message: 'Producto desactivado exitosamente',
                data: {
                    product: product
                }
            });
        }
    } catch (error) {
        console.error('Error al eliminar el producto:', error);
        res.status(500).json({
            success: false,
            message: 'Error al eliminar el producto',
            error: error.message
        });
    }
};
