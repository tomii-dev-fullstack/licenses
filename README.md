Licenses Management API
Descripción
Este proyecto es una API para gestionar licencias de productos. Implementada con Node.js, Express, Apollo Server (GraphQL) y MongoDB, permite la creación, validación y revocación de licencias de productos. Además, se implementa una interfaz GraphQL para facilitar las consultas y mutaciones relacionadas con las licencias.

Tecnologías Usadas
Node.js: Plataforma para el desarrollo del backend.

Express: Framework web para Node.js.

Apollo Server (GraphQL): Implementación de un servidor GraphQL.

MongoDB: Base de datos NoSQL utilizada para almacenar los productos y licencias.

Mongoose: Librería para interactuar con MongoDB en Node.js.

Estructura del Proyecto
├── src
│   ├── controllers
│   │   └── license_controller.js
│   ├── graphql
│   │   ├── index.js
│   │   └── typeDefs.js
│   ├── models_db
│   │   ├── licence.js
│   │   └── product.js
│   ├── services
│   │   └── auth_service.js
│   ├── utils
│   │   └── generate.js
│   └── index.js
├── .env
├── package.json
└── README.md

controllers: Contiene los controladores que gestionan las operaciones REST.

graphql: Define los tipos, queries, mutations y resolvers de GraphQL.

models_db: Modelos de datos de MongoDB para productos y licencias.

services: Lógica de negocio, como la creación de licencias y validación.

utils: Utilidades como la generación de claves de licencia.

Instalación
Requisitos previos
Tener Node.js instalado.

Tener acceso a una instancia de MongoDB (puedes usar MongoDB Atlas para crear un clúster).

Pasos para la instalación
Clona el repositorio:

bash
git clone <url-del-repositorio>
Instala las dependencias del proyecto:

bash
Copiar
Editar
cd <nombre-del-directorio>
npm install
Crea un archivo .env en la raíz del proyecto y agrega tu cadena de conexión de MongoDB:

bash

MONGO_URI="mongodb+srv://<usuario>:<contraseña>@<cluster>/<nombre-db>?retryWrites=true&w=majority"
Inicia el servidor:

bash

npm start
El servidor debería estar corriendo en http://localhost:4000. Puedes acceder a la interfaz de GraphQL Playground en http://localhost:4000/graphql para interactuar con las consultas y mutaciones.

API - GraphQL
Queries
getLicense: Obtiene los detalles de una licencia por su clave.

graphql

query {
  getLicense(key: "LIC-001") {
    id
    key
    status
    user
    createdAt
    expiresAt
  }
}
getLicenses: Obtiene todas las licencias almacenadas.

graphql

query {
  getLicenses {
    id
    key
    status
    user
    createdAt
    expiresAt
  }
}
Mutations
generateLicense: Crea una nueva licencia asociada a un producto.

graphql

mutation {
  generateLicense(productId: "product_id") {
    id
    key
    status
    usageCount
    createdAt
    expiresAt
  }
}
revokeLicense: Revoca una licencia existente.

graphql

mutation {
  revokeLicense(key: "LIC-001") {
    id
    key
    status
  }
}
validateLicense: Valida una licencia de producto y la incrementa en su contador de uso.

graphql

mutation {
  validateLicense(key: "LIC-001", productId: "product_id") {
    key
    status
    usageCount
  }
}
Modelos de Datos
License
Define los detalles de una licencia de producto.

js

{
  id: ID!
  key: String!
  status: String!
  user: String!
  usageCount: Int!
  createdAt: String!
  expiresAt: String
}
Product
Define los detalles de un producto.

js

{
  id: ID!
  name: String!
  webhookURL: String
}
Notas
Autenticación: Este proyecto no incluye autenticación, por lo que puedes integrarlo con un sistema de autenticación como JWT si lo necesitas.
MongoDB: Se utiliza MongoDB como base de datos, pero puedes adaptar el código para usar otro sistema de bases de datos si lo prefieres.
Generación de Licencias: Se genera una clave única para cada licencia a través de la función generateLicenseKey en los servicios.

