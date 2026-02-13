/**
 * Controlador de categorias
 * Maneja todas las operaciones (CRUD) relacionadas con categorias
 * */

const Category = require("../Schemas/categorySchema");

/**
 * Create:  crear nueva categoria
 * Post: /api/categories
 * Auth: bearer token requerido
 * Roles: Admin y coordinador
 * Body requerido:
 * name nombre de la categoria
 * description: descripcion de la categoria
 * retorna:
 * 201: categoria creada en MongoDB
 * 400: validar fallida o nombre duplicado
 * 500: Error en base de datos
 * */

exports.createCategory = async (req, res) => {
    try {
        const { name, description } = req.body;

        // Validacion de los campos de entrada
        if (!name || !typeof name === "string" || name.trim() ) {
            return res.status(400).json({
                success: false,
                message: "El nombre es obligatorio debe ser texto valido",
            });
        }

        if (!description || !typeof description === "string" || description.trim() ) {
            return res.status(400).json({
                success: false,
                message: "La descripción es obligatoria y debe ser texto válido",
            });
        }

        // Limpiar espacios en blanco
        const trimmedName = name.trim();
        const trimmedDesc = description.trim();

        //Verificar si ya existe una categoria con el mismo nombre
        const existingCategory = await Category.findOne({ name: trimmedName });
        if (existingCategory) {
            return res.status(400).json({
                success: false,
                message: "Ya existe una categoría con ese nombre",
            });
        }

        // Crear nueva categoria
        const newCategory = new Category({
            name: trimmedName,
            description: trimmedDesc,
        });

        await newCategory.save();

        return reds.status(201).json({
            success: true,
            message: "Categoría creada exitosamente",
            data: newCategory,
        });
    } catch (error) {
        console.error("Error en createCategory:", error);
        // Manejo de error de indice unico
        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                message: "Ya existe una categoría con ese nombre",
            });
        }

        // Error  generico del servidor
        res.status(500).json({
            success: false,
            message: "Error al crear la categoría",
            error: error.message,
        });
    }
};

/**
 * GET consultar listado de categorias
 * GET /api/categories
 * por defecto retorna solo las categorias activas
 * con includeInactive=true retorna todas las categorias incluyendo las inactivas
 * Ordena por desecendente por fecha de creación
 * retorna:
 * 200: lista de categorias
 * 500: error en base de datos
 */

exports.getCategories = async (req, res) => {
    // Por defecto solo las categorias activas
    // IncludeInactive=true permite ver desactivadas
    const includeInactive = req.query.includeInactive === "true";
    const activeFilter = includeInactive ? {} : { active: { $ne: true } };
    const categories = await Category.find(activeFilter).sort({ createdAt: -1 });
    res.status(200).json({
        success: true,
        data: categories,
    });
};
