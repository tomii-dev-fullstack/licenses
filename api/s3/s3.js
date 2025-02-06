/* import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

const AWS_PUBLIC_KEY = process.env.AWS_PUBLIC_KEY;
const AWS_SECRET_KEY = process.env.AWS_SECRET_KEY;
const AWS_BUCKET_NAME = process.env.AWS_BUCKET_NAME;
const AWS_BUCKET_REGION = process.env.AWS_BUCKET_REGION;

console.log('Región:', AWS_BUCKET_REGION);  // Añadir esto para depuración

const client = new S3Client({
    region: process.env.AWS_BUCKET_REGION,
    credentials: {
        accessKeyId: process.env.AWS_PUBLIC_KEY,
        secretAccessKey: process.env.AWS_SECRET_KEY,
    }
});
//v   pt      c                    

export const uploadFileToS3 = async (file, data, categoria) => {
  
    function sanitizeFileName(fileName) {
        return fileName
            .toLowerCase()                // Convierte todo a minúsculas
            .replace(/ /g, '')           // Reemplaza espacios con guiones bajos
            .replace(/-/g, '')            // Elimina guiones
            .replace(/[^a-z0-9_.]/g, ''); // Elimina caracteres especiales, dejando solo letras, números, guiones bajos y puntos
    }
    try {

        const stream = fs.createReadStream(file.path);
        const key = file.originalname ? `${data.toLowerCase()}/${categoria.toLowerCase()}/${sanitizeFileName(file.originalname.toLowerCase())}` : `${data.toLowerCase()}/${categoria.toLowerCase()}/${sanitizeFileName(file.imagen.toLowerCase())}`;
        const uploadParams = {
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: key,
            Body: stream,
            ACL: 'public-read-write',
        };
        const command = new PutObjectCommand(uploadParams);
        const result = await client.send(command);
        console.log('Archivo subido:', result);
        return result;
    } catch (error) {
        console.error('Error al subir archivo:', error);
        throw error;
    }
};
export const getObjectFromS3 = async (product, categoria, file) => {
    console.log(`Archivo: ${file}`);
    try {
        // Validar parámetros de entrada
        if (!file) {
            console.error('Parámetros insuficientes: se requiere un nombre de archivo.');
            return null;
        }

        // Generar la clave S3 para la imagen
        const s3Key = `${product}/${categoria}/${file}`;
        console.log(`Buscando imagen en S3 con clave: ${s3Key}`);

        // Configurar los parámetros de obtención
        const params = {
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: s3Key,
        };

        // Ejecutar el comando GetObjectCommand
        const command = new GetObjectCommand(params);
        const result = await client.send(command);

        console.log('Imagen obtenida desde S3:', result);

        // Devolver el resultado para que el consumidor decida cómo usarlo
        return result;
    } catch (error) {
        // Manejar errores específicos
        if (error.name === 'NoSuchKey' || error.Code === 'NoSuchKey') {
            console.log('La imagen no existe en S3.');
            return null; // Devolver null si la imagen no está en S3
        }

        // Loguear errores inesperados y continuar el flujo
        console.error('Error inesperado al obtener la imagen desde S3:', error);
        return null; // Devolver null para evitar romper el flujo principal
    }
};




export const uploadFileServiceToS3 = async (file, user, service_name) => {
    try {
        console.log(file);
        const stream = fs.createReadStream(file.path);
        const uploadParams = {
            Bucket: AWS_BUCKET_NAME,
            Key: `${user}/${service_name}/${file.originalname}`,
            Body: stream,
            ACL: 'public-read',
        };
        const command = new PutObjectCommand(uploadParams);
        const result = await client.send(command);
        console.log('Archivo subido:', result);
        return result;
    } catch (error) {
        console.error('Error al subir archivo:', error);
        throw error;
    }
};
export const deleteFileFromS3 = async (nombre, product, categoria) => {
    console.log(nombre, product, categoria)
    try {

        const uploadParams = {
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: `${product}/${categoria}/${nombre}`,
        };
        const command = new DeleteObjectCommand(uploadParams);
        const result = await client.send(command);
        console.log('Archivo eliminado:', result);
        return result;
    } catch (error) {
        console.error('Error al subir archivo:', error);
        throw error;
    }
};
 */

