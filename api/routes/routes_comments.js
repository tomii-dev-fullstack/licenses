import { Router } from 'express';

import { createComment, getAllComments, getComments } from '../controllers/comment_controller.js';
/* import checkPermission from '../middlewares/checkPermission.js';
 */
const router = Router();

// Crear un producto (solo vendedores autorizados)
/* router.post('/', authenticate,  checkPermission('create_product'),  createProduct);
 */
// Obtener todos los productos
/*  router.get('/', getAllProducts); */
router.get('/queries', getComments);
router.get('/all_queries/:id', getAllComments);
router.post('/queries', createComment);

/* router.get('/api/:id/:idProduct', getProductById); */

/* // Actualizar un producto (solo el vendedor que lo creó o admin)
router.put('/:id', authenticate , checkPermission('update_product'), updateProduct);

// Eliminar un producto (solo el vendedor que lo creó o admin)
router.delete('/:id', authenticate , checkPermission('delete_product'), deleteProduct);  */

export default router;
