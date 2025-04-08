// src/models/Product.js
import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  licenses: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'licencia'  // Referencia al modelo License
  }],
  webhookURL: {
    type: String,
    default: null
  },
}, {
  timestamps: true
}, {
  collection: "products"
});

export default mongoose.model('Product', productSchema);
