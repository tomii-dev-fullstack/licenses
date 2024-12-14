import express from "express";
import { config } from "dotenv";
import cors from "cors";
// Tus rutas existentes
import productRoutes from "./routes/routes_product.js"
import purchasesRoutes from "./routes/routes_purchases.js"
import subscriptionRoutes from "./routes/routes_subscriptions.js"
import sellsRoutes from "./routes/routes_sells.js"
import userRoutes from "./routes/routes_user.js"
import ordersRoutes from "./routes/routes_orders.js"
import transaccionRoutes from "./routes/routes_transaccion.js"
import cookieParser from "cookie-parser";
/* import orderRoutes from "./routes/routes_orders.js" */
config();

const app = express();
app.use(cors({ origin: ["*"], methods: "GET, POST, PUT, DELETE", credentials: true }));
/* app.options('*', cors()); */
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use('/api', userRoutes);
app.use('/api', transaccionRoutes);
app.use('/api', ordersRoutes);
app.use('/api', purchasesRoutes);
app.use('/api', subscriptionRoutes);
app.use('/api', sellsRoutes);
app.use('/api', productRoutes);

app.listen(3001, () => {
    console.log("Servidor escuchando en puerto 3001");
});