🧠 API de Licencias de Software
Este proyecto es una API para gestionar licencias de software: creación, validación y revocación, todo desde un backend rápido y flexible.

🚀 Tecnologías
Node.js – Motor del backend

GraphQL – Consultas eficientes y precisas

MongoDB – Base de datos NoSQL para licencias y productos

AWS EC2 – Infraestructura de despliegue

🛠️ Funcionalidades principales
Crear licencias vinculadas a productos

Validar licencias al momento de usarlas

Revocar licencias en cualquier momento

Consultar licencias por ID o producto

▶️ Cómo levantarlo

git clone https://github.com/tu-usuario/tu-repo.git
cd tu-repo
npm install
npm start

Configurar tus variables de entorno en un archivo .env:

env
MONGO_URI=mongodb+srv://...
PORT=4000
📬 Consultas en GraphQL
Accedé al playground en http://localhost:4000/graphql y probá tus queries.

Autenticación: Este proyecto no incluye autenticación por el momento.
Generación de Licencias: Se genera una clave única para cada licencia a través de la función generateLicenseKey en los servicios.

