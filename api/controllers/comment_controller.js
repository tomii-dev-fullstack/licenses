import { ObjectId } from 'mongodb';
import CommentService from '../classes/comment_service.js';

const commentController = new CommentService();

// Registro de usuario
export const getComments = async (req, res) => {
    const { productId } = req.query;  // Obtener el productId de los query params
    // Validar que el productId esté presente
    if (!productId) {
        return res.status(400).json({ message: 'El ID del producto es requerido.' });
    }

    try {
        // Conectarse a la base de datos y buscar los comentarios por productId


        // Realizar la búsqueda de comentarios
        const comments = await commentController.getComments(productId);
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

};
export const getAllComments = async (req, res) => {
    // Validar que el productId esté presente
    try {
        const { id } = req.params
        if (!id) {
            return res.status(400).json({ message: 'El ID es requerido.' });
        }
        // Conectarse a la base de datos

        // Realizar la búsqueda de comentarios en la colección
        const comments = await commentController.getAllComments(id);

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

    }

};

// Inicio de sesión
export const createComment = async (req, res) => {

    const { newQueryObject } = req.body;
    if (!newQueryObject) {
        return res.status(400).json({ message: 'El ID del producto es requerido y debe ser una cadena de texto.' });
    }


    try {

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
        const result = await commentController.createComment(newComment);

        // Responder con el comentario recién creado y el ID generado
        return res.status(201).json({ data: result });
    } catch (error) {
        console.error('Error al guardar el comentario:', error);
        res.status(500).json({ message: 'Error al guardar el comentario.' });
    }
};

