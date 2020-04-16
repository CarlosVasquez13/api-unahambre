const express = require('express')
const jsonResult = require('../models/result')
const router = express.Router()
const db = require('../connection/conexion')
const jwt = require('jsonwebtoken')

const respuesta = require('../models/respuesta')
const autenticar = require('../middlewares/autentication')

/**************************************************************** */
// CVásquez@1ABR2020
// Sacar el id y rol del usuario que hace la petición. 
function decodedJWT_all_usuarios(token) {
    const token_decoded = jwt.verify(token, 'llave')
    const id = token_decoded.id
    const rol = token_decoded.rol
    return { id, rol }
}

/****************<<<<<<<<Pagos con tarjeta >>>>>>>>>>>>********** */
/**CVásquez@18MAR2020 */
const stripe = require('stripe')('sk_test_smJBw722C61JXaVJaIq4EwZl00rXkBU89f');
router.post('/realizar_pago', autenticar, (req, res) => {
    const { id, rol } = decodedJWT_all_usuarios(req.headers['access-token'])
    const query = `CALL SP_INSERTAR_PEDIDO(?, ?, ?, ?, ?, @Mensaje);
                    SELECT @Mensaje as mensaje;
                    `
    db.query(query, [req.body.idProductos, id, 1, req.body.ubicacion, req.body.tiempo],
        (err, result) => {
            let resultado = jsonResult
            resultado.error = null
            resultado.item = null
            if (err) {
                resultado.error = result[1][0].mensaje
                res.send(resultado)
            } else {
                (async () => {

                    // const customer = await stripe.customers.create({
                    //     email: req.body.stripeEmail,
                    //     source: req.body.stripeToken
                    // });
                    // console.log(customer.id)


                    // const paymentMethods = await stripe.paymentMethods.list({
                    //     customer: customer.id,
                    //     type: 'card',
                    // });
                    // console.log(paymentMethods)
                    // console.log(req.body)
                    const session = await stripe.checkout.sessions.create({
                        //     // payment_intent_data: {
                        //     //     setup_future_usage: 'off_session',
                        //     // },
                        payment_method_types: ['card'],
                        line_items: [{
                            name: req.body.nombre, //'T-shirt',
                            description: req.body.descripcion, //'Comfortable cotton t-shirt',
                            images: ['https://res.cloudinary.com/unahambre/image/upload/v1586934314/menus/29e972b2-5d61-4b03-9e0d-4c1558b9efd0.png'], //     ['https://example.com/t-shirt.png'],
                            amount: (req.body.monto * 100),
                            currency: 'hnl',
                            quantity: 1,
                        }],
                        success_url: 'https://webunahambre.herokuapp.com/success.html',
                        cancel_url: 'https://webunahambre.herokuapp.com/cancel.html',
                    });
                    //  console.log(session)
                    res.send(session)
                })();


            }

        })
    // res.send('recibido....')

})


module.exports = router