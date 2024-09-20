import { ObjectId } from 'mongodb';
import ProductService from '../classes/product_service.js';
import { uploadFileToS3 } from "../s3/s3.js"
const productService = new ProductService();

// Crear un producto
export const createProduct = async (req, res) => {
    try {
        const product = {
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
        }
        const savedProduct = await productService.createProduct(product); // req.user.id proviene del middleware de autenticación
        if (savedProduct.acknowledged) {

            const uploadPromises = req.files.map(file => uploadFileToS3(file, req.body.user, savedProduct.insertedId))
            await Promise.all(uploadPromises);  // Esperar a que todos los archivos se suban
        }

        // Responder con éxito
        res.status(200).json({
            message: 'Producto cargado exitosamente',
            status: 200,
            product_id: added.insertedId
        });
    } catch (error) {
        console.error('Error al crear el producto:', error);
        res.status(500).json({ message: 'Error al crear el producto' });
    }
};

// Obtener todos los productos
export const getAllProducts = async (req, res) => {
    try {
        const products = await productService.getAllProducts();
        res.status(200).json({ data: products });
    } catch (error) {
        console.error('Error al obtener los productos:', error);
        res.status(500).json({ message: 'Error al obtener los productos' });
    }
};


// Obtener un producto por ID
export const getProductById = async (req, res) => {
    try {
        const { id, idProduct } = req.params;

        // Validación mejorada de los parámetros
        if (!id || !idProduct) {
            return res.status(400).json({ message: 'Both id and idProduct are required' });
        }

        const product = await productService.getProductById(idProduct);
        if (!product) {
            return res.status(404).json({ message: 'Producto no encontrado' });
        }
        if (product.length > 0) {
            return res.status(200).json({ data: product });
        } else {
            return res.status(404).json({ message: 'No products found for the given ID' });
        }

    } catch (error) {
        console.error('Error al obtener el producto:', error);
        res.status(500).json({ message: 'Error al obtener el producto' });
    }
};

// Actualizar un producto
export const updateProduct = async (req, res) => {
    try {
        const { id } = req.params;  // Obtener el ID del producto desde la URL
        if (!id) {
            return res.status(404).json({
                message: 'Falta el id',
                status: 404
            });
        }
        const product = await productService.getProductByIdForUpdate(id);
        if (!product) {
            return res.status(404).json({
                message: 'Producto no encontrado',
                status: 404
            });
        }
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
        if (req.files && req.files.length > 0) {
            updateData.images = req.files.map(file => file.originalname);  // Actualizar con nuevas imágenes
        }

        const updatedProduct = await productService.editProduct(product._id, updateData);
        if (!updatedProduct) {
            return res.status(404).json({ message: 'Producto no actualizado' });
        }
        res.status(200).json(updatedProduct);
    } catch (error) {
        console.error('Error al actualizar el producto:', error);
        res.status(500).json({ message: 'Error al actualizar el producto' });
    }
};

// Eliminar un producto
/* export const deleteProduct = async (req, res) => {
    try {
        const deletedProduct = await productService.deleteProduct(req.params.id);
        if (!deletedProduct) {
            return res.status(404).json({ message: 'Producto no encontrado' });
        }
        res.status(200).json({ message: 'Producto eliminado' });
    } catch (error) {
        console.error('Error al eliminar el producto:', error);
        res.status(500).json({ message: 'Error al eliminar el producto' });
    }
};
 */