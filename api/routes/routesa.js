import { application, Router } from "express";
import { clientDB } from "../../lib/database.js";
import { ObjectId } from "mongodb";
import { auth } from '../../firebase.js';
import cors from "cors"
import { uploadFileToS3 } from "../s3/s3.js";
import { send } from "../nodemailer/config.js"
import jwt from "jsonwebtoken"
import bcrypt from "bcrypt"
import { Payment, MercadoPagoConfig, Preference } from "mercadopago"
import multer from "multer";
import path from "path";
import { ALLOWED_ORIGIN } from "./lib/apis.js"
import PayPalClient from "../paypal/paypal.js"

const { PAYPAL_CLIENT_ID, PAYPAL_CLIENT_SECRET } = process.env;
const base = "https://api-m.sandbox.paypal.com";
/* import { calculateMatch } from "../match.js"
import { calculateMatchByUserByJob } from "../objet-match.js"; */
const router = Router()
const client = new MercadoPagoConfig({
    accessToken: "TEST-5387852327876700-073110-755bd3bd40e2672d39bea5dad3cfbbec-360175350",

})



const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'api/uploads/');  // Carpeta donde se guardarán los archivos
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));  // Nombre único para evitar colisiones
    }
});
const upload = multer({ storage });


router.post("/api/purchase", (req, res) => {
    try {
        const preference = new Preference(client);
        preference.create({
            body: {
                items: req.body.items


            }
        })
            .then(preference => res.json({
                status: 200,
                message: 'La compra fue realizada con éxito!',
                data: preference
            }))
            .catch(console.log);
    } catch (error) {
        console.error(error);
        throw new Error("Error al crear la preferencia de Mercado Pago");
    }


})




router.get('/api/queries', cors(), async (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 's-max-age=1, stale-while-revalidate');
    res.setHeader('Access-Control-Allow-Origin', ALLOWED_ORIGIN);
    res.setHeader('Access-Control-Allow-Credentials', "true");
    const { productId } = req.query;  // Obtener el productId de los query params
    console.log("parametro: " + productId)
    // Validar que el productId esté presente
    if (!productId) {
        return res.status(400).json({ message: 'El ID del producto es requerido.' });
    }

    try {
        // Conectarse a la base de datos y buscar los comentarios por productId
        await clientDB.connect();

        // Realizar la búsqueda de comentarios
        const comments = await clientDB.db("mercado").collection("comment").find({ product_id: new ObjectId(productId) }).toArray();

        // Convertir el cursor a un array
        /*         const comments = await commentsCursor.toArray(); */
        console.log(comments);
        // Verificar si hay comentarios para ese productId
        if (comments.length === 0) {
            await clientDB.close(); // Cerrar la conexión antes de devolver la respuesta
            return res.status(404).json({ message: 'No se encontraron comentarios para este producto.' });
        }

        // Devolver los comentarios encontrados
        /*    await clientDB.close(); // Cerrar la conexión antes de devolver la respuesta */
        return res.status(200).json({ data: comments });

    } catch (error) {
        await clientDB.close(); // Asegurarse de cerrar la conexión en caso de error
        console.error('Error al obtener los comentarios de la publicacion:', error);
        return res.status(500).json({ message: 'Error al obtener los comentarios.' });
    }


});
router.get('/api/all_queries/:id', cors(), async (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 's-max-age=1, stale-while-revalidate');
    res.setHeader('Access-Control-Allow-Origin', ALLOWED_ORIGIN);
    res.setHeader('Access-Control-Allow-Credentials', "true");

    try {
        const { id } = req.params
        if (!id) {
            return res.status(400).json({ message: 'El ID es requerido.' });
        }
        // Conectarse a la base de datos
        await clientDB.connect();

        // Realizar la búsqueda de comentarios en la colección
        const comments = await clientDB.db("mercado").collection("comment").find({ product_owner_id: new ObjectId(id) }).toArray();

        // Verificar si se encontraron comentarios
        if (comments.length === 0) {
            return res.status(404).json({ message: 'No se encontraron comentarios para este producto.' });
        }
        console.log("querys por prop:" + comments)
        // Devolver los comentarios encontrados
        return res.status(200).json({ data: comments });

    } catch (error) {
        console.error('Error al obtener los comentarios:', error);
        return res.status(500).json({ message: 'Error al obtener los comentarios.' });

    }/*  finally {
      // Asegurarse de cerrar la conexión a la base de datos
      await clientDB.close();
    } */
});

















router.post('/api/reply', cors(), async (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 's-max-age=1, stale-while-revalidate');
    res.setHeader('Access-Control-Allow-Origin', /* 'https://opawork.vercel.app' */ ALLOWED_ORIGIN);
    res.setHeader('Access-Control-Allow-Credentials', "true");
    const { reply } = req.body;
    console.log(reply)
    // Validar manualmente los campos
    if (!reply) {
        return res.status(400).json({ message: 'DATOS REQUERIDOS' });
    }


    try {
        await clientDB.connect();
        // Crear un nuevo comentario
        /*        const newComment = {
                   product_reply_id: new ObjectId(reply.product_reply_id),
                   user_reply_id: new ObjectId(reply.user_reply_id),
                   reply: reply.text,
                   timestamp: new Date(reply.timestamp),  // Asegurarse de que sea un objeto Date válido
               };
        */
        // Guardar el comentario en la base de datos
        ;
        const result = await clientDB.db("mercado").collection("comment").updateOne(
            { _id: new ObjectId(reply.id_reply_comment) }, // Filtro de búsqueda
            { $set: { reply: { text: reply.text, user_owner_id: new ObjectId(reply.user_owner_id), timestamp: reply.timestamp, answered: true } } } // Actualización de la réplica completa
        );

        // Responder con el comentario recién creado y el ID generado
        return res.status(201).json({ data: result });
    } catch (error) {
        console.error('Error al guardar el comentario:', error);
        res.status(500).json({ message: 'Error al guardar el comentario.' });
    }
});






router.get('/api/products', cors(), async (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 's-max-age=1, stale-while-revalidate');
    res.setHeader('Access-Control-Allow-Origin', ALLOWED_ORIGIN);
    res.setHeader('Access-Control-Allow-Credentials', "true");

    const { query } = req.query;  // Obtener la query de los query params
    console.log("Parámetro de búsqueda: " + query);

    // Validar que la query esté presente
    if (!query) {
        return res.status(400).json({ message: 'La query es requerida.' });
    }

    try {
        // Conectarse a la base de datos
        await clientDB.connect();

        // Realizar la búsqueda en la colección 'product' por título de producto o nombre de tienda
        const products = await clientDB.db("mercado").collection("product").find({
            $or: [
                { title: { $regex: query, $options: 'i' } },  // Búsqueda insensible a mayúsculas en el título del producto
                { store_name: { $regex: query, $options: 'i' } }
            ]
        }).toArray();

        // Verificar si se encontraron productos
        if (products.length === 0) {
            /*   await clientDB.close(); */ // Cerrar la conexión antes de devolver la respuesta
            return res.status(404).json({ message: 'No se encontraron productos o tiendas que coincidan con la búsqueda.' });
        }
        console.log(products)
        // Devolver los productos encontrados
      /*   await clientDB.close() */; // Cerrar la conexión antes de devolver la respuesta
        res.status(200).json({ data: products });

    } catch (error) {
        /*     await clientDB.close(); */ // Asegurarse de cerrar la conexión en caso de error
        console.error('Error al buscar productos:', error);
        return res.status(500).json({ message: 'Error al buscar productos.' });
    }
});







































