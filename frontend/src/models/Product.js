export default class Product { // Clase modelo que representa un producto; estructura los datos del backend para usar en el frontend
  constructor({ // Constructor con desestructuración; crea una instancia Product a partir del objeto JSON de la API
    _id = '', // ID único de MongoDB; vacío por defecto al crear un producto nuevo desde el formulario
    name = '', // Nombre del producto; campo requerido en el backend, inicializado vacío como valor seguro
    description = '', // Descripción del producto; campo opcional, cadena vacía si no viene del servidor
    price = 0, // Precio del producto; número, se inicializa en 0 para evitar valores undefined en el formulario
    stock = 0, // Cantidad en inventario; número, inicializado en 0 como valor por defecto seguro
    category = '', // ID de referencia a la categoría padre (ObjectId de MongoDB); cadena vacía por defecto
    subcategory = '', // ID de referencia a la subcategoría (ObjectId de MongoDB); cadena vacía si no aplica
    createdBy = '', // ID del usuario que creó el producto (ObjectId); se llena automáticamente en el backend
    images = [] // Array de URLs o rutas de imágenes del producto; array vacío si no tiene imágenes asociadas
  } = {}) { // El = {} evita error si el constructor se llama sin argumentos
    this._id = _id; // Asigna el ID de MongoDB a la instancia para identificar el producto en operaciones CRUD
    this.name = name; // Asigna el nombre a la propiedad de la instancia; se muestra en listas y formularios
    this.description = description; // Asigna la descripción a la instancia para mostrar en detalle del producto
    this.price = price; // Asigna el precio a la instancia; usado en formularios y visualización
    this.stock = stock; // Asigna el stock a la instancia; refleja la cantidad disponible en inventario
    this.category = category; // Asigna la referencia a la categoría; puede ser el ID o el objeto populado del backend
    this.subcategory = subcategory; // Asigna la referencia a la subcategoría; puede ser ID u objeto populado
    this.createdBy = createdBy; // Asigna el creador del producto; útil para auditoría y control de acceso
    this.images = images; // Asigna el array de imágenes a la instancia para mostrar en la vista del producto
  } // Fin del constructor
} // Fin de la clase Product
