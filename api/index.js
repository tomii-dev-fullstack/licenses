
import express from 'express'; // Importa express 
import { startServer, app } from './routes/route.js'; // Importa la función desde server.js
import dotenv from 'dotenv';
import cors from 'cors';
import cookieParser from 'cookie-parser';
dotenv.config();
app.use(cookieParser());
app.use(cors({
  origin: 'http://localhost:5173', credentials: true,
}));
app.use(express.json());
// Llamar a la función para iniciar el servidor
startServer().catch((err) => {
  console.error('❌ Error al iniciar el servidor:', err);
});