// Ruta para crear un nuevo comentario
router.post('/api/queries', cors(), async (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 's-max-age=1, stale-while-revalidate');
    res.setHeader('Access-Control-Allow-Origin', /* 'https://opawork.vercel.app' */ ALLOWED_ORIGIN);
    res.setHeader('Access-Control-Allow-Credentials', "true");
    const { newQueryObject } = req.body;
    console.log(newQueryObject)
    // Validar manualmente los campos
    if (!newQueryObject) {
        return res.status(400).json({ message: 'El ID del producto es requerido y debe ser una cadena de texto.' });
    }


    try {
        await clientDB.connect();
        // Crear un nuevo comentario
        const newComment = {
            product_id: new ObjectId(newQueryObject.product_id),
            user_id: new ObjectId(newQueryObject.user_id),
            user_name: newQueryObject.user_name,
            text: newQueryObject.text,
            reply: {
                answered: false,
            },
            timestamp: new Date(newQueryObject.timestamp),  // Asegurarse de que sea un objeto Date válido
        };

        // Guardar el comentario en la base de datos
        ;
        const result = await clientDB.db("mercado").collection("comment").insertOne(newComment);

        // Responder con el comentario recién creado y el ID generado
        return res.status(201).json({ data: result });
    } catch (error) {
        console.error('Error al guardar el comentario:', error);
        res.status(500).json({ message: 'Error al guardar el comentario.' });
    }
});




router.get("/", async (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 's-max-age=1, stale-while-revalidate');
    res.setHeader('Access-Control-Allow-Origin', /* 'https://opawork.vercel.app' */ ALLOWED_ORIGIN);
    res.setHeader('Access-Control-Allow-Credentials', "true");

    try {
        // Conectamos a la base de datos
        await clientDB.connect();

        // Ejecutamos la consulta con agregaciones
        const data = await clientDB.db("mercado").collection("product").aggregate([
            {
                $lookup: {
                    from: "user",
                    localField: "user_id",
                    foreignField: "_id",
                    as: "user_details"
                }
            },
            {
                $unwind: "$user_details"
            }
        ]).toArray();



        // Comprobamos si hay datos
        if (data.length > 0) {
            console.log(data)
            return res.status(200).json({ data: data });
        } else {
            // Enviar respuesta con un estado 204 si no se encontraron productos
            return res.status(204).json({ message: "No se encontraron productos." });
        }

    } catch (error) {
        // Manejamos el error y lo registramos
        console.error('Error:', error);
        res.status(500).json({
            message: 'Ocurrió un error procesando tu solicitud',
            error: error.message
        });
    } finally {
        // Cerramos la conexión de manera segura
        /*   if (clientDB) {
              clientDB.close();
          } */
    }
});



router.get("/api/user_store/:id",cors(), async (req, res) => {
    // Definir las cabeceras
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 's-max-age=1, stale-while-revalidate');
    res.setHeader('Access-Control-Allow-Origin', ALLOWED_ORIGIN);  // Usar una constante o variable de entorno para el origen permitido


    try {
        const { id } = req.params;

        // Verificar que se haya proporcionado un ID
        if (!id) {
            return res.status(400).json({ message: 'Se requiere el ID del usuario.' });
        }

        // Conectar a la base de datos
        await clientDB.connect();

        // Ejecutar la consulta con agregaciones
        const data = await clientDB.db("mercado").collection("user").aggregate([
            {
                $match: {
                    _id: new ObjectId(id),  // Buscar al usuario por ID
                }
            },
            {
                $lookup: {
                    from: "product",  // Conectar con la colección de productos
                    localField: "_id",  // El campo en la colección de usuario
                    foreignField: "user_id",  // El campo en la colección de productos que referencia al usuario
                    as: "product_details"  // Los productos se almacenan en el campo `product_details`
                }
            }
        ]).toArray();

        // Verificar si hay datos y enviar la respuesta
        if (data.length > 0) {
            await clientDB.close();
            return res.status(200).json({ data: data });
        } else {
            await clientDB.close();
            // Si no hay productos, devolver 404 (no encontrado)
            return res.status(404).json({ message: "No se encontraron productos para este usuario." });
        }

    } catch (error) {
        // Manejar los errores y enviar un mensaje de error con código 500
        console.error('Error:', error);
        return res.status(500).json({
            message: 'Ocurrió un error procesando tu solicitud.',
            error: error.message
        });
    }
});






router.get("/api/own_store/:id", async (req, res) => {
    // Definir las cabeceras
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 's-max-age=1, stale-while-revalidate');
    res.setHeader('Access-Control-Allow-Origin', ALLOWED_ORIGIN);  // Usar una constante o variable de entorno para el origen permitido
   /*  res.setHeader('Access-Control-Allow-Credentials', "true");
 */
    try {
        const { id } = req.params;
        console.log(id)
        // Verificar que se haya proporcionado un ID
        if (!id) {
            return res.status(400).json({ message: 'Se requiere el ID del usuario.' });
        }

        // Conectar a la base de datos
        await clientDB.connect();

        // Ejecutar la consulta con agregaciones
        const data = await clientDB.db("mercado").collection("user").aggregate([
            {
                $match: {
                    _id: new ObjectId(id),  // Buscar al usuario por ID
                }
            },
            {
                $lookup: {
                    from: "product",  // Conectar con la colección de productos
                    localField: "_id",  // El campo en la colección de usuario
                    foreignField: "user_id",  // El campo en la colección de productos que referencia al usuario
                    as: "product_details"  // Los productos se almacenan en el campo `product_details`
                }
            }
        ]).toArray();

        // Verificar si hay datos y enviar la respuesta
        if (data.length > 0) {
            await clientDB.close();
            return res.status(200).json({ data: data });
        } else {
            await clientDB.close();
            // Si no hay productos, devolver 404 (no encontrado)
            return res.status(404).json({ message: "No se encontraron productos para este usuario." });
        }

    } catch (error) {
        // Manejar los errores y enviar un mensaje de error con código 500
        console.error('Error:', error);
        return res.status(500).json({
            message: 'Ocurrió un error procesando tu solicitud.',
            error: error.message
        });
    }
});










router.get("/api/:id/:idProduct", cors(), async (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 's-max-age=1, stale-while-revalidate');
    res.setHeader('Access-Control-Allow-Origin', ALLOWED_ORIGIN);
    res.setHeader('Access-Control-Allow-Credentials', "true");

    try {
        const { id, idProduct } = req.params;
        console.log(id, idProduct);

        // Validación mejorada de los parámetros
        if (!id || !idProduct) {
            return res.status(400).json({ message: 'Both id and idProduct are required' });
        }

        await clientDB.connect();

        // Convertir idProduct a ObjectId para la consulta
        const product = await clientDB.db("mercado").collection("product").aggregate([
            {
                $match: {
                    _id: new ObjectId(idProduct) // Filtramos por el product ID
                }
            },
            {
                $lookup: {
                    from: "user", // Nombre de la colección de aplicaciones
                    localField: "user_id", // Campo en la colección de trabajos que coincide con el ObjectId
                    foreignField: "_id", // Campo en la colección de aplicaciones que coincide con el ObjectId del trabajo
                    as: "user_details" // Nombre del array resultante
                }
            },
            {
                $unwind: "$user_details" // Desplazamos los datos del array de aplicaciones
            },
            {
                $lookup: {
                    from: "review", // Nombre de la colección de aplicaciones
                    localField: "_id", // Campo en la colección de trabajos que coincide con el ObjectId
                    foreignField: "product_id", // Campo en la colección de aplicaciones que coincide con el ObjectId del trabajo
                    as: "product_details" // Nombre del array resultante
                }
            }
        ]).toArray();

        console.log(product);

        if (product.length > 0) {
            return res.status(200).json({ data: product });
        } else {
            return res.status(404).json({ message: 'No products found for the given ID' });
        }

    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'An error occurred while processing your request', error: error.message });
    } /* finally {
        // Cerramos la conexión a la base de datos en el bloque `finally`
        clientDB.close();
    } */
});





