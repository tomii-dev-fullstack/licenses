import { ObjectId } from "mongodb";
import { clientDB } from "../../lib/database.js";

class SubscriptionService {
    constructor() {
        this.collection = clientDB.db("keplan").collection('subscription'); // Nombre de la colección de usuarios
    }

    async createSubscription(newSubscription) {
        // Buscar usuario por email
        const subscription = await this.collection.insertOne(newSubscription);
        if (!subscription) throw new Error('subscription no creada');

        return subscription
    }
    async getSuscription(id) {
        // Buscar usuario por email
        return this.collection.findOne({ user_id: new ObjectId(id) })
        /*   if (subscription) throw new Error('subscription encontrada'); */

    }
}

export default SubscriptionService;
