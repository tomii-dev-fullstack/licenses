import { ObjectId } from 'mongodb';
import ProductService from '../classes/product_service.js';
import { deleteFileFromS3, getObjectFromS3, uploadFileToS3 } from "../s3/s3.js"
import jwt from "jsonwebtoken"
import UserService from '../classes/user_service.js';
import OrderService from '../classes/order_service.js';
import { Payment, Preference, MercadoPagoConfig } from 'mercadopago';
const productService = new ProductService();
const oService = new OrderService();
// SDK de Mercado Pago
// Agrega credenciales

const clientMP = new MercadoPagoConfig({ accessToken: 'APP_USR-6666012562184757-121615-07b1f0e92942a7caff5c29f2adfaf100-1187609678' });


export const createProduct = async (req, res) => {
    try {
        const { body: data, files: archivos } = req;
        console.log(data);
        // Validar datos básicos
        if (!data || !data.titulo || !data.productoTipo || !data.categoria) {
            return res.status(400).json({ message: 'Datos incompletos en el cuerpo de la solicitud.' });
        }

        // Parsear las variantes e imágenes del body
        const variantes = data.variantes || '[]'; // Variantes como JSON
        const imagenesGenerales = archivos.filter(file => file.fieldname.startsWith('imagenes')); // Imágenes generales

        // Validar si el producto es único o tiene variantes
        const esProductoConVariantes = variantes.length > 0;

        if (esProductoConVariantes) {
            // Validar que todas las variantes tengan datos completos
            for (let variant of variantes) {
                if (!variant.color || !variant.peso) {
                    return res.status(400).json({ message: 'Datos incompletos en una o más variantes.' });
                }
            }
            console.log(variantes)
            // Asignar imágenes subidas a las variantes
            variantes.forEach((variant, index) => {
                const imagenCampo = `variantes[${index}][imagen]`;
                const archivo = archivos.find(file => file.fieldname === imagenCampo);
                if (archivo) {
                    variant.imagen = archivo.originalname;
                    variant.path = archivo.path;
                }
            });

        } else {
            // Validar que existan imágenes generales si no hay variantes
            if (imagenesGenerales.length === 0) {
                return res.status(400).json({ message: 'Se requieren imágenes para un producto sin variantes.' });
            }
        }

        // Preparar el objeto del producto
        const product = {
            creado: new Date(),
            titulo: data.titulo,
            descripcion: data.descripcion,
            productoTipo: data.productoTipo,
            categoria: data.categoria,
            imagenes: esProductoConVariantes ? [] : imagenesGenerales.map(file => ({
                nombre: file.originalname,
                /*   imagen: file.path */
            })),
            estado: true,
            variantes: esProductoConVariantes ? variantes.map(variant => ({
                color: variant.color,
                imagen: variant.imagen,
                peso: variant.peso
            })) : []
        };

        // Subir imágenes de variantes (si las hay)
        if (esProductoConVariantes) {
            await Promise.all(
                variantes.map(async (variant, index) => {
                    if (variant.imagen && variant.path) {
                        try {
                            const subidaExitosa = await uploadFileToS3(variant, data.productoTipo);
                            if (!subidaExitosa) {
                                console.error(`Error al subir la imagen de la variante ${index}`);
                            } else {
                                console.log(`Imagen de la variante ${index} subida exitosamente.`);
                            }
                        } catch (error) {
                            console.error(`Error al subir la imagen de la variante ${index}:`, error);
                        }
                    }
                })
            );
        }

        // Subir imágenes generales (si no hay variantes)
        if (!esProductoConVariantes) {
            console.log(imagenesGenerales)
            await Promise.all(
                imagenesGenerales.map(async (file, index) => {
                    try {
                        const subidaExitosa = await uploadFileToS3(file, data.productoTipo);
                        if (!subidaExitosa) {
                            console.error(`Error al subir la imagen general ${index}`);
                        } else {
                            console.log(`Imagen general ${index} subida exitosamente.`);
                        }
                    } catch (error) {
                        console.error(`Error al subir la imagen general ${index}:`, error);
                    }
                })
            );
        }

        // Crear producto en la base de datos
        const createdProduct = await productService.createProduct(product);
        if (!createdProduct) {
            return res.status(500).json({ message: 'Error al guardar el producto en la base de datos.' });
        }

        // Responder con éxito
        res.status(200).json({
            message: 'Producto creado exitosamente',
            /*    producto: createdProduct */
        });
    } catch (error) {
        console.error('Error al crear el producto:', error);
        res.status(500).json({ message: 'Error interno al crear el producto.' });
    }
};