import multer from "multer";
import multerS3 from "multer-s3";
import { S3Client, DeleteObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import dotenv from "dotenv";

dotenv.config();

const AWS_PUBLIC_KEY = process.env.AWS_PUBLIC_KEY;
const AWS_SECRET_KEY = process.env.AWS_SECRET_KEY;
const AWS_BUCKET_NAME = process.env.AWS_BUCKET_NAME;
const AWS_BUCKET_REGION = process.env.AWS_BUCKET_REGION;

// 🔹 Configurar el cliente S3
const s3 = new S3Client({
    region: AWS_BUCKET_REGION,
    credentials: {
        accessKeyId: AWS_PUBLIC_KEY,
        secretAccessKey: AWS_SECRET_KEY,
    }
});

// 🔹 Función para limpiar nombres de archivo
const sanitizeFileName = (fileName) => {
    return fileName
        .toLowerCase()
        .replace(/ /g, '')
        .replace(/-/g, '')
        .replace(/[^a-z0-9_.]/g, '');
};

// 🔹 Configurar `multer-s3` para subir archivos directamente a S3
export const uploadFileToS3 = multer({
    storage: multerS3({
        s3: s3,
        bucket: AWS_BUCKET_NAME,
        ACL: 'public-read-write',
        metadata: (req, file, cb) => {
            cb(null, { fieldName: file.fieldname });
        },
        key: (req, file, cb) => {
            const { data, categoria } = req.body; // 📌 Extraer datos del request
            const key = `${data.toLowerCase()}/${categoria.toLowerCase()}/${sanitizeFileName(file.originalname)}`;
            cb(null, key);
        }
    })
});


// ✅ Función para obtener un archivo de S3
export const getObjectFromS3 = async (product, categoria, file) => {
    try {
        if (!file) {
            console.error("Parámetros insuficientes: se requiere un nombre de archivo.");
            return null;
        }

        const s3Key = `${product}/${categoria}/${file}`;
        console.log(`📂 Buscando imagen en S3 con clave: ${s3Key}`);

        const params = { Bucket: AWS_BUCKET_NAME, Key: s3Key };
        const command = new GetObjectCommand(params);
        const result = await s3.send(command);

        return result;
    } catch (error) {
        if (error.name === "NoSuchKey" || error.Code === "NoSuchKey") {
            console.log("❌ La imagen no existe en S3.");
            return null;
        }

        console.error("❌ Error inesperado al obtener la imagen desde S3:", error);
        return null;
    }
};

// ✅ Función para eliminar un archivo de S3
export const deleteFileFromS3 = async (nombre, product, categoria) => {
    try {
        const s3Key = `${product}/${categoria}/${nombre}`;
        console.log(`🗑 Eliminando archivo: ${s3Key}`);

        const params = { Bucket: AWS_BUCKET_NAME, Key: s3Key };
        const command = new DeleteObjectCommand(params);
        const result = await s3.send(command);

        console.log("✅ Archivo eliminado:", result);
        return result;
    } catch (error) {
        console.error("❌ Error al eliminar archivo:", error);
        throw error;
    }
};

export const uploadFileServiceToS3 = async (file, user, service_name) => {
    try {
        console.log(file);
        const stream = fs.createReadStream(file.path);
        const uploadParams = {
            Bucket: AWS_BUCKET_NAME,
            Key: `${user}/${service_name}/${file.originalname}`,
            Body: stream,
            ACL: 'public-read',
        };
        const command = new PutObjectCommand(uploadParams);
        const result = await client.send(command);
        console.log('Archivo subido:', result);
        return result;
    } catch (error) {
        console.error('Error al subir archivo:', error);
        throw error;
    }
};