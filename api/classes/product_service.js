import { ObjectId } from "mongodb";
import { clientDB } from "../../lib/database.js";

// services/ProductService.js
class ProductService {
    constructor() {
        this.collection = clientDB.db("mercado").collection('product'); // Nombre de la colección de usuarios
    }

    async getAllProducts() {
        return this.collection.aggregate([
            {
                $lookup: {
                    from: "user",
                    localField: "user_id",
                    foreignField: "_id",
                    as: "user_details"
                }
            },
            {
                $unwind: "$user_details"
            }
        ]).toArray();
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


    async editProduct(productId, updateData) {
        const productUpdate = await this.collection.updateOne(
            { _id: new ObjectId(productId) },
            { $set: updateData }
        );
        return productUpdate
    }
}

export default ProductService;
