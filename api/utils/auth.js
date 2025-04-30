import jwt from 'jsonwebtoken';

export const authenticateToken = (req, res, next) => {
  const token = req.cookies?.token;

  if (!token) {
    return res.status(401).json({ success: false, message: 'Token no encontrado' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'clave-secreta');
    req.user = decoded; // guardás el payload en req.user
    next();
  } catch (error) {
    console.error("Token inválido:", error);
    return res.status(403).json({ success: false, message: 'Token inválido' });
  }
};
