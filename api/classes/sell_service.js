import { clientDB } from "../../lib/database.js";
import jwt from "jsonwebtoken";
import { ObjectId } from "mongodb";

class SellService {
    constructor() {
        this.collection = clientDB.db("mercado").collection('order'); // Nombre de la colección de usuarios
    }


    async getSells(id) {
        // Buscar usuario por email
        const sells = await this.collection.aggregate([
            {
                // Despliega los documentos que tienen un 'cart' con al menos un elemento
                $match: {
                    "cart.user_product": new ObjectId(id),
                }
            }
        ]).toArray();
        if (!sells) throw new Error('Compras no encontradas');

        return sells
    }
    async getSellById(id) {
        // Buscar usuario por email
        const sell = await this.collection.aggregate([
            {

                $match: {
                    _id: new ObjectId(id),
                },
            }, {
                $lookup: {
                    from: "user",
                    localField: "cart.userId", // Referencia al usuario del producto
                    foreignField: "_id", // Campo en 'user' que será comparado (el '_id' de usuario)
                    as: "userId" // El resultado del lookup será almacenado en 'user_product'
                }
            },

        ]).toArray();
        if (!sell) throw new Error('Ventas no encontradas');

        return sell
    }
}

export default SellService;