/* export const createProduct = async (req, res) => {
    try {
        const { body: data, files: archivos } = req;
        const variantes = data.variantes || '[]';

        if (!data || !variantes.length) {
            return res.status(400).json({ message: 'Datos incompletos o archivos no enviados' });
        }

        // Asignar imágenes subidas a las variantes
        variantes.forEach((variant, index) => {
            const imagenCampo = `variantes[${index}][imagen]`;
            const archivo = archivos.find(file => file.fieldname === imagenCampo);
            if (archivo) {
                variant.imagen = archivo.originalname
                variant.path = archivo.path
            }
        });

        const product = {
            titulo: data.titulo,
            descripcion: data.descripcion,
            productoTipo: data.productoTipo,
            categoria: data.categoria,
            variantes: data.variantes.map(variant => ({
                color: variant.color,
                imagen: variant.imagen,
                peso: variant.peso
            }))
        };
        await Promise.all(
            variantes.map(async (variant, index) => {
                const { imagen } = variant;

                if (!imagen) {
                    console.log(`No hay imagen para la variante ${index}`);
                    return;
                }

                try {
                    // Subir la imagen a S3 primero
                    const subidaExitosa = await uploadFileToS3(variant);
                    if (!subidaExitosa) {
                        console.error(`Error al subir la imagen de la variante ${index}.`);
                        return;
                    }

                    console.log(`Imagen de la variante ${index} subida exitosamente.`);

                    // Actualizar la base de datos con la imagen subida
                    const updatedProduct = await productService.createProduct(product);
                    if (!updatedProduct) {
                        console.warn(`Producto no actualizado para la variante ${index}`);
                        return;
                    }

                    console.log(`Producto actualizado correctamente para la variante ${index}.`);
                } catch (error) {
                    console.error(`Error procesando la imagen de la variante ${index}:`, error);
                }
            })
        );

        // Responder después de que todas las operaciones hayan finalizado
        res.status(200).json({
            message: 'Producto cargado exitosamente',
            status: 200,
        });


        // Responder con éxito
    } catch (error) {
        console.error('Error al crear el producto:', error);
        res.status(500).json({ message: 'Error al crear el producto' });
    }
}; */
export const createSimpleOrder = async (req, res) => {
    try {
        const { payload } = req.body;
        console.log(payload);
        // Validación inicial de los datos enviados
       /*   if (
             !payload ||
             !payload.items || payload.items.length === 0 ||
             !payload.totalAmount || isNaN(payload.totalAmount) ||
             !payload.subtotal || isNaN(payload.subtotal) ||
             payload.discountAmount === undefined || isNaN(payload.discountAmount) ||
             !payload.fullName || payload.fullName === "" ||
             !payload.deliveryOption || payload.deliveryOption === "" ||
             !payload.address || payload.address === "" ||
             !payload.city || payload.city === "" ||
             !payload.postalCode || payload.postalCode === "" ||
             !payload.phone || payload.phone === "" ||
             !payload.email || !/^[\w.-]+@[a-zA-Z\d.-]+\.[a-zA-Z]{2,}$/.test(payload.email) // Validación básica de email
         ) {
             return res.status(400).json({
                 message: 'Datos incompletos o inválidos: asegúrate de llenar todos los campos requeridos correctamente.',
                 errors: {
                     items: payload.items && payload.items.length > 0 ? null : "Se requieren items en el carrito.",
                     totalAmount: !isNaN(payload.totalAmount) ? null : "totalAmount debe ser un número válido.",
                     subtotal: !isNaN(payload.subtotal) ? null : "subtotal debe ser un número válido.",
                     discountAmount: !isNaN(payload.discountAmount) ? null : "discountAmount debe ser un número válido.",
                     fullName: payload.fullName && payload.fullName ? null : "fullName es obligatorio.",
                     deliveryOption: payload.deliveryOption && payload.deliveryOption ? null : "deliveryOption es obligatorio.",
                     address: payload.address && payload.address ? null : "address es obligatorio.",
                     city: payload.city && payload.city ? null : "city es obligatorio.",
                     postalCode: payload.postalCode && payload.postalCode ? null : "postalCode es obligatorio.",
                     phone: payload.phone && payload.phone ? null : "phone es obligatorio.",
                     email: /^[\w.-]+@[a-zA-Z\d.-]+\.[a-zA-Z]{2,}$/.test(payload.email) ? null : "email debe ser válido."
                 }
             });
         } 
 */
        // Construcción de la orden
        const order = {
            fullName: payload.fullName,
            deliveryOption: payload.deliveryOption,
            address: payload.address,
            apartment: payload.apartment,
            city: payload.city,
            postalCode: payload.postalCode,
            phone: payload.phone,
            email: payload.email,
            notes: payload.notes,
            paymentMethod: payload.paymentMethod,
            items: payload.items,
            totalAmount: payload.totalAmount,
            subtotal: payload.subtotal,
            discountAmount: payload.discountAmount,
            createdAt: new Date(), // Marca de tiempo para la orden
        };

        if (payload.paymentMethod === "mp") {

            const payment = new Preference(clientMP);

            payment.create({
                body: {
                    items: payload.items.map(item => ({
                        title: item.titulo || "Producto sin título", // Ajusta según la estructura de tu carrito
                        quantity: item.cantidad || 1,
                        unit_price: item.precio || 0, // Ajusta para el precio
                    })),
                }
            })
                .then(async (response) => {
                    try {
                        // Extraer el sandbox_init_point
                        const sandbox_init_point = response.sandbox_init_point;
                        console.log('Sandbox Init Point:', sandbox_init_point);

                        // Crear la orden en la base de datos
                        const createdOrder = await oService.createOrdenOne(order);
                        if (!createdOrder) {
                            console.error('Error al crear la orden en la base de datos');
                            return res.status(500).json({
                                message: 'No se pudo crear la orden. Inténtalo de nuevo más tarde.',
                            });
                        }

                        // Responder con el sandbox_init_point o realizar otra acción
                        return res.status(200).json({
                            message: 'Orden creada con éxito.',
                            sandbox_init_point: sandbox_init_point,
                        });
                    } catch (error) {
                        console.error('Error al procesar la creación de la orden:', error);
                        return res.status(500).json({
                            message: 'Hubo un problema al crear la orden.',
                        });
                    }
                })
                .catch((error) => {
                    console.error('Error al crear el pago:', error);
                    return res.status(500).json({
                        message: 'Hubo un problema al procesar el pago.',
                    });
                });
        }

        const createdOrder = await oService.createOrdenOne(order);
        if (!createdOrder) {
            console.error('Error al crear la orden en la base de datos');
            return res.status(500).json({
                message: 'No se pudo crear la orden. Inténtalo de nuevo más tarde.',
            });
        }
        // Crear la orden en la base de datos
        /* const createdOrder = await oService.createOrdenOne(order);

    // Validar si la orden fue creada exitosamente
    */

        // Responder con éxito


    } catch (error) {
        // Manejo de errores generales
        console.error('Error inesperado al crear la orden:', error);
        return res.status(500).json({
            message: 'Error interno del servidor al crear la orden.'
        });
    }
};


