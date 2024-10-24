import { ObjectId } from 'mongodb';
import SellService from '../classes/sell_service.js';

const sellService = new SellService();

// Registro de usuario
export const getSells = async (req, res) => {
    try {

        const { id } = req.params;
        // Verifica si el ID fue proporcionado
        if (!id) {
            return res.status(400).json({ success: 400, message: 'ID is required' });
        }
        const sells = await sellService.getSells(id);
        console.log(sells);
        if (sells.length > 0) {
            console.log(sells)
            return res.status(200).json({ data: sells });
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


