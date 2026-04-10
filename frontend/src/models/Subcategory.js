export default class Subcategory { // Clase modelo que representa una subcategoría; estructura los datos del backend para el frontend
  constructor({ // Constructor con desestructuración de objeto; permite crear instancias desde el JSON de la API
    _id = '', // ID único asignado por MongoDB; cadena vacía por defecto al crear una subcategoría nueva
    name = '', // Nombre de la subcategoría; campo requerido en el backend, inicializado vacío como valor seguro
    description = '', // Descripción opcional de la subcategoría; cadena vacía si el backend no envía este campo
    category = '' // ID de referencia a la categoría padre (ObjectId de MongoDB); vacío por defecto
  } = {}) { // El = {} permite llamar al constructor sin argumentos sin lanzar error de desestructuración
    this._id = _id; // Asigna el ID de MongoDB a la instancia para identificar la subcategoría en el CRUD
    this.name = name; // Asigna el nombre a la propiedad de la instancia; se muestra en listas y selectores
    this.description = description; // Asigna la descripción a la instancia para mostrar en formularios
    this.category = category; // Asigna la referencia a la categoría padre; puede ser el ID o el objeto populado
  } // Fin del constructor
} // Fin de la clase Subcategory
