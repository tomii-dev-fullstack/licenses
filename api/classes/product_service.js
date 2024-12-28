import { ObjectId } from "mongodb";
import { clientDB } from "../../lib/database.js";

// services/ProductService.js
class ProductService {
    constructor() {
        this.collection = clientDB.db("tienda").collection('product'); // Nombre de la colección de usuarios
    }

    async getAllProducts() {
        return this.collection.find().toArray();
    }
    /*     async getAllProducts() {
            return this.collection.aggregate([
                {
                    $lookup: {
                        from: "user",
                        localField: "user_id",
                        foreignField: "_id",
                        as: "products"
                    }
                },
                {
                    $unwind: "$products"
                }
            ]).toArray();
        } */
    async getImageProduct(userId, image) {
        return this.collection.aggregate([
            {
                $match: {
                    user_id: new ObjectId(userId), // Filtra por user_id
                    imagenes: image // Filtra los productos que contienen la imagen
                }
            },
            {
                $project: {
                    _id: 1 // Devuelve solo el ID del producto
                }
            }
        ]).toArray();
    }

    /*   async getOnlyProductById(productId, category, subCategory) {
          return this.collection.find({ _id: new ObjectId(productId) }).toArray();
      } */
    async getOnlyProductById(productId, subCategory) {
        console.log(productId, subCategory);
        const product = await this.collection.find({ _id: new ObjectId(productId) }).toArray();
        const relatedProducts = await this.collection.find({ categoria: subCategory }).toArray();

        return { product, relatedProducts };
    }

    async gProductById(id) {
        return await this.collection.find({ _id: new ObjectId(id) }).toArray();
    }




    async getProductById(productId) {
        return this.collection.aggregate([
            {
                $match: {
                    _id: new ObjectId(productId) // Filtramos por el product ID
                }
            },
            {
                $lookup: {
                    from: "user", // Nombre de la colección de aplicaciones
                    localField: "user_id", // Campo en la colección de trabajos que coincide con el ObjectId
                    foreignField: "_id", // Campo en la colección de aplicaciones que coincide con el ObjectId del trabajo
                    as: "user_details" // Nombre del array resultante
                }
            },
            {
                $unwind: "$user_details" // Desplazamos los datos del array de aplicaciones
            },
            {
                $lookup: {
                    from: "review", // Nombre de la colección de aplicaciones
                    localField: "_id", // Campo en la colección de trabajos que coincide con el ObjectId
                    foreignField: "product_id", // Campo en la colección de aplicaciones que coincide con el ObjectId del trabajo
                    as: "product_details" // Nombre del array resultante
                }
            }
        ]).toArray();
    }


    async createProduct(product) {
        return this.collection.insertOne(product)
    }
    async getProductByIdForUpdate(id) {
        return this.collection.collection("product").findOne({ _id: new ObjectId(id) });
    }
    async deleteProdu(id) {
        return this.collection.deleteOne({ _id: new ObjectId(id) });
    }



    async getProductsByCategory(category) {
        console.log(category);
        return this.collection.aggregate([
            {
                $match: { categoria: category }
            }
        ]).toArray();
    }

    async obtenerDatosDeCategoriaElegida(p, c) {

        return this.collection.aggregate([
            {
                $match: { categoria: c, productoTipo: p }
            }
        ]).toArray();
    }
    async rsearch(q) {
        return this.collection.aggregate([
            {
                $match: {
                    titulo: {
                        $regex: q,
                        $options: "i", // Insensible a mayúsculas/minúsculas
                    },
                },
            },
            {
                $project: {
                    titulo: 1, // Incluir el campo título
                    productoTipo: 1, // Incluir el campo productoTipo
                    categoria: 1, // Incluir el campo categoria
                    variantes: 1,
                    precio: 1,
                    imagenes: 1
                },
            },
        ]).toArray();
    }

