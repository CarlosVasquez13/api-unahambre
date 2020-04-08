const express = require('express')
const jsonResult = require('../models/result')
const router = express.Router()
const autenticar = require('../middlewares/autentication')
const jwt = require('jsonwebtoken')
const respuesta = require('../models/respuesta')

// CVásquez@1ABR2020
// VERIFICAR LOS DATOS DE UN USUARIO CUANDO NAVEGA POR LAS PAGINAS
router.post('/g_verficar_datos_de_usuario_logueado', autenticar , function (req, res, next) {
    const { id, rol } = decodedJWT_all_usuarios(req.headers['access-token'])
    if ((req.body.id === undefined) || (req.body.rol === undefined)) {
        res.send({ mensaje: 'error al verificar el usuario' })
    } else {
        if ((id == req.body.id) && (rol == req.body.rol)) {
            res.send({ mensaje: null })
        } else {
            res.send({ mensaje: 'error al verificar el usuario' })
        }
    }

})


// CVásquez@1ABR2020
// Sacar el id y rol del usuario que hace la petición. 
function decodedJWT_all_usuarios(token) {
    const token_decoded = jwt.verify(token, 'llave')
    const id = token_decoded.id
    const rol = token_decoded.rol
    return { id, rol }
}


module.exports = router