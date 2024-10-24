import TransactionService from '../classes/transaction_service.js';
import jwt from "jsonwebtoken"
const transaccionService = new TransactionService();
import { uid } from 'uid';
// Registro de usuario
export const getTransaccions = async (req, res) => {
    try {
        const token = req.cookies?.sessionToken;

        if (!token) {
            return res.status(401).json({ error: 'No autorizado' });
        }

        console.log(token);
        // Decodificar el token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const transactions = await transaccionService.getTransaccions(decoded.id);
        if (transactions.length > 0) {

            return res.status(200).json({ data: transactions });
        } else {
            return res.status(404).json({ message: "No purchases found for the user" });
        }
    } catch (error) {

        res.status(400).json({ message: 'Error al obtener compras' });
    }
};
export const getSellDetailOrder = async (req, res) => {
    const { id } = req.params;

    // Verifica si el ID fue proporcionado
    if (!id) {
        return res.status(400).json({ success: 400, message: 'ID is required' });
    }

    console.log("Uid de orden: " + id);

    try {

        // Realiza el aggregate para encontrar las compras del usuario
        const order_detail = await sellService.getSellById(id);
        console.log("Orden: ", order_detail);
        if (order_detail) {
            res.status(200).json({ data: order_detail });
        } else {
            res.status(404).json({ message: "No purchases found for the user" });
        }
    } catch (error) {
        console.error('Error al obtener los items:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
export const postTransaccions = async (req, res) => {

    try {
        const token = req.cookies?.sessionToken;
        const { type, amount, description, date, category } = req.body
        if (!token) {
            return res.status(401).json({ error: 'No autorizado' });
        }

        console.log(token);
        // Decodificar el token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const transaction = {

            /*   nombre: title, */
            orden: uid(),
            tipo: type,
            monto: amount,
            fecha: date,
            categoria: category,
            descripcion: description,

        }
        console.log(transaction)
        // Realiza el aggregate para encontrar las compras del usuario
        const tran = await transaccionService.postTransaction(transaction, decoded.id)
        if (tran) {
            res.status(200).json({ data: tran });
        } else {
            res.status(404).json({ message: "error al crear transaccion" });
        }
    } catch (error) {
        console.error('Error al obtener los items:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};


