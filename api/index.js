
import express from 'express'; // Importa express 
import { startServer,app } from './routes/route.js'; // Importa la función desde server.js
import dotenv from 'dotenv';
import cors from 'cors';
dotenv.config();

app.use(cors());
app.use(express.json());
// Llamar a la función para iniciar el servidor
startServer().catch((err) => {
  console.error('❌ Error al iniciar el servidor:', err);
});

