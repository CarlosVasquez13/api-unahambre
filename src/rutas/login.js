var express = require('express');
var router = express.Router();
var jsonResult = require('../models/result')
const jwt = require('jsonwebtoken')
const db = require('../connection/conexion')


//      * CVasquez@02Mar2020
//      *El error llevará el mensaje para la consulta
//      *Indicará si se concede o no el acceso al usuario 
//     */

// POST PARA LOGIN
router.post('/', function (req, res, next) {
    const query = `CALL SP_LOGIN(?, ?, @id, @Usuario, @Mensaje); SELECT @id as id; SELECT @Usuario as usuario; SELECT @Mensaje as mensaje; SELECT Rol_idRol as Rol FROM Usuario_has_Rol WHERE Usuario_idUsuario = (SELECT @id as id);`;
    db.query(query, [req.body.usuario, req.body.contrasena],
        function (err, result) {            
            let resultado = jsonResult
            if (err) resultado.error = err;
            if (result == undefined) {
                resultado.items = null
                res.send(resultado)
            } else {
                resultado.error = null
                resultado.items = result
                // console.log('Este es el rol del usuario: ', resultado.items[4][0].Rol )
                // console.log(resultado.items[2][0].usuario)
                if (resultado.items[2][0].usuario != undefined) {
                    const payload = {
                        check: true,
                        Usuario: resultado.items[2][0].usuario,
                        id: resultado.items[1][0].id,
                        rol: resultado.items[4][0].Rol

                    }
                    const token = jwt.sign(payload, 'llave', {
                        expiresIn: 60 * 60 * 24
                    })
                    resultado.item = token                
                    res.send(resultado)

                } else {
                    resultado.error = 'Usuario o contraseña incorrecta'
                    resultado.item = null
                    res.send(resultado)
                }

            }
        })
})


module.exports = router