import express from 'express';
import { ApolloServer } from 'apollo-server-express';
import mongoose from 'mongoose';
import { connect } from '../lib/database.js';
import { typeDefs } from '../graphql/schemas/schemas.js';
import { resolvers } from '../graphql/resolvers/resolvers.js';
import { authenticateToken } from '../utils/auth.js';
const app = express();
const server = new ApolloServer({
  typeDefs,
  resolvers,
  introspection: true, // Permite la exploración
  context: ({ req, res }) => ({ req, res }), // <- necesario para acceder a res
});

async function startServer() {
  // Esperar a que ApolloServer inicie
  await server.start();
  await connect()
  // Aplicar el middleware de Apollo a Express
  server.applyMiddleware({ app, path: '/graphql',cors: false });

  // Iniciar el servidor Express
  const PORT = process.env.PORT || 4000;
  app.listen(PORT,'0.0.0.0', (req, res) => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`GraphQL playground available at http://localhost:${PORT}${server.graphqlPath}`);
  });
  app.get('/api/check-auth', authenticateToken, (req, res) => {
    res.json({ success: true, message: 'Token válido', user: req.user });
  });
  app.get('/', (req, res) => {
    res.send('API with GraphQL is running');
  });
  app.get('/cicd', (req, res) => {
    res.send('Proceso de CI/CD implementado para desplegar en EC2');
  });
}

// Exportar la función para iniciar el servidor
export { startServer, app };
