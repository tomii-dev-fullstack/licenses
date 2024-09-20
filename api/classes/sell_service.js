import { clientDB } from "../../lib/database.js";
import jwt from "jsonwebtoken";
import { ObjectId } from "mongodb";

class SellService {
    constructor() {
        this.collection = clientDB.db("mercado").collection('order'); // Nombre de la colección de usuarios
    }

    // Registro de nuevo usuario
    /*     async createPurchase(purchaseData) {
            const { email, password, name } = purchaseData;
    
            // Verificar si el usuario ya existe
            const existingUser = await this.collection.findOne({ email });
            if (existingUser) throw new Error('Usuario ya registrado con este email');
    
            // Hashear la contraseña antes de guardarla
            const hashedPassword = await bcrypt.hash(password, 10);
    
            // Crear nuevo usuario
            const user = {
                email,
                password: hashedPassword,
                name,
                createdAt: new Date(),
            };
    
            // Guardar el usuario en la base de datos
            await this.collection.insertOne(user);
    
            // Generar y retornar el token JWT
            const token = jwt.sign(
                { email: user.email },
                process.env.JWT_SECRET,
                { expiresIn: '30d' } // El token expirará en 30 días
            );
    
            return { token };
        } */

    // Iniciar sesión
    async getSells(id) {
        // Buscar usuario por email
        const sells = await this.collection.aggregate([
            {
                // Despliega los documentos que tienen un 'cart' con al menos un elemento
                $match: {
                    "cart.user_product": new ObjectId(id),
                }
            }
        ]).toArray();
        if (!sells) throw new Error('Compras no encontradas');

        return sells
    }
}

export default SellService;
