import { Router } from 'express';

/* import checkPermission from '../middlewares/checkPermission.js';
 */
import { getTransaccions, postTransaccions } from "../controllers/transaccions_controller.js"
const router = Router();

// Crear un producto (solo vendedores autorizados)
/* router.post('/', authenticate,  checkPermission('create_product'),  createProduct);
 */
// Obtener todos los productos

// Obtener un producto por ID
router.get('/transacciones', getTransaccions);
router.post('/add-transaction', postTransaccions);
/* router.post('/:id/:idProduct', getAllReviews); */

/* // Actualizar un producto (solo el vendedor que lo creó o admin)
router.put('/:id', authenticate , checkPermission('update_product'), updateProduct);

// Eliminar un producto (solo el vendedor que lo creó o admin)
router.delete('/:id', authenticate , checkPermission('delete_product'), deleteProduct);  */

export default router;
