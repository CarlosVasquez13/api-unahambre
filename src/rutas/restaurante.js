/*** Aquí estarán las rutas para :
 * mostrar información en el landing.
 * mostrar información en la pag de menus.
 * ruta para registrar un nuevo restaurante.
 */

const express = require('express')
const jsonResult = require('../models/result')
const router = express.Router()
const db = require('../connection/conexion')
const autenticar = require('../middlewares/autentication')
const respuesta = require('../models/respuesta')





/** CVásquez@17MAR2020
 * Recibe como parametros del JSON:
 *      
 * "idUsuario":,
 * "rolUsuario":, 
 * "nombreRestaurante":, 
 * "telefono":, 
 * "correo":, 
": * "ubicacion":
 * el data.error llevará el mensaje de éxito o fracaso 
 */
router.post('/g_insertar-restaurante', autenticar, function (req, res, next) {
        const query = `CALL SP_INSERT_RESTAURANTE(?, ?, ?, ?, ?, ?, @MENSAJE); SELECT @MENSAJE AS mensaje;`
        db.query(query, [req.body.idUsuario, req.body.rolUsuario, req.body.nombreRestaurante, req.body.telefono, req.body.correo, req.body.ubicacion],
            function (err, result) {
                respuesta.respuestaError(err, result, res)
        })
})

/*********************************************pag menus(principal) */

/** CVásquez@20MAR2020
// Devuelve la lista de los restaurantes en la DB
/**
 * /api/g_mostrar_restaurantes
 * /api/restaurantes
 */
router.get('/g_mostrar_restaurantes', function (req, res, next) {

    const query = `SELECT idRestaurante, Nombre_Local, Telefono, Correo, Ubicacion, Usuario_idUsuario, EstadoRestaurante, Nombre_Usuario FROM Restaurante
INNER JOIN usuario
WHERE idUsuario = Usuario_idUsuario`
    db.query(query,
        function (err, result) {
            respuesta.respuestaItems(err, result, res)            
        }

    );
});

//Retorna todos los menus en la base
router.get('/g_mostrar_menus', function (req, res, next) {
    const query = `SELECT * FROM Menu`;
    db.query(query,
        function (err, result) {
            respuesta.respuestaItems(err, result, res)
        }
    )
});

/** CVasquez@04MAR2020
 *
 * Se devuelve un arreglo en el campo items con los platillos existentes en la base de datos
 */

router.get('/g_mostrar_platillos', function (req, res, next) {
    const query = `SELECT * FROM Platillo`;
    db.query(query,
        function (err, result) {
           respuesta.respuestaItems(err, result, res)           
        })
});



module.exports = router