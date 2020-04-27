"use strict";
const nodemailer = require('nodemailer')
const jsonResult = require('../models/result')


/** CVásquez@08MAR2020*/
// Se crea el objeto transporte 

async function enviar_correo(mensaje, correo){
    let transporter = nodemailer.createTransport({
      service: 'gmail',
        // port: 587,
        auth: {
            user: 'unahambre.is@gmail.com',
            pass: 'unahambre_IPAC2020'
        }
    });
    let info = await transporter.sendMail({
        from: '"Equipo Unahambre" <unahambre.is@gmail.com>',
        to: correo,
        subject: "Servicios unahambre",
        text: mensaje,
        // text: 'hola desde nodejs await'
        html: mensaje
    })
    // res.send('1')
    console.log(info);
    return true;
}



module.exports = enviar_correo