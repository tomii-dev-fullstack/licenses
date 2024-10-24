import { ObjectId } from "mongodb";
import { clientDB } from "../../lib/database.js";

// services/ProductService.js
class ProductService {
    constructor() {
        this.collection = clientDB.db("keplan").collection('product'); // Nombre de la colección de usuarios
    }

    async getAllProducts(id) {
        return this.collection.aggregate([
            {
                $match: {
                    user_id: new ObjectId(id)
                }
            }
        ]).toArray();
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

    async getOnlyProductById({ productId }) {
        return this.collection.findOne({ _id: new ObjectId(productId) })
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



    async getProductsByCategory(category) {
        console.log(category);
        return this.collection.aggregate([
            { 
                $match: { proveedor: category } 
            }
        ]).toArray();
    }
    
    async getSuppliers() {
        try {
            // Accede directamente a la colección de productos desde `this.collection`
            const suppliers = await this.collection.find().toArray();
            return suppliers;
        } catch (error) {
            console.error('Error fetching suppliers:', error);
            throw new Error('Could not fetch suppliers');
        }
    }



    async editProduct(productId, updateData) {
        const productUpdate = await this.collection.updateOne(
            { _id: new ObjectId(productId) },
            { $set: updateData }
        );
        return productUpdate
    }
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