router.get("/api/edit_product/:id", cors(), async (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 's-max-age=1, stale-while-revalidate');
    res.setHeader('Access-Control-Allow-Origin', ALLOWED_ORIGIN);
    res.setHeader('Access-Control-Allow-Credentials', "true");

    try {
        const { id } = req.params;
        console.log(id);

        // Validación mejorada de los parámetros
        if (!id) {
            return res.status(400).json({ message: 'Both id and idProduct are required' });
        }

        await clientDB.connect();

        // Convertir idProduct a ObjectId para la consulta
        const product = await clientDB.db("mercado").collection("product").aggregate([
            {
                $match: {
                    _id: new ObjectId(id) // Filtramos por el product ID
                }
            },
            {
                $lookup: {
                    from: "user", // Nombre de la colección de aplicaciones
                    localField: "user_id", // Campo en la colección de trabajos que coincide con el ObjectId
                    foreignField: "_id", // Campo en la colección de aplicaciones que coincide con el ObjectId del trabajo
                    as: "user_details" // Nombre del array resultante
                }
            },
            {
                $unwind: "$user_details" // Desplazamos los datos del array de aplicaciones
            },
            {
                $lookup: {
                    from: "review", // Nombre de la colección de aplicaciones
                    localField: "_id", // Campo en la colección de trabajos que coincide con el ObjectId
                    foreignField: "product_id", // Campo en la colección de aplicaciones que coincide con el ObjectId del trabajo
                    as: "product_details" // Nombre del array resultante
                }
            }
        ]).toArray();

        console.log(product);

        if (product.length > 0) {
            return res.status(200).json({ data: product });
        } else {
            return res.status(404).json({ message: 'No products found for the given ID' });
        }

    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'An error occurred while processing your request', error: error.message });
    } /* finally {
        // Cerramos la conexión a la base de datos en el bloque `finally`
        clientDB.close();
    } */
});












router.get('/api/check-auth', cors(), (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', ALLOWED_ORIGIN)
    res.setHeader('Access-Control-Allow-Credentials', "true");
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
});


router.post('/api/logout', (req, res) => {
    // Elimina la cookie de sesión
    res.clearCookie('sessionToken', {
        httpOnly: true,
        secure: true,
        sameSite: 'strict'// pasar a otro val en prod
    });

    // Responde con un mensaje de éxito
    res.status(200).json({ message: 'Logout exitoso' });
});













router.post("/api/login_with_google", cors(), async (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 's-max-age=1, stale-while-revalidate');
    res.setHeader('Access-Control-Allow-Origin', ALLOWED_ORIGIN)
    /*  res.setHeader('Access-Control-Allow-Origin', 'http://localhost:3030'); */
    res.setHeader('Access-Control-Allow-Credentials', "true");

    const { token } = req.body;
    if (!token) {
        return res.status(401).json({ error: 'Token inválido' });
    }

    try {
        // Verificar el token de Google con Firebase Admin
        const decodedToken = await auth.verifyIdToken(token);
        const userEmail = decodedToken.email;

        // Buscar usuario en la base de datos
        await clientDB.connect();
        const user = await clientDB.db("mercado").collection("user").findOne({ email: userEmail });

        if (!user) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        // Generar un JWT personalizado
        const sessionToken = jwt.sign(
            {
                id: user._id,
                email: user.email,
                published_products: user.published_products

                /*      nombre: user.nombre, */
                // Puedes agregar más datos aquí si es necesario
            },
            process.env.JWT_SECRET, // Asegúrate de tener una clave secreta en tu archivo .env
            {
                expiresIn: '30d', // El token expirará en 1 día
            }
        );

        // Configurar la cookie con el token de sesión
        res.cookie('sessionToken', sessionToken, {
            httpOnly: true,

            /*      domain:"https://olamercado.vercel.app", */
            secure: true, // Solo en HTTPS en producción
            sameSite: 'strict', // cambiar a None en produccion
            maxAge: 24 * 60 * 60 * 1000 // 1 día de vida útil
        });

        // No devolvemos datos del usuario, solo confirmamos el login exitoso
        return res.status(200).json({ message: 'Login exitoso' });

    } catch (error) {
        console.error('Error verifying token:', error);
        return res.status(401).json({ error: 'No autorizado' });
    } finally {
        clientDB.close();
    }
});

router.post("/api/upload_product", cors(), upload.array("images", 5), async (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 's-max-age=1, stale-while-revalidate');
    res.setHeader('Access-Control-Allow-Origin', ALLOWED_ORIGIN);

    try {
        await clientDB.connect();  // Conectar a la base de datos

        // Insertar producto en la base de datos
        const added = await clientDB.db("mercado").collection("product").insertOne({
            title: req.body.title,
            description: req.body.description,
            stock: Number(req.body.stock),
            calification: 0,
            reviews: [],
            discount: Number(req.body.discount) || 0,
            /* tags: req.body.tags.split(",") || [], */
            price: req.body.price,
            category: req.body.category,
            sold_count: 0,
            stars: 0,
            created_at: new Date(),
            updated_at: new Date(),
            status: req.body.status || "active",
            shipping_details: {
                shipping_cost: req.body.shipping_cost
            },
            delivery: req.body.delivery,
            condition: req.body.condition,
            warranty: req.body.warranty || "No tiene garantía",
            colors: req.body.colors,
            images: req.files.map(file => file.originalname),  // Guardar la ruta de las imágenes
            user_id: new ObjectId(req.body.user)
        });

        // Subir archivos a S3 de manera asíncrona
        if (added.acknowledged) {

            const uploadPromises = req.files.map(file => uploadFileToS3(file, req.body.user, added.insertedId))
            await Promise.all(uploadPromises);  // Esperar a que todos los archivos se suban
        }

        // Responder con éxito
        res.status(200).json({
            message: 'Producto cargado exitosamente',
            status: 200,
            product_id: added.insertedId
        });
    } catch (error) {
        console.error('Error al cargar el producto:', error);

        // Responder con error
        res.status(500).json({
            message: 'Error al cargar el producto',
            error: error.message,
            status: 500
        });
    } finally {
        // Asegurar que la conexión a la base de datos se cierra
        await clientDB.close();
    }
});























