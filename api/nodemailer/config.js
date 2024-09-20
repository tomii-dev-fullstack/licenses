import nodemailer from "nodemailer";
import dotenv from "dotenv";
import { google } from "googleapis";

dotenv.config();

// Crear cliente OAuth2 con el refresh token para obtener automáticamente un nuevo access token
const oAuth2Client = new google.auth.OAuth2({

    clientId: process.env.OAUTH_CLIENTID,
    clientSecret: process.env.OAUTH_CLIENT_SECRET,
    redirectUri: "https://developers.google.com/oauthplayground"  // Redirect URI, puedes usar la misma que usaste para obtener el refresh token
}
);

// Configurar el refresh token
oAuth2Client.setCredentials({
    refresh_token: process.env.OAUTH_REFRESH_TOKEN,
});

// Función para obtener el access token automáticamente usando el refresh token
async function getAccessToken() {
    try {
        const tokenResponse = await oAuth2Client.getAccessToken();  // Esto renueva automáticamente el access token usando el refresh token
        const accessToken = tokenResponse.token;
        return accessToken;
    } catch (error) {
        console.error('Error al obtener el access token:', error);
        throw new Error('Error al obtener el access token');
    }
}

// Función para enviar el correo electrónico
export async function send(email_to, orderId_mongo) {
    try {
        const accessToken = await getAccessToken();  // Obtener el access token actual

        // Crear transportador de nodemailer
        let transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                type: 'OAuth2',
                user: process.env.MAIL_USERNAME,  // Tu correo
                accessToken: accessToken,          // Access token actualizado
                clientId: process.env.OAUTH_CLIENTID,
                clientSecret: process.env.OAUTH_CLIENT_SECRET,
                refreshToken: process.env.OAUTH_REFRESH_TOKEN, // El refresh token lo usará automáticamente
            },
        });

        // Opciones de correo
        let mailOptions = {
            from: process.env.MAIL_USERNAME,
            to: email_to,
            subject: 'Entrega de producto',
            text: `Hola, ${email_to}`,
            html: `
                <h3>El vendedor nos indicó que entregó tu producto.</h3>
                <p>Para confirmar la entrega, por favor haz clic en el botón de abajo:</p>
                <a href="http://localhost:3030/mi_tienda/mis_compras/${orderId_mongo}" style="display: inline-block; padding: 10px 20px; font-size: 16px; color: white; background-color: #4CAF50; text-align: center; text-decoration: none; border-radius: 5px;">
                    Confirmar Entrega
                </a>
                <p>Gracias por tu compra.</p>
            `,
        };

        // Enviar correo
        const result = await transporter.sendMail(mailOptions);
        console.log('Email enviado:', result);
    } catch (error) {
        console.error('Error al enviar el correo:', error);
        throw new Error('Error al enviar el correo');
    }
}
