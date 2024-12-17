
import BlogService from '../classes/blog_service.js'; // Importación con ES Modules
import { ObjectId } from "mongodb";

const blogService = new BlogService();

export const getArticles = async (req, res) => {
    try {

        const articles = await blogService.getart()
        if (articles.length > 0) {
            console.log(articles)
            res.status(200).json({ success: 200, data: articles });
        }

    } catch (error) {
        console.error('Error al eliminar la imagen:', error);
        res.status(500).json({ message: 'Error al subir la imagen' });
    }
};