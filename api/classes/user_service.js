import { ObjectId } from "mongodb";
import { clientDB } from "../../lib/database.js";

class UserService {
  constructor() {
    this.collection = clientDB.db("mercado").collection('user'); // Nombre de la colección de usuarios
  }


  async getAllProductsByUser(id) {
    
    return this.collection.aggregate([
      {
        $match: {
          _id: new ObjectId(id),  // Buscar al usuario por ID
        }
      },
      {
        $lookup: {
          from: "product",  // Conectar con la colección de productos
          localField: "_id",  // El campo en la colección de usuario
          foreignField: "user_id",  // El campo en la colección de productos que referencia al usuario
          as: "product_details"  // Los productos se almacenan en el campo `product_details`
        }
      }
    ]).toArray();
  }


}

export default UserService