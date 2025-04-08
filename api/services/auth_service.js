/* // src/services/licenseService.js
import licencia from '../models_db/licence.js';
import Product from '../models_db/product.js';
import generateLicenseKey from '../utils/generate.js';

export const getLicense = async (key) => {
  return await licencia.findOne({ key })
};
export const getLicenses = async () => {
  try {
    const licenses = await licencia.find();
    return licenses;
  } catch (err) {
    console.error('Error fetching licenses:', err);
    throw new Error('Error fetching licenses');
  }
};

export const createLicense = async (productId) => {
  const product = await Product.findById(productId);
  if (!product) throw new Error('Product not found');

  const license = await licencia.create({
    key: generateLicenseKey(),
    product: productId,
    user: product.name, // Replace with actual user logic,
    status: product.status || 'active',
    usageCount: product.usageCount || 0,
    createdAt: product.createdAt || new Date(),
  });

  return license;
};

export const revokeLicense = async (key) => {
  const license = await licencia.findOneAndUpdate(
    { key },
    { status: 'revoked' },
    { new: true }
  );

  if (!license) throw new Error('License not found');

  return license;
};

export const validateLicense = async (key, productId) => {
  const license = await licencia.findOne({ key, product: productId });
  if (!license || license.status !== 'active') return false;

  license.usageCount += 1;
  await license.save();

  return true;
};
 */