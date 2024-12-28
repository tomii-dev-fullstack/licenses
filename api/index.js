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
import blogRoutes from "./routes/routes_blog.js"
import cookieParser from "cookie-parser";
/* import orderRoutes from "./routes/routes_orders.js" */
config();

const app = express();
app.use(cors({ origin: "*", methods: "GET, POST, PUT, DELETE, OPTIONS", credentials: true }));
/* app.options('*', cors()); */
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use((err, req, res, next) => {
    if (err) {
        return res.status(400).json({ error: err.message });
    }
    next();
});
app.get("/", async (req, res) => {
    try {
        // Obtener `topic` desde query params o desde el cuerpo
        const topic = req.query.topic || req.query.type || req.body.topic || req.body.type;
        console.log({ topic });
    
        if (topic === "payment") {
          // Obtener el ID del pago
          const paymentId = req.query.id || req.query['data.id'] || req.body.id || req.body['data.id'];
    
          if (!paymentId) {
            return res.status(400).json({ message: "Payment ID not provided" });
          }
    
          // Buscar el estado del pago
          const payment = await mercadopago.payment.findById(Number(paymentId));
          const paymentStatus = payment.body.status;
    
          console.log({ payment, paymentStatus });
    
          res.status(200).json({ payment, paymentStatus });
        } else {
          res.status(400).json({ message: "Invalid topic" });
        }
      } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal Server Error", error: error.message });
      }
  });
app.use('/api', userRoutes);
app.use('/api', transaccionRoutes);
app.use('/api', ordersRoutes);
app.use('/api', purchasesRoutes);
app.use('/api', subscriptionRoutes);
app.use('/api', sellsRoutes);
app.use('/api', productRoutes);
app.use('/api', blogRoutes);

app.listen(3001, () => {
    console.log("Servidor escuchando en puerto 3001");
});