    async getProductsByProdType() {
        try {
            const results = await this.collection.aggregate([
                {
                    $group: {
                        _id: "$productoTipo", // Agrupar por productoTipo
                        categorias: { $addToSet: "$categoria" } // Consolidar categorías únicas en un array
                    }
                },
                {
                    $project: {
                        _id: 0, // Excluir el _id del resultado
                        productoTipo: "$_id", // Renombrar _id a productoTipo
                        categorias: 1 // Incluir las categorías
                    }
                }
            ]).toArray();
            console.log(results)
            return results;
        } catch (error) {
            console.error("Error fetching products and categories:", error);
            throw new Error("Could not fetch products and categories");
        }
    }

    async getSuppliers() {
        try {
            // Accede directamente a la colección de productos desde `this.collection`
            const suppliers = await this.collection.distinct("categoria");

            return suppliers;
        } catch (error) {
            console.error('Error fetching suppliers:', error);
            throw new Error('Could not fetch suppliers');
        }
    }
    async getDestacados() {
        try {
            // Accede directamente a la colección de productos desde `this.collection`
            const destacados = this.collection.find({ destacado: true }).toArray();
            return destacados;
        } catch (error) {
            console.error('Error fetching destacados:', error);
            throw new Error('Could not fetch destacados');
        }
    }



    async editProduct(product) {
        // Extraemos el `_id` del producto y eliminamos este campo del objeto `updateData`
        const { id, ...updateData } = product;

        // Realizamos la operación de actualización usando `$set`
        const productUpdate = await this.collection.updateOne(
            { _id: new ObjectId(id) }, // Filtrar por el ID del producto
            { $set: updateData } // Solo actualizamos los campos enviados
        );

        // Retornamos el resultado de la operación
        return productUpdate;
    }
    async saveImages(data) {
        console.log(data)
        try {
            // Validar que los parámetros sean válidos
            if (!data) {
                throw new Error('Parámetros insuficientes');
            }

            // Actualizar solo la imagen de la variante específica
            if (data.productoConVariantes === "no") {

                const updateQuery = {
                    titulo: data.titulo,
                    descripcion: data.descripcion,
                    imagenes: data.imagenes,
                    productoTipo: data.productoTipo,
                    categoria: data.categoria,
                    color: data.color,
                    precio: data.precio,
                    variantes: []
                };

                console.log(updateQuery)
                const productUpdate = await this.collection.updateOne(
                    { _id: new ObjectId(data.id) }, // Filtrar por ID del producto
                    {
                        $set: updateQuery, // Solo actualizar los campos proporcionados
                    }
                );

                if (productUpdate.matchedCount === 0) {
                    console.warn(`No se encontró el producto con ID: ${productId}`);
                    return null; // Indicar que no se encontró el producto
                }


                return productUpdate;
            }
            else {
                const updateQuery = {
                    titulo: data.titulo,
                    descripcion: data.descripcion,
                    productoTipo: data.productoTipo,
                    imagenes: [],
                    categoria: data.categoria,
                    variantes: data.variantes.map(variant => ({
                        dato_1_col: variant.dato_1_col,
                        dato_2_mul: variant.dato_2_mul,
                        dato_3_pre: variant.dato_3_pre,
                        imagen: variant.imagen
                    }))
                };

                console.log(updateQuery)
                const productUpdate = await this.collection.updateOne(
                    { _id: new ObjectId(data.id) }, // Filtrar por ID del producto
                    {
                        $set: updateQuery, // Solo actualizar los campos proporcionados
                    }
                );

                if (productUpdate.matchedCount === 0) {
                    console.warn(`No se encontró el producto con ID: ${productId}`);
                    return null; // Indicar que no se encontró el producto
                }


                return productUpdate;
            }
        } catch (error) {
            console.error('Error actualizando la imagen de la variante:', error);
            throw error; // Propagar el error para manejarlo en el flujo superior
        }
    }



