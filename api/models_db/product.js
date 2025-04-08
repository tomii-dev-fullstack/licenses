// src/models/Product.js
import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
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