router.post("/api/edit_product/:id", cors(), upload.array("images", 5), async (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 's-max-age=1, stale-while-revalidate');
    res.setHeader('Access-Control-Allow-Origin', ALLOWED_ORIGIN);

    const { id } = req.params;  // Obtener el ID del producto desde la URL

    try {
        await clientDB.connect();  // Conectar a la base de datos

        // Verificar si el producto existe
        const product = await clientDB.db("mercado").collection("product").findOne({ _id: new ObjectId(id) });
        if (!product) {
            return res.status(404).json({
                message: 'Producto no encontrado',
                status: 404
            });
        }

        // Preparar el objeto de actualización
        const updateData = {
            title: req.body.title || product.title,
            description: req.body.description || product.description,
            stock: req.body.stock !== undefined ? Number(req.body.stock) : product.stock,
            discount: req.body.discount !== undefined ? Number(req.body.discount) : product.discount,
            price: req.body.price || product.price,
            category: req.body.category || product.category,
            status: req.body.status || product.status,
            shipping_details: {
                shipping_cost: req.body.shipping_cost || product.shipping_details.shipping_cost
            },

            delivery: req.body.delivery || product.delivery,
            condition: req.body.condition || product.condition,
            warranty: req.body.warranty || product.warranty,
            colors: req.body.colors ? req.body.colors.split(",") : product.colors,
            updated_at: new Date(),
        };

        // Si hay nuevas imágenes, actualizarlas
        if (req.files && req.files.length > 0) {
            updateData.images = req.files.map(file => file.originalname);  // Actualizar con nuevas imágenes
        }

        // Actualizar el producto en la base de datos
        const updated = await clientDB.db("mercado").collection("product").updateOne(
            { _id: new ObjectId(id) },
            { $set: updateData }
        );

        // Verificar si la actualización fue exitosa
        if (updated.modifiedCount === 1) {
            // Subir archivos a S3 de manera asíncrona si hay imágenes nuevas
            if (req.files && req.files.length > 0) {
                const uploadPromises = req.files.map(file => uploadFileToS3(file, req.body.user, id));
                await Promise.all(uploadPromises);  // Esperar a que todos los archivos se suban
            }

            // Responder con éxito
            res.status(200).json({
                message: 'Producto actualizado exitosamente',
                status: 200,
                product_id: id
            });
        } else {
            // Si no se actualizó el producto
            res.status(400).json({
                message: 'No se pudo actualizar el producto',
                status: 400
            });
        }
    } catch (error) {
        console.error('Error al actualizar el producto:', error);

        // Responder con error
        res.status(500).json({
            message: 'Error al actualizar el producto',
            error: error.message,
            status: 500
        });
    } finally {
        // Asegurar que la conexión a la base de datos se cierra
        await clientDB.close();
    }
});

































router.get("/api/match/explorer/:id", cors(), async (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 's-max-age=1, stale-while-revalidate');
    res.setHeader('Access-Control-Allow-Origin', 'https://opawork.vercel.app');
    const { id } = req.params

    try {

        await clientDB.connect();
        console.log(id);

        const jobsBD = await clientDB.db("opawork").collection("job").aggregate([
            {
                $lookup: {
                    from: "application",
                    localField: "_id",
                    foreignField: "job_id",
                    as: "applications"
                }
            },
            {
                $match: {
                    "title": { $regex: id, $options: 'i' } // 'i' para búsqueda insensible a mayúsculas/minúsculas
                }
            },
            {
                $lookup: {
                    from: "user", // Suponiendo que la colección "user" contiene la información de la empresa o empleador
                    localField: "user_id", // Relacionamos el campo user_id del trabajo con el _id del usuario/empresa
                    foreignField: "_id",
                    as: "userInfo"
                }
            },
            {
                $unwind: "$userInfo"
            },
            /*      {
                     $project: {
                         "applications": 0
                     }
                 } */
        ]).toArray();

        /*     const user = await clientDB.db("opawork").collection("user").findOne({ _id: new ObjectId(id) }) */
        /*   console.log(user); */

        /*       const jobs = await clientDB.db("opawork").collection("job").aggregate([
                     {
                         $lookup: {
                             from: "application",
                             localField: "_id",
                             foreignField: "job_id",
                             as: "applications"
                         }
                     },
                     {
                         $match: {
                             "applications.user_id": { $ne: userId } 
                         }
                     },
                     {
                         $project: {
                             applications: 0
                         }
                     }
                 ]).toArray(); 
     */



        if (!jobsBD.length) {
            return res.status(404).json({ error: 'No hay trabajos disponibles' });
        }

        const jobs = jobsBD.map(job => ({
            matchp: "Debes loguearte",
            message: "Exito",
            job: job
        }));
        console.log(jobsBD)
        return res.status(200).json({
            message: 'Búsqueda exitosa',
            jobs: jobs
        });
    } catch (error) {
        console.error('Error al buscar trabajos:', error);
        return res.status(500).json({ error: 'Error interno del servidor' });
    } finally {
        await clientDB.close(); // Cierra la conexión a la base de datos en todos los casos
    }
});
















router.post("/api/upload_profile_image", cors(), async (req, res) => {
    /*     res.setHeader('Content-Type', 'application/json'); */
    res.setHeader('Cache-Control', 's-max-age=1, stale-while-revalidate');
    res.setHeader('Access-Control-Allow-Origin', /* 'https://opawork.vercel.app' */'http://localhost:3000');
    const { image, id } = req.body
    console.log(image, id)
    try {
        if (!image || !id) {
            return res.status(400).json('No hay datos.');
        }
        await clientDB.connect();
        const user = await clientDB.db("opawork").collection("user").findOneAndUpdate(
            { _id: new ObjectId(id) },
            { $set: { photo: image } },
            { returnOriginal: false }
        );


        /*    await uploadFileToS3(req.file) */

        res.json({
            success: 200,
            message: "Archivo subido exitosamente!",
            user: {
                id: user._id,
                name: user.nombre,
                email: user.email,
                photo: user.photo,
                phone: user.phone,
                city: user.city,
                street: user.street,
                country: user.country,
                description: user.description,
                type: user.type
                // Añade otros campos que quieras devolver
            }
        });
    } catch (error) {
        res.status(500).send(error.message);
    }
});
















router.post("/api/update_benefits_user/:id", cors(), async (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 's-max-age=1, stale-while-revalidate');
    res.setHeader('Access-Control-Allow-Origin', 'https://opawork.vercel.app');
    const { benefits_user } = req.body
    const { id } = req.params
    console.log(id, benefits_user)
    try {
        if (!id || !benefits_user) {
            return res.status(400).json({ success: 400, message: 'ID and name are required' });
        }
        await clientDB.connect()
        // Encuentra y actualiza el documento del usuario
        const result = await clientDB.db("opawork").collection("user").updateOne(
            { _id: new ObjectId(id) }, // Filtro para encontrar al usuario
            {
                $push: {
                    benefits: {
                        $each: benefits_user // Agrega cada elemento del array al array existente en la base de datos
                    }
                }
            }
        );


        // Verifica si se realizó una actualización
        if (result.modifiedCount === 0) {
            console.log('No se encontró el documento o el ítem ya no estaba en el array.');
        } else {
            console.log('Ítem agregado correctamente.');
        }
    } catch (error) {
        console.error('Error al eliminar el ítem:', error);
    }
});
;




//contact en ruta 


router.post("/api/update_contact_user/:id", cors(), async (req, res) => {
    /*     res.setHeader('Content-Type', 'application/json'); */
    res.setHeader('Cache-Control', 's-max-age=1, stale-while-revalidate');
    res.setHeader('Access-Control-Allow-Origin', 'https://opawork.vercel.app');
    const { contact_info } = req.body
    const { id } = req.params
    console.log(contact_info)
    try {
        if (!contact_info) {
            return res.status(400).json('No hay datos.');
        }
        await clientDB.connect();
        const user = await clientDB.db("opawork").collection("user").findOneAndUpdate(
            { _id: new ObjectId(id) },
            {
                $set: {
                    contact_info: contact_info // Guarda el array tal cual lo recibes
                }
            },
            { returnDocument: "after" } // Opción para devolver el documento actualizado
        );



        /*    await uploadFileToS3(req.file) */
        if (user) {
            console.log(user)
            res.json({
                success: 200,
                message: "Archivo subido exitosamente!",
                /* user: {
                    id: user._id,
                name: user.nombre,
                description: user.description,
                phone: user.phone,
                email: user.email,
                ciudad: user.city,
                direccion: user.street,
                pais: user.country,
                photo: user.photo,
                type: user.type
                } */
            });
        }
    } catch (error) {
        res.status(500).send(error.message);
    }
});




