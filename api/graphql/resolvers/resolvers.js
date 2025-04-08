import mongoose from 'mongoose';
import licencia from '../../models_db/licence.js';
import license from '../../models_db/licence.js';
import Product from '../../models_db/product.js';
import generateLicenseKey from '../../utils/generate.js';
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

    validateLicense: async (_, { key, productId }) => {
      const license = await license.findOne({ key, product: productId });

      if (!license || license.status !== 'active') return false;

      license.usageCount += 1;
      await license.save();

      return true;
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
  }
};
