const nodemailer = require('nodemailer')


/** CVásquez@08MAR2020*/
// Se crea el objeto transporte 
var transporter = nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    auth: {
        user: 'euna.leannon56@ethereal.email',
        pass: 'ZETX554BJAxsNhUexN'
    }
});

function enviar_correo(mensaje, correo, resultado, res){
    var mailOptions = {
        from: 'soporte.unahambre@gmail.com',
        to: correo,
        subject: 'Soporte UNAHAMBRE',
        text: mensaje,
        html: mensaje
    }
    var estado_envio = null
    transporter.sendMail(mailOptions, function (error, info) {
        if (error) {
            // console.log(error)
            // console.log('no se completo la operación, intentalo más tarde')
            resultado.error = 'no se completo la operación, intentalo más tarde'
            resultado.success = false
            res.send(resultado)
        } else {
            // console.log('todo ok')
            resultado.item = null
            resultado.error = null
            resultado.success = true
            res.send(resultado)
            // console.log('Email enviado: ' + info.response)
        }
    })
    // res.send('1')
    return estado_envio
}



module.exports = enviar_correo