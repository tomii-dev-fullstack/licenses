import { ObjectId } from "mongodb";
import { clientDB } from "../../lib/database.js";
import jwt from "jsonwebtoken";

class BlogService {
    constructor() {
        this.collection = clientDB.db("tienda").collection('blog'); // Nombre de la colección de usuarios
    }

    async getart() {
        return this.collection.find().toArray();

    }
}

export default BlogService;
