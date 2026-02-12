/**
 * Modelo de categoria MONGODB
 * Define la estructura de la categoria
 */

const mongoose = require("mongoose");

// Campos de la tabla categoria

const categorySchema = new mongoose.Schema({
    //nombre de la categoria unico y requerido
    name: {
        type: String,
        required: [ true, "El nombre de la categoria es obligatorio" ],
        unique: true,
        trim: true, //Eliminar espacios al inicio y al final
    },

    //Descripcion de la categoria - requerida
    description: {
        type: String,
        required: [ true, "la descripcion es requerida"],
        trim: true,
    },

    // Active desactiva la categoria sin eliminarla
    active: {
        type: Boolean,
        default: true,
    }
}, {
    timestamps: true, // agrega createdAt y updatedAt automaticamente
    versionKey: false, // No  incluir campos __v
});

/**
 * MIDDLEWARE PRE-SAVE
 * limpia indices duplicados
 * Mongodb a veces crea multiples indices con el mismo nombre
 * esto causa conflictos al intentar dropIndex o recrear indices
 * este middleware limpia los indices problematicos
 * Proceso
 * 1 obtiene una lista de todos los indices de la coleccion
 * 2 busca si existe un indice con el nombre name_1 (antiguo o duplicado)
 * si existe lo elimina antes de nuevas operaciones
 * ignora errores si el indice no existe
 * continua con el guardado normal
 * */

categorySchema.pre("save", async function(next){
    try {
        //Obtener referencia de la coleccion de Mongodb
        const collection = this.constructor.collection;
        // obtener lista de indices
        const indexes = await collection.indexes();
        //Bucar si existe un indice problematico con el nombre "name_1"
        //(del orden: 1 para ascendente)
        const problematicIndex = indexes.find(index => index.name === "name_1");

        // si lo encuentra, eliminarlo
        if  (problematicIndex) {
            await collection.dropIndex("name_1");
        }
    } catch (error) {
        // si el erro es index notfound no es el problema - continuar
        // si es otro error, pasarlo al siguiente middleware
        if (!err.message.includes("index not found")) {
            return next(err);
        }
    }
    // continuar con el guardado normal
    next ();
    });

    /** indice unico
    Mongo rechazara cualquier intento de insertar o actualizar un documento con un valor de name que ya exista
    aumenta la velocidad de las busquedas
    **/

    categorySchema.index({ name: 1 }, {
        unique: true,
        name: "name_1"// nombre explicito para evitar conflictos
    });

    // Epoxrtar el modelo
    module.exports = mongoose.model("Category", categorySchema);