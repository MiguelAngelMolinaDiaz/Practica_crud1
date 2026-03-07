// Modelo de usuario
/* Define la estructura de base de datos para los usuarios
Encripta la contraseña
Manejo de roles, (admin, coordinador, auxiliar)
*/

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs'); // Libreria para encriptar contraseña

//Estrucutura de la base de datos para los usuarios
const userSchema = new mongoose.Schema({
  // El nombre de usuario debe ser único en toda la base de datos
  username:{
    type: String,
    required: true,
    unique: true,
    trim: true // Elimina espacios en blanco al inicio y al final
  },

  //Email debe ser único valido en minúsculas
  email:{
    type: String,
    required: true,
    unique: true,
    lowercase: true, // Convierte el email a minúsculas
    trim: true,
    match: [/\S+@\S+\.\S+/, 'El correo no es valido'] // Validación de formato de correo en MongoDB
  },
  // Contraseña - requerida, minimo 10 caracteres
  password:{
    type: String,
    required: true,
    minlength: 10,
    select: false // no incluir en resultados por defecto, ninguna consulta puede traer ese dato, solo una especifica
  },
  //Rol del usuario restringe valores especificos
  role:{
    type: String,
    enum: ['admin', 'coordinador', 'auxiliar'], // solo estos valores son permitidos
    default: 'auxiliar' // por defecto, los nuevos usuarios son auxiliar
  },
  // usuarios activos
  active:{
    type: Boolean,
    default: true // nuevos usuarios comienzan activos
  },
}, {
  timestamps: true, // agrega createdAt y updatedAt automáticamente
  versionKey: false // no incluir __v en el control de versiones de Mongoose
});

// Middleware para encriptar la contraseña antes de guardar el usuario
userSchema.pre('save', async function(next){
  // si el password no fue modificado, no encriptar de nuevo
  if(!this.isModified('password')) return next();

  try {
    //generar slat con coplejidad de 10 rondas
    //mayor numero de rondas, mas seguro pero mas lento
    const salt = await bcrypt.genSalt(10);

    //Encriptar la password usando el salt generado
    this.password = await bcrypt.hash(this.password, salt);

    //continuar con el gurdado normal
    next();
  } catch (error) {
    //si hay un error en encriptacion pasar error al siguiente middleware
    next(error);
  }
});

// Crear y exponer el modulo de usuario
module.exports = mongoose.model('User', userSchema);