import jwt from 'jsonwebtoken';

// Middleware de autenticación
 const authenticate = (req, res, next) => {
    const token = req.headers['sessionToken'];

    if (!token) {
        return res.status(401).json({ message: 'Acceso no autorizado. Token no proporcionado.' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET); // Verificación del token
        req.user = decoded; // Asignar la información decodificada del token a req.user
        next(); // Continuar con la solicitud
    } catch (error) {
        console.error('Error en la autenticación:', error);
        res.status(401).json({ message: 'Token inválido o expirado' });
    }
};

export default authenticate