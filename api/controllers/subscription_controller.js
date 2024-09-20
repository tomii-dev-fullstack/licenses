import jwt from "jsonwebtoken"
import SubscriptionService from '../classes/subscription_service.js';
import PayPalClient from "../paypal/paypal.js"
import { ObjectId } from "mongodb";
const subscriptionService = new SubscriptionService();

// Registro de usuario
export const captureSubscription = async (req, res) => {
    try {
        const { subscription_id, token, planId } = req.body; // Extrae subscription_id, token, planId del body
        const sessionToken = req.cookies["sessionToken"]; // Accede directamente a la cookie "sessionToken"

        // Valida que todos los parámetros estén presentes
        if (!subscription_id || !token || !sessionToken || !planId) {
            return res.status(400).json({ error: 'Subscription ID, token, sessionToken, and planId are required' });
        }



        // Decodifica el token JWT
        let decoded;
        try {
            decoded = jwt.verify(sessionToken, process.env.JWT_SECRET); // Verifica el token
        } catch (error) {
            return res.status(401).json({ error: 'Invalid session token' });
        }

        // Determina el tipo de cuenta según el plan seleccionado
        let accountType;
        if (planId === 'plan-id-free') {
            accountType = 'free';
        } else if (planId === 'plan-id-small') {
            accountType = 'small_business';
        } else if (planId === 'plan-id-large') {
            accountType = 'enterprise';
        }

        // Crea el objeto de suscripción
        const newSubscription = {
            userId: new ObjectId(decoded.id), // Usa el ID del usuario decodificado
            planId: planId,
            status: 'active',
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        // Inserta la suscripción en la base de datos
        const savesSubscription = await subscriptionService.createSubscription(newSubscription);

        // Verifica si la suscripción se guardó correctamente
        if (!savesSubscription.acknowledged) {
            return res.status(500).json({ error: 'Failed to save subscription' });
        }

        console.log('Suscripción capturada y tipo de cuenta actualizado:', savesSubscription);

        // Responde con éxito y el ID de la suscripción
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
    console.log(planId, price)
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

        // Paso 4: Obtener el link de aprobación
        console.log(subscription)
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