router.get("/api/get_contact_user/:id", cors(), async (req, res) => {
    /*     res.setHeader('Content-Type', 'application/json'); */
    res.setHeader('Cache-Control', 's-max-age=1, stale-while-revalidate');
    res.setHeader('Access-Control-Allow-Origin', /* 'https://opawork.vercel.app' */'http://localhost:3000');
    const { _id } = req.params
    console.log("iddddd" + _id)
    try {
        if (!_id) {
            return res.status(400).json({ success: 400, message: 'ID and name are required' });
        }
        // Encuentra y actualiza el documento del usuario
        const updatedUser = await clientDB.db("opawork").collection("user").findOne({ _id: new ObjectId(_id) });
        const contact = updatedUser ? updatedUser.contact_info : [];
        console.log(contact)
        // Verifica si se realizó una actualización
        res.status(200).json({ success: 200, contact });
    } catch (error) {
        console.error('Error al obtener el usuario:', error);
    }
});





router.post("/api/update_knoledge_user/:id", cors(), async (req, res) => {
    /*     res.setHeader('Content-Type', 'application/json'); */
    res.setHeader('Cache-Control', 's-max-age=1, stale-while-revalidate');
    res.setHeader('Access-Control-Allow-Origin', 'https://opawork.vercel.app');
    const { knoledge_info } = req.body
    const { id } = req.params
    console.log(knoledge_info)
    try {
        if (!knoledge_info) {
            return res.status(400).json('No hay datos.');
        }
        await clientDB.connect();
        const result = await clientDB.db("opawork").collection("user").updateOne(
            { _id: new ObjectId(id) }, // Filtro para encontrar al usuario
            {
                $push: {
                    knoledge: {
                        $each: knoledge_info // Agrega cada elemento del array al array existente en la base de datos
                    }
                }
            }
        );




        /*    await uploadFileToS3(req.file) */
        if (user) {
            console.log(user)
            res.json({
                success: 200,
                message: "Archivo subido exitosamente!",
                /* user: {
                    id: user._id,
                name: user.nombre,
                description: user.description,
                phone: user.phone,
                email: user.email,
                ciudad: user.city,
                direccion: user.street,
                pais: user.country,
                photo: user.photo,
                type: user.type
                } */
            });
        }
    } catch (error) {
        res.status(500).send(error.message);
    }
});



















router.get("/api/get_description_user/:id", cors(), async (req, res) => {
    /*     res.setHeader('Content-Type', 'application/json'); */
    res.setHeader('Cache-Control', 's-max-age=1, stale-while-revalidate');
    res.setHeader('Access-Control-Allow-Origin', /* 'https://opawork.vercel.app' */'http://localhost:3000');
    const { id } = req.params
    console.log("user: " + id)
    try {
        if (!id) {
            return res.status(400).json({ success: 400, message: 'ID and name are required' });
        }
        await clientDB.connect()
        // Encuentra y actualiza el documento del usuario
        const updatedUser = await clientDB.db("opawork").collection("user").findOne({ _id: new ObjectId(id) });
        const description = updatedUser ? updatedUser.description : [];


        // Verifica si se realizó una actualización
        res.status(200).json({ success: 200, description });
    } catch (error) {
        console.error('Error al obtener los items:', error);
    }
});




router.post("/api/update_personal_about", cors(), async (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 's-max-age=1, stale-while-revalidate');
    res.setHeader('Access-Control-Allow-Origin', 'https://opawork.vercel.app');
    const { about } = req.body
    console.log("descripcion" + about.description, "id" + about.id)
    try {
        if (!about) {
            return res.status(400).json('No hay datos.');
        }
        await clientDB.connect();
        const user = await clientDB.db("opawork").collection("user").updateOne(
            { _id: new ObjectId(about.id) },
            {
                $set: {
                    description: about.description
                }
            }
        );
        console.log(user)
        res.json({
            success: 200,
            message: "Descripción actualizada exitosamente!",
            /*    user: {
                   id: user._id,
                   name: user.nombre,
                   description: user.description,
                   phone: user.phone,
                   email: user.email,
                   ciudad: user.city,
                   direccion: user.street,
                   pais: user.country,
                   photo: user.photo,
                   type: user.type
               } */
        });
    } catch (error) {
        res.status(500).send(error.message);
    }
});



router.post("/api/mark_user-view", async (req, res) => {
    /*     res.setHeader('Content-Type', 'application/json'); */
    res.setHeader('Cache-Control', 's-max-age=1, stale-while-revalidate');
    res.setHeader('Access-Control-Allow-Origin', /* 'https://opawork.vercel.app' */'http://localhost:3000');
    try {
        const { _id } = req.body;

        // Validar los datos de entrada
        if (!_id) {
            return res.status(400).json({ message: '_id is required' });
        }

        // Agregar la postulación al trabajo (esto puede variar según tu modelo)
        /*    await clientDB.db("opawork").collection("job").insertOne({ jobId: "jobId", userId: "userId" })
    */
        // Agregar la postulación al usuario (esto puede variar según tu modelo)
        await clientDB.connect()
        const result = await clientDB.db("opawork").collection("application").updateOne({ _id: new ObjectId(_id) }, { $set: { apply_state: "Visto" } })
        if (result.modifiedCount === 1) {
            return res.status(200).json({
                message: 'El estado de la postulación ha sido actualizado con éxito!',
                success: 200,
            });
        }
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'An error occurred while processing your request', error: error.message });
    }
})











router.post('/api/login_account', cors(), async (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 's-max-age=1, stale-while-revalidate');
    res.setHeader('Access-Control-Allow-Origin', ALLOWED_ORIGIN);
    res.setHeader('Access-Control-Allow-Credentials', "true");
    const { uLogin } = req.body;
    console.log(uLogin)
    try {
        // Verificar si el usuario existe
        await clientDB.connect();


        const user = await clientDB.db("mercado").collection("user").findOne({ email: uLogin.email });
        if (!user) {
            return res.status(400).json({ msg: 'Credenciales inválidas' });
        }

        // Verificar la contraseña
        const isMatch = await bcrypt.compare(uLogin.password, user.password);
        if (!isMatch) {
            return res.status(400).json({ msg: 'Credenciales inválidas' });
        }

        // Crear un token y enviarlo en la respuesta
        const sessionToken = jwt.sign(
            {
                id: user._id,
                email: user.email,

                /*      nombre: user.nombre, */
                // Puedes agregar más datos aquí si es necesario
            },
            process.env.JWT_SECRET, // Asegúrate de tener una clave secreta en tu archivo .env
            {
                expiresIn: '30d', // El token expirará en 1 día
            }
        );

        // Configurar la cookie con el token de sesión
        res.cookie('sessionToken', sessionToken, {
            httpOnly: true,

            /*      domain:"https://olamercado.vercel.app", */
            secure: process.env.NODE_ENV === 'production', // Solo en HTTPS en producción
            sameSite: 'strict', // cambiar a None en produccion
            maxAge: 24 * 60 * 60 * 1000 // 1 día de vida útil
        });

        // No devolvemos datos del usuario, solo confirmamos el login exitoso
        return res.status(200).json({ message: 'Login exitoso' });
    } catch (err) {

        console.error(err.message);
        res.status(500).send('Error en el servidor');
    }
});







