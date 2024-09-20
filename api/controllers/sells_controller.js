import { auth } from '../../firebase.js'; // Importar configuración de Firebase
import SellService from '../classes/sell_service.js';

const sellService = new SellService();

// Registro de usuario
export const getSells = async (req, res) => {
    try {

        const { id } = req.params;
        // Verifica si el ID fue proporcionado
        if (!id) {
            return res.status(400).json({ success: 400, message: 'ID is required' });
        }
        const sells = await sellService.getSells(id);
        console.log(sells);
        if (sells.length > 0) {
            console.log(sells)
            return res.status(200).json({ data: sells });
        } else {
            return res.status(404).json({ message: "No purchases found for the user" });
        }
    } catch (error) {

        res.status(400).json({ message: 'Error al obtener compras' });
    }
};

// Inicio de sesión

/* export const createPurchase = async (req, res) => {

    try {
        const { token } = req.body;
        if (!token) {
            return res.status(400).json({ message: 'Token no proporcionado' });
        }

        // Verificar el token con Firebase
        const decodedToken = await auth.verifyIdToken(token);
        const userEmail = decodedToken.email;

        // Llamar al método de inicio de sesión del servicio de autenticación
        const { sessionToken: sessionToken } = await purchaseService.(userEmail);
        console.log(sessionToken)
        if (!sessionToken) {
            return res.status(401).json({ message: 'Credenciales inválidas' });
        }

        // Crear el token de sesión
        res.cookie('sessionToken', sessionToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production', // Solo en HTTPS en producción
            sameSite: 'Strict', // Cambiar a 'None' en producción si usas cookies cross-site
            maxAge: 24 * 60 * 60 * 1000 // 1 día de vida útil
        });
        return res.status(200).json({ message: 'Login exitoso' });

    } catch (error) {
        console.error('Error al iniciar sesión:', error);
        res.status(401).json({ message: 'Credenciales inválidas' });
    }
}; */

