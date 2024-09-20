import { Router } from "express";
import cors from "cors";
import { checkAuth, getAllProductsById, login, logout, register } from "../controllers/user_controller.js"
const router = Router();

// Registro de usuarios
router.post('/register', register);
router.get('/own_store/:id', getAllProductsById)

// Inicio de sesión
router.post('/login_with_google', /* authenticate */login);
router.get('/check-auth', /* authenticate */checkAuth);
router.post('/logout', /* authenticate */logout);


export default router;
