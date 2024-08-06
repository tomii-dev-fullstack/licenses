import { Router } from "express";
import { clientDB } from "../../lib/database";
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

export default router