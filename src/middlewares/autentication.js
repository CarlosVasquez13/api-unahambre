var express = require('express');
var router = express.Router();
// var jsonResult = require('../models/result')
const jwt = require('jsonwebtoken')


/** CVasquez@16MAR2020
 *Middleware para verificar el jwt enviado desde frontend
 * Se respondera con un mensaje si el token no fue proveído o no es valído 
 */
router.use((req, res, next) => {
    const token = req.headers['access-token'];
    if (token) {
        jwt.verify(token, 'llave', (err, decoded) => {
            if (err) {
                return res.send({ mensaje: 'token invalida' })

            } else {
                req.decoded = decoded
                next()
            }
        })
    } else {
        res.send({
            mensaje: 'token no proveida.'
        })
    }
})

module.exports = router