import mongoose from 'mongoose';

const licenseSchema = new mongoose.Schema({
  key: { type: String, required: true },
  user: { type: String, required: true },
  status: { type: String, required: true },
  usageCount: { type: Number, default: 0 },
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true }, // Asegúrate de que el ID del producto sea un ObjectId
  createdAt: { type: Date, default: Date.now },  // Asegúrate de usar el tipo Date para createdAt
  expiresAt: { type: Date },  // Asegúrate de usar el tipo Date para expiresAt
},{
  collection:"licencia"
});

const licencia = mongoose.model('licencia', licenseSchema);
export default licencia;
