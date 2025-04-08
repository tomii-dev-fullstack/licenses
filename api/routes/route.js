import express from 'express';
import { ApolloServer } from 'apollo-server-express';
import mongoose from 'mongoose';
import { connect } from '../lib/database.js';
import { typeDefs } from '../graphql/schemas/schemas.js';
import { resolvers } from '../graphql/resolvers/resolvers.js';
/* import * as licenseController from '../controllers/license_controller.js';
 */
const app = express();
const server = new ApolloServer({
  typeDefs,
  resolvers,
  introspection: true, // Permite la exploración
});

async function startServer() {
  // Esperar a que ApolloServer inicie
  await server.start();
  await connect()
  // Aplicar el middleware de Apollo a Express
  server.applyMiddleware({ app, path: '/graphql' });

  // Iniciar el servidor Express
  const port = 4000;
  app.listen(port, (req, res) => {
    res.send('Server is running...')
    console.log(`🚀 Server running on http://localhost:${port}`);
    console.log(`GraphQL playground available at http://localhost:${port}${server.graphqlPath}`);
  });
}

// Exportar la función para iniciar el servidor
export { startServer, app };
