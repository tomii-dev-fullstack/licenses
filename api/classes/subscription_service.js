import { clientDB } from "../../lib/database.js";

class SubscriptionService {
    constructor() {
        this.collection = clientDB.db("mercado").collection('subscription'); // Nombre de la colección de usuarios
    }

    async createSubscription(newSubscription) {
        // Buscar usuario por email
        const subscription = await this.collection.insertOne(newSubscription);
        if (!subscription) throw new Error('subscription no encontrada');

        return subscription
    }
}

export default SubscriptionService;
