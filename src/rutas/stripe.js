const express = require('express')
const jsonResult = require('../models/result')
const router = express.Router()
const db = require('../connection/conexion')
const respuesta = require('../models/respuesta')
const autenticar = require('../middlewares/autentication')


// Set your secret key. Remember to switch to your live secret key in production!
// See your keys here: https://dashboard.stripe.com/account/apikeys
const stripe = require('stripe')('sk_test_smJBw722C61JXaVJaIq4EwZl00rXkBU89f');

router.post('/realizar_pago' , (req, res) => {
    (async () => {
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [{
                name: req.body.nombre, //'T-shirt',
                description: req.body.descripcion, //'Comfortable cotton t-shirt',
                images: [req.body.foto], //['https://example.com/t-shirt.png'],
                amount: req.body.monto,
                currency: 'hnl',
                quantity: 1,
            }],
            success_url: 'https://web-unahambre.herokuapp.com/principal.html',
            cancel_url: 'https://example.com/cancel',
        });
        console.log(session)
        res.send(session)
    })();

})


module.exports = router