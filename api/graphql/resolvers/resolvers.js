import mongoose from 'mongoose';
import licencia from '../../models_db/licence.js';
import license from '../../models_db/licence.js';
import Product from '../../models_db/product.js';
import generateLicenseKey from '../../utils/generate.js';
import jwt from 'jsonwebtoken';  // Asegúrate de instalar la librería

export const resolvers = {
  Query: {
    getLicenses: async () => {
      try {
        return await license.find(); // Obtiene todas las licencias desde MongoDB
      } catch (err) {
        throw new Error('Error fetching licenses: ' + err.message);
      }
    },
    getLicense: async (_, { id }) => {
      const objectId = new mongoose.Types.ObjectId(id);
      return await license.findOne({ _id: objectId }); // Busca la licencia por ID
    },
    getLicensesByProduct: async (_, { productId }) => {
      try {
        const product = await Product.findById(productId).populate('licenses'); // Usamos populate para obtener las licencias asociadas
        if (!product) throw new Error('Producto no encontrado');

        return product.licenses; // Devuelve las licencias del producto
      } catch (err) {
        throw new Error('Error fetching licenses for product: ' + err.message);
      }
    }
  },

  Mutation: {

    generateLicense: async (_, { productId }) => {
      const product = await Product.findById(productId); // Busca el producto por ID
      if (!product) throw new Error('Producto no encontrado');

      // Crear la licencia con el ID del producto
      const license = await licencia.create({
        key: generateLicenseKey(),
        product: productId,
        user: product.name, // Replace with actual user logic,
        status: product.status || 'active',
        usageCount: product.usageCount || 0,
        createdAt: product.createdAt || new Date(),
      });

      return license;
    },
    revokeLicense: async (_, { key }) => {
      const result = await license.findOneAndUpdate(
        { key },
        { status: 'revoked' }
      );
      return !!result;
    },
    validateLicense: async (_, { key, productId }, { res }) => {
      console.log("Validando licencia:", key, productId); // Agrega un log para depuración
      try {
        const result = await license.findOne({ key, productId: new mongoose.Types.ObjectId(productId) })

        if (!result || result.status !== 'active') {
          return {
            success: false,
            message: 'Licencia no válida o inactiva',
          };
        }

        // Si usageCount es null o undefined, lo inicializa en 0
        result.usageCount = (result.usageCount || 0) + 1;
        await result.save();
        const token = jwt.sign(
          { userId: result.user, key: result.key },
          process.env.JWT_SECRET || 'clave-secreta',
          { expiresIn: '1h' }
        );

        // 🧁 Seteamos la cookie acá
        res.cookie('token', token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'Lax',
          maxAge: 60 * 60 * 1000, // 1 hora
        });
        return { success: true, token: token, message: 'Licencia válida' };
      } catch (error) {
        console.error("Error al validar la licencia:", error);
        return { success: false, message: 'Error al validar la licencia' };
      }
    },

    createProduct: async (_, { name, webhookURL }) => {
      try {
        const newProduct = new Product({
          name,
          webhookURL,
        });

        await newProduct.save(); // Guarda el nuevo producto en la base de datos
        return newProduct;
      } catch (error) {
        console.error('Error creando el producto:', error);
        throw new Error('Error creando el producto');
      }
    },
    logout: async (_, __, { res }) => {
      try {
        res.clearCookie('token', {
          httpOnly: true,
          sameSite: 'lax',
          secure: process.env.NODE_ENV === 'production',
        });
    
        return {
          success: true,
          message: 'Sesión cerrada correctamente',
        };
      } catch (error) {
        console.error('Error al cerrar sesión:', error);
    
        return {
          success: false,
          message: 'Hubo un error al cerrar la sesión',
        };
      }
    }    

  }
};
