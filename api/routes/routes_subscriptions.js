import { Router } from 'express';
import { captureSubscription, createSubscription ,cancelSubscription} from '../controllers/subscription_controller.js';
/* import checkPermission from '../middlewares/checkPermission.js';
 */
const router = Router();

// Crear un producto (solo vendedores autorizados)
/* router.post('/', authenticate,  checkPermission('create_product'),  createProduct);
 */
// Obtener todos los productos

// Obtener un producto por ID
router.post('/create_subscription', createSubscription);
router.post('/capture_subscription', captureSubscription);
router.post('/cancel_subscription', cancelSubscription);

/* // Actualizar un producto (solo el vendedor que lo creó o admin)
router.put('/:id', authenticate , checkPermission('update_product'), updateProduct);

// Eliminar un producto (solo el vendedor que lo creó o admin)
router.delete('/:id', authenticate , checkPermission('delete_product'), deleteProduct);  */

export default router;
