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
/* import { calculateMatch } from "../match.js"
import { calculateMatchByUserByJob } from "../objet-match.js"; */
const router = Router()
const client = new MercadoPagoConfig({
    accessToken: "TEST-5387852327876700-073110-755bd3bd40e2672d39bea5dad3cfbbec-360175350",

})
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

router.get("/", (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 's-max-age=1, stale-while-revalidate');
    res.send("Hello World!");
})
router.get("/api/advise/:id", async (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 's-max-age=1, stale-while-revalidate');
    res.setHeader('Access-Control-Allow-Origin', /* 'https://opawork.vercel.app' */'http://localhost:3000');
    res.setHeader('Access-Control-Allow-Credentials', "true");
    try {
        const { id } = req.params;
        console.log(id);
        if (!id) {
            return res.status(400).json({ message: 'user_id is required' });
        }
        await clientDB.connect();

        const applications = await clientDB.db("opawork").collection("application").aggregate([
            {
                $match: {
                    job_id: new ObjectId(id) // Filtramos por el trabajo ID
                }
            },
            {
                $lookup: {
                    from: "user", // Nombre de la colección de aplicaciones
                    localField: "user_id", // Campo en la colección de trabajos que contiene el ID del trabajo
                    foreignField: "_id", // Campo en la colección de aplicaciones que referencia el ID del trabajo
                    as: "userDetails" // Nombre del array resultante
                }
            },
            {
                $unwind: "$userDetails" // Desenrollamos el array resultante para acceder a los detalles de la aplicación
            },
            {
                $lookup: {
                    from: "job", // Nombre de la colección de aplicaciones
                    localField: "job_id", // Campo en la colección de trabajos que contiene el ID del trabajo
                    foreignField: "_id", // Campo en la colección de aplicaciones que referencia el ID del trabajo
                    as: "jobDetails" // Nombre del array resultante
                }
            },
            {
                $unwind: "$jobDetails" // Desenrollamos el array resultante para acceder a los detalles de la aplicación
            }
        ]).toArray();
        /*   const user = await clientDB.db("opawork").collection("user").findOne({ _id: new ObjectId(user_id) }) */
        console.log(applications);
        /*   const ap = applications.map(app => ({
             matchp: calculateMatchByUserByJob(app.userDetails, app.jobDetails),
             u: app
         })); */
        console.log(ap)
        if (ap.length > 0) {
            res.status(200).json(ap);

        } else {
            res.status(404).json({ message: 'No se encontraron postulaciones para el usuario dado' });

        }
        /*   if (applications.length > 0) {
              res.status(200).json(applications);
           
          } else {
              res.status(404).json({ message: 'No se encontraron postulaciones para el usuario dado' });
              
          }
   */
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
    res.setHeader('Access-Control-Allow-Origin', /* 'https://opawork.vercel.app' */'http://localhost:3000');
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
                    user_id: new ObjectId(id) // Filtramos por el ID del usuario del negocio
                }
            },
            {
                $lookup: {
                    from: "application", // Nombre de la colección de aplicaciones
                    localField: "_id", // Campo en la colección de trabajos que coincide con el ObjectId
                    foreignField: "job_id", // Campo en la colección de aplicaciones que coincide con el ObjectId del trabajo
                    as: "applications" // Nombre del array resultante
                }
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









 router.get('/api/check-auth',cors(), (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', 'http://localhost:3030')
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
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'Strict'
    });

    // Responde con un mensaje de éxito
    res.status(200).json({ message: 'Logout exitoso' });
});
 





