    /*  async editProduct(productId, updateData) {
         const productUpdate = await this.collection.updateOne(
             { _id: new ObjectId(productId) },
             { $set: updateData }
         );
         return productUpdate
     } */


    async dProduct(productId) {
        const productDeleted = await this.collection.deleteOne(
            { _id: new ObjectId(productId) }
        );
        return productDeleted

    }



    async upproduct(data) {
        try {
            // Verifica si es un producto sin variantes
            if (data.productoConVariantes === "no") {

                // Mapeamos las imágenes para extraer los datos que queremos agregar
                const imagenes = data.imagesAdded ? data.imagesAdded.map((imagen) => ({
                    nombre: imagen.nombre, // Asegúrate de que 'nombre' esté presente en cada imagen

                })) : [];

                // Construimos el objeto de actualización
                const updateData = {
                    productoConVariantes: data.productoConVariantes,
                    titulo: data.titulo,
                    descripcion: data.descripcion,
                    productoTipo: data.productoTipo,
                    categoria: data.categoria,
                    color: data.color,
                    precio: Number(data.precio),
                    variantes: [] // Si no hay variantes, se agrega un array vacío
                };

                const updateQuery = {
                    $set: updateData
                };

                // Si hay nuevas imágenes, agregamos al array `imagesAdded`
                if (imagenes.length > 0) {
                    updateQuery.$push = {
                        imagesAdded: { $each: imagenes }
                    };
                }

                // Si hay imágenes para eliminar, usamos $pull
                if (Array.isArray(data.imagesDeleted) && data.imagesDeleted.length > 0) {
                    // Crear un array para almacenar los nombres de las imágenes a eliminar
                    const nombresAEliminar = [];

                    data.imagesDeleted.forEach((imageStr) => {
                        // Convertir el string en un objeto JSON
                        const imageObj = JSON.parse(imageStr);

                        // Corregir la clave "nombre" si aparece entre comillas
                        const correctedImageObj = {};
                        for (const key in imageObj) {
                            const correctedKey = key.replace(/"/g, ""); // Eliminar las comillas de la clave
                            correctedImageObj[correctedKey] = imageObj[key];
                        }

                        // Añadir el nombre al array de nombres a eliminar
                        nombresAEliminar.push(correctedImageObj.nombre);

                        console.log('Nombre de la imagen eliminada:', correctedImageObj.nombre);
                    });

                    // Construir la consulta $pull con los nombres recopilados
                    if (nombresAEliminar.length > 0) {
                        updateQuery.$pull = {
                            imagesAdded: { nombre: { $in: nombresAEliminar } }
                        };
                    }

                    console.log('Consulta $pull construida:', updateQuery);
                }





                try {
                    /* JSON.stringify(data.imagesDeleted) */
                    // Ejecutamos la actualización
                    const productUpdate = await this.collection.updateOne(
                        { _id: new ObjectId(data.id) },
                        updateQuery
                    );

                    console.log("Producto actualizado con nuevas imágenes.");
                    return productUpdate;
                } catch (error) {
                    console.error("Error actualizando las imágenes del producto:", error);
                    throw new Error("Error actualizando las imágenes del producto");
                }
            } else {


                /* ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- */
                const actualizarProducto = async (collection, id, data) => {
                    const updateSetQuery = {};

                    // Verificar si el título ha cambiado
                    if (data.titulo) {
                        updateSetQuery.titulo = data.titulo;
                    }

                    // Verificar si la descripción ha cambiado
                    if (data.descripcion) {
                        updateSetQuery.descripcion = data.descripcion;
                    }

                    // Si hay cambios en título o descripción, actualizamos el producto
                    if (Object.keys(updateSetQuery).length > 0) {
                        try {
                            const result = await collection.updateOne(
                                { _id: new ObjectId(id) },  // Buscar producto por ID
                                { $set: updateSetQuery }    // Aplicar los cambios
                            );
                            console.log("Producto actualizado correctamente:", result);
                        } catch (error) {
                            console.error("Error al actualizar el producto:", error);
                        }
                    }
                };

                // Generar un ObjectId para cada variante si no tiene uno
                const agregarVariantes = async (collection, data, variantesParaAgregar) => {
                    // Si hay variantes para agregar
                    console.log("agregar variantes: " + JSON.stringify(variantesParaAgregar))
                    if (variantesParaAgregar.length > 0) {
                        // Asignamos un _id a cada variante y aseguramos que el precio sea un número
                        const variantesConIdYPrecio = variantesParaAgregar.map((variante,index) => ({
                            dato_1_col: variante.dato_1_col,
                            dato_2_mul: variante.dato_2_mul,
                            imagen: data.imagesAdded[index].nombre || null,
                            dato_3_pre: Number(variante.dato_3_pre) || 0, // Convertimos el precio a número (si no es válido, asignamos 0)
                            _id: variante._id || new ObjectId(), // Si no tiene _id, asignamos uno nuevo

                        }));

                        // Realizamos la actualización, agregando las variantes al array "variantes"
                        await collection.updateOne(
                            { _id: new ObjectId(data.id) },
                            { $push: { variantes: { $each: variantesConIdYPrecio } } }
                        );

                        console.log("Nuevas variantes agregadas correctamente.");
                    }
                };
                const variantesParaEliminar = async (id, variantesParaEliminar) => {
              
                    if (variantesParaEliminar?.length > 0) {
                        try {
                            // Construimos una condición para eliminar cada variante por su `_id`
                            const condicionesParaEliminar = variantesParaEliminar?.map((variante) => ({ _id: new ObjectId(variante._id) }));

                            // Realizamos la actualización, eliminando variantes específicas del array "variantes"
                            const result = await this.collection.updateOne(
                                { _id: new ObjectId(id) },
                                { $pull: { variantes: { $or: condicionesParaEliminar } } } // Usamos $or para aplicar múltiples condiciones
                            );

                            console.log("Variantes eliminadas correctamente:", result);
                        } catch (error) {
                            console.error("Error al eliminar variantes:", error);
                        }
                    }
                };




                const obtenerVariantesParaAgregar = (nuevasVariantes, variantesExistentes) => {
                    return nuevasVariantes.filter(nuevaVariante =>
                        !variantesExistentes.some(varianteExistente =>
                            nuevaVariante._id && nuevaVariante._id.toString() === varianteExistente._id.toString()
                        )
                    );
                };

                const obtenerVariantesParaEditar = (nuevasVariantes, variantesExistentes) => {
              
                    return variantesExistentes
                        .filter(varianteExistente =>
                            nuevasVariantes.some(nuevaVariante => {
                                const nuevaId = nuevaVariante._id?.toString();
                                const existenteId = varianteExistente._id?.toString();
                                console.log("Comparando IDs:", { nuevaId, existenteId });
                                return nuevaId === existenteId;
                            })
                        )
                        .map(varianteExistente => {
                            const nuevaVariante = nuevasVariantes.find(nueva => {
                                const nuevaId = nueva._id?.toString();
                                const existenteId = varianteExistente._id?.toString();
                                console.log("Buscando nueva variante:", { nuevaId, existenteId });
                                return nuevaId === existenteId;
                            });

                            console.log("Nueva variante encontrada:", nuevaVariante);

                            if (!nuevaVariante) return null; // Ignorar si no hay una variante nueva que coincida

                            const cambios = {};
                            if (nuevaVariante.dato_1_col !== varianteExistente.dato_1_col) {
                                cambios.dato_1_col = nuevaVariante.dato_1_col;
                            }
                            if (nuevaVariante.dato_2_mul !== varianteExistente.dato_2_mul) {
                                cambios.dato_2_mul = nuevaVariante.dato_2_mul;
                            }
                            if (Number(nuevaVariante.dato_3_pre) !== Number(varianteExistente.dato_3_pre)) {
                                cambios.dato_3_pre = Number(nuevaVariante.dato_3_pre);
                            }
                            if (nuevaVariante.imagen !== varianteExistente.imagen) {
                                cambios.imagen = nuevaVariante.imagen;
                            }

                            return {
                                _id: varianteExistente._id,
                                cambios,
                            };
                        })
                        .filter(edit => edit !== null && Object.keys(edit.cambios).length > 0); // Filtrar cambios vacíos
                };

                const actualizarVariantes = async (collection, id, variantesParaEditar) => {
                    if (variantesParaEditar.length > 0) {
                        for (const { _id, cambios } of variantesParaEditar) {
                            const updateSetQuery = {};
                            console.log(cambios)
                            // Construimos el $set para solo los campos que tienen cambios
                            if (cambios.dato_1_col) {
                                updateSetQuery[`variantes.$[variante].dato_1_col`] = cambios.dato_1_col;
                            }
                            if (cambios.dato_2_mul) {
                                updateSetQuery[`variantes.$[variante].dato_2_mul`] = cambios.dato_2_mul;
                            }
                            if (cambios.dato_3_pre) {
                                updateSetQuery[`variantes.$[variante].dato_3_pre`] = cambios.dato_3_pre;
                            }
                            if (cambios.imagen) {
                                updateSetQuery[`variantes.$[variante].imagen`] = cambios.imagen;
                            }

                            // Aplicamos solo si hay cambios en el objeto
                            if (Object.keys(updateSetQuery).length > 0) {
                                try {
                                    const result = await collection.updateOne(
                                        { _id: new ObjectId(id) }, // Buscamos el documento por ID principal
                                        { $set: updateSetQuery }, // Aplicamos los cambios
                                        {
                                            arrayFilters: [
                                                { 'variante._id': new ObjectId(_id) } // Filtro para la variante específica
                                            ]
                                        }
                                    );

                                    console.log(`Actualización realizada para variante ${_id}:`, result);
                                } catch (error) {
                                    console.error(`Error al actualizar variante ${_id}:`, error);
                                }
                            }
                        }
                    }
                };


                try {
                    // Obtener el producto
                    const producto = await this.collection.findOne({ _id: new ObjectId(data.id) });

                    if (!producto) {
                        throw new Error("Producto no encontrado");
                    }
                    await actualizarProducto(this.collection, data.id, data);
                    const variantesExistentes = producto.variantes || [];
                    const nuevasVariantes = data.nuevas_variantes || [];
                    const variantes = data.variantes || [];
                    const variantesEliminar = data.variantes_borradas || [];

                    // Identificar variantes para agregar y editar
                    const variantesParaAgregar = obtenerVariantesParaAgregar(nuevasVariantes, variantesExistentes);
                    const variantesParaEditar = obtenerVariantesParaEditar(variantes, variantesExistentes);

       

                    // Agregar nuevas variantes
                    await agregarVariantes(this.collection, data, variantesParaAgregar);

                    // Editar variantes existentes
                    await actualizarVariantes(this.collection, data.id, variantesParaEditar);
                    await variantesParaEliminar(data.id, data.variantes_borradas)

                    console.log("Proceso de actualización de variantes completado.");
                } catch (error) {
                    console.error("Error al procesar variantes:", error);
                    throw error;
                }



                /*      const updateFields = {
                         productoConVariantes: data.productoConVariantes,
                         titulo: data.titulo,
                         descripcion: data.descripcion,
                         productoTipo: data.productoTipo,
                         categoria: data.categoria,
     
                     };
     
                     try {
                         // Actualizar campos generales
                         await this.collection.updateOne(
                             { _id: new ObjectId(data.id) },
                             { $set: updateFields }
                         );
                         console.log("Campos generales actualizados correctamente.");
                     } catch (error) {
                         console.error("Error actualizando campos generales:", error);
                         throw error;
                     }
     
     
     
     
     
     
                     // Función para comparar variantes basadas en propiedades clave
                     const sonVariantesIguales = (variant1, variant2) => {
                         return (
                             variant1.titulo === variant2.titulo &&
                             variant1.descripcion === variant2.descripcion &&
                             variant1.imagen === variant2.imagen
                         );
                     };
     
                     // Filtrar variantes para agregar
                     const variantesParaAgregar = data.nuevas_variantes?.filter(nuevaVariante =>
                         !data.variantes?.some(varianteExistente =>
                             sonVariantesIguales(nuevaVariante, varianteExistente)
                         )
                     );
     
                     // Filtrar variantes para actualizar
                     const variantesParaActualizar = data.variantes.filter(varianteExistente =>
                         data.nuevas_variantes?.some(nuevaVariante =>
                             sonVariantesIguales(nuevaVariante, varianteExistente)
                         )
                     );
     
                     const encontrarIndiceVariante = (variantes, varianteBuscada) => {
                         return variantes.findIndex(variant =>
                             variant.dato_1_col === varianteBuscada.dato_1_col &&
                             variant.dato_2_mul === varianteBuscada.dato_2_mul &&
                             variant.dato_3_pre === varianteBuscada.dato_3_pre &&
                             variant.imagen === varianteBuscada.imagen
                         );
                     };
     
     
                     const variantesParaEditar = data.variantes?.filter((varianteExistente, index) => {
                         // Compara cada campo de la variante existente con los datos proporcionados
                         return (
                             varianteExistente.dato_1_col !== data.variantes[index]?.dato_1_col ||
                             varianteExistente.dato_2_mul !== data.variantes[index]?.dato_2_mul ||
                             varianteExistente.dato_3_pre !== data.variantes[index]?.dato_3_pre ||
                             varianteExistente.imagen !== data.variantes[index]?.imagen
                         );
                     });
     
                     let v = JSON.stringify(data.variantes)
                     if (v.length > 0) {
                         const updateSetQuery = { $set: {} };
                         console.log("v: " + v)
                         variantesParaEditar.forEach((variantEdit) => {
                             const index = encontrarIndiceVariante(data.variantes, variantEdit);
                             if (index >= 0) {
                                 // Actualiza solo los campos que han cambiado
                                 if (variantEdit.dato_1_col !== data.variantes[index].dato_1_col) {
                                     updateSetQuery.$set[`variantes.${index}.dato_1_col`] = variantEdit.dato_1_col;
                                 }
                                 if (variantEdit.dato_2_mul !== data.variantes[index].dato_2_mul) {
                                     updateSetQuery.$set[`variantes.${index}.dato_2_mul`] = variantEdit.dato_2_mul;
                                 }
                                 if (variantEdit.dato_3_pre !== data.variantes[index].dato_3_pre) {
                                     updateSetQuery.$set[`variantes.${index}.dato_3_pre`] = Number(variantEdit.dato_3_pre);
                                 }
                                 if (variantEdit.imagen !== data.variantes[index].imagen) {
                                     updateSetQuery.$set[`variantes.${index}.imagen`] = variantEdit.imagen;
                                 }
     
                             }
                         });
                         if (Object.keys(updateSetQuery.$set).length > 0) {
                             try {
                                 await this.collection.updateOne({ _id: new ObjectId(data.id) }, updateSetQuery);
                                 console.log("Variantes actualizadas correctamente.");
                             } catch (error) {
                                 console.error("Error actualizando variantes:", error);
                                 throw error;
                             }
                         } else {
                             console.log("No hay cambios detectados en las variantes para actualizar.");
                         }
                     }
     
                     const updateData = {
                         productoConVariantes: data.productoConVariantes,
                         titulo: data.titulo,
                         descripcion: data.descripcion,
                         productoTipo: data.productoTipo,
                         categoria: data.categoria,
                         color: data.color,
                         precio: data.precio,
                         imagenes: [], // Si no hay nuevas imágenes, dejamos este array vacío
                     };
     
                     // Inicializamos la consulta de actualización
                     const updateQuery = {
                         $set: updateData
                     };
                     if (variantesParaActualizar.length > 0) {
                         const updateSetQuery = { $set: {} };
     
                         variantesParaActualizar.forEach((variant) => {
                             const index = data.variantes.findIndex(v =>
                                 sonVariantesIguales(v, variant)
                             );
     
                             if (index >= 0) {
                                 updateSetQuery.$set[`variantes.${index}.dato_1_col`] = variant.dato_1_col;
                                 updateSetQuery.$set[`variantes.${index}.dato_2_mul`] = variant.dato_2_mul;
                                 updateSetQuery.$set[`variantes.${index}.dato_3_pre`] = Number(variant.dato_3_pre);
                                 updateSetQuery.$set[`variantes.${index}.imagen`] = variant.imagen;
                             }
                         });
     
                         try {
                             await this.collection.updateOne({ _id: new ObjectId(data.id) }, updateSetQuery);
                             console.log("Variantes existentes actualizadas correctamente.");
                         } catch (error) {
                             console.error("Error actualizando variantes existentes:", error);
                             throw error;
                         }
                     }
     
                     if (variantesParaAgregar?.length > 0) {
                         const updatePushQuery = {
                             $push: {
                                 variantes: { $each: variantesParaAgregar },
                             },
                         };
     
                         try {
                             await this.collection.updateOne({ _id: new ObjectId(data.id) }, updatePushQuery);
                             console.log("Nuevas variantes agregadas correctamente.");
                         } catch (error) {
                             console.error("Error agregando nuevas variantes:", error);
                             throw error;
                         }
                     }
     
     
                     // Si hay imágenes para eliminar, usamos $pull
                     if (Array.isArray(data.imagesDeleted) && data.imagesDeleted.length > 0) {
                         const nombresParaEliminar = data.imagesDeleted.map(imagen => imagen.nombre);
                         console.log("Imágenes a eliminar:", nombresParaEliminar);
     
                         // Construimos la consulta $pull para eliminar las imágenes
                         updateQuery.$pull = {
                             imagesAdded: { nombre: { $in: nombresParaEliminar } }
                         };
                     } */


            }
        } catch (error) {
            console.error("Error actualizando producto: ", error);
            throw new Error("Error al actualizar el producto");
        }


    }
































    async uploadImageOfProduct(productId, image) {

        const productUpdate = await this.collection.updateOne(
            { _id: new ObjectId(productId) },

            {
                $push: {
                    imagenes: image  // Elimina la imagen específica del array de imágenes
                }
            }
        );
        return productUpdate
    }
    /*   async getAllImages(userId) {
          const products = await this.collection.find(
              { user_id: new ObjectId(userId) }, // Filtra por user_id
              { projection: { imagenes: 1 } } // Proyecta solo el campo 'imagenes'
          ).toArray();
      
          // Extraer todas las imágenes de los productos
          const allImages = products.flatMap(product => product.imagenes);
      
          return allImages;
      } */
    async getAllImages(userId) {
        const products = await this.collection.find(
            { user_id: new ObjectId(userId) }, // Filtra por user_id
            { projection: { imagenes: 1, user_id: 1 } } // Proyecta los campos necesarios
        ).toArray();

        // Extraer las imágenes junto con _id y user_id
        const allImagesWithDetails = products.flatMap(product =>
            product.imagenes.map(image => ({
                image: image, // Asumiendo que 'image' es una cadena o un objeto con la URL
                productId: product._id, // ID del producto
                userId: product.user_id // user_id del producto
            }))
        );

        return allImagesWithDetails;
    }


}

export default ProductService;
