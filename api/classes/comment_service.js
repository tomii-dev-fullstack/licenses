import { clientDB } from "../../lib/database.js";
import { ObjectId } from "mongodb";

class CommentService {
    constructor() {
        this.collection = clientDB.db("mercado").collection('comment'); // Nombre de la colección de usuarios
    }


    async createComment(newComment) {
        // Buscar usuario por email
        const comments = await this.collection.insertOne(newComment);
        if (!comments) throw new Error('Error al crear el comentario');

        return comments
    }
    async getComments(productId) {
        // Buscar usuario por email
        const comments = await this.collection.find({ product_id: new ObjectId(productId) }).toArray();
        if (!comments) throw new Error('Error al obtener los comentarios del producto');

        return comments
    }
    async getAllComments(id) {
        // Buscar usuario por email
        const all_comments = await this.collection.find({ product_owner_id: new ObjectId(id) }).toArray();
        if (!all_comments) throw new Error('Error al obtener los comentarios de los productos');

        return all_comments
    }
}

export default CommentService;
