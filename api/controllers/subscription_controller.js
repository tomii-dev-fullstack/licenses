import jwt from "jsonwebtoken"
import SubscriptionService from '../classes/subscription_service.js';
import PayPalClient from "../paypal/paypal.js"
import { ObjectId } from "mongodb";
import axios from "axios";
const subscriptionService = new SubscriptionService();

// Registro de usuario
export const captureSubscription = async (req, res) => {
    try {
        const { subscription_id, token, planId } = req.body; // Extrae subscription_id, token, planId del body
        const sessionToken = req.cookies["sessionToken"]; // Accede directamente a la cookie "sessionToken"
        const decoded = jwt.verify(sessionToken, process.env.JWT_SECRET); // Verifica el token
        if (!decoded) {
            return res.status(401).json({ error: 'Invalid session token' });
        }
        // Valida que todos los parámetros estén presentes
        if (!subscription_id || !token || !sessionToken || !planId) {
            return res.status(400).json({ error: 'Subscription ID, token, sessionToken, and planId are required' });
        }

        const newSubscription = {
            subscription_id: subscription_id,
            user_id: new ObjectId(decoded.id), // Usa el ID del usuario decodificado
            type_plan: planId,
            status: 'active',
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        // Inserta la suscripción en la base de datos
        console.log(newSubscription)
        const savesSubscription = await subscriptionService.createSubscription(newSubscription);
        // Verifica si la suscripción se guardó correctamente
        if (!savesSubscription.acknowledged) {
            return res.status(500).json({ error: 'Failed to save subscription' });
        }

        return res.status(200).json({
            success: true,
            subscriptionId: savesSubscription.insertedId, // Devuelve el ID de la suscripción guardada
        });
    } catch (error) {
        console.error('Error capturing subscription or updating user:', error.message);
        return res.status(500).json({
            error: 'Internal server error while capturing subscription or updating user',
            details: error.message
        });
    }
};
export const createSubscription = async (req, res) => {
    const { planId, price } = req.body; // Datos del plan

    const sessionToken = req.cookies["sessionToken"]; // Accede directamente a la cookie "sessionToken"
    const decoded = jwt.verify(sessionToken, process.env.JWT_SECRET); // Verifica el token
    if (!decoded) {
        return res.status(401).json({ error: 'Invalid session token' });
    }
    if (!planId || !price) {
        return res.status(400).json({ error: 'Plan name and price are required' });
    }
    const paypal = new PayPalClient();

    try {

        // Paso 1: Crear el producto
        const product = await paypal.createProduct(planId, `Descripción para el plan ${planId}`);

        // Paso 2: Crear el plan de suscripción asociado al producto
        const plan = await paypal.createPlan(product.id, planId, price);

        // Paso 3: Crear la suscripción utilizando el ID del plan recién creado
        const subscription = await paypal.createSubscription(plan.id);
        console.log(subscription)
        if (!decoded || !planId) {
            return res.status(400).json({ error: 'Subscription ID, token, sessionToken, and planId are required' });
        }

        const newSubscription = {
            subscription_id: subscription.id,
            user_id: new ObjectId(decoded.id), // Usa el ID del usuario decodificado
            type_plan: planId,
            status: 'active',
            createdAt: new Date(),
            updatedAt: new Date(),
        };
        const savesSubscription = await subscriptionService.createSubscription(newSubscription);
        // Verifica si la suscripción se guardó correctamente
        if (!savesSubscription.acknowledged) {
            return res.status(500).json({ error: 'Failed to save subscription' });
        }
        const approvalLink = subscription.links.find(link => link.rel === 'approve').href;

        return res.status(200).json({
            success: true,
            approval_url: approvalLink
        });

    } catch (error) {
        console.error('Error creating subscription:', error.message);
        res.status(500).json({
            error: 'Internal server error while creating PayPal subscription',
            details: error.message
        });
    }
};
export const cancelSubscription = async (req, res) => {
    try {
        // 1. Verificar el token de sesión
        const sessionToken = req.cookies["sessionToken"];
        const decoded = jwt.verify(sessionToken, process.env.JWT_SECRET);
        if (!decoded) {
            return res.status(401).json({ error: 'Invalid session token' });
        }

        // 2. Obtener la suscripción del usuario
        const sus = await subscriptionService.getSuscription(decoded.id);
        console.log(sus)
        if (!sus || !sus.subscription_id) {
            return res.status(404).json({ error: 'No se encontró la suscripción' });
        }

        // 3. Obtener el token de acceso de PayPal
        const accessToken = await getPayPalAccessToken();
        if (!accessToken) {
            return res.status(500).json({ error: 'No se pudo obtener el token de acceso de PayPal' });
        }

        // 4. Cancelar la suscripción en PayPal
        const cancelResponse = await cancelPayPalSubscription(sus.subscription_id, accessToken);
        //eliminar de mongo 
        // 5. Manejar la respuesta de la cancelación
        if (cancelResponse.status === 204) {
            return res.status(200).json({ message: 'La suscripción fue cancelada exitosamente' });
        } else {
            return res.status(400).json({ error: 'Error al cancelar la suscripción' });
        }

    } catch (error) {
        console.error('Error al cancelar la suscripción:', error);
        return res.status(500).json({ error: 'Ocurrió un error al cancelar la suscripción' });
    }
};

// Función para obtener el token de acceso de PayPal
const getPayPalAccessToken = async () => {
    try {
        const paypalClient = new PayPalClient();
        const accessToken = await paypalClient.getAccessToken();
        return accessToken;
    } catch (error) {
        console.error('Error obteniendo el token de acceso de PayPal:', error);
        return null;
    }
};

// Función para cancelar la suscripción de PayPal
const cancelPayPalSubscription = async (subscriptionId, accessToken) => {
    try {
        const response = await axios.post(
            `https://api-m.sandbox.paypal.com/v1/billing/subscriptions/${subscriptionId}/cancel`,
            {
                "reason": "Cancelación automática por el usuario"
            }, // No es necesario enviar datos en el cuerpo para la cancelación
            {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                },
            }
        );
        return response;
    } catch (error) {
        console.error(`Error al cancelar la suscripción ${subscriptionId}:`, error.response ? error.response.data : error);
        throw error;
    }
};


