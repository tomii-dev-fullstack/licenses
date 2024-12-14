import { ObjectId } from "mongodb";
import { clientDB } from "../../lib/database.js";
import jwt from "jsonwebtoken";


class OrderService {
    constructor() {
        this.collection = clientDB.db("tienda").collection('order'); // Nombre de la colección de usuarios
    }
    async createOrdenOne(order) {
        return await this.collection.insertOne(order);

    }
    async getOrderSimple() {
        return this.collection.find().toArray();

    }
    async getOrderSimpleId(id) {
        return this.collection.find({ _id: new ObjectId(id) }).toArray();

    }

    async createOrder(jsonResponse, decoded) {
        // Verificar si el usuario ya existe
        const orderData = await this.savePaymentToDB(jsonResponse, decoded);
        const insertedOrder = await this.collection.insertOne(orderData);


        return insertedOrder
    };
    async getOrders(id) {
        console.log(id)
        // Verificar si el usuario ya existe
        return this.collection.aggregate([
            {
                $match: {
                    user_id: new ObjectId(id)
                }
            }
        ]).toArray();
    };
    async notifyDeliverySeller(orderId_mongo) {
        // Verificar si el usuario ya existe
        return this.collection.findOneAndUpdate(
            { _id: new ObjectId(orderId_mongo) },
            { $set: { seller_delivered: true } },
            {
                returnDocument: "after"
            } // Devuelve el documento actualizado
        );


    };
    async notifyDeliveryByBuyer(orderId_mongo) {
        // Verificar si el usuario ya existe
        return this.collection.findOneAndUpdate(
            { _id: new ObjectId(orderId_mongo) },
            { $set: { buyer_delivered: true } },
            {
                returnDocument: "after"
            } // Devuelve el documento actualizado
        );


    };
    async getOrder(id) {
        // Verificar si el usuario ya existe
        const order = await this.collection.findOne({ paymentId: id })


        return order
    };
    async updateProductStock(cart) {

        for (const item of cart) {
            await this.collection.updateOne(
                { _id: new ObjectId(item.id) }, // Busca el producto por su ID
                { $inc: { stock: -1 } } // Resta 1 al stock del producto
            );
        }


        return cart
    };
    async updateCartOrder(cart) {

        const updatedCart = cart.map((item) => {
            return {
                ...item,
                userId: new ObjectId(item.userId), // Convertir userId a ObjectId
                user_product: new ObjectId(item.user_product) // Convertir user_product a ObjectId
            };
        });

        return updatedCart
    };
    async updateCartOrderFinal(id, jsonResponse) {

        const updatedCart = this.collection.updateOne(
            { paymentId: id }, // Asegúrate de que se busca por el ID del usuario
            { $set: jsonResponse } // Actualiza los datos de la orden con el carrito
        );

        return updatedCart
    };



    async savePaymentToDB(jsonResponse, decoded) {
        try {
            const paymentData = {
                paymentId: jsonResponse.id,  // Aquí usamos el ID de la orden
                status: jsonResponse.status,

                payer: {
                    name: {
                        given_name: jsonResponse.payer.name.given_name,
                        surname: jsonResponse.payer.name.surname,
                    },
                    email_address: decoded.email,
                    payer_id: new ObjectId(decoded.id),
                    country_code: jsonResponse.payer.address.country_code,
                },
                payment_source: {
                    paypal: {
                        email_address: jsonResponse.payment_source.paypal.email_address,
                        account_id: jsonResponse.payment_source.paypal.account_id,
                        account_status: jsonResponse.payment_source.paypal.account_status,
                        name: {
                            given_name: jsonResponse.payment_source.paypal.name.given_name,
                            surname: jsonResponse.payment_source.paypal.name.surname,
                        },
                        country_code: jsonResponse.payment_source.paypal.address.country_code,
                    },
                },
                amount: {
                    currency_code: jsonResponse.purchase_units[0].payments.captures[0].amount.currency_code,
                    value: jsonResponse.purchase_units[0].payments.captures[0].amount.value,
                },
                shipping: {
                    name: jsonResponse.purchase_units[0].shipping.name.full_name,
                    address: {
                        address_line_1: jsonResponse.purchase_units[0].shipping.address.address_line_1,
                        admin_area_1: jsonResponse.purchase_units[0].shipping.address.admin_area_1,
                        admin_area_2: jsonResponse.purchase_units[0].shipping.address.admin_area_2,
                        postal_code: jsonResponse.purchase_units[0].shipping.address.postal_code,
                        country_code: jsonResponse.purchase_units[0].shipping.address.country_code,
                    },
                },
                paypal_fee: {
                    currency_code: jsonResponse.purchase_units[0].payments.captures[0].seller_receivable_breakdown.paypal_fee.currency_code,
                    value: jsonResponse.purchase_units[0].payments.captures[0].seller_receivable_breakdown.paypal_fee.value,
                },
                net_amount: {
                    currency_code: jsonResponse.purchase_units[0].payments.captures[0].seller_receivable_breakdown.net_amount.currency_code,
                    value: jsonResponse.purchase_units[0].payments.captures[0].seller_receivable_breakdown.net_amount.value,
                },
                capture_id: jsonResponse.purchase_units[0].payments.captures[0].id,
                create_time: jsonResponse.purchase_units[0].payments.captures[0].create_time,
                update_time: jsonResponse.purchase_units[0].payments.captures[0].update_time,
            };
            return paymentData;
        } catch (error) {
            console.error("Failed to save payment to DB:", error);
        }
    }
}



export default OrderService;
