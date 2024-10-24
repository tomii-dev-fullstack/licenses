import jwt from "jsonwebtoken"
import OrderService from '../classes/order_service.js'; // Importación con ES Modules
import { ObjectId } from "mongodb";
import { send } from "../nodemailer/config.js";
const { PAYPAL_CLIENT_ID, PAYPAL_CLIENT_SECRET } = process.env;
const orderService = new OrderService();

// Registro de usuario
/**
 * Generate a client token for rendering the hosted card fields.
 * @see https://developer.paypal.com/docs/checkout/advanced/integrate/#link-integratebackend
 */
const generateAccessToken = async () => {
    try {
        if (!PAYPAL_CLIENT_ID || !PAYPAL_CLIENT_SECRET) {
            throw new Error("MISSING_API_CREDENTIALS");
        }
        const auth = Buffer.from(
            PAYPAL_CLIENT_ID + ":" + PAYPAL_CLIENT_SECRET,
        ).toString("base64");
        const response = await fetch(`https://api-m.sandbox.paypal.com/v1/oauth2/token`, {
            method: "POST",
            body: "grant_type=client_credentials",
            headers: {
                Authorization: `Basic ${auth}`,
            },
        });

        const data = await response.json();
        return data.access_token;
    } catch (error) {
        console.error("Failed to generate Access Token:", error);
    }
};
// Inicio de sesión
export const createOrder = async (req, res) => {

    try {
        // use the cart information passed from the front-end to calculate the order amount detals
        const { cart } = req.body;
        const { jsonResponse, httpStatusCode } = await createOrderWithCart(cart);

        res.status(httpStatusCode).json(jsonResponse);
    } catch (error) {
        console.error("Failed to create order:", error);
        res.status(500).json({ error: "Failed to create order." });
    }
};

const createOrderWithCart = async (cart) => {
    // use the cart information passed from the front-end to calculate the purchase unit details
    console.log(
        "shopping cart information passed from the frontend createOrder() callback:",
        cart
    );

    const accessToken = await generateAccessToken();
    const url = `https://api-m.sandbox.paypal.com/v2/checkout/orders`;

    // Calcular el total del carrito
    const subtotal = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);
    const commission = subtotal * 0.05; // 5% de comisión
    const totalWithCommission = subtotal + commission;

    const payload = {
        intent: "CAPTURE",

        purchase_units: [
            {
                amount: {
                    currency_code: "USD",
                    value: totalWithCommission, // Total con la comisión incluida
                    breakdown: {
                        item_total: {
                            currency_code: "USD",
                            value: subtotal, // Subtotal de los productos (sin la comisión)
                        },
                        handling: {
                            currency_code: "USD",
                            value: commission, // Comisión del 5%
                        },
                    },
                },
                items: cart.map((item) => ({
                    name: item.name,
                    unit_amount: {
                        currency_code: "USD",
                        value: item.price, // Precio por unidad
                    },
                    quantity: item.quantity, // Cantidad
                })),
            },
        ],
    };

    // Hacer la petición a PayPal con el payload dinámico
    const response = await fetch(url, {
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
            // "PayPal-Mock-Response": '{"mock_application_codes": "MISSING_REQUIRED_PARAMETER"}'
            // "PayPal-Mock-Response": '{"mock_application_codes": "PERMISSION_DENIED"}'
            // "PayPal-Mock-Response": '{"mock_application_codes": "INTERNAL_SERVER_ERROR"}'
        },
        method: "POST",
        body: JSON.stringify(payload),
    });

    return handleResponse(response);
};
async function handleResponse(response) {
    try {
        const jsonResponse = await response.json();
        return {
            jsonResponse,
            httpStatusCode: response.status,
        };
    } catch (err) {
        const errorMessage = await response.text();
        throw new Error(errorMessage);
    }
}
export const captureOrder = async (req, res) => {
    try {
        const { orderID } = req.params;

        const sessionToken = req.cookies["sessionToken"];
        const { jsonResponse, httpStatusCode } = await captureOrderr(orderID);
        console.log(jsonResponse, httpStatusCode)
        let decoded = jwt.verify(sessionToken, process.env.JWT_SECRET); // Verifica el token


        // Save payment data to MongoDB
        const orderData = await orderService.savePaymentToDB(jsonResponse, decoded);
        if (orderData) {
            await orderService.createOrder()
            res.status(httpStatusCode).json(jsonResponse);
        }
    } catch (error) {
        console.error("Failed to create order:", error);
        res.status(500).json({ error: "Failed to capture order." });
    }
};
export const saveOrderProducts = async () => {
    try {
        const { id } = req.params; // Este es el ID del usuario
        const { cart } = req.body; // El carrito que llega desde el front-end
        // Busca la orden en la base de datos por el id del usuario
        const orderFromDB = await orderService.getOrder(id)
        if (!orderFromDB) {
            return res.status(404).json({ error: "Order not found for this user" });
        }
        // Actualiza el stock de los productos en la colección `product`
        const stockProduct = await orderService.updateProductStock(cart)
        // Actualiza el carrito con la nueva información
        const updatedCart = await orderService.updateCartOrder(stockProduct)

        // Incluye el carrito actualizado en el jsonResponse
        const jsonResponse = {
            ...orderFromDB,
            cart: updatedCart // Sobrescribe o añade el carrito al jsonResponse existente
        };

        // Guarda los datos en MongoDB
        if (jsonResponse) {
            // Actualiza la orden en la base de datos
            await orderService.updateCartOrderFinal(id, jsonResponse)

            res.status(200).json({ message: "Order and products saved successfully", data: jsonResponse });
        } else {
            res.status(500).json({ error: "Failed to save order data." });
        }
    } catch (error) {
        console.error("Failed to save products:", error);
        res.status(500).json({ error: "Failed to save products." });
    }
};

