export default class User { // Clase modelo que representa un usuario; estructura los datos del backend para usar en el frontend
  constructor({ // Constructor con desestructuración; crea una instancia User a partir del objeto JSON de la API
    _id = '', // ID único de MongoDB; cadena vacía por defecto al crear un usuario nuevo desde el formulario
    username = '', // Nombre de usuario único; campo requerido en el backend, inicializado vacío como valor seguro
    email = '', // Correo electrónico del usuario; campo requerido y único en la base de datos
    password = '', // Contraseña del usuario; en el frontend se usa solo en formularios, nunca se persiste en estado
    role = 'auxiliar' // Rol del usuario en el sistema; valor por defecto 'auxiliar' (el rol de menor privilegio)
  } = {}) { // El = {} permite instanciar sin argumentos sin lanzar error de desestructuración
    this._id = _id; // Asigna el ID de MongoDB a la instancia para identificar el usuario en operaciones CRUD
    this.username = username; // Asigna el nombre de usuario a la instancia; se muestra en listas y perfil
    this.email = email; // Asigna el email a la instancia; se usa en formularios de edición y visualización
    this.password = password; // Asigna la contraseña; solo se usa al crear/editar, el backend la hashea con bcryptjs
    this.role = role; // Asigna el rol a la instancia; determina los permisos: admin, coordinador o auxiliar
  } // Fin del constructor
} // Fin de la clase User
