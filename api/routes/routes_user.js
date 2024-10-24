import { Router } from "express";
import { checkAuth, getAllProductsById, login, logout, postClient, register, getClients, postRequestModuleUser, removeModuleUser, updateServiceDescription, updateServiceData, getProfile } from "../controllers/user_controller.js"
import multer from "multer";
import path from 'path';
const router = Router();
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
// Registro de usuarios
router.post('/create_account_with_email', register);
router.get('/own_store/:id', getAllProductsById)

router.get('/get-profile', getProfile)
// Inicio de sesión
router.post('/sign_in_with_email', /* authenticate */login);
router.post('/request-module', /* authenticate */postRequestModuleUser);
router.post('/delete-module', /* authenticate */removeModuleUser);
router.post('/update-service-description', /* authenticate */updateServiceDescription);
router.post('/update-service-data', /* authenticate */upload.single("service_picture"),updateServiceData);
router.get('/check-auth', /* authenticate */checkAuth);
router.post('/logout', /* authenticate */logout);
router.post('/add-client', /* authenticate */postClient);
router.get('/clients', /* authenticate */getClients);
router.post('/api/logout', (req, res) => {
    // Elimina la cookie de sesión
    res.clearCookie('sessionToken', {
        httpOnly: true,
        secure: true,
        sameSite: 'strict'// pasar a otro val en prod
    });

    // Responde con un mensaje de éxito
    res.status(200).json({ message: 'Logout exitoso' });
});






export default router;