const captureOrderr = async (orderID) => {
    const accessToken = await generateAccessToken();
    const url = `https://api-m.sandbox.paypal.com/v2/checkout/orders/${orderID}/capture`;

    const response = await fetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
            // Uncomment one of these to force an error for negative testing (in sandbox mode only). Documentation:
            // https://developer.paypal.com/tools/sandbox/negative-testing/request-headers/
            // "PayPal-Mock-Response": '{"mock_application_codes": "INSTRUMENT_DECLINED"}'
            // "PayPal-Mock-Response": '{"mock_application_codes": "TRANSACTION_REFUSED"}'
            // "PayPal-Mock-Response": '{"mock_application_codes": "INTERNAL_SERVER_ERROR"}'
        },
    });

    return handleResponse(response);
};
export const notifyDelivery = async (req, res) => {
    const { orderId_mongo } = req.body;
    // Validación del ID de la orden
    if (!ObjectId.isValid(orderId_mongo)) {
        return res.status(400).json({ error: 'ID de orden inválido' });
    }

    const result = await orderService.notifyDeliverySeller(orderId_mongo)
    try {
        // Conectar a la base de datos
        if (result.matchedCount === 0) {
            return res.status(404).json({ error: 'Orden no encontrada' });
        }

        if (result.modifiedCount === 0) {
            return res.status(400).json({ error: 'No se pudo actualizar el estado de la orden' });
        }

        send(result.payer.email_address, orderId_mongo)

        // Enviar respuesta exitosa
        return res.status(200).json({ message: 'Estado de entrega actualizado', data: result });
    } catch (error) {
        console.error('Error al actualizar la orden:', error);
        return res.status(500).json({ error: 'Error al actualizar el estado de entrega' });
    }
};
export const notifyDeliveryByBuyer = async (req, res) => {
    const { orderId_mongo } = req.body;
    // Validación del ID de la orden
    if (!ObjectId.isValid(orderId_mongo)) {
        return res.status(400).json({ error: 'ID de orden inválido' });
    }

    try {

        // Actualizar el estado de entrega
        const result = await orderService.notifyDeliveryByBuyer(orderId_mongo)
        if (result.matchedCount === 0) {
            return res.status(404).json({ error: 'Orden no encontrada' });
        }

        if (result.modifiedCount === 0) {
            return res.status(400).json({ error: 'No se pudo actualizar el estado de la orden' });
        }


        // Enviar respuesta exitosa
        return res.status(200).json({ message: 'Estado de entrega actualizado', data: result });
    } catch (error) {
        console.error('Error al actualizar la orden:', error);
        return res.status(500).json({ error: 'Error al actualizar el estado de entrega' });
    }
};
export const getOrders = async (req, res) => {

    try {
        const token = req.cookies?.sessionToken;

        if (!token) {
            return res.status(401).json({ error: 'No autorizado' });
        }

        // Decodificar el token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        // Actualizar el estado de entrega
        const result = await orderService.getOrders(decoded.id)
        console.log(result);
        if (result > 0) {
            return res.status(404).json({ data: result });
        }



        // Enviar respuesta exitosa
        return res.status(200).json({ message: 'Estado de entrega actualizado', data: result });
    } catch (error) {
        console.error('Error al actualizar la orden:', error);
        return res.status(500).json({ error: 'Error al actualizar el estado de entrega' });
    }
};
