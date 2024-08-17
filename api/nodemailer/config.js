import nodemailer from "nodemailer"
import dotenv from "dotenv";
dotenv.config()
let transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        type: 'OAuth2',
        user: process.env.MAIL_USERNAME,
        pass: process.env.MAIL_PASSWORD,
        clientId: process.env.OAUTH_CLIENTID,
        clientSecret: process.env.OAUTH_CLIENT_SECRET,
        refreshToken: process.env.OAUTH_REFRESH_TOKEN
    }
});

// Opciones de correo electrónico
let mailOptions = {
    from: process.env.MAIL_USERNAME,
    to: "tomasruglio18@gmail.com",
    subject: 'Nodemailer Project',
    text: 'Hi from your nodemailer project'
};

// Enviar correo electrónico
export const send = (mailOptions) => {

    transporter.sendMail({
        from: "opaawork@gmail.com",
        to: mailOptions.to,
        subject: mailOptions.subject,
        text: mailOptions.text,
        html: `<p>${mailOptions.text}</p>` // Para enviar correo con HTML, eliminar esta línea y agregar la línea anterior.
    }, function (error, info) {

        if (error) {
            console.log(error);
        } else {
            console.log('Correo enviado: ' + info.response);
        }
    });

}
