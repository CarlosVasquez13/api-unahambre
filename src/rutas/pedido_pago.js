const express = require('express')
const jsonResult = require('../models/result')
const router = express.Router()
const db = require('../connection/conexion')
const jwt = require('jsonwebtoken')
const enviar_correo = require('../models/mail_service')

const respuesta = require('../models/respuesta')
const autenticar = require('../middlewares/autentication')

const stripe = require('stripe')('sk_test_smJBw722C61JXaVJaIq4EwZl00rXkBU89f');

/**************************************************************** */
// CVásquez@1ABR2020
// Sacar el id y rol del usuario que hace la petición. 
function decodedJWT_all_usuarios(token) {
    const token_decoded = jwt.verify(token, 'llave')
    const id = token_decoded.id
    const rol = token_decoded.rol
    return { id, rol }
}

/**CVásquez@24ABR2020 */
async function calc_total_pedido(idPedido) {
    let total
    const query = `SELECT SUM(Precio) as total FROM pedido_detalle INNER JOIN Platillo
    ON idPlatillo =  Platillo_idPlatillo
    WHERE Pedido_idCompra = ?;
    `

    db.query(query, [idPedido],
        (err, result) => {
            if (!err) {
                total = result[0].total
            }
        })
    await new Promise((resolve, reject) => setTimeout(resolve, 500));
    return (total)

}

// obtener las fotos de los platillos del pedido
/**CVásquez@24ABR2020 */
async function obtener_fotos_platillos(idPedido) {
    const query = `SELECT Foto_Platillo FROM Platillo INNER JOIN pedido_detalle
                ON idPlatillo = Platillo_idPlatillo
                WHERE Pedido_idCompra = ?;`
    let fotos = [];
    db.query(query, [idPedido], (err, result) => {
        if (!err) {
            for (let index = 0; index < result.length; index++) {
                fotos[index] = result[index].Foto_Platillo
            }

        }
    })
    await new Promise((resolve, reject) => setTimeout(resolve, 1000));
    return fotos
}
router.get('/prueba', function (req, res, next) {
    (async () => {
        let total = await obtener_fotos_platillos(47)
        res.send({ "mensaje": total })
    })();
    // await new Promise((resolve, reject) => setTimeout(resolve, 500));


})


/****************<<<<<<<<Pagos de pedidos con tarjeta >>>>>>>>>>>>********** */
/**CVásquez@18MAR2020 */
router.post('/realizar_pago', autenticar, (req, res) => {
    const { id, rol } = decodedJWT_all_usuarios(req.headers['access-token'])
    const query = `CALL SP_INSERTAR_PEDIDO(?, ?, ?, ?, ?, @Mensaje);
                    SELECT @Mensaje as mensaje;
                    SELECT MAX(Pedido_idCompra) AS idPedido FROM pedido_detalle;
                    `
    db.query(query, [req.body.idProductos, id, req.body.metodoPago, req.body.ubicacion, req.body.tiempo],
        (err, result) => {
            let resultado = jsonResult
            resultado.error = null
            resultado.item = null
            if (err) {
                resultado.error = result[1][0].mensaje
                res.send(resultado.error)
            } else {
                if (req.body.metodoPago === 1) {
                    // si se pagará en efectivo
                    resultado.error = result[1][0].mensaje
                    resultado.item = result[2][0].idPedido
                    res.send({ "error": resultado.error, "item": resultado.item })

                } else {
                    // PAGO CON TARJETA
                    (async () => {

                        let fotos_platillos = await obtener_fotos_platillos(result[2][0].idPedido);
                        let total = await calc_total_pedido(result[2][0].idPedido);
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
                                    images: fotos_platillos, //     ['https://example.com/t-shirt.png'],
                                    amount: (total * 100),
                                    currency: 'hnl',
                                    quantity: 1,
                                }],
                                success_url: 'https://webunahambre.herokuapp.com/success.html',
                                cancel_url: 'https://webunahambre.herokuapp.com/cancel.html',
                            });
                            //  console.log(session)
                            res.send({ "id": session, "idPedido": result[2][0].idPedido })
                        })();
                    })();

                }



            }

        })
    // res.send('recibido....')

})



/****************<<<<<<<<Comprobar pago de pedido >>>>>>>>>>>>********** */
/**Cambirá el estado del pedido si se completo el pago, sino se eliminará el pedido */
/**IN PI_ID_USUARIO INT,
IN PI_ID_PEDIDO INT,
IN PB_ESTADO_PAGO BOOL, */
router.post('/verificar_pago', autenticar, (req, res, next) => {
    const { idUsuario, rol } = decodedJWT_all_usuarios(req.headers['access-token'])
    const query = `CALL SP_VERIFICAR_PAGO(?, ?, @MENSAJE);
                    `
    db.query(query, [req.body.idPedido, req.body.estadoPago],
        (err, result) => {
            respuesta.respuestaError(err, result, res)
        })
})


/****************<<<<<<<< contratar plan publicidad>>>>>>>>>>>>********** */
router.post('/contratar_plan', autenticar, (req, res, next) => {
    const { id, rol } = decodedJWT_all_usuarios(req.headers['access-token'])
    const query = `CALL SP_CONTRARTAR_PLAN_PUBLICIDAD(?, ?, @correo, @Mensaje);Select @Mensaje as mensaje; select @correo as correo;`
    if (rol === 1) {
        db.query(query, [id, req.body.idPlan],
            (err, result) => {
                     if (!err) {
                    if (result[1][0].mensaje === null) {
                        let correo = result[2][0].correo
                        let mensaje = `
                                        <div>
                                            <h2>Servicios Unahambre</h2>
                                            <p>
                                                Estimado usuario tu solicitud de contrato de plan de publicidad está en proceso, pronto nos contactaremos contigo para completar el proceso de pago. 
                                            </p>
                                            <p>
                                            <strong>Gracias por elegirnos.</strong> 
                                            </p>
                                            <hr>
                                            <p>
                                                AtteÑ <a href="https://webunahambre.herokuapp.com/index.html">Equipo Unahambre</a>
                                            </p>
                                        </div>
                                        `;
                        (async () => {
                            let mail = await enviar_correo(mensaje, correo)

                        })();
                    }
                }
                 
               
                respuesta.respuestaError(err, result, res)
            })
    } else {
        respuesta.respuestaError(err, 'accion no permitida', res)
    }
})



module.exports = router