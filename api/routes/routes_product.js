import express from 'express';
import multer from 'multer';
import path from 'path';
const router = express.Router();
import { createProduct, getAllProducts,registersearch, getOnlyProductById,obtenerDatosDeCategoriaElegida,getProductsByProductType, getProductById, updateProduct ,deleteImage, getAllImagesOfProducts,uploadImageToProduct, getSuppliers, getProductsByCategory, deleteProd, createSimpleOrder, getOrder, getOrderbyid, gProductForEdit, getDestacados, deleteimages, deleteImagep, deleteProduct, registerPayment} from '../controllers/product_controller.js';
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
router.post('/get-product-by-id/:id', getOnlyProductById);
router.post('/register-payment', registerPayment);
router.get('/get-product-for-edit/:id', gProductForEdit);
router.post('/orders', createSimpleOrder);
router.get('/getorders', getOrder);
router.get('/orders/:id', getOrderbyid);
router.get('/products', getAllProducts);
router.get('/get-suppliers', getSuppliers);
router.get('/get-destacados', getDestacados);
router.get('/all-images', getAllImagesOfProducts);
router.get('/productsbyproductstype', getProductsByProductType);
router.put('/save-edits', upload.any(), updateProduct);
router.put('/update-product/:id', upload.any(), deleteImagep);
router.delete('/delete-product/:id', deleteProduct);
/* router.put('/deleteimage', upload.any(), deleteimages); */
router.post('/add-product', upload.any(), createProduct);
router.post('/editimage', deleteImage);
router.post('/edit_product/:id', updateProduct);
router.post('/productsbycategory', getProductsByCategory);
router.post('/obtenerdatosdecategoriaelegida', obtenerDatosDeCategoriaElegida);
router.post('/registersearch', registersearch);
router.delete('/deleteproduct/:id', deleteProd);

router.post('/upload-product-image', upload.array("image"), uploadImageToProduct);

router.get('/:id/:idProduct', getProductById);

/* // Actualizar un producto (solo el vendedor que lo creó o admin)
router.put('/:id', authenticate , checkPermission('update_product'), updateProduct);

// Eliminar un producto (solo el vendedor que lo creó o admin)
router.delete('/:id', authenticate , checkPermission('delete_product'), deleteProduct);  */

export default router;
