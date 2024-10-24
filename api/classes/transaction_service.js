import { clientDB } from "../../lib/database.js";
import { ObjectId } from "mongodb";

class TransactionService {
    constructor() {
        this.collection = clientDB.db("keplan").collection('transaccion'); // Nombre de la colección de usuarios
    }


    async getTransaccions(id) {
        // Buscar usuario por email
        console.log(id)
        return this.collection.aggregate([
            {
                // Despliega los documentos que tienen un 'cart' con al menos un elemento
                $match: {
                    "user_id": new ObjectId(id),
                }
            }
        ]).toArray();
    }
    async postTransaction(transaction, id) {
        // Verificamos que el id proporcionado sea válido
        try {
            // Insertamos la transacción asociada al user_id
            const result = await this.collection.insertOne({
                user_id: new ObjectId(id),  // Convertimos el id a ObjectId
                ...transaction,             // Incluimos todos los campos del objeto de la transacción           // Añadimos la fecha de la transacción
            });

            return result;
        } catch (error) {
            console.error("Error al insertar la transacción:", error);
            throw error; // Propagamos el error para manejarlo fuera de la función si es necesario
        }
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

export default TransactionService;
