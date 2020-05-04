/*** 
 * /api_producto/..
 * Aquí estarán las rutas para :
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
const enviar_correo = require('../models/mail_service')






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
                if(!err) {
                    // mensaje del correo a enviar al usuario
                    var mensaje = `Estimado cliente, le agradecemos por elegir trabajar con nosotros, pronto nos pondremos 
                                    en contacto contigo para realizar las debidas verificaciones de tu negocio. Agradecemos la espera. Atte: Rquipo Unahambre
                                    `    
                    enviar_correo(mensaje, req.body.correo, res)
                   
                    /**
                     * Nota_cambios: crear otro estado para el restaurante y verificar el rol del cliente
                     * Mejorar el mensaje a enviar al cliente
                     * 
                     */
                                    
                }
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

    const query = `SELECT idRestaurante, Nombre_Local, Telefono, Correo, Ubicacion, Foto_Restaurante, Usuario_idUsuario, EstadoRestaurante, Nombre_Usuario FROM Restaurante
                INNER JOIN usuario
                ON idUsuario = Usuario_idUsuario 
                WHERE EstadoRestaurante = 'activo'
            ;`
    db.query(query,
        function (err, result) {
            respuesta.respuestaItems(err, result, res)            
        }

    );
});

//Retorna todos los menus en la base
router.get('/g_mostrar_menus', function (req, res, next) {
    const query = `SELECT idMenu, Tipo_Menu, Fecha_Registro, Restaurante_idRestaurante, Foto_Menu, idCategoria FROM Menu INNER JOIN restaurante
                ON idRestaurante = Restaurante_idRestaurante
                WHERE EstadoRestaurante = 'activo';
                    `;
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
    const query = `SELECT idPlatillo, Nombre, Descripcion, Precio, menu.Fecha_Registro, Foto_Platillo, Menu_idMenu, Tipo_Platillo_idTipo_Platillo FROM Platillo
                    INNER JOIN menu ON Menu_idMenu = idMenu
                    INNER JOIN restaurante ON Restaurante_idRestaurante = idRestaurante
                    WHERE EstadoRestaurante = "Activo";
    `;
    db.query(query,
        function (err, result) {
           respuesta.respuestaItems(err, result, res)           
        })
});





/***********<<<<PRUEBAS, BORRAR LUEGO>>>>************************ */
/**
 * CVasquez@04MAR2020
 * retorna los datos del restaurante y el propietario
 */
router.post('/datos_restaurante_propietario', (req, res, next) => {
    
    const query = `SELECT restaurante.Nombre_Local, restaurante.Foto_Restaurante, restaurante.Correo, restaurante.Telefono, restaurante.Ubicacion, usuario.Foto_Perfil, persona.Nombre, persona.Apellidos FROM restaurante INNER JOIN usuario 
                    ON Usuario_idUsuario = idUsuario
                    INNER JOIN persona
                    ON usuario.Persona_idPersona = persona.idPersona
                    WHERE idRestaurante = ?;`
    db.query(query, [req.body.idRestaurante],
        function (err, result) {
            console.log(result)
            respuesta.respuestaItems(err, result, res)
        })
})

/**
 * CVasquez@04MAR2020
 *Retorna los menus que pertenecen a un restaurante
 *idRestaurante
 */
router.post('/menus_restaurante', (req, res, next) => {
    const query = `SELECT idMenu, Tipo_Menu, Foto_Menu FROM menu 
                    WHERE Restaurante_idRestaurante = ?`
    db.query(query, [req.body.idRestaurante],
        function (err, result){
            respuesta.respuestaItems(err, result, res)
        })
})

/**
 * CVasquez@04MAR2020
 *Retorna los platillos que pertenecen a un menu
 *idMenu
 */
router.post('/platillos_menu', (req, res, next) => {
    const query = `SELECT idPlatillo, Nombre, Descripcion, Precio, Foto_Platillo FROM platillo 
                    WHERE Menu_idMenu = ?`
    db.query(query, [req.body.idMenu],
        function (err, result) {
            respuesta.respuestaItems(err, result, res)
        })
})



module.exports = router