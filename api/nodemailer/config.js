import nodemailer from "nodemailer"
import dotenv from "dotenv";
import { google } from "googleapis"
dotenv.config()
const oAuth2Client = new google.auth.OAuth2({

    clientId: process.env.OAUTH_CLIENTID,
    clientSecret: process.env.OAUTH_CLIENT_SECRET}
);

async function getAccessToken() {
    try {
        const { token } = await oAuth2Client.getAccessToken();
        return token;
    } catch (error) {
        console.error('Error getting access token:', error);
    }
}
// Opciones de correo electrónico


// Enviar correo electrónico
export async function send() {
    const accessToken = await getAccessToken();

    let transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            type: 'OAuth2',
            user: process.env.MAIL_USERNAME,
            pass: process.env.MAIL_PASSWORD,
            accessToken,
            clientId: process.env.OAUTH_CLIENTID,
            clientSecret: process.env.OAUTH_CLIENT_SECRET,
            refreshToken: process.env.OAUTH_REFRESH_TOKEN
        }
    });
    let mailOptions = {
        from: process.env.MAIL_USERNAME,
        to: "tomasruglio18@gmail.com",
        subject: 'Nodemailer Project',
        text: 'Hi from your nodemailer project'
    };

    try {
        const result = await transporter.sendMail(mailOptions);
        console.log('Email sent:', result);
    } catch (error) {
        console.error('Error sending email:', error);
    }
}
