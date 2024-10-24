import AuthService from '../classes/auth_service.js'; // Importación con ES Modules
import jwt from 'jsonwebtoken'; // Asegúrate de instalar jsonwebtoken
import UserService from '../classes/user_service.js';
import bcrypt from 'bcrypt';  // Importar bcrypt
// Crear instancia del servicio de autenticación
const authService = new AuthService();
const userService = new UserService();
import { uploadFileServiceToS3, uploadFileToS3 } from "../s3/s3.js"
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

            return res.status(200).json({ data: products, message: "No se encontraron productos" });
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
        const { email, password } = req.body;

        // Verificar si se recibieron los datos necesarios
        if (!email || !password) {
            return res.status(400).json({ message: 'Correo y contraseña son requeridos' });
        }
        // Buscar al usuario por correo electrónico en la base de datos
        const user = await userService.getUserById(email);  // Supongamos que esta función obtiene el usuario

        if (!user) {
            return res.status(401).json({ message: 'Usuario no encontrado' });
        }

        // Comparar la contraseña proporcionada con la almacenada usando bcrypt
        const isPasswordValid = await bcrypt.compare(password, user[0].password);
        if (!isPasswordValid) {
            return res.status(401).json({ message: 'Credenciales inválidas' });
        }

        // Crear el token de sesión (puedes usar JWT u otro mecanismo)
        const sessionToken = jwt.sign(
            {
                id: user[0]._id,
                email: user[0].email,

                /*      nombre: user.nombre, */
                // Puedes agregar más datos aquí si es necesario
            },
            process.env.JWT_SECRET, // Asegúrate de tener una clave secreta en tu archivo .env
            {
                expiresIn: '30d', // El token expirará en 1 día
            }
        );
        console.log(user);
        // Configurar la cookie del token de sesión
        res.cookie('sessionToken', sessionToken, {
            httpOnly: false,
            secure: true,
            sameSite: "None",
            maxAge: 30 * 24 * 60 * 60 * 1000
        });

        // Respuesta exitosa
        return res.status(200).json({ message: 'Login exitoso', user: user });

    } catch (error) {
        console.error('Error al iniciar sesión:', error);
        return res.status(500).json({ message: 'Error interno del servidor' });
    }
};

