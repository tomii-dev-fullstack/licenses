import { clientDB } from "../../lib/database.js";

class GpsService {
    constructor() {
        this.collection = clientDB.db("tienda").collection('gps'); // Nombre de la colección
    }

    // Registrar GPS (en lote)
    async register(gps) {
        // Validar que gps sea un array válido
        if (!Array.isArray(gps) || gps.length === 0) {
            throw new Error('El parámetro gps debe ser un array no vacío');
        }

        // Insertar los documentos en la base de datos
        try {
            const result = await this.collection.insertMany(gps);
            return result; // MongoDB devuelve información sobre la operación
        } catch (error) {
            console.error('Error al registrar GPS:', error);
            throw new Error('Error al registrar GPS en la base de datos');
        }
    }
    async getRoutes() {
        try {
            const pipeline = [
                // Clasificar la ruta por tipo
                {
                    $addFields: {
                        tipoRuta: {
                            $switch: {
                                branches: [
                                    { case: { $regexMatch: { input: "$ruta", regex: "^/shop/" } }, then: "producto" },
                                    { case: { $regexMatch: { input: "$ruta", regex: "^/servicios" } }, then: "servicio" },
                                    { case: { $regexMatch: { input: "$ruta", regex: "^/cart$" } }, then: "carrito" },
                                    { case: { $regexMatch: { input: "$ruta", regex: "^/$" } }, then: "inicio" },
                                    { case: { $regexMatch: { input: "$ruta", regex: "^/blog$" } }, then: "blog" }
                                ],
                                default: "otros"
                            }
                        }
                    }
                },
                // Extraer detalles según el tipo
                {
                    $project: {
                        ruta: 1,
                        tipoRuta: 1,
                        categoria: {
                            $cond: [
                                { $eq: ["$tipoRuta", "producto"] },
                                { $arrayElemAt: [{ $split: ["$ruta", "/"] }, 2] },
                                {
                                    $cond: [
                                        { $eq: ["$tipoRuta", "servicio"] },
                                        { $arrayElemAt: [{ $split: ["$ruta", "/"] }, 2] },
                                        null
                                    ]
                                }
                            ]
                        },
                        tipo: {
                            $cond: [
                                { $eq: ["$tipoRuta", "producto"] },
                                { $arrayElemAt: [{ $split: ["$ruta", "/"] }, 3] },
                                null
                            ]
                        },
                        titulo: {
                            $cond: [
                                {
                                    $or: [
                                        { $eq: ["$tipoRuta", "producto"] },
                                        { $eq: ["$tipoRuta", "servicio"] }
                                    ]
                                },
                                { $arrayElemAt: [{ $split: ["$ruta", "/"] }, 4] },
                                null
                            ]
                        },
                        dispositivoO_Navegador: {
                            // Si el navegador es null, usa el dispositivo
                            $ifNull: ["$navegador", "$dispositivo"]
                        }
                    }
                },
                // Agrupar por ruta (producto/servicio) y contar las visitas
                {
                    $group: {
                        _id: { ruta: "$ruta", tipoRuta: "$tipoRuta" },
                        visitas: { $sum: 1 },
                        categoria: { $first: "$categoria" },
                        tipo: { $first: "$tipo" },
                        titulo: { $first: "$titulo" },
                        dispositivoO_Navegador: { $first: "$dispositivoO_Navegador" }  // Agregar dispositivo o navegador al grupo
                    }
                },
                // Ordenar por cantidad de visitas (de mayor a menor)
                {
                    $sort: {
                        visitas: -1
                    }
                }
            ];
    
            // Ejecutar el pipeline directamente sobre la colección
            const resultados = await this.collection.aggregate(pipeline).toArray();
    
            // Mostrar resultados
            console.log(resultados);
            return resultados;
        } catch (error) {
            console.error("Error procesando rutas:", error);
            throw error;
        }
    }
    
    
    
    
}

export default GpsService;
