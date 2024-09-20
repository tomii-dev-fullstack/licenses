import { Router } from "express";
import { captureOrder, createOrder, saveOrderProducts } from "../controllers/orders_controller.js";
const router = Router();

// Crear un nuevo pedido
router.post('/orders',createOrder );
router.post('/orders/:orderID/capture',captureOrder );
router.post('/orders/save_products/:id',saveOrderProducts );

// Obtener pedidos del usuario autenticado
/* router.get('/my-orders', authenticate, orderController.getMyOrders);

// Obtener un pedido por ID (solo admins o el usuario que lo creó)
router.get('/:id', authenticate, orderController.getOrderById);

// Actualizar el estado de un pedido (solo admins o vendedores)
router.put('/:id', authenticate, checkPermission('update_order_status'), orderController.updateOrderStatus); */

export default router;
