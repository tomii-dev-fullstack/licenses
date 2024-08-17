import express from 'express';
import cors from 'cors';
import candidatos from "./candidatos.json" assert { type: 'json' };
import ofertas from "./avisos.json" assert { type: 'json' };
import { calcularMatch } from "./match.js";
import multer from 'multer';
import path from 'path';
import dotenv from 'dotenv';
import fs from "fs"
import { uploadFileToS3 } from "./api/s3/s3.js"

import { send } from './api/nodemailer/config.js';
import { auth } from './firebase.js';
import cookieParser from 'cookie-parser';
import { clientDB } from './lib/database.js';
import { ObjectId } from 'mongodb';
import router from "./api/routes/routes.js"

const app = express();
const port = 3001;
app.use(router)
dotenv.config();

app.use(cors({ origin: "*" }))

app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});
app.use(cors({
    origin: ['https://opawork.vercel.app', 'http://localhost:3000'],
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Access-Control-Allow-Origin', 'Access-Control-Allow-Methods'],
}));
app.use(cookieParser())



// Rutas
app.get('/match/:id', async (req, res) => {
    try {
        const candidato = candidatos.find(candidato => candidato.id === 2);
        const matches = ofertas.map(oferta => {
            const matchScore = calcularMatch(oferta, candidato);
            return { titulo: oferta.titulo, porcentaje: matchScore.toFixed(2) };
        });

        matches.sort((a, b) => b.porcentaje - a.porcentaje);
        res.send(matches);
    } catch (error) {
        res.status(500).send(error.message);
    }
});

app.post("/api/upload", upload.single("yo"), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).send('No se encontró ningún archivo.');
        }


        /*   await uploadFileToS3(req.file); */
        res.send("Archivo subido exitosamente!");
    } catch (error) {
        res.status(500).send(error.message);
    }
});



app.get("/api/postulations/:id", async (req, res) => {
    try {
        const { id } = req.params;
        if (!id) {
            return res.status(400).json({ message: 'user_id is required' });
        }
        await clientDB.connect();

        console.log(id);
        const applications = await clientDB.db("opawork").collection("user").aggregate([
            {
                $match: {
                    _id: new ObjectId(id) // Filtramos por el usuario ID
                }
            },
            {
                $lookup: {
                    from: "application", // Nombre de la colección de aplicaciones
                    localField: "aplicaciones", // Campo en la colección de usuarios que contiene el array de ObjectId
                    foreignField: "_id", // Campo en la colección de aplicaciones que coincide con los ObjectId
                    as: "applicationDetails" // Nombre del array resultante
                }
            },
            {
                $lookup: {
                    from: "job", // Nombre de la colección de trabajos
                    localField: "applicationDetails.empleo_id", // Campo en la colección de aplicaciones
                    foreignField: "_id", // Campo en la colección de trabajos
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
});







app.get("/api/all_advises/:id", async (req, res) => {
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
});

app.get("/api/advise/:id", async (req, res) => {
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
});





app.post('/api/login', async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*'); // Permitir todas las solicitudes desde cualquier origen
    const { token } = req.body;
    console.log(token);
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
        res.cookie('session', sessionToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'Strict',
        });

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
});
app.post('/api/register', async (req, res) => {
    const { token } = req.body;

    if (!token) {
        return res.status(401).json({ error: 'Token inválido' });
    }

    try {
        // Verificar el token de Google con Firebase Admin
        const decodedToken = await auth.verifyIdToken(token);
        console.log(decodedToken);
        const userEmail = decodedToken.email;

        // Verificar si el usuario ya existe en la base de datos
        const existingUser = await clientDB.db("opawork").collection("user").findOne({ email: userEmail });

        if (existingUser) {
            return res.status(400).json({ error: 'Usuario ya registrado' });
        }

        // Crear un nuevo usuario en la base de datos
        const newUser = {
            email: decodedToken.email,
            nombre: decodedToken.name,
            email: decodedToken.email,
            type: "person"
            // Añade otros campos que consideres necesarios
            // Añade otros campos que consideres necesarios
        };
        await clientDB.db("opawork").collection("user").insertOne(newUser);

        // Generar un token de sesión (puedes usar el mismo token o un JWT personalizado)
        const sessionToken = token; // Para simplicidad, estamos usando el mismo token

        // Configurar la cookie con el token de sesión
        res.cookie('session', sessionToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'Strict',
        });

        // Devolver una respuesta con el mensaje y el usuario registrado
        return res.status(201).json({
            message: 'Registro exitoso',
            user: {
                id: newUser._id,
                name: newUser.nombre,
                email: newUser.email,
                type: newUser.type,
                // Añade otros campos que quieras devolver
            }
        });
    } catch (error) {
        console.error('Error verifying token:', error);
        return res.status(401).json({ error: 'No autorizado' });
    }
});

/* app.get("/", (req, res) => {
    res.setHeader ('Content-Type', 'application/json');
    res.setHeader ('Cache-Control', 's-max-age=1, stale-while-revalidate');
    res.send("Hello World!");
})

 */
app.listen(3001, (req, res) => {
    console.log("escucahd")
})