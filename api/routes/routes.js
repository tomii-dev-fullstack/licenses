import { Router } from "express";
import { clientDB } from "../../lib/database.js";
import { ObjectId } from "mongodb";
import { auth } from '../../firebase.js';
import cors from "cors"
const router = Router()




router.get("/", (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 's-max-age=1, stale-while-revalidate');
    res.send("Hello World!");
})
router.get("/api/advise/:id", async (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 's-max-age=1, stale-while-revalidate');
    try {
        const { id } = req.params;
        if (!id) {
            return res.status(400).json({ message: 'user_id is required' });
        }
        await clientDB.connect();

        console.log(id)
        const applications = await clientDB.db("opawork").collection("job").aggregate([
            {
                $match: {
                    _id: new ObjectId(id) // Filtramos por el trabajo ID
                }
            },
            /*  {
                $lookup: {
                    from: "application", // Nombre de la colección de aplicaciones
                    localField: "_id", // Campo en la colección de trabajos que contiene el ID del trabajo
                    foreignField: "empleo_id", // Campo en la colección de aplicaciones que referencia el ID del trabajo
                    as: "appDetails" // Nombre del array resultante
                }
            },
            {
                $unwind: "$appDetails" // Desenrollamos el array resultante para acceder a los detalles de la aplicación
            },  */
            {
                $lookup: {
                    from: "user", // Nombre de la colección de usuarios
                    localField: "_id", // Campo en la colección de aplicaciones que referencia el ID del usuario
                    foreignField: "aplicaciones", // Campo en la colección de usuarios que coincide con el ID del usuario
                    as: "userDetails" // Nombre del array resultante
                }
            },
            {
                $unwind: "$userDetails" // Desenrollamos el array resultante para acceder a los detalles del usuario
            }
        ]).toArray();
        console.log(applications)
        if (applications.length > 0) {
            res.status(200).json(applications);
            /*      clientDB.close(); */
        } else {
            res.status(404).json({ message: 'No se encontraron postulaciones para el usuario dado' });
            /*     clientDB.close(); */
        }

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'An error occurred while processing your request', error: error.message });
        clientDB.close();
    }
    finally {
        clientDB.close();
    }
})
router.get("/api/all_advises/:id", async (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 's-max-age=1, stale-while-revalidate');
    try {
        const { id } = req.params;
        if (!id) {
            return res.status(400).json({ message: 'user_id is required' });
        }
        await clientDB.connect();

        console.log(id)
        const applications = await clientDB.db("opawork").collection("user").aggregate([
            {
                $match: {
                    _id: new ObjectId(id) // Filtramos por el usuario ID
                }
            },
            {
                $lookup: {
                    from: "job", // Nombre de la colección de aplicaciones
                    localField: "avisos", // Campo en la colección de usuarios que contiene el array de ObjectId
                    foreignField: "_id", // Campo en la colección de aplicaciones que coincide con los ObjectId
                    as: "jobDetails" // Nombre del array resultante
                }
            },
            {
                $unwind: "$jobDetails" // Desenrollamos el array resultante para acceder a los detalles del trabajo
            }
        ]).toArray();

        console.log(applications)
        if (applications.length > 0) {
            res.status(200).json(applications);
            /*      clientDB.close(); */
        } else {
            res.status(404).json({ message: 'No se encontraron postulaciones para el usuario dado' });
            /*     clientDB.close(); */
        }

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'An error occurred while processing your request', error: error.message });
        clientDB.close();
    }
    finally {
        clientDB.close();
    }
})
router.post("/api/login", cors(), async (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 's-max-age=1, stale-while-revalidate');
    res.setHeader('Access-Control-Allow-Origin', `https://opawork.vercel.app`);
    res.setHeader('Access-Control-Allow-Credentials', "true");
    const { token } = req.body;

    if (!token) {
        return res.status(401).json({ error: 'Token inválido' });
    }

    try {
        // Verificar el token de Google con Firebase Admin
        const decodedToken = await auth.verifyIdToken(token);
        console.log(decodedToken);
        const userEmail = decodedToken.email;

        // Buscar usuario en la base de datos
        await clientDB.connect()
        const user = await clientDB.db("opawork").collection("user").findOne({ email: userEmail });

        if (!user) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        // Generar un token de sesión (puedes usar el mismo token o un JWT personalizado)
        const sessionToken = token; // Para simplicidad, estamos usando el mismo token

        // Configurar la cookie con el token de sesión
       /*  res.cookie('session', sessionToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
        }); */

        return res.status(200).json({
            message: 'Login exitoso',
            user: {

                id: user._id,
                name: user.nombre,
                email: user.email,
                type: user.type
                // Añade otros campos que quieras devolver
            }
        });
    } catch (error) {
        console.error('Error verifying token:', error);
        return res.status(401).json({ error: 'No autorizado' });
    }
    finally {
        clientDB.close();
    }
})

export default router