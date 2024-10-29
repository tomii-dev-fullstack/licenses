import { ObjectId } from "mongodb";
import { clientDB } from "../../lib/database.js";

class UserService {
  constructor() {
    this.collection = clientDB.db("keplan").collection('user'); // Nombre de la colección de usuarios
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
  async requestModuleUser(id, module) {

    return this.collection.insertOne({ _id: new ObjectId(id) },  // Filtrar por ID
      {
        $push: { modules: module }  // Añadir el módulo al array "modules"
      })
  }
  async updateServiceDescription(id, description) {

    return this.collection.updateOne(
      { _id: new ObjectId(id) },  // Filtrar por ID
      {
        $set: {
          'service.description': description  // Actualizar solo la descripción del servicio
        }
      }
    );
  }
  async updateServiceData(id, data) {
    // Inicializamos un objeto vacío para almacenar solo los campos válidos
    const updateFields = {};
    // Verificamos si cada campo está presente y no es vacío o nulo antes de agregarlo al objeto de actualización
    if (data.service_name) {
      updateFields['service.name'] = data.service_name;
    }

    if (data.service_experience) {
      updateFields['service.description'] = data.service_experience;
    }

    if (data.service_picture) {
      updateFields['service.picture'] = data.service_picture;
    }

    // Si no hay campos para actualizar, devolvemos un valor o mensaje que lo indique
    if (Object.keys(updateFields).length === 0) {
      throw new Error('No hay campos válidos para actualizar');
    }

    // Realizamos la actualización solo con los campos que no son vacíos
    return this.collection.updateOne(
      { _id: new ObjectId(id) },  // Filtrar por ID
      { $set: updateFields }      // Solo actualiza los campos válidos
    );
  }
  async removeModuleUser(id, module) {

    return this.collection.updateOne(
      { _id: new ObjectId(id) },  // Filtrar por ID
      {
        $pull: { modules: module }  // Eliminar el módulo del array "modules"
      }
    );
  }
  async   getUserById(id) {

    return this.collection.findOne(
      { email: id }
    )
  }
  async postClient(id, client) {

    try {
      // Insertamos la transacción asociada al user_id
      const result = await this.collection.insertOne({
        user_id: new ObjectId(id),  // Convertimos el id a ObjectId
        ...client,             // Incluimos todos los campos del objeto de la transacción           // Añadimos la fecha de la transacción
      });

      return result;
    } catch (error) {
      console.error("Error al insertar el cliente:", error);
      throw error; // Propagamos el error para manejarlo fuera de la función si es necesario
    }

  }
  async getClients(id) {

    try {
      // Insertamos la transacción asociada al user_id
      const result = this.collection.aggregate({
        $match: {
          user_id: new ObjectId(id),  // Convertimos el id a ObjectId
        }
      });

      return result;
    } catch (error) {
      console.error("Error al insertar el cliente:", error);
      throw error; // Propagamos el error para manejarlo fuera de la función si es necesario
    }

  }
}

export default UserService