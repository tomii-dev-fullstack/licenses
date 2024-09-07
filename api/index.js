import express from "express";
import { config } from "dotenv";
import cors from "cors";
import router from "./routes/routes.js";  // Tus rutas existentes
import cookieParser from "cookie-parser";
/* import { Server } from "socket.io";
import http from "http";
 */
config();

const app = express();
app.use(cors({ origin: ["https://unabuenauy.com", "http://localhost:3030"], methods: "GET, POST, PUT, DELETE", credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(router);  // Tus rutas normales de Express

// Crear el servidor HTTP a partir de Express
/* const server = http.createServer(app); */

// Inicializar socket.io con el servidor HTTP
/* const io = new Server(server, {
    cors: {
        origin: ["https://unabuenauy.com", "http://localhost:3030"],  // Orígenes permitidos
        methods: ["GET", "POST"],
        credentials: true
    }
}); */

// Manejar la conexión de WebSocket
/* io.on('connection', (socket) => {
    let productQueries = {};  // { productId: [{ userId, userName, text, timestamp }] }

    console.log('Un usuario se ha conectado', socket.id);

    // Manejar la conexión a una sala específica para un producto
    socket.on('joinProductRoom', (productId) => {
        socket.join(productId);
        console.log(`Usuario ${socket.id} se unió a la sala ${productId}`);

        // Enviar todas las consultas existentes para ese producto al nuevo usuario
        if (productQueries[productId]) {
            socket.emit('allQueries', productQueries[productId]);
        }
    });

    // Manejar la recepción de una nueva consulta
    socket.on('sendQuery', (query) => {
        const { productId, userId, userName, text } = query;
        
        if (!productQueries[productId]) {
            productQueries[productId] = [];
        }

        const newQuery = { userId, userName, text, timestamp: new Date() };
        productQueries[productId].push(newQuery);

        // Emitir la consulta a todos los usuarios en la sala del producto
        io.to(productId).emit('newQuery', newQuery);
        
    });

    // Manejar la desconexión del usuario
    socket.on('disconnect', () => {
        console.log('Un usuario se ha desconectado', socket.id);
    });
});
 */

// Iniciar el servidor en el puerto 3001
app.listen(3001, () => {
    console.log("Servidor escuchando en puerto 3001");
});