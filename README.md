# 🧠 API de Licencias de Software

Este proyecto es una API para gestionar licencias de software: creación, validación y revocación, todo desde un backend rápido y flexible.

---

## 🚀 Tecnologías utilizadas

- **Node.js** – Motor del backend.
- **GraphQL** – Consultas precisas y flexibles.
- **MongoDB** – Base de datos NoSQL para almacenar licencias y productos.
- **AWS EC2** – Infraestructura de despliegue (entorno de producción).

---

## 🛠️ Funcionalidades principales

- 📄 **Crear licencias** asociadas a productos.
- ✅ **Validar licencias** en tiempo real.
- ❌ **Revocar licencias** en cualquier momento.
- 🔍 **Consultar licencias** por ID o por producto.

---

## ▶️ Cómo levantar el proyecto

1. Cloná el repositorio:

   ```bash
   git clone https://github.com/tomii-dev-fullstack/licenses
   cd licenses
   ```

2. Instalá las dependencias:

   ```bash
   npm install
   ```

3. Configurá las variables de entorno en un archivo `.env`:

   ```env
   MONGO_URI=mongodb+srv://<usuario>:<password>@cluster.mongodb.net/<db>
   PORT=4000
   ```

4. Iniciá el servidor:

   ```bash
   npm start
   ```

---

## 📬 GraphQL Playground

Una vez iniciado el servidor, accedé al Playground de GraphQL desde:

```
http://localhost:4000/graphql
```

Desde ahí podés probar tus **queries** y **mutaciones** para gestionar licencias fácilmente.

---

## 🧾 Información adicional

- 🔐 **Autenticación**: Actualmente, esta API **no cuenta con autenticación** integrada.
- 🔑 **Generación de licencias**: Las claves de licencia se generan de forma única mediante la función `generateLicenseKey`, ubicada en los servicios del backend.
