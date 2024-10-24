import { clientDB } from "../../lib/database.js";
import { ObjectId } from "mongodb";

class PurchaseService {
    constructor() {
        this.collection = clientDB.db("mercado").collection('order'); // Nombre de la colección de usuarios
    }

    async getPurchases(id) {
        // Buscar usuario por email
        const purchases = await this.collection.aggregate([
            {
                // Despliega los documentos que tienen un 'cart' con al menos un elemento
                $match: {
                    "cart.userId": new ObjectId(id),
                }
            }
        ]).toArray();
        if (!purchases) throw new Error('Compras no encontradas');

        return purchases
    }
    async getPurchaseById(id) {
        // Buscar usuario por email
        const purchase = await this.collection.aggregate([
            {
                // Filtramos la orden por su _id
                $match: {
                    _id: new ObjectId(id),
                },
            },
            {
                $lookup: {
                    from: "user",
                    localField: "cart.user_product", // Referencia al usuario del producto
                    foreignField: "_id", // Campo en 'user' que será comparado (el '_id' de usuario)
                    as: "user_product" // El resultado del lookup será almacenado en 'user_product'
                }
            }
        ]).toArray();
        if (!purchase) throw new Error('Compra no encontrada');

        return purchase
    }
}

export default PurchaseService;