router.post("/api/login", cors(), async (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 's-max-age=1, stale-while-revalidate');
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
            secure: process.env.NODE_ENV === 'production', // Solo en HTTPS en producción
            sameSite: 'Strict',
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

router.get("/api/match/:id", /* cors(), */ async (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 's-max-age=1, stale-while-revalidate');
    res.setHeader('Access-Control-Allow-Origin', /* 'https://opawork.vercel.app' */'http://localhost:3000');

    const { id } = req.params;

    if (!id || id.trim() === '' || id === null || id === undefined) {
        console.log(id)
        return res.status(400).json({
            message: 'ID de usuario no válido',
            error: 'No se ha proporcionado un ID de usuario válido.',
            status: 404
        });
    }

    try {
        console.log(`ID recibido: ${id}`);

        await clientDB.connect();
        const userId = new ObjectId(id); // El id del usuario

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
                    "applications.user_id": { $ne: userId }
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
            {
                $project: {
                    "applications": 0
                }
            }
        ]).toArray();

        const user = await clientDB.db("opawork").collection("user").findOne({ _id: new ObjectId(id) })
        console.log(user);

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

        /*  const jobs = jobsBD.map(job => ({
             matchp: calculateMatch(user, job),
             job: job
         })); */
        console.log(jobs)
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


























router.post("/api/matcsssssh/:searchTerm", cors(), async (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 's-max-age=1, stale-while-revalidate');
    res.setHeader('Access-Control-Allow-Origin', 'https://opawork.vercel.app');
    try {
        const { searchTerm } = req.params;
        await clientDB.connect();
        console.log(searchTerm);

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
                    "title": { $regex: searchTerm, $options: 'i' } // 'i' para búsqueda insensible a mayúsculas/minúsculas
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

        /*   const jobs = jobsBD.map(job => ({
              matchp: calculateMatch(user, job),
              job: job
          })); */
        console.log(jobsBD)
        return res.status(200).json({
            message: 'Búsqueda exitosa',
            jobs: jobsBD
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
router.post("/api/update_personal_information", cors(), async (req, res) => {
    /*     res.setHeader('Content-Type', 'application/json'); */
    res.setHeader('Cache-Control', 's-max-age=1, stale-while-revalidate');
    res.setHeader('Access-Control-Allow-Origin', 'https://opawork.vercel.app');
    const { user_info } = req.body
    console.log("descripcion" + user_info.id, user_info.ciudad, user_info.direccion, user_info.celular, user_info.pais)
    try {
        if (!user_info) {
            return res.status(400).json('No hay datos.');
        }
        await clientDB.connect();
        const user = await clientDB.db("opawork").collection("user").findOneAndUpdate(
            { _id: new ObjectId(user_info.id) },
            {
                $set: {
                    email: user_info.email, phone: user_info.celular, city: user_info.ciudad,
                    street: user_info.direccion, country: user_info.pais,
                }
            }
        );


        /*    await uploadFileToS3(req.file) */

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
    } catch (error) {
        res.status(500).send(error.message);
    }
});








router.post("/api/add_user_lenguage/:id", cors(), async (req, res) => {
    /*     res.setHeader('Content-Type', 'application/json'); */
    res.setHeader('Cache-Control', 's-max-age=1, stale-while-revalidate');
    res.setHeader('Access-Control-Allow-Origin', 'https://opawork.vercel.app');
    const { lenguages } = req.body
    const { id } = req.params
    console.log("id: " + id)
    console.log("works: " + lenguages)
    try {
        if (!lenguages) {
            return res.status(400).json('No hay datos.');
        }
        await clientDB.connect();
        const user = await clientDB.db("opawork").collection("user").updateOne(
            { _id: new ObjectId(id) },
            {
                $push: {
                    lenguages: {
                        $each: lenguages // Agrega cada elemento del array al array existente en la base de datos
                    }
                }
            }
        );


        /*    await uploadFileToS3(req.file) */
        if (user) {

            res.json({
                success: 200,
                message: "experiencia subida exitosamente!",

            });
        }
    } catch (error) {
        res.status(500).send(error.message);
    }
});





router.post("/api/add_work_experience/:id", cors(), async (req, res) => {
    /*     res.setHeader('Content-Type', 'application/json'); */
    res.setHeader('Cache-Control', 's-max-age=1, stale-while-revalidate');
    res.setHeader('Access-Control-Allow-Origin', 'https://opawork.vercel.app');
    const { work_experience } = req.body
    const { id } = req.params
    console.log("id: " + id)
    console.log("works: " + work_experience)
    try {
        if (!work_experience) {
            return res.status(400).json('No hay datos.');
        }
        await clientDB.connect();
        const user = await clientDB.db("opawork").collection("user").updateOne(
            { _id: new ObjectId(id) },
            {
                $push: {
                    works_information: work_experience // Agrega cada elemento del array al array existente en la base de datos

                }
            }
        );


        /*    await uploadFileToS3(req.file) */
        if (user) {

            res.json({
                success: 200,
                message: "experiencia subida exitosamente!",

            });
        }
    } catch (error) {
        res.status(500).send(error.message);
    }
});

router.post("/api/add_education_experience/:id", cors(), async (req, res) => {
    /*     res.setHeader('Content-Type', 'application/json'); */
    res.setHeader('Cache-Control', 's-max-age=1, stale-while-revalidate');
    res.setHeader('Access-Control-Allow-Origin', 'https://opawork.vercel.app');
    const { ed } = req.body
    const { id } = req.params
    console.log("ed: " + ed)
    try {
        if (!ed) {
            return res.status(400).json('No hay datos.');
        }
        await clientDB.connect();
        if (!ed.id) {
            ed.id = new ObjectId();
        } else {
            // Si ya tiene un campo `id`, lo convertimos a ObjectId
            ed.id = new ObjectId(ed.id);
        }
        const user = await clientDB.db("opawork").collection("user").updateOne(
            { _id: new ObjectId(id) },
            {
                $push: {
                    education_information: ed // Agrega cada elemento del array al array existente en la base de datos

                }
            }
        );


        /*    await uploadFileToS3(req.file) */
        if (user) {

            res.json({
                success: 200,
                message: "educación subida exitosamente!",

            });
        }
    } catch (error) {
        res.status(500).send(error.message);
    }
});


router.get("/api/get_lenguages_user/:id", cors(), async (req, res) => {
    /*     res.setHeader('Content-Type', 'application/json'); */
    res.setHeader('Cache-Control', 's-max-age=1, stale-while-revalidate');
    res.setHeader('Access-Control-Allow-Origin', /* 'https://opawork.vercel.app' */'http://localhost:3000');
    const { id } = req.params
    console.log("leng: " + id)
    try {
        if (!id) {
            return res.status(400).json({ success: 400, message: 'ID and name are required' });
        }
        await clientDB.connect()
        // Encuentra y actualiza el documento del usuario
        const updatedUser = await clientDB.db("opawork").collection("user").findOne({ _id: new ObjectId(id) });
        const lenguages = updatedUser ? updatedUser.lenguages : [];


        // Verifica si se realizó una actualización
        res.status(200).json({ success: 200, lenguages });
    } catch (error) {
        console.error('Error al obtener los items:', error);
    }
});


router.get("/api/get_education_user/:id", cors(), async (req, res) => {
    /*     res.setHeader('Content-Type', 'application/json'); */
    res.setHeader('Cache-Control', 's-max-age=1, stale-while-revalidate');
    res.setHeader('Access-Control-Allow-Origin', /* 'https://opawork.vercel.app' */'http://localhost:3000');
    const { id } = req.params
    console.log("eds: " + id)
    try {
        if (!id) {
            return res.status(400).json({ success: 400, message: 'ID and name are required' });
        }
        await clientDB.connect()
        // Encuentra y actualiza el documento del usuario
        const updatedUser = await clientDB.db("opawork").collection("user").findOne({ _id: new ObjectId(id) });
        const education = updatedUser ? updatedUser.education_information : [];


        // Verifica si se realizó una actualización
        res.status(200).json({ success: 200, education });
    } catch (error) {
        console.error('Error al obtener los items:', error);
    }
});





router.get("/api/get_information_user/:id", cors(), async (req, res) => {
    /*     res.setHeader('Content-Type', 'application/json'); */
    res.setHeader('Cache-Control', 's-max-age=1, stale-while-revalidate');
    res.setHeader('Access-Control-Allow-Origin', /* 'https://opawork.vercel.app' */'http://localhost:3000');
    const { user_id } = req.params
    console.log("user:  " + id)
    try {
        if (!id) {
            return res.status(400).json({ success: 400, message: 'ID and name are required' });
        }
        await clientDB.connect()
        // Encuentra y actualiza el documento del usuario
        const user = await clientDB.db("opawork").collection("user").findOne({ _id: new ObjectId(user_id) });


        // Verifica si se realizó una actualización
        res.status(200).json({ success: 200, user });
    } catch (error) {
        console.error('Error al obtener los items:', error);
    }
});




router.delete("/api/delete_education_user/:id", cors(), async (req, res) => {
    res.setHeader('Cache-Control', 's-max-age=1, stale-while-revalidate');
    res.setHeader('Access-Control-Allow-Origin', 'https://opawork.vercel.app');
    const { id } = req.params;
    const { idItem } = req.body;

    try {
        await clientDB.connect();
        console.log(id, "---------", idItem)
        // Convertir `edId` a un ObjectId
        const result = await clientDB.db("opawork").collection("user").updateOne(
            { _id: new ObjectId(id) },
            {
                $pull: {
                    education_information: { _id: new ObjectId(idItem) } // Elimina el elemento cuyo id coincide con edId
                }
            }
        );
        if (result.modifiedCount > 0) {
            console.log(result);
            res.json({
                success: 200,
                message: "¡Educación eliminada exitosamente!",
            });
        } else {
            res.status(404).json({
                success: 404,
                message: "Usuario o experiencia educativa no encontrada",
            });
        }
    } catch (error) {
        res.status(500).send(error.message);
    }
});

router.delete("/api/delete_user_lenguage/:id", cors(), async (req, res) => {
    res.setHeader('Cache-Control', 's-max-age=1, stale-while-revalidate');
    res.setHeader('Access-Control-Allow-Origin', 'https://opawork.vercel.app');
    const { id } = req.params;
    const { lenguage } = req.body;

    try {
        await clientDB.connect();
        console.log(id, "---------", lenguage)
        // Convertir `edId` a un ObjectId
        const result = await clientDB.db("opawork").collection("user").updateOne(
            { _id: new ObjectId(id) },
            {
                $pull: {
                    lenguages: lenguage // Elimina el elemento cuyo id coincide con edId
                }
            }
        );
        if (result.modifiedCount > 0) {
            console.log(result);
            res.json({
                success: 200,
                message: "¡Educación eliminada exitosamente!",
            });
        } else {
            res.status(404).json({
                success: 404,
                message: "Usuario o experiencia educativa no encontrada",
            });
        }
    } catch (error) {
        res.status(500).send(error.message);
    }
});
































































router.get("/api/get_job/:id", cors(), async (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 's-max-age=1, stale-while-revalidate');
    res.setHeader('Access-Control-Allow-Origin', /* 'https://opawork.vercel.app' */'http://localhost:3000');
    const { id } = req.params
    console.log("id job: " + id)
    try {
        if (!id) {
            return res.status(400).json({ success: 400, message: 'ID and name are required' });
        }
        await clientDB.connect()
        // Encuentra y actualiza el documento del usuario
        const job = await clientDB.db("opawork").collection("job").aggregate([
            {
                $match: { _id: new ObjectId(id) } // Encuentra el documento específico en la colección job
            },
            {
                $lookup: {
                    from: 'user', // Nombre de la colección a unir (user)
                    localField: 'user_id', // Campo en la colección job que relaciona con la colección user
                    foreignField: '_id', // Campo en la colección user que coincide con localField
                    as: 'userInfo' // Nombre del campo de salida donde se almacenará la información de user
                }
            },
            {
                $unwind: '$userInfo' // Desempaqueta la información del usuario si sólo esperas un resultado
            }
        ]).toArray() // Devuelve los resultados como un array

        console.log(job)
        // Verifica si se realizó una actualización
        res.status(200).json({ success: 200, job });
    } catch (error) {
        console.error('Error al obtener los items:', error);
    }
});

router.get("/api/get_advises_by_bussines/:id", cors(), async (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 's-max-age=1, stale-while-revalidate');
    res.setHeader('Access-Control-Allow-Origin', /* 'https://opawork.vercel.app' */'http://localhost:3000');
    const { id } = req.params
    console.log("id job: " + id)
    try {
        if (!id) {
            return res.status(400).json({ success: 400, message: 'ID and name are required' });
        }
        await clientDB.connect()
        // Encuentra y actualiza el documento del usuario
        const jobs = await clientDB.db("opawork").collection("user").aggregate([
            {
                $match: { _id: new ObjectId(id) } // Encuentra el documento específico en la colección job
            },
            {
                $lookup: {
                    from: 'job', // Nombre de la colección a unir (user)
                    localField: '_id', // Campo en la colección job que relaciona con la colección user
                    foreignField: 'user_id', // Campo en la colección user que coincide con localField
                    as: 'userInfo' // Nombre del campo de salida donde se almacenará la información de user
                }
            },
            {
                $unwind: '$userInfo' // Desempaqueta la información del usuario si sólo esperas un resultado
            }
        ]).toArray() // Devuelve los resultados como un array

        console.log(jobs)
        // Verifica si se realizó una actualización
        res.status(200).json({ success: 200, jobs });
    } catch (error) {
        console.error('Error al obtener los items:', error);
    }
});









router.get("/api/get_works_user/:id", cors(), async (req, res) => {
    /*     res.setHeader('Content-Type', 'application/json'); */
    res.setHeader('Cache-Control', 's-max-age=1, stale-while-revalidate');
    res.setHeader('Access-Control-Allow-Origin', /* 'https://opawork.vercel.app' */'http://localhost:3000');
    const { id } = req.params
    console.log("eds: " + id)
    try {
        if (!id) {
            return res.status(400).json({ success: 400, message: 'ID and name are required' });
        }
        await clientDB.connect()
        // Encuentra y actualiza el documento del usuario
        const updatedUser = await clientDB.db("opawork").collection("user").findOne({ _id: new ObjectId(id) });
        const works_information = updatedUser ? updatedUser.works_information : [];


        // Verifica si se realizó una actualización
        res.status(200).json({ success: 200, works_information });
    } catch (error) {
        console.error('Error al obtener los items:', error);
    }
});




router.delete("/api/delete_work_user/:id", cors(), async (req, res) => {
    res.setHeader('Cache-Control', 's-max-age=1, stale-while-revalidate');
    res.setHeader('Access-Control-Allow-Origin', 'https://opawork.vercel.app');
    const { id } = req.params;
    const { idItem } = req.body;

    try {
        await clientDB.connect();
        console.log(id, "---------", idItem)
        // Convertir `edId` a un ObjectId
        const result = await clientDB.db("opawork").collection("user").updateOne(
            { _id: new ObjectId(id) },
            {
                $pull: {
                    works_information: { _id: new ObjectId(idItem) } // Elimina el elemento cuyo id coincide con edId
                }
            }
        );
        if (result.modifiedCount > 0) {
            console.log(result);
            res.json({
                success: 200,
                message: "Trabajo eliminado exitosamente!",
            });
        } else {
            res.status(404).json({
                success: 404,
                message: "Usuario o trabajo educativa no encontrada",
            });
        }
    } catch (error) {
        res.status(500).send(error.message);
    }
});































router.post("/api/update_benefits_advise_by_user/:id", cors(), async (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 's-max-age=1, stale-while-revalidate');
    res.setHeader('Access-Control-Allow-Origin', 'https://opawork.vercel.app');

    const { id } = req.params;  // Cambiado _id a id para mayor claridad
    const { benefitsJob, company, title, description } = req.body;

    console.log("Beneficios:", benefitsJob);
    console.log("ID:", id);

    if (!Array.isArray(benefitsJob) || !id || !company || !title || !description) {
        return res.status(400).json({ error: 'No hay datos válidos.' });
    }

    try {
        await clientDB.connect();  // Conectar a la base de datos si no está ya conectada

        const result = await clientDB.db("opawork").collection("job").updateOne(
            { _id: new ObjectId(id) },  // Filtro para encontrar el documento
            {
                $set: {
                    benefits: benefitsJob, title: title, company: company, description: description // Reemplaza la lista de beneficios en lugar de usar 
                }
            },
            { returnOriginal: false } // Devuelve el documento actualizado
        );
        console.log(result)
        if (result.value) {
            console.log("Documento actualizado:", result.value);
            res.status(200).json({
                success: true,
                message: "Beneficios actualizados exitosamente!"
            });
        } else {
            res.status(404).json({
                success: false,
                message: "Documento no encontrado."
            });
        }
    } catch (error) {
        console.error("Error al actualizar beneficios:", error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    } finally {
        await clientDB.close(); // Asegúrate de cerrar la conexión si es necesario
    }
});
router.post("/api/update_mod_advise_by_user/:id", cors(), async (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 's-max-age=1, stale-while-revalidate');
    res.setHeader('Access-Control-Allow-Origin', 'https://opawork.vercel.app');

    const { id } = req.params;  // Cambiado _id a id para mayor claridad
    const { modJob } = req.body;

    console.log("modos:", modJob);
    console.log("ID:", id);

    if (!Array.isArray(modJob) || !id) {
        return res.status(400).json({ error: 'No hay datos válidos.' });
    }

    try {
        await clientDB.connect();  // Conectar a la base de datos si no está ya conectada

        const result = await clientDB.db("opawork").collection("job").updateOne(
            { _id: new ObjectId(id) },  // Filtro para encontrar el documento
            {
                $set: {
                    modJob: modJob // Reemplaza la lista de beneficios en lugar de usar 
                }
            },
            { returnOriginal: false } // Devuelve el documento actualizado
        );
        console.log(result)
        if (result.value) {
            console.log("Documento actualizado:", result.value);
            res.status(200).json({
                success: true,
                message: "modos actualizados exitosamente!"
            });
        } else {
            res.status(404).json({
                success: false,
                message: "Documento no encontrado."
            });
        }
    } catch (error) {
        console.error("Error al actualizar beneficios:", error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    } finally {
        await clientDB.close(); // Asegúrate de cerrar la conexión si es necesario
    }
});







router.delete("/api/delete_contact_user/:id", cors(), async (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 's-max-age=1, stale-while-revalidate');
    res.setHeader('Access-Control-Allow-Origin', 'https://opawork.vercel.app');
    const { name } = req.body
    const { id } = req.params
    console.log(id, name)
    try {
        if (!id || !name) {
            return res.status(400).json({ success: 400, message: 'ID and name are required' });
        }
        await clientDB.connect()
        // Encuentra y actualiza el documento del usuario
        const result = await clientDB.db("opawork").collection("user").updateOne(
            { _id: new ObjectId(id) }, // Filtro para encontrar al usuario
            {
                $pull: {
                    benefits: name // Elimina el ítem con el contact_id especificado
                }
            }
        );

        // Verifica si se realizó una actualización
        if (result.modifiedCount === 0) {
            console.log('No se encontró el documento o el ítem ya no estaba en el array.');
        } else {
            console.log('Ítem eliminado correctamente.');
        }
    } catch (error) {
        console.error('Error al eliminar el ítem:', error);
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
router.delete("/api/delete_benefits_user/:id", cors(), async (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 's-max-age=1, stale-while-revalidate');
    res.setHeader('Access-Control-Allow-Origin', 'https://opawork.vercel.app');
    const { name } = req.body
    const { id } = req.params
    console.log(id, name)
    try {
        if (!id || !name) {
            return res.status(400).json({ success: 400, message: 'ID and name are required' });
        }
        await clientDB.connect()
        // Encuentra y actualiza el documento del usuario
        const result = await clientDB.db("opawork").collection("user").updateOne(
            { _id: new ObjectId(id) }, // Filtro para encontrar al usuario
            {
                $pull: {
                    benefits: name // Elimina el ítem con el contact_id especificado
                }
            }
        );

        // Verifica si se realizó una actualización
        if (result.modifiedCount === 0) {
            console.log('No se encontró el documento o el ítem ya no estaba en el array.');
        } else {
            console.log('Ítem eliminado correctamente.');
        }
    } catch (error) {
        console.error('Error al eliminar el ítem:', error);
    }
});



router.delete("/api/delete_knoledge_user/:id", cors(), async (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 's-max-age=1, stale-while-revalidate');
    res.setHeader('Access-Control-Allow-Origin', 'https://opawork.vercel.app');
    const { name } = req.body
    const { id } = req.params
    console.log(id, name)
    try {
        if (!id || !name) {
            return res.status(400).json({ success: 400, message: 'ID and name are required' });
        }
        await clientDB.connect()
        // Encuentra y actualiza el documento del usuario
        const result = await clientDB.db("opawork").collection("user").updateOne(
            { _id: new ObjectId(id) }, // Filtro para encontrar al usuario
            {
                $pull: {
                    knoledge: name // Elimina el ítem con el contact_id especificado
                }
            }
        );

        // Verifica si se realizó una actualización
        if (result.modifiedCount === 0) {
            console.log('No se encontró el documento o el ítem ya no estaba en el array.');
        } else {
            console.log('Ítem eliminado correctamente.');
        }
    } catch (error) {
        console.error('Error al eliminar el ítem:', error);
    }
});
//contact en ruta 
router.get("/api/get_benefits_user/:id", cors(), async (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 's-max-age=1, stale-while-revalidate');
    res.setHeader('Access-Control-Allow-Origin', /* 'https://opawork.vercel.app' */'http://localhost:3000');
    const { id } = req.params
    try {
        if (!id) {
            return res.status(400).json({ success: 400, message: 'ID and name are required' });
        }
        await clientDB.connect()
        // Encuentra y actualiza el documento del usuario
        const updatedUser = await clientDB.db("opawork").collection("user").findOne({ _id: new ObjectId(id) });
        const benefits = updatedUser ? updatedUser.benefits : [];


        // Verifica si se realizó una actualización
        res.status(200).json({ success: 200, benefits });
    } catch (error) {
        console.error('Error al eliminar el ítem:', error);
    }
});
router.get("/api/update_knoledge_user/:id", cors(), async (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 's-max-age=1, stale-while-revalidate');
    res.setHeader('Access-Control-Allow-Origin', 'https://opawork.vercel.app');
    const { id } = req.params
    try {
        if (!id) {
            return res.status(400).json({ success: 400, message: 'ID and name are required' });
        }
        await clientDB.connect()
        // Encuentra y actualiza el documento del usuario
        const updatedUser = await clientDB.db("opawork").collection("user").findOne({ _id: new ObjectId(id) });
        const knoledge = updatedUser ? updatedUser.knoledge : [];


        // Verifica si se realizó una actualización
        res.status(200).json({ success: 200, knoledge });
    } catch (error) {
        console.error('Error al eliminar el ítem:', error);
    }
});
router.get("/api/get_knoledge_user/:id", cors(), async (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 's-max-age=1, stale-while-revalidate');
    res.setHeader('Access-Control-Allow-Origin', /* 'https://opawork.vercel.app' */'http://localhost:3000');
    const { id } = req.params
    try {
        if (!id) {
            return res.status(400).json({ success: 400, message: 'ID and name are required' });
        }
        await clientDB.connect()
        // Encuentra y actualiza el documento del usuario
        const updatedUser = await clientDB.db("opawork").collection("user").findOne({ _id: new ObjectId(id) });
        const knoledge = updatedUser ? updatedUser.knoledge : [];


        // Verifica si se realizó una actualización
        res.status(200).json({ success: 200, knoledge });
    } catch (error) {
        console.error('Error al eliminar el ítem:', error);
    }
});



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
router.get("/api/postulations/:id", cors(), async (req, res) => {
    /*     res.setHeader('Content-Type', 'application/json'); */
    res.setHeader('Cache-Control', 's-max-age=1, stale-while-revalidate');
    res.setHeader('Access-Control-Allow-Origin', /* 'https://opawork.vercel.app' */'http://localhost:3000');

    try {
        const { id } = req.params;
        console.log(id);
        if (!id) {
            return res.status(400).json({ message: 'user_id is required' });
        }
        await clientDB.connect();


        const applications = await clientDB.db("opawork").collection("application").aggregate([
            {
                $match: {
                    user_id: new ObjectId(id) // Filtramos por el usuario ID
                }
            },
            {
                $lookup: {
                    from: "job", // Nombre de la colección de aplicaciones
                    localField: "job_id", // Campo en la colección de usuarios que contiene el array de ObjectId
                    foreignField: "_id", // Campo en la colección de aplicaciones que coincide con los ObjectId
                    as: "applicationDetails" // Nombre del array resultante
                }
            }/* ,
            {
                $lookup: {
                    from: "job", // Nombre de la colección de trabajos
                    localField: "applicationDetails.empleo_id", // Campo en la colección de aplicaciones
                    foreignField: "_id", // Campo en la colección de trabajos
                    as: "jobDetails" // Nombre del array resultante
                }
            } */,/* ,
            {
                $lookup: {
                    from: "job", // Nombre de la colección de trabajos
                    localField: "aplicaciones", // Campo en la colección de aplicaciones
                    foreignField: "_id", // Campo en la colección de trabajos
                    as: "jobDetails" // Nombre del array resultante
                }
            }, */
            {
                $unwind: "$applicationDetails" // Desenrollamos el array resultante para acceder a los detalles del trabajo
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

router.post("/api/postulate", async (req, res) => {
    /*     res.setHeader('Content-Type', 'application/json'); */
    res.setHeader('Cache-Control', 's-max-age=1, stale-while-revalidate');
    res.setHeader('Access-Control-Allow-Origin', /* 'https://opawork.vercel.app' */'http://localhost:3000');
    try {
        const { jobId, userId, bussinesId } = req.body;
        console.log(jobId, userId, bussinesId);
        // Validar los datos de entrada
        if (!jobId || !userId || !bussinesId) {
            return res.status(400).json({ message: 'jobId, userId are required' });
        }

        // Agregar la postulación al trabajo (esto puede variar según tu modelo)
        /*    await clientDB.db("opawork").collection("job").insertOne({ jobId: "jobId", userId: "userId" })
    */
        // Agregar la postulación al usuario (esto puede variar según tu modelo)
        await clientDB.connect()
        await clientDB.db("opawork").collection("application").insertOne({
            user_id: new ObjectId(userId),
            job_id: new ObjectId(jobId),
            bussines_id: new ObjectId(bussinesId),
            apply_date: new Date(),
            apply_state: "En revision"
        }).catch(error => {
            console.error('Error inserting application:', error);
        });

        return res.status(200).json({
            message: 'Se ha enviado la postulación con éxito!',
            jobId,
            userId
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'An error occurred while processing your request', error: error.message });
    }
})
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







router.post("/api/create_advise/:id", async (req, res) => {
    /*     res.setHeader('Content-Type', 'application/json'); */
    res.setHeader('Cache-Control', 's-max-age=1, stale-while-revalidate');
    res.setHeader('Access-Control-Allow-Origin', /* 'https://opawork.vercel.app' */'https://localhost:3000');
    try {
        const { id } = req.params; // Corregir la desestructuración de params
        const { title, description, street, type, salary, experience, requirements, benefits, typeTime, company, sector,
            email, contactLinkedIn, contactPhone, department, country, location } = req.body;

        // Verificar que todos los campos obligatorios están presentes
        /*    if (!title || !description || !location || !type || !salary || !experience || !requirements || !user_id) {
               return res.status(400).json({ message: 'Todos los campos son obligatorios' });
           } */

        await clientDB.connect();

        // Verificar que el usuario existe
        const bussinesUser = await clientDB.db("opawork").collection("user").findOne({ _id: new ObjectId(id) });
        if (!bussinesUser) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }


        const newAdvise = {
            title: title,
            description: description,
            street: street,
            department: department,
            country: country,
            company: bussinesUser.contact_info.Email,
            user_id: new ObjectId(id),
            requirements: requirements,
            benefits: benefits,
            sector: sector,
            modJob: [
                {
                    "nombre": "Salario",
                    "data": `${salary}`
                },
                {
                    "nombre": "Experiencia",
                    "data": `${experience} años`
                },
                {
                    "nombre": "Ubicación",
                    "data": location
                },
                {
                    "nombre": "Tipo de trabajo",
                    "data": type
                },
                {
                    "nombre": "Horarios",
                    "data": typeTime
                }
            ],
            email: email,
            contactLinkedIn: contactLinkedIn,
            contactPhone: contactPhone,
            status_advise: "Activo",
            postedDate: new Date(),
        };
        console.log(newAdvise)
        const result = await clientDB.db("opawork").collection("job").insertOne(newAdvise);
        if (result.acknowledged) {


            const relatedUsers = await clientDB.db("opawork").collection("user").find({
                // Asume que tienes un campo o lógica que te permite encontrar usuarios relacionados
                sector: { $regex: sector, $options: 'i' }
            }).toArray();

            relatedUsers.forEach(user => {

                const mailOptions = {
                    from: 'opaawork@gmail.com',
                    to: user.email,
                    subject: `¡Nuevo anuncio! ${title}`,
                    text: `Hola ${user.nombre},\n\n ${company} ha publicado un nuevo anuncio que podría interesarte: ${title}.\n\nDescripción: ${description}\n\nSaludos,\nEl equipo de Opawork`
                };
                send(mailOptions);
            });


            console.log(result);
            res.status(201).json({ message: 'Anuncio creado exitosamente' });

        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'An error occurred while processing your request', error: error.message });
    } finally {
        clientDB.close();
    }
})





router.post('/api/login_account', async (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 's-max-age=1, stale-while-revalidate');
    res.setHeader('Access-Control-Allow-Origin', /* 'https://opawork.vercel.app' */'http://localhost:3000');
    res.setHeader('Access-Control-Allow-Credentials', "true");
    const { uLogin } = req.body;
    console.log(uLogin)
    try {
        // Verificar si el usuario existe
        const user = await clientDB.db("opawork").collection("user").findOne({ email: uLogin.email });
        if (!user) {
            return res.status(400).json({ msg: 'Credenciales inválidas' });
        }

        // Verificar la contraseña
        const isMatch = await bcrypt.compare(uLogin.password, user.password);
        if (!isMatch) {
            return res.status(400).json({ msg: 'Credenciales inválidas' });
        }

        // Crear un token y enviarlo en la respuesta
        const payload = { id: user.id };
        const token = jwt.sign(payload, 'secreta', { expiresIn: '1h' });

        res.json({
            success: 200,
            user: {
                id: user._id,
                nombre: user.nombre,
                email: user.email,
                photo: user.photo,
                phone: user.phone,
                city: user.city,
                street: user.street,
                country: user.country,
                description: user.description,
                type: user.type,
                contact_info: user.contact_info,
                benefits: user.benefits,
                knoledge: user.knoledge,
                first_experience: user.first_experience,
                works_information: user.works_information,
                education_information: user.education_information,
                lenguages: user.lenguages,
                sector: user.sector,
                // Añade otros campos que quieras devolver
            }
        });
    } catch (err) {

        console.error(err.message);
        res.status(500).send('Error en el servidor');
    }
});




router.post('/api/register_account', cors(), async (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 's-max-age=1, stale-while-revalidate');
    res.setHeader('Access-Control-Allow-Origin', /* 'https://opawork.vercel.app' */'http://localhost:3030');
    res.setHeader('Access-Control-Allow-Credentials', "true");

    const { uRegister } = req.body;
    console.log(uRegister);

    try {
        if (!uRegister) {
            return res.status(400).json({ msg: 'Todos los campos son obligatorios' });
        }
        await clientDB.connect()
        // Verificar si el usuario ya existe
        const user = await clientDB.db("mercado").collection("user").findOne({ email: uRegister.email });
        console.log(user)
        if (user) {
            return res.status(400).json({ msg: 'El usuario ya existe' });
        }

        // Hashear la contraseña antes de guardarla
        /*  const salt = await bcrypt.genSalt(10);
         const hashedPass = await bcrypt.hash(uRegister.password, salt); */

        // Crear un nuevo usuario basado en el modelo proporcionado
        /*         if (uRegister.is_bussines === false) {
         */
        const newUser = {

            email: uRegister.email,
            /*   password: hashedPass,
              type: 'person',
              aplicaciones: [], // Esto puede ser llenado luego o según el uRegister si se proporciona
              photo: "",
              sector: uRegister.sector || "",
              contact_info: [
                  {
                      name: "WhatsApp",
                      value: uRegister.phone
                  },
                  {
                      name: "Facebook",
                      value: ""
                  },
                  {
                      name: "Twitter",
                      value: ""
                  },
                  {
                      name: "LinkedIn",
                      value: ""
                  },
                  {
                      name: "Github",
                      value: ""
                  },
                  {
                      name: "Github",
                      value: ""
                  }

              ],
              benefits: uRegister.benefits || [],
              knoledge: uRegister.knoledge || [],
              description: uRegister.description || [],
              works_information: uRegister.works_information || [],
              education_information: uRegister.education_information || [],
              lenguages: uRegister.lenguages || [] */
        };

        const savedUser = await clientDB.db("mercado").collection("user").insertOne(newUser);

        if (savedUser.acknowledged === true) {
            res.json({
                success: 200,
                user: {
                    id: savedUser.insertedId, // MongoDB devuelve el ID en este campo
                    nombre: newUser.nombre,
                    email: newUser.email,
                    /*    type: newUser.type,
                       aplicaciones: newUser.aplicaciones,
                       photo: newUser.photo,
                       sector: newUser.sector,
                       contact_info: newUser.contact_info,
                       benefits: newUser.benefits,
                       knoledge: newUser.knoledge,
                       description: newUser.description,
                       works_information: newUser.works_information,
                       education_information: newUser.education_information,
                       lenguages: newUser.lenguages,
                       sector: user.sector, */
                }
            });
        }

        if (uRegister.is_bussines === true) {

            const newUser = {
                nombre: uRegister.name,
                email: uRegister.email,
                password: hashedPass,
                type: 'person',
                aplicaciones: [], // Esto puede ser llenado luego o según el uRegister si se proporciona
                photo: "",
                sector: uRegister.sector || "",
                contact_info: [
                    {
                        name: "WhatsApp",
                        value: uRegister.phone
                    },
                    {
                        name: "Facebook",
                        value: ""
                    },
                    {
                        name: "Twitter",
                        value: ""
                    },
                    {
                        name: "LinkedIn",
                        value: ""
                    },
                    {
                        name: "Github",
                        value: ""
                    },
                    {
                        name: "Github",
                        value: ""
                    }

                ],
                benefits: uRegister.benefits || [],
                knoledge: uRegister.knoledge || [],
                description: uRegister.description || [],
                works_information: uRegister.works_information || [],
                education_information: uRegister.education_information || [],
                lenguages: uRegister.lenguages || [],
                sector: user.sector,
            };

            const savedUser = await clientDB.db("mercado").collection("user").insertOne(newUser);

            if (savedUser.acknowledged === true) {
                res.json({
                    success: 200,
                    user: {
                        id: savedUser.insertedId, // MongoDB devuelve el ID en este campo
                        nombre: newUser.nombre,
                        email: newUser.email,
                        type: newUser.type,
                        aplicaciones: newUser.aplicaciones,
                        photo: newUser.photo,
                        sector: newUser.sector,
                        contact_info: newUser.contact_info,
                        benefits: newUser.benefits,
                        knoledge: newUser.knoledge,
                        description: newUser.description,
                        works_information: newUser.works_information,
                        education_information: newUser.education_information,
                        lenguages: newUser.lenguages,
                    }
                });
            }
        }

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Error en el servidor');
    }
});


router.post("/api/all_advises_bussines/:id", async (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 's-max-age=1, stale-while-revalidate');
    res.setHeader('Access-Control-Allow-Origin', /* 'https://opawork.vercel.app' */'http://localhost:3000');
    try {
        const { id } = req.params;
        if (!id) {
            return res.status(400).json({ message: 'user_id is required' });
        }
        await clientDB.connect();

        console.log(id)
        const jobs = await clientDB.db("opawork").collection("user").aggregate([
            {
                $match: {
                    _id: new ObjectId(id) // Filtramos por el ID del usuario del negocio
                }
            },
            {
                $lookup: {
                    from: "job", // Nombre de la colección de trabajos
                    localField: "_id", // Campo en la colección de usuarios que coincide con el ObjectId
                    foreignField: "user_id", // Campo en la colección de trabajos que coincide con el ObjectId del usuario
                    as: "jobs" // Nombre del array resultante
                }
            }
        ]).toArray();



        console.log(jobs)
        if (jobs.length > 0) {
            res.status(200).json(jobs);
            /*      clientDB.close(); */
        } else {
            res.status(404).json({ message: 'No se encontraron avisos para el usuario dado' });
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















export default router