router.post('/api/register_account', cors(), async (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 's-max-age=1, stale-while-revalidate');
    res.setHeader('Access-Control-Allow-Origin', ALLOWED_ORIGIN);
    res.setHeader('Access-Control-Allow-Credentials', "true");

    try {
        const { uRegister } = req.body;
        console.log(uRegister)
        // Verificar si el usuario ya está registrado
        await clientDB.connect()
        const existingUser = await clientDB.db("mercado").collection("user").findOne({ email: uRegister.email });
        if (existingUser) {
            return res.status(409).json({ message: 'El usuario ya está registrado' });
        }

        // Hashear la contraseña antes de guardar
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(uRegister.password, salt);

        // Crear el nuevo usuario
        const newUser = {
            email: uRegister.email,
            password: hashedPassword,
            products: [],
            payments_methods: []
        };

        const addUser = await clientDB.db("mercado").collection("user").insertOne(newUser);

        if (addUser.acknowledged) {
            return res.status(201).json({ message: 'Registro exitoso' });
        } else {
            return res.status(500).json({ message: 'Error al crear el usuario' });
        }
    } catch (error) {
        console.error('Error al procesar el registro:', error);
        return res.status(500).json({ message: 'Error en el servidor', error: error.message });
    } finally {
        await clientDB.close();
    }
});





















router.post('/api/register_account_with_google', cors(), async (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 's-max-age=1, stale-while-revalidate');
    res.setHeader('Access-Control-Allow-Origin', ALLOWED_ORIGIN);
    res.setHeader('Access-Control-Allow-Credentials', "true");

    const { credentials } = req.body;

    if (!credentials) {
        return res.status(400).json({ error: 'Credenciales inválidas' });
    }

    try {
        await clientDB.connect();

        // Verificar si el usuario ya existe en la base de datos
        const user = await clientDB.db("mercado").collection("user").findOne({ email: credentials.user.email });

        if (user) {
            return res.status(409).json({ message: 'El usuario ya está registrado' });
        } else {
            // Si el usuario no existe, se registra en la base de datos
            const newUser = {
                email: credentials.user.email,
                name: credentials.user.displayName,
                products: [],
                payments_methods: []
            };

            const addUser = await clientDB.db("mercado").collection("user").insertOne(newUser);

            if (addUser.acknowledged) {
                return res.status(201).json({ message: 'Registro exitoso' });
            } else {
                return res.status(500).json({ message: 'Error al crear el usuario' });
            }
        }

    } catch (error) {
        console.error('Error al procesar el registro:', error);
        return res.status(500).json({ error: 'Error en el servidor' });
    } finally {
        await clientDB.close();
    }
});




