import { auth } from '../../firebase.js'; // Importar configuración de Firebase
import AuthService from '../classes/auth_service.js'; // Importación con ES Modules
import jwt from 'jsonwebtoken'; // Asegúrate de instalar jsonwebtoken
import UserService from '../classes/user_service.js';

// Crear instancia del servicio de autenticación
const authService = new AuthService();
const userService = new UserService();

// Registro de usuario
export const register = async (req, res) => {
    try {
        const token = await authService.register(req.body);
        res.status(201).json({ token });
    } catch (error) {
        console.error('Error al registrar usuario:', error);
        res.status(400).json({ message: 'Error al registrar usuario' });
    }
};

// Inicio de sesión
export const checkAuth = async (req, res) => {
    const token = req.cookies;
    console.log(token);

    if (!token) {
        return res.status(401).json({ error: 'No autorizado' });
    }

    try {
        const decoded = jwt.verify(token.sessionToken, process.env.JWT_SECRET);
        res.status(200).json({
            user: {
                id: decoded.id,
                email: decoded.email,
                published_products: decoded.published_products
            }
        });
    } catch (error) {
        console.error('Error verifying token:', error);
        res.status(401).json({ error: 'No autorizado' });
    }
}
export const logout = async (req, res) => {
    res.clearCookie('sessionToken', {
        httpOnly: true,
        secure: true,
        sameSite: 'strict'// pasar a otro val en prod
    });

    // Responde con un mensaje de éxito
    res.status(200).json({ message: 'Logout exitoso' });
}
export const getAllProductsById = async (req, res) => {

    try {
        const { id } = req.params;
        if (!id) {
            return res.status(400).json({ message: 'Se requiere el ID del usuario.' });
        }

        const products = await userService.getAllProductsByUser(id);
        console.log(products)   
        if (products.length > 0) {

            return res.status(200).json({ data: products,message: "No se encontraron productos" });
        } else {

            // Si no hay productos, devolver 404 (no encontrado)
            return res.status(404).json({ message: "No se encontraron productos para este usuario." });
        }

    } catch (error) {
        console.error('Error al obtener los productos:', error);
        res.status(500).json({ message: 'Error al obtener los productos' });
    }
};


export const login = async (req, res) => {

    try {
        const { token } = req.body;
        if (!token) {
            return res.status(400).json({ message: 'Token no proporcionado' });
        }

        // Verificar el token con Firebase
        const decodedToken = await auth.verifyIdToken(token);
        const userEmail = decodedToken.email;

        // Llamar al método de inicio de sesión del servicio de autenticación
        const { sessionToken: sessionToken } = await authService.login(userEmail);
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
};

// Obtener perfil del usuario autenticado
export const getProfile = async (req, res) => {
    try {
        res.status(200).json(req.user); // Asegúrate que `req.user` viene del middleware JWT
    } catch (error) {
        console.error('Error al obtener el perfil:', error);
        res.status(500).json({ message: 'Error al obtener el perfil del usuario' });
    }
};

// Actualizar perfil del usuario autenticado
export const updateProfile = async (req, res) => {
    try {
        const updatedUser = await authService.updateUser(req.user.id, req.body); // `req.user.id` asume que el middleware JWT asigna `req.user`
        res.status(200).json(updatedUser);
    } catch (error) {
        console.error('Error al actualizar el perfil:', error);
        res.status(500).json({ message: 'Error al actualizar el perfil' });
    }
};
