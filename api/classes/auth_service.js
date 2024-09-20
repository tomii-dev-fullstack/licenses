import { clientDB } from "../../lib/database.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

class AuthService {
    constructor() {
        this.collection = clientDB.db("mercado").collection('user'); // Nombre de la colección de usuarios
    }

    // Registro de nuevo usuario
    async register(userData) {
        const { email, password, name } = userData;

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
    }

    // Iniciar sesión
    async login(email, /* password */) {
        // Buscar usuario por email
        const user = await this.collection.findOne({ email: email });
        if (!user) throw new Error('Usuario no encontrado');
        console.log(user)
        // Comparar contraseñas
        /*   const validPassword = await bcrypt.compare(password, user.password);
          if (!validPassword) throw new Error('Contraseña incorrecta'); */

        // Generar y retornar el token JWT
        const sessionToken = jwt.sign(
            { id: user._id, email: user.email, published_products: user.published_products },
            process.env.JWT_SECRET,
            { expiresIn: '30d' } // El token expirará en 30 días
        );

        return { sessionToken };
    }

}

export default AuthService;