router.post("/api/user_sells/:id", cors(), async (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 's-max-age=1, stale-while-revalidate');
    res.setHeader('Access-Control-Allow-Origin', ALLOWED_ORIGIN);
    res.setHeader('Access-Control-Allow-Credentials', "true");


    const { id } = req.params;

    // Verifica si el ID fue proporcionado
    if (!id) {
        return res.status(400).json({ success: 400, message: 'ID is required' });
    }

    // Si el id debería ser un ObjectId, realiza la conversión
    /*     const userId = new ObjectId(id); */

    console.log("User ID: " + id);

    try {
        await clientDB.connect();

        // Realiza el aggregate para encontrar las compras del usuario
        const products = await clientDB.db("mercado").collection("order").aggregate([
            {
                // Despliega los documentos que tienen un 'cart' con al menos un elemento
                $match: {
                    "cart.user_product": new ObjectId(id),
                }
            }
        ]).toArray();

        console.log("Products found: ", products);

        if (products.length > 0) {
            return res.status(200).json({ data: products });
        } else {
            return res.status(404).json({ message: "No purchases found for the user" });
        }
    } catch (error) {
        console.error('Error al obtener los items:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});






router.post("/api/user_purchases/:id", cors(), async (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 's-max-age=1, stale-while-revalidate');
    res.setHeader('Access-Control-Allow-Origin', ALLOWED_ORIGIN);
    res.setHeader('Access-Control-Allow-Credentials', "true");


    const { id } = req.params;

    // Verifica si el ID fue proporcionado
    if (!id) {
        return res.status(400).json({ success: 400, message: 'ID is required' });
    }

    // Si el id debería ser un ObjectId, realiza la conversión
    /*     const userId = new ObjectId(id); */

    console.log("User ID: " + id);

    try {
        await clientDB.connect();

        // Realiza el aggregate para encontrar las compras del usuario
        const products = await clientDB.db("mercado").collection("order").aggregate([
            {
                // Despliega los documentos que tienen un 'cart' con al menos un elemento
                $match: {
                    "cart.userId": new ObjectId(id),
                }
            }
        ]).toArray();

        console.log("Products found: ", products);

        if (products.length > 0) {
            return res.status(200).json({ data: products });
        } else {
            return res.status(404).json({ message: "No purchases found for the user" });
        }
    } catch (error) {
        console.error('Error al obtener los items:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});



router.post("/api/users/chat/:id", cors(), async (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 's-max-age=1, stale-while-revalidate');
    res.setHeader('Access-Control-Allow-Origin', ALLOWED_ORIGIN);
    res.setHeader('Access-Control-Allow-Credentials', "true");


    const { id } = req.params;

    // Verifica si el ID fue proporcionado
    if (!id) {
        return res.status(400).json({ success: 400, message: 'ID is required' });
    }

    // Si el id debería ser un ObjectId, realiza la conversión
    /*     const userId = new ObjectId(id); */

    console.log("User seller ID: " + id);

    try {
        await clientDB.connect();

        // Realiza el aggregate para encontrar las compras del usuario
        const conversation = await clientDB.db("mercado").collection("chat").aggregate([
            {
                // Despliega los documentos que tienen un 'cart' con al menos un elemento
                $match: {
                    "orderId": id
                }
            }
        ]).toArray();

        console.log("Conversation found: ", conversation);

        if (conversation) {
            res.status(200).json({ data: conversation });
        } else {
            res.status(404).json({ message: "No purchases found for the user" });
        }
    } catch (error) {
        console.error('Error al obtener los items:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});


router.post('/api/users/chat/:orderId/send/id_seller/:id_seller', cors(), async (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 's-max-age=1, stale-while-revalidate');
    res.setHeader('Access-Control-Allow-Origin', ALLOWED_ORIGIN);
    res.setHeader('Access-Control-Allow-Credentials', "true");

    const { orderId, id_seller } = req.params;  // Obtener parámetros de la URL
    const { newMsg } = req.body;  // Obtener el mensaje del cuerpo de la petición

    // Validar los datos recibidos
    if (!orderId || !id_seller || !newMsg || !newMsg.sender || !newMsg.content || !newMsg.timestamp) {
        return res.status(400).json({ error: 'Datos incompletos o incorrectos.' });
    }

    // Estructura del mensaje a guardar en la base de datos
    const newMessage = {
        orderId: orderId,
        id_seller: new ObjectId(id_seller),  // Agregar id_seller para tener claridad en el registro
        sender: new ObjectId(newMsg.sender),
        content: newMsg.content,
        timestamp: newMsg.timestamp,
    };

    try {
        // Guardar el mensaje en la base de datos
        await clientDB.db("mercado").collection('chat').insertOne(newMessage);
        return res.status(200).json({ message: 'Mensaje guardado correctamente' });
    } catch (error) {
        console.error('Error al guardar el mensaje:', error);
        return res.status(500).json({ error: 'Error al guardar el mensaje' });
    }
});














































router.post("/api/purchase_detail_order/:id", cors(), async (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 's-max-age=1, stale-while-revalidate');
    res.setHeader('Access-Control-Allow-Origin', ALLOWED_ORIGIN);
    res.setHeader('Access-Control-Allow-Credentials', "true");


    const { id } = req.params;

    // Verifica si el ID fue proporcionado
    if (!id) {
        return res.status(400).json({ success: 400, message: 'ID is required' });
    }

    // Si el id debería ser un ObjectId, realiza la conversión
    /*     const userId = new ObjectId(id); */

    console.log("Uid de orden: " + id);

    try {
        await clientDB.connect();

        // Realiza el aggregate para encontrar las compras del usuario
        const order_detail = await clientDB.db("mercado").collection("order").aggregate([
            {
                // Filtramos la orden por su _id
                $match: {
                    _id: new ObjectId(id),
                },
            },
            /*       {
                 
                      $unwind: "$cart"
                  }, */
            {
                // Realizamos el $lookup para obtener detalles del vendedor desde la colección 'user'
                $lookup: {
                    from: "user",
                    localField: "cart.user_product", // Referencia al usuario del producto
                    foreignField: "_id", // Campo en 'user' que será comparado (el '_id' de usuario)
                    as: "user_product" // El resultado del lookup será almacenado en 'user_product'
                }
            },

            /*       {
                      // Volvemos a agrupar el carrito y los datos de la orden
                      $group: {
                          _id: "$id",
                          cart: { $push: { product: "$cart", seller: "$user_product" } }, // Reagrupar los productos y los datos del vendedor
                  
                         
                      }
                  } */
        ]).toArray();


        console.log("Orden: ", order_detail);

        if (order_detail) {
            res.status(200).json({ data: order_detail });
        } else {
            res.status(404).json({ message: "No purchases found for the user" });
        }
    } catch (error) {
        console.error('Error al obtener los items:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

router.post("/api/sell_detail_order/:id", cors(), async (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 's-max-age=1, stale-while-revalidate');
    res.setHeader('Access-Control-Allow-Origin', ALLOWED_ORIGIN);
    res.setHeader('Access-Control-Allow-Credentials', "true");


    const { id } = req.params;

    // Verifica si el ID fue proporcionado
    if (!id) {
        return res.status(400).json({ success: 400, message: 'ID is required' });
    }

    // Si el id debería ser un ObjectId, realiza la conversión
    /*     const userId = new ObjectId(id); */

    console.log("Uid de orden: " + id);

    try {
        await clientDB.connect();

        // Realiza el aggregate para encontrar las compras del usuario
        const order_detail = await clientDB.db("mercado").collection("order").aggregate([
            {
                // Filtramos la orden por su _id
                $match: {
                    _id: new ObjectId(id),
                },
            },
            /*       {
                 
                      $unwind: "$cart"
                  }, */
            {
                // Realizamos el $lookup para obtener detalles del vendedor desde la colección 'user'
                $lookup: {
                    from: "user",
                    localField: "cart.userId", // Referencia al usuario del producto
                    foreignField: "_id", // Campo en 'user' que será comparado (el '_id' de usuario)
                    as: "userId" // El resultado del lookup será almacenado en 'user_product'
                }
            },

            /*       {
                      // Volvemos a agrupar el carrito y los datos de la orden
                      $group: {
                          _id: "$id",
                          cart: { $push: { product: "$cart", seller: "$user_product" } }, // Reagrupar los productos y los datos del vendedor
                  
                         
                      }
                  } */
        ]).toArray();


        console.log("Orden: ", order_detail);

        if (order_detail) {
            res.status(200).json({ data: order_detail });
        } else {
            res.status(404).json({ message: "No purchases found for the user" });
        }
    } catch (error) {
        console.error('Error al obtener los items:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});


























const generateAccessToken = async () => {
    try {
        if (!PAYPAL_CLIENT_ID || !PAYPAL_CLIENT_SECRET) {
            throw new Error("MISSING_API_CREDENTIALS");
        }
        const auth = Buffer.from(
            PAYPAL_CLIENT_ID + ":" + PAYPAL_CLIENT_SECRET,
        ).toString("base64");
        const response = await fetch(`${base}/v1/oauth2/token`, {
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

/**
 * Generate a client token for rendering the hosted card fields.
 * @see https://developer.paypal.com/docs/checkout/advanced/integrate/#link-integratebackend
 */
const generateClientToken = async () => {
    const accessToken = await generateAccessToken();
    const url = `${base}/v1/identity/generate-token`;
    const response = await fetch(url, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${accessToken}`,
            "Accept-Language": "en_US",
            "Content-Type": "application/json",
        },
    });

    return handleResponse(response);
};

/**
 * Create an order to start the transaction.
 * @see https://developer.paypal.com/docs/api/orders/v2/#orders_create
 */
const createOrder = async (cart) => {
    // use the cart information passed from the front-end to calculate the purchase unit details
    console.log(
        "shopping cart information passed from the frontend createOrder() callback:",
        cart
    );

    const accessToken = await generateAccessToken();
    const url = `${base}/v2/checkout/orders`;

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

/**
 * Capture payment for the created order to complete the transaction.
 * @see https://developer.paypal.com/docs/api/orders/v2/#orders_capture
 */
const captureOrder = async (orderID) => {
    const accessToken = await generateAccessToken();
    const url = `${base}/v2/checkout/orders/${orderID}/capture`;

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
router.post("/api/token", async (req, res) => {
    try {
        const { jsonResponse, httpStatusCode } = await generateClientToken();
        res.status(httpStatusCode).json(jsonResponse);
    } catch (error) {
        console.error("Failed to generate client token:", error);
        res.status(500).send({ error: "Failed to generate client token." });
    }
});

router.post("/api/orders", async (req, res) => {
    try {
        // use the cart information passed from the front-end to calculate the order amount detals
        const { cart } = req.body;
        const { jsonResponse, httpStatusCode } = await createOrder(cart);

        res.status(httpStatusCode).json(jsonResponse);
    } catch (error) {
        console.error("Failed to create order:", error);
        res.status(500).json({ error: "Failed to create order." });
    }
});

router.post("/api/orders/:orderID/capture", async (req, res) => {
    try {
        const { orderID } = req.params;
        const sessionToken = req.cookies["sessionToken"];
        const { jsonResponse, httpStatusCode } = await captureOrder(orderID);

        let decoded = jwt.verify(sessionToken, process.env.JWT_SECRET); // Verifica el token

        await clientDB.connect()
        // Save payment data to MongoDB
        const orderData = await savePaymentToDB(jsonResponse, decoded);
        if (orderData) {
            await clientDB.db("mercado").collection("order").insertOne(orderData);
            res.status(httpStatusCode).json(jsonResponse);
        }
    } catch (error) {
        console.error("Failed to create order:", error);
        res.status(500).json({ error: "Failed to capture order." });
    }
});
router.post("/api/orders/save_products/:id", async (req, res) => {
    try {
        const { id } = req.params; // Este es el ID del usuario
        const { cart } = req.body; // El carrito que llega desde el front-end

        await clientDB.connect();

        // Busca la orden en la base de datos por el id del usuario
        const orderFromDB = await clientDB.db("mercado").collection("order").findOne({ paymentId: id });

        if (!orderFromDB) {
            return res.status(404).json({ error: "Order not found for this user" });
        }

        // Actualiza el stock de los productos en la colección `product`
        for (const item of cart) {
            await clientDB.db("mercado").collection("product").updateOne(
                { _id: new ObjectId(item.id) }, // Busca el producto por su ID
                { $inc: { stock: -1 } } // Resta 1 al stock del producto
            );
        }

        // Actualiza el carrito con la nueva información
        const updatedCart = cart.map((item) => {
            return {
                ...item,
                userId: new ObjectId(item.userId), // Convertir userId a ObjectId
                user_product: new ObjectId(item.user_product) // Convertir user_product a ObjectId
            };
        });

        // Incluye el carrito actualizado en el jsonResponse
        const jsonResponse = {
            ...orderFromDB,
            cart: updatedCart // Sobrescribe o añade el carrito al jsonResponse existente
        };

        // Guarda los datos en MongoDB
        if (jsonResponse) {
            // Actualiza la orden en la base de datos
            await clientDB.db("mercado").collection("order").updateOne(
                { paymentId: id }, // Asegúrate de que se busca por el ID del usuario
                { $set: jsonResponse } // Actualiza los datos de la orden con el carrito
            );

            res.status(200).json({ message: "Order and products saved successfully", data: jsonResponse });
        } else {
            res.status(500).json({ error: "Failed to save order data." });
        }
    } catch (error) {
        console.error("Failed to save products:", error);
        res.status(500).json({ error: "Failed to save products." });
    }
});


const savePaymentToDB = async (jsonResponse, decoded) => {
    try {
        const paymentData = {
            paymentId: jsonResponse.id,  // Aquí usamos el ID de la orden
            status: jsonResponse.status,

            payer: {
                name: {
                    given_name: jsonResponse.payer.name.given_name,
                    surname: jsonResponse.payer.name.surname,
                },
                email_address: decoded.email,
                payer_id: new ObjectId(decoded.id),
                country_code: jsonResponse.payer.address.country_code,
            },
            payment_source: {
                paypal: {
                    email_address: jsonResponse.payment_source.paypal.email_address,
                    account_id: jsonResponse.payment_source.paypal.account_id,
                    account_status: jsonResponse.payment_source.paypal.account_status,
                    name: {
                        given_name: jsonResponse.payment_source.paypal.name.given_name,
                        surname: jsonResponse.payment_source.paypal.name.surname,
                    },
                    country_code: jsonResponse.payment_source.paypal.address.country_code,
                },
            },
            amount: {
                currency_code: jsonResponse.purchase_units[0].payments.captures[0].amount.currency_code,
                value: jsonResponse.purchase_units[0].payments.captures[0].amount.value,
            },
            shipping: {
                name: jsonResponse.purchase_units[0].shipping.name.full_name,
                address: {
                    address_line_1: jsonResponse.purchase_units[0].shipping.address.address_line_1,
                    admin_area_1: jsonResponse.purchase_units[0].shipping.address.admin_area_1,
                    admin_area_2: jsonResponse.purchase_units[0].shipping.address.admin_area_2,
                    postal_code: jsonResponse.purchase_units[0].shipping.address.postal_code,
                    country_code: jsonResponse.purchase_units[0].shipping.address.country_code,
                },
            },
            paypal_fee: {
                currency_code: jsonResponse.purchase_units[0].payments.captures[0].seller_receivable_breakdown.paypal_fee.currency_code,
                value: jsonResponse.purchase_units[0].payments.captures[0].seller_receivable_breakdown.paypal_fee.value,
            },
            net_amount: {
                currency_code: jsonResponse.purchase_units[0].payments.captures[0].seller_receivable_breakdown.net_amount.currency_code,
                value: jsonResponse.purchase_units[0].payments.captures[0].seller_receivable_breakdown.net_amount.value,
            },
            capture_id: jsonResponse.purchase_units[0].payments.captures[0].id,
            create_time: jsonResponse.purchase_units[0].payments.captures[0].create_time,
            update_time: jsonResponse.purchase_units[0].payments.captures[0].update_time,
        };
        return paymentData;
    } catch (error) {
        console.error("Failed to save payment to DB:", error);
    }
}








































router.post('/api/create_subscription', cors(), async (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 's-max-age=1, stale-while-revalidate');
    res.setHeader('Access-Control-Allow-Origin', ALLOWED_ORIGIN);
    res.setHeader('Access-Control-Allow-Credentials', "true");

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
});
router.post('/api/capture_subscription', cors(), async (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 's-max-age=1, stale-while-revalidate');
    res.setHeader('Access-Control-Allow-Origin', ALLOWED_ORIGIN); // Configura tu origen permitido
    res.setHeader('Access-Control-Allow-Credentials', "true");

    const { subscription_id, token, planId } = req.body; // Extrae subscription_id, token, planId del body
    const sessionToken = req.cookies["sessionToken"]; // Accede directamente a la cookie "sessionToken"

    // Valida que todos los parámetros estén presentes
    if (!subscription_id || !token || !sessionToken || !planId) {
        return res.status(400).json({ error: 'Subscription ID, token, sessionToken, and planId are required' });
    }

    try {
        await clientDB.connect(); // Conecta a la base de datos

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
        const savesSubscription = await clientDB.db("mercado").collection("subscription").insertOne(newSubscription);

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
    } finally {
        await clientDB.close(); // Cierra la conexión a la base de datos
    }
});


router.post('/api/notify_delivery', cors(), async (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 's-max-age=1, stale-while-revalidate');
    res.setHeader('Access-Control-Allow-Origin', ALLOWED_ORIGIN); // Configura tu origen permitido
    res.setHeader('Access-Control-Allow-Credentials', "true");

    const { orderId_mongo } = req.body;
    // Validación del ID de la orden
    if (!ObjectId.isValid(orderId_mongo)) {
        return res.status(400).json({ error: 'ID de orden inválido' });
    }

    try {
        // Conectar a la base de datos
        await clientDB.connect();
        const db = clientDB.db('mercado');
        const collection = db.collection('order');

        console.log(orderId_mongo)
        // Actualizar el estado de entrega
     /*    const result = await collection.findOneAndUpdate(
            { _id: new ObjectId(orderId_mongo) },
            { $set: { seller_delivered: true } },
            {
                returnDocument: "after",
                projection: { "payer.email_address": 1, }
            } // Devuelve el documento actualizado
        ); */
        if (result.matchedCount === 0) {
            return res.status(404).json({ error: 'Orden no encontrada' });
        }

        if (result.modifiedCount === 0) {
            return res.status(400).json({ error: 'No se pudo actualizar el estado de la orden' });
        }

        /* send(result.payer.email_address, orderId_mongo) */

        // se le envia un mail al usuario con el link a la pagina de entrega de producto

        // Se busca el mail del usuario comprador en la orden y se le envia un email



        // Enviar respuesta exitosa
        return res.status(200).json({ message: 'Estado de entrega actualizado' });
    } catch (error) {
        console.error('Error al actualizar la orden:', error);
        return res.status(500).json({ error: 'Error al actualizar el estado de entrega' });
    } /* finally {
        // Cerrar la conexión a la base de datos si se ha abierto
        await clientDB.close();
    } */
});
router.post('/api/notify_delivery_by_buyer', cors(), async (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 's-max-age=1, stale-while-revalidate');
    res.setHeader('Access-Control-Allow-Origin', ALLOWED_ORIGIN); // Configura tu origen permitido
    res.setHeader('Access-Control-Allow-Credentials', "true");

    const { orderId_mongo } = req.body;
    // Validación del ID de la orden
    if (!ObjectId.isValid(orderId_mongo)) {
        return res.status(400).json({ error: 'ID de orden inválido' });
    }

    try {
        // Conectar a la base de datos
        await clientDB.connect();
        const db = clientDB.db('mercado');
        const collection = db.collection('order');

        console.log(orderId_mongo)
        // Actualizar el estado de entrega
        const result = await collection.findOneAndUpdate(
            { _id: new ObjectId(orderId_mongo) },
            { $set: { buyer_delivered: true } },
            {
                returnDocument: "after"
            } // Devuelve el documento actualizado
        );
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
    } /* finally {
        // Cerrar la conexión a la base de datos si se ha abierto
        await clientDB.close();
    } */
});


router.get('/product/review/', cors(), (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 's-max-age=1, stale-while-revalidate');
    res.setHeader('Access-Control-Allow-Origin', ALLOWED_ORIGIN); // Configura tu origen permitido
    res.setHeader('Access-Control-Allow-Credentials', "true");
    const sessionToken = req.cookies["sessionToken"];

    // Procesa el token como sea necesario, por ejemplo, verificar su validez
    // Luego envía una respuesta adecuada
    res.json({ message: 'Token recibido', sessionToken });
});

export default router