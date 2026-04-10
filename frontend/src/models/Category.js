export default class Category { // Clase modelo que representa una categoría; estructura los datos recibidos del backend
  constructor({ // Constructor con desestructuración de objeto; permite crear instancias desde el JSON de la API
    _id = '', // ID único asignado por MongoDB; cadena vacía por defecto al crear una categoría nueva
    name = '', // Nombre de la categoría; campo requerido en el backend, inicializado vacío como valor seguro
    description = '' // Descripción opcional de la categoría; cadena vacía si el backend no envía este campo
  } = {}) { // El = {} permite llamar al constructor sin argumentos sin lanzar error de desestructuración
    this._id = _id; // Asigna el ID de MongoDB a la instancia para identificar la categoría en operaciones CRUD
    this.name = name; // Asigna el nombre a la propiedad de la instancia; se usa en formularios y listas
    this.description = description; // Asigna la descripción a la propiedad de la instancia
  } // Fin del constructor
} // Fin de la clase Category
