import express from 'express';
import multer from 'multer';
import path from 'path';
const router = express.Router();
import { createProduct, getAllProducts, getOnlyProductById, getProductById, updateProduct ,deleteImage, getAllImagesOfProducts,uploadImageToProduct, getSuppliers, getProductsByCategory} from '../controllers/product_controller.js';
/* import checkPermission from '../middlewares/checkPermission.js';
 */
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'api/uploads/');  // Carpeta donde se guardarán los archivos
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));  // Nombre único para evitar colisiones
    }
});
const upload = multer({ storage });
// Crear un producto (solo vendedores autorizados)
/* router.post('/', authenticate,  checkPermission('create_product'),  createProduct);
 */
// Obtener todos los productos
router.get('/products', getAllProducts);
router.get('/get-suppliers', getSuppliers);
router.get('/all-images', getAllImagesOfProducts);
router.post('/save-edits', updateProduct);
router.post('/add-product', upload.array("images"), createProduct);
router.post('/editimage', deleteImage);
router.post('/edit_product/:id', updateProduct);
router.post('/productsbycategory', getProductsByCategory);

router.post('/upload-product-image', upload.array("image"), uploadImageToProduct);

router.get('/api/:id/:idProduct', getProductById);
router.get('/api/:id', getOnlyProductById);

/* // Actualizar un producto (solo el vendedor que lo creó o admin)
router.put('/:id', authenticate , checkPermission('update_product'), updateProduct);

// Eliminar un producto (solo el vendedor que lo creó o admin)
router.delete('/:id', authenticate , checkPermission('delete_product'), deleteProduct);  */

export default router;