// Obtener todos los productos
export const getAllProducts = async (req, res) => {
    try {
        /* const token = req.cookies?.sessionToken;

        if (!token) {
            return res.status(401).json({ error: 'No autorizado' });
        }

        // Decodificar el token
        const decoded = jwt.verify(token, process.env.JWT_SECRET); */
        const products = await productService.getAllProducts();
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
export const gProductForEdit = async (req, res) => {
    try {
        const { id } = req.params;
        console.log(id)
        // Validación mejorada de los parámetros
        if (!id) {
            return res.status(400).json({ message: 'Both id and idProduct are required' });
        }

        const product = await productService.gProductById(id);
        if (!product) {
            return res.status(404).json({ message: 'Producto no encontrado' });
        }
        if (product.length > 0) {
            return res.status(200).json({ data: product[0] });
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
        // Capturar el ID del producto desde los parámetros de la URL
        const { id } = req.params;

        // Capturar subCategory desde el cuerpo de la solicitud
        const { subcategory } = req.body.parametros || {}; // Manejo de casos donde no se envíen parámetros

        console.log("ID del producto:", id);
        console.log("Subcategoría:", subcategory);

        // Validaciones
        if (!id) {
            return res.status(400).json({ message: 'El ID del producto es requerido.' });
        }
        if (!subcategory) {
            return res.status(400).json({ message: 'La subcategoría es requerida.' });
        }

        // Obtener el producto y los relacionados
        const result = await productService.getOnlyProductById(id, subcategory);

        console.log("Producto y relacionados:", result);

        if (!result.product) {
            return res.status(404).json({ message: 'Producto no encontrado.' });
        }

        // Responder con éxito
        return res.status(200).json({
            success: true,
            data: {
                product: result.product,
                relatedProducts: result.relatedProducts,
            },
        });

    } catch (error) {
        console.error('Error al obtener el producto:', error);
        return res.status(500).json({ message: 'Error al obtener el producto.' });
    }
};


// Actualizar un producto
export const updateProduct = async (req, res) => {
    try {
        const { body: data, files: archivos } = req;
        const variantes = data.variantes || '[]';

        if (!data || !variantes.length) {
            return res.status(400).json({ message: 'Datos incompletos o archivos no enviados' });
        }

        // Asignar imágenes subidas a las variantes
        variantes.forEach((variant, index) => {
            const imagenCampo = `variantes[${index}][imagen]`;
            const archivo = archivos.find(file => file.fieldname === imagenCampo);
            if (archivo) {
                variant.imagen = archivo.originalname
                variant.path = archivo.path
            }
        });

        // Subir imágenes a S3 si no existen
        console.log("la data cruda es" + JSON.stringify(data))
        console.log("la data de variantes es" + JSON.stringify(variantes))
        await Promise.all(
            variantes.map(async (variant, index) => {
                const { imagen } = variant;
                if (!imagen) return console.log(`No hay imagen para la variante ${index}`);

                try {
                    const imagenExiste = await getObjectFromS3(variant.originalname);
                    if (imagenExiste !== null) {
                        console.log(`La imagen de la variante ${index} ya existe en S3.`);
                        return;
                    }

                    /*           console.log(`Subiendo imagen de la variante ${index} a S3...`);
                */
                    const subidaExitosa = await uploadFileToS3(variant);

                    if (subidaExitosa) {
                        /* console.log(`Imagen de la variante ${index} subida exitosamente.`); */
                        // Actualizar la base de datos si es necesario
                        const updatedProduct = await productService.saveImages(data);
                        if (!updatedProduct) return res.status(404).json({ message: 'Producto no actualizado' });
                        // await productService.updateVariantImage(variant.id, imagen.originalname);
                    } else {
                        console.error(`Error al subir la imagen de la variante ${index}.`);
                    }
                } catch (error) {
                    console.error(`Error procesando la imagen de la variante ${index}:`, error);
                }
            })
        );

        // Aquí puedes realizar otras actualizaciones relacionadas con el producto
        // Ejemplo:
        // const updatedProduct = await productService.editProduct(data);
        // if (!updatedProduct) return res.status(404).json({ message: 'Producto no actualizado' });

        res.status(200).json({ message: 'Producto actualizado exitosamente', status: 200 });
    } catch (error) {
        console.error('Error al actualizar el producto:', error);
        res.status(500).json({ message: 'Error al actualizar el producto' });
    }
};

/* export const updateProduct = async (req, res) => {
    try {
        const { editedRows } = req.body;  // Obtener el ID del producto desde la URL
        console.log(editedRows);

          const updatedProduct = await productService.editProduct(product._id, updateData);
          if (!updatedProduct) {
              return res.status(404).json({ message: 'Producto no actualizado' });
          } 
        res.status(200).json({
            message: 'Producto actualizado exitosamente',
            status: 200,

        });
    } catch (error) {
        console.error('Error al actualizar el producto:', error);
        res.status(500).json({ message: 'Error al actualizar el producto' });
    }
}; */

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
export const getDestacados = async (req, res) => {
    try {

        const products = await productService.getDestacados()
        console.log(products)
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
        const { category } = req.body

        const products = await productService.getProductsByCategory(category)

        if (products.length > 0) {
            res.status(200).json({ data: products });
        }

    } catch (error) {
        console.error('Error al obtener categorias:', error);
        res.status(500).json({ message: 'Error al obtener los productos' });
    }
};
export const obtenerDatosDeCategoriaElegida = async (req, res) => {
    try {
        const { productType, category } = req.body
        console.log(productType, category)
        const products = await productService.obtenerDatosDeCategoriaElegida(productType, category)

        if (products.length > 0) {
            console.log(products)
            res.status(200).json({ data: products });
        }

    } catch (error) {
        console.error('Error al obtener categorias:', error);
        res.status(500).json({ message: 'Error al obtener los productos' });
    }
};
export const getProductsByProductType = async (req, res) => {
    try {


        const products = await productService.getProductsByProdType()
        console.log(products)
        if (products.length > 0) {
            res.status(200).json({ data: products });
        }

    } catch (error) {
        console.error('Error al obtener categorias:', error);
        res.status(500).json({ message: 'Error al obtener los productos' });
    }
};
export const registersearch = async (req, res) => {
    try {
        const { query } = req.body
        console.log(query);
        const products = await productService.rsearch(query)
        console.log("Coincidencias: " + products)
        if (products.length > 0) {
            res.status(200).json({ data: products });
        }

    } catch (error) {
        console.error('Error al obtener categorias:', error);
        res.status(500).json({ message: 'Error al obtener los productos' });
    }
};
export const deleteProd = async (req, res) => {
    try {
        const { id } = req.params

        const products = await productService.deleteProdu(id)
        if (products.acknowledged) {
            res.status(200).json({ success: 200, message: 'Producto eliminado exitosamente' });
        }

    } catch (error) {
        console.error('Error al obtener categorias:', error);
        res.status(500).json({ message: 'Error al obtener los productos' });
    }
};
export const getOrder = async (req, res) => {
    try {

        const orders = await oService.getOrderSimple()
        if (orders.length > 0) {
            console.log(orders)
            res.status(200).json({ success: 200, data: orders });
        }

    } catch (error) {
        console.error('Error al obtener categorias:', error);
        res.status(500).json({ message: 'Error al obtener los productos' });
    }
};
export const getOrderbyid = async (req, res) => {
    try {
        const { id } = req.params
        const orders = await oService.getOrderSimpleId(id)
        if (orders.length > 0) {
            console.log(orders)
            res.status(200).json({ success: 200, data: orders });
        }

    } catch (error) {
        console.error('Error al obtener categorias:', error);
        res.status(500).json({ message: 'Error al obtener los productos' });
    }
};
