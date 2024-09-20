import express from 'express';
import { createProduct, getAllProducts, getProductById, updateProduct } from '../controllers/product_controller.js';
import authenticate from '../middlewares/auth.js';
/* import checkPermission from '../middlewares/checkPermission.js';
 */
const router = express.Router();

// Crear un producto (solo vendedores autorizados)
/* router.post('/', authenticate,  checkPermission('create_product'),  createProduct);
 */
// Obtener todos los productos
router.get('/', getAllProducts);
router.get('/upload_product', createProduct);
router.post('/edit_product/:id', updateProduct);

router.get('/api/:id/:idProduct', getProductById);

/* // Actualizar un producto (solo el vendedor que lo creó o admin)
router.put('/:id', authenticate , checkPermission('update_product'), updateProduct);

// Eliminar un producto (solo el vendedor que lo creó o admin)
router.delete('/:id', authenticate , checkPermission('delete_product'), deleteProduct);  */

export default router;
