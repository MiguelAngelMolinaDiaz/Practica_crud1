/** 
 * Modelo de producto MONGODB 
 * Define la estructura de producto
 * el producto depende de una subcategoria depende de una categoria
 * muchos productos pueden pertenecer a una subcategoria
 * Tiene relacion un user para ver quein creo el producto
 * Soporte de imagenes (array de url) se guarda en una carperta no en la Base de datos
 * Validadcion de valores numericos (no negativos)
**/


const mongoose = require('mongoose');

//Campos de la tabla producto

const productSchema = new mongoose.Schema({
    //Nombre del producto unico y requerido
    name:{
        type: String,
        required: [true, 'El nombre es obligatorio'],
        unique: true, // No pueden haber dos productos con el mismo nombre
        trim: true // Eliminar espacios al inicio y al final
    },

    // Descripcion del producto -- requerida
    description: {
        type: String,
        required: [true, 'La decripción es requerida'],
        trim: true
    },

    // Precio en unidades monetarias
    // No puede ser negativo
    price: {
        type: Number,
        required: [true, 'El precio es obligatorio'],
        min: [0, 'El precio no puede ser negativo']
    },

    // Cantidad de stock
    // No puede ser negativo
    stock: {
        type: Number,
        required: [true, 'El stock es obligatorio'],
        min: [0, 'El stock no puede ser negativo']
    },

    // Categoria padre esta subcategoria pertenece a una categoria
    // relacion 1 - muchos Una categoria puede tener muchas subcategorias
    // Un producto pertenece a una categoria pero una subcategoria puede tener muchos productos relacion 1 a muchos

    category:{
        type: mongoose.Schema.Types.ObjectId, // Consultar en otra coleccion
        ref: 'Category', // puede ser poblado con .populate('category')
        required: [true, 'La categoria es requerida']
    },

    subcategory:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Subcategory', // puede ser poblado con .populate('subcategory')
        required: [true, 'La subcategoria es requerida']
    },

    // Quien creo el producto
    // Referencia de User no requerido
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User' // puede ser poblado para mostrar los usuarios
    },

    // Array de urls de imagenes de productos
    images: [{
        type: String, // url de la imagen
    }],

    // Active desactiva el producto pero no la elimina
    active:{
        type: Boolean,
        default: true
    }
},{
    timestamps: true, // agrega createdAt y updatedAt automaticamente
    versionKey: false, // NO incluir campos __V
});

// MIDDLEWARE PRE-SAVE
// limpia indices duplicados
// Mongodb a veces crea multiples indices con el mismo nombre
// esto causa conflictos al intentar dropIndex o recrear indices
// este middleware limpia los indices problematicos
// Proceso
// 1 obtiene una lista de todos los indices de la coleccion
// 2 busca si existe indice con nombre name_1 (antiguo o duplicado)
// si existe lo elimina anted de nuevas operaciones 
// ignora errores si el indice no existe
// continua con el guardado normal

productSchema.post('save', function(error, doc, next) {
    //Verifiacar si es error de mongoDB por violación de indice unico
        if (error.name === 'MongoServerError' && error.code === 11000) {
            return next(new Error('Ya existe un producto con ese'))
        }
        // pasar el error tal como es  
        next(error);
});

/**
 * Crear indice unico
 * 
 * MongoDB rechazara cualquier intento de insertar o actualizar un documento con un valor de name que ya exista
 * aumenta la velocidad de la busquedas
 */



// Exportar el modelo
module.exports = mongoose.model('Product', productSchema);