// Obtener perfil del usuario autenticado
export const getProfile = async (req, res) => {
    try {
        const token = req.cookies?.sessionToken;
        if (!token) {
            return res.status(401).json({ error: 'No autorizado' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await userService.getUserById(decoded.email)
        console.log(user)
        if (user) {
            // En este punto, `req.user` contiene los datos del usuario autenticado
            // Puedes usarlo para mostrar o procesar los datos del usuario
            // Por ejemplo, si deseas mostrar su nombre en la vista:
            // res.send(`Hola, ${req.user.nombre}!`);
            return res.status(200).json({ data: user });
        }
        else {
            return res.status(404).json({ message: "No se encontró el usuario" });
        }
    } catch (error) {
        console.error('Error al obtener el perfil:', error);
        res.status(500).json({ message: 'Error al obtener el perfil del usuario' });
    }
};
export const getClients = async (req, res) => {
    try {
        const token = req.cookies?.sessionToken;
        if (!token) {
            return res.status(401).json({ error: 'No autorizado' });
        }
        const decoded = jwt.verify(token, process.env.JWT_SECRET);


        // Realiza el aggregate para encontrar las compras del usuario
        const clients = await userService.getClients(decoded.id)
        if (clients) {
            res.status(200).json({ data: clients });
        } else {
            res.status(404).json({ message: "error al crear transaccion" });
        }
    } catch (error) {
        console.error('Error al obtener los items:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
export const postRequestModuleUser = async (req, res) => {
    try {
        const { module } = req.body
        const token = req.cookies?.sessionToken;
        if (!token) {
            return res.status(401).json({ error: 'No autorizado' });
        }
        if (!module) {
            return res.status(400).json({ message: 'Se requiere el modulo a solicitar.' });
        }
        const decoded = jwt.verify(token, process.env.JWT_SECRET);


        // Realiza el aggregate para encontrar las compras del usuario
        const moduleAdded = await userService.requestModuleUser(decoded.id, module)
        if (moduleAdded) {
            res.status(200).json({ data: moduleAdded });
        } else {
            res.status(404).json({ message: "error al solicitar modulo" });
        }
    } catch (error) {
        console.error('Error al solicitar modulos:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
export const removeModuleUser = async (req, res) => {
    try {
        const { module } = req.body
        const token = req.cookies?.sessionToken;
        if (!token) {
            return res.status(401).json({ error: 'No autorizado' });
        }
        if (!module) {
            return res.status(400).json({ message: 'Se requiere el modulo a solicitar.' });
        }
        const decoded = jwt.verify(token, process.env.JWT_SECRET);


        // Realiza el aggregate para encontrar las compras del usuario
        const moduleAdded = await userService.removeModuleUser(decoded.id, module)
        if (moduleAdded) {
            res.status(200).json({ data: moduleAdded });
        } else {
            res.status(404).json({ message: "error al eliminar modulo" });
        }
    } catch (error) {
        console.error('Error al eliminar modulos:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
export const updateServiceDescription = async (req, res) => {
    try {
        const { service_description } = req.body
        const token = req.cookies?.sessionToken;
        if (!token) {
            return res.status(401).json({ error: 'No autorizado' });
        }
        if (!service_description) {
            return res.status(400).json({ message: 'Se requiere la desc a actualizar.' });
        }
        const decoded = jwt.verify(token, process.env.JWT_SECRET);


        // Realiza el aggregate para encontrar las compras del usuario
        const descriptionUpdated = await userService.updateServiceDescription(decoded.id, service_description)
        if (descriptionUpdated) {
            res.status(200).json({ data: descriptionUpdated });
        } else {
            res.status(404).json({ message: "error al eliminar modulo" });
        }
    } catch (error) {
        console.error('Error al eliminar modulos:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
export const updateServiceData = async (req, res) => {
    try {
        const { service_experience, service_name } = req.body
        const service_picture = req.file
        console.log(service_picture, service_experience, service_name)
        const token = req.cookies?.sessionToken;
        if (!token) {
            return res.status(401).json({ error: 'No autorizado' });
        }
        /*   if (!service_picture || !service_experience || !service_name) {
              return res.status(400).json({ message: 'Se requiere la desc a actualizar.' });
          } */
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const data = {
            service_experience: service_experience,
            service_name: service_name,
            service_picture: service_picture.originalname
        }

        // Realiza el aggregate para encontrar las compras del usuario
        const dataUpdated = await userService.updateServiceData(decoded.id, data)
        if (dataUpdated.acknowledged === true) {
            await uploadFileServiceToS3(service_picture, decoded.id, data.service_name)
        }
        if (dataUpdated) {
            res.status(200).json({ data: dataUpdated });
        } else {
            res.status(404).json({ message: "error al actualizar datos" });
        }
    } catch (error) {
        console.error('Error al actualizar datos:', error);
        res.status(500).json({ message: 'Internal server error' });
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
export const postClient = async (req, res) => {
    try {
        const token = req.cookies?.sessionToken;
        const { name, email, gender, city, phone } = req.body
        if (!token) {
            return res.status(401).json({ error: 'No autorizado' });
        }

        console.log(token);
        // Decodificar el token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const client = {

            /*   nombre: title, */
            cliente: uid(),
            nombre: name,
            correo: email,
            teléfono: phone,
            género: gender,
            ciudad: city,

        }

        // Realiza el aggregate para encontrar las compras del usuario
        const inserted = await userService.postClient(decoded.id, client)
        if (inserted) {
            res.status(200).json({ data: inserted });
        } else {
            res.status(404).json({ message: "error al crear transaccion" });
        }
    } catch (error) {
        console.error('Error al obtener los items:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
