import { ObjectId } from "mongodb";
import { clientDB } from "../../lib/database.js";

// services/ProductService.js
class ProductService {
    constructor() {
        this.collection = clientDB.db("tienda").collection('product'); // Nombre de la colección de usuarios
    }

    async getAllProducts() {
        return this.collection.find().toArray();
    }
    /*     async getAllProducts() {
            return this.collection.aggregate([
                {
                    $lookup: {
                        from: "user",
                        localField: "user_id",
                        foreignField: "_id",
                        as: "products"
                    }
                },
                {
                    $unwind: "$products"
                }
            ]).toArray();
        } */
    async getImageProduct(userId, image) {
        return this.collection.aggregate([
            {
                $match: {
                    user_id: new ObjectId(userId), // Filtra por user_id
                    imagenes: image // Filtra los productos que contienen la imagen
                }
            },
            {
                $project: {
                    _id: 1 // Devuelve solo el ID del producto
                }
            }
        ]).toArray();
    }

    /*   async getOnlyProductById(productId, category, subCategory) {
          return this.collection.find({ _id: new ObjectId(productId) }).toArray();
      } */
    async getOnlyProductById(productId, subCategory) {
        const product = await this.collection.find({ _id: new ObjectId(productId) }).toArray();
        const relatedProducts = await this.collection.find({ categoria: subCategory }).toArray();

        return { product, relatedProducts };
    }

    async gProductById(id) {
        return await this.collection.find({ _id: new ObjectId(id) }).toArray();
    }




    async getProductById(productId) {
        return this.collection.aggregate([
            {
                $match: {
                    _id: new ObjectId(productId) // Filtramos por el product ID
                }
            },
            {
                $lookup: {
                    from: "user", // Nombre de la colección de aplicaciones
                    localField: "user_id", // Campo en la colección de trabajos que coincide con el ObjectId
                    foreignField: "_id", // Campo en la colección de aplicaciones que coincide con el ObjectId del trabajo
                    as: "user_details" // Nombre del array resultante
                }
            },
            {
                $unwind: "$user_details" // Desplazamos los datos del array de aplicaciones
            },
            {
                $lookup: {
                    from: "review", // Nombre de la colección de aplicaciones
                    localField: "_id", // Campo en la colección de trabajos que coincide con el ObjectId
                    foreignField: "product_id", // Campo en la colección de aplicaciones que coincide con el ObjectId del trabajo
                    as: "product_details" // Nombre del array resultante
                }
            }
        ]).toArray();
    }


    async createProduct(product) {
        return this.collection.insertOne(product)
    }
    async getProductByIdForUpdate(id) {
        return this.collection.collection("product").findOne({ _id: new ObjectId(id) });
    }
    async deleteProdu(id) {
        return this.collection.deleteOne({ _id: new ObjectId(id) });
    }



    async getProductsByCategory(category) {
        console.log(category);
        return this.collection.aggregate([
            {
                $match: { categoria: category }
            }
        ]).toArray();
    }

    async obtenerDatosDeCategoriaElegida(p, c) {

        return this.collection.aggregate([
            {
                $match: { categoria: c, productoTipo: p }
            }
        ]).toArray();
    }
    async rsearch(q) {
        return this.collection.aggregate([
            {
                $match: {
                    titulo: {
                        $regex: q,
                        $options: "i", // Insensible a mayúsculas/minúsculas
                    },
                },
            },
            {
                $project: {
                    titulo: 1, // Incluir el campo título
                    productoTipo: 1, // Incluir el campo productoTipo
                    categoria: 1, // Incluir el campo categoria
                    variantes: 1,
                    precio: 1
                },
            },
        ]).toArray();
    }

    async getProductsByProdType() {
        try {
            const results = await this.collection.aggregate([
                {
                    $group: {
                        _id: "$productoTipo", // Agrupar por productoTipo
                        categorias: { $addToSet: "$categoria" } // Consolidar categorías únicas en un array
                    }
                },
                {
                    $project: {
                        _id: 0, // Excluir el _id del resultado
                        productoTipo: "$_id", // Renombrar _id a productoTipo
                        categorias: 1 // Incluir las categorías
                    }
                }
            ]).toArray();
            console.log(results)
            return results;
        } catch (error) {
            console.error("Error fetching products and categories:", error);
            throw new Error("Could not fetch products and categories");
        }
    }

