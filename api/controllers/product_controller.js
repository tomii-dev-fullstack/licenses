import { ObjectId } from 'mongodb';
import ProductService from '../classes/product_service.js';
import { deleteFileFromS3, uploadFileToS3 } from "../s3/s3.js"
import jwt from "jsonwebtoken"
import UserService from '../classes/user_service.js';
const productService = new ProductService();
const userService = new UserService()




export const createProduct = async (req, res) => {
    try {
        const { title, colors, supplier, stock, price, description } = req.body;
        const token = req.cookies?.sessionToken;

        if (!token) {
            return res.status(401).json({ error: 'No autorizado' });
        }

        // Decodificar el token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Crear array de productos con imágenes
        const product = {
            user_id: new ObjectId(decoded.id),
            item: title,
            proveedor: supplier,
            colores: colors,
            stock: Number(stock),
            precio: Number(price),
            descripcion: description,
            imagenes: req.files.map(file => ({
                filename: file.originalname,
            }))// Aquí puedes agregar la lógica para almacenar la ruta de la imagen si lo necesitas
        }
        // Guardar el producto usando el servicio de producto
        const savedProduct = await productService.createProduct(product);

        // Subir las imágenes a S3 (si esta lógica es requerida, descomenta esta sección)

        if (savedProduct.acknowledged) {
            const uploadPromises = req.files.map(file => uploadFileToS3(file, decoded.id, savedProduct.insertedId));
            await Promise.all(uploadPromises);  // Esperar a que todos los archivos se suban
        }


        // Responder con éxito
        res.status(200).json({
            message: 'Producto cargado exitosamente',
            status: 200,
        });
    } catch (error) {
        console.error('Error al crear el producto:', error);
        res.status(500).json({ message: 'Error al crear el producto' });
    }
};

// Obtener todos los productos
export const getAllProducts = async (req, res) => {
    try {
        const token = req.cookies?.sessionToken;

        if (!token) {
            return res.status(401).json({ error: 'No autorizado' });
        }

        // Decodificar el token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const products = await productService.getAllProducts(decoded.id);
        console.log(products)
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
export const getOnlyProductById = async (req, res) => {
    try {
        const { id, idProduct } = req.params;

        // Validación mejorada de los parámetros
        if (!id || !idProduct) {
            return res.status(400).json({ message: 'Both id and idProduct are required' });
        }

        const product = await productService.getOnlyProductById(idProduct);
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
        const { editedRows } = req.body;  // Obtener el ID del producto desde la URL
        console.log(editedRows);

        /*   const updatedProduct = await productService.editProduct(product._id, updateData);
          if (!updatedProduct) {
              return res.status(404).json({ message: 'Producto no actualizado' });
          } */
        res.status(200).json({
            message: 'Producto actualizado exitosamente',
            status: 200,

        });
    } catch (error) {
        console.error('Error al actualizar el producto:', error);
        res.status(500).json({ message: 'Error al actualizar el producto' });
    }
};

// Eliminar una imagen
export const deleteImage = async (req, res) => {
    try {
        const token = req.cookies?.sessionToken;

        if (!token) {
            return res.status(401).json({ error: 'No autorizado' });
        }
        // Decodificar el token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const { selectedFile } = req.body
        if (selectedFile && decoded) {
            /*    const user = await userService.getUserById(decoded.email) */
            /* const idProduct = await productService.getImageProduct(decoded.id, selectedFile.image) */
            const deleteImageOnProduct = await productService.deleteImageOfProduct(selectedFile.productId, selectedFile.image)
            if (deleteImageOnProduct) {
                await deleteFileFromS3(selectedFile.image, decoded.id, selectedFile.productId)
                res.status(200).json({ message: 'Imagen eliminada' });
            }
        }
    } catch (error) {
        console.error('Error al eliminar la imagen:', error);
        res.status(500).json({ message: 'Error al eliminar la imagen' });
    }
};
export const uploadImageToProduct = async (req, res) => {
    try {
        const token = req.cookies?.sessionToken;

        if (!token) {
            return res.status(401).json({ error: 'No autorizado' });
        }
        // Decodificar el token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const image = req.files
        const { product_id } = req.body
        console.log(image, product_id);
        if (image && decoded) {
            const uploadImageOnProduct = await productService.uploadImageOfProduct(product_id, image[0].originalname)
            if (uploadImageOnProduct) {
                await req.files.map(file => uploadFileToS3(file, decoded.id, product_id))
                res.status(200).json({ message: 'Imagen subida' });
            }
        }
    } catch (error) {
        console.error('Error al eliminar la imagen:', error);
        res.status(500).json({ message: 'Error al subir la imagen' });
    }
};
export const getAllImagesOfProducts = async (req, res) => {
    try {
        const token = req.cookies?.sessionToken;

        if (!token) {
            return res.status(401).json({ error: 'No autorizado' });
        }
        // Decodificar el token
        const decoded = jwt.verify(token, process.env.JWT_SECRET)
        if (decoded) {
            const images = await productService.getAllImages(decoded.id)

            if (images) {
                res.status(200).json({ data: images });
            }
        }
    } catch (error) {
        console.error('Error al eliminar la imagen:', error);
        res.status(500).json({ message: 'Error al eliminar la imagen' });
    }
};
export const getSuppliers = async (req, res) => {
    try {

        const products = await productService.getSuppliers()

        if (products.length > 0) {
            res.status(200).json({ data: products });
        }

    } catch (error) {
        console.error('Error al obtener categorias:', error);
        res.status(500).json({ message: 'Error al obtener los productos' });
    }
};
export const getProductsByCategory = async (req, res) => {
    try {
        const {category} = req.body
    
        const products = await productService.getProductsByCategory(category)

        if (products.length > 0) {
            res.status(200).json({ data: products });
        }

    } catch (error) {
        console.error('Error al obtener categorias:', error);
        res.status(500).json({ message: 'Error al obtener los productos' });
    }
};