    async getSuppliers() {
        try {
            // Accede directamente a la colección de productos desde `this.collection`
            const suppliers = await this.collection.distinct("categoria");
            console.log(suppliers)
            return suppliers;
        } catch (error) {
            console.error('Error fetching suppliers:', error);
            throw new Error('Could not fetch suppliers');
        }
    }



    async editProduct(product) {
        // Extraemos el `_id` del producto y eliminamos este campo del objeto `updateData`
        const { id, ...updateData } = product;

        // Realizamos la operación de actualización usando `$set`
        const productUpdate = await this.collection.updateOne(
            { _id: new ObjectId(id) }, // Filtrar por el ID del producto
            { $set: updateData } // Solo actualizamos los campos enviados
        );

        // Retornamos el resultado de la operación
        return productUpdate;
    }
    async saveImages(data) {
        try {
            // Validar que los parámetros sean válidos
            if (!data) {
                throw new Error('Parámetros insuficientes');
            }

            // Actualizar solo la imagen de la variante específica
            const updateQuery = {
                titulo: data.titulo,
                descripcion: data.descripcion,
                productoTipo: data.productoTipo,
                categoria: data.categoria,
                variantes: data.variantes.map(variant => ({
                    color: variant.color,
                    imagen: variant.imagen,
                    peso: variant.peso
                }))
            };

            console.log(updateQuery)
            const productUpdate = await this.collection.updateOne(
                { _id: new ObjectId(data.id) }, // Filtrar por ID del producto
                {
                    $set: updateQuery, // Solo actualizar los campos proporcionados
                }
            );

            if (productUpdate.matchedCount === 0) {
                console.warn(`No se encontró el producto con ID: ${productId}`);
                return null; // Indicar que no se encontró el producto
            }


            return productUpdate;
        } catch (error) {
            console.error('Error actualizando la imagen de la variante:', error);
            throw error; // Propagar el error para manejarlo en el flujo superior
        }
    }



    /*  async editProduct(productId, updateData) {
         const productUpdate = await this.collection.updateOne(
             { _id: new ObjectId(productId) },
             { $set: updateData }
         );
         return productUpdate
     } */
    async deleteImageOfProduct(productId, image) {

        const productUpdate = await this.collection.updateOne(
            { _id: new ObjectId(productId) },

            {
                $pull: {
                    imagenes: image  // Elimina la imagen específica del array de imágenes
                }
            }
        );
        return productUpdate
    }
    async uploadImageOfProduct(productId, image) {

        const productUpdate = await this.collection.updateOne(
            { _id: new ObjectId(productId) },

            {
                $push: {
                    imagenes: image  // Elimina la imagen específica del array de imágenes
                }
            }
        );
        return productUpdate
    }
    /*   async getAllImages(userId) {
          const products = await this.collection.find(
              { user_id: new ObjectId(userId) }, // Filtra por user_id
              { projection: { imagenes: 1 } } // Proyecta solo el campo 'imagenes'
          ).toArray();
      
          // Extraer todas las imágenes de los productos
          const allImages = products.flatMap(product => product.imagenes);
      
          return allImages;
      } */
    async getAllImages(userId) {
        const products = await this.collection.find(
            { user_id: new ObjectId(userId) }, // Filtra por user_id
            { projection: { imagenes: 1, user_id: 1 } } // Proyecta los campos necesarios
        ).toArray();

        // Extraer las imágenes junto con _id y user_id
        const allImagesWithDetails = products.flatMap(product =>
            product.imagenes.map(image => ({
                image: image, // Asumiendo que 'image' es una cadena o un objeto con la URL
                productId: product._id, // ID del producto
                userId: product.user_id // user_id del producto
            }))
        );

        return allImagesWithDetails;
    }


}

export default ProductService;
