/**
 * Aquí estarán todas las rutas que tengan que ver con la página administración de Restaurante
 */

const express = require('express')
const jsonResult = require('../models/result')
const router = express.Router()
const db = require('../connection/conexion')
const autenticar = require('../middlewares/autentication')
const jwt = require('jsonwebtoken')
const respuesta = require('../models/respuesta')
const cloudinary = require('../configs/credenciales')
const fs = require('fs-extra');



// CVásquez@05MAY2020
// Sacar el id y rol del usuario que hace la petición. 
function decodedJWT_all_usuarios(token) {
    const token_decoded = jwt.verify(token, 'llave')
    const id = token_decoded.id
    const rol = token_decoded.rol
    return { id, rol }
}


/* POST Insertar Platillo */
router.post('/insertar-platillo', autenticar, function (req, res, next) {
    const query = `CALL SP_INSERTAR_PLATILLO(?,?,?,?,?,@Mensaje);Select @Mensaje as mensaje`;
    db.query(query, [req.body.descripcion, req.body.idMenu, req.body.nombre, req.body.precio, req.body.tipoPlatillo],
        function (err, result, rows) {
            respuesta.respuestaError(err, result, res)
        }
    );
});

/**Robindroide
/* POST Insertar Menu */
router.post('/insertar-menu', autenticar, function (req, res, next) {
    const query = `CALL SP_INSERTAR_MENU(?,?,?,?,@Mensaje);Select @Mensaje as mensaje`;
    db.query(query, [req.body.tipoMenu, req.body.idRestaurante, req.body.fotoMenu, req.body.idCategoria],
        function (err, result, rows) {
            respuesta.respuestaError(err, result, res)
        }

    );
});


/** CVásquez@13MAR2020
 *Se borra el local asi como los menús y platillos que dicho local tenga.
 *Se recibe el idRestaurante.
 *El error llevará la respuesta, si error.mensaje no está null, entonces ocurrió un problema y no se borro el local.
 */
router.put('/g-borrar-local', autenticar, function (req, res, next) {
    const query = `CALL SP_ADMIN_ELIMINAR_LOCAL(?, @MENSAJE); SELECT @MENSAJE AS mensaje;`
    db.query(query, [req.body.idRestaurante],
        function (err, result) {
          respuesta.respuestaError(err, result, res)
        })
})

// MODIFICAR RESTAURANTE
router.post('/modificar-local', autenticar, function (req, res, next) {
        const query = `CALL SP_ADMIN_EDITAR_RESTAURANTE(?, ?, ?, ?, ?, @MENSAJE); SELECT @MENSAJE AS mensaje;`
        db.query(query, [req.body.idRestaurante, req.body.nombreRestaurante, req.body.telefono, req.body.ubicacion, req.body.correo],
            function (err, result) {
                respuesta.respuestaError(err, result, res)
            })
})
/**Robindroide
* Eliminar un platillo, recibe el idPlatillo*/
router.post('/g-eliminar-platillo', autenticar, function (req, res, next) {
    const query = `CALL SP_ELIMINAR_PLATILLO(?, @MENSAJE); SELECT @MENSAJE AS mensaje;`
    db.query(query, [req.body.idPlatillo],
        function (err, result) {
            let resultado = jsonResult
            if (err) resultado.error = err;
            if (result == undefined) {
                resultado.items = null;
                res.send(resultado);
            } else {
                resultado.error = result;
                resultado.items = null;
                res.send(resultado);
            }
        })
})


/** CVásquez@13MAR2020
 * Eliminar un menú, recibe el idMenu
 *En el error irá la respuesta de la petición para frontend, si error.mensaje != null entonces ocurrió un problema
 * y no se borro el menú.
 */
router.post('/eliminar-menu', autenticar, function (req, res, next) {
    const query = `CALL SP_ELIMINAR_MENU(?, @MENSAJE); SELECT @MENSAJE AS mensaje;`
    db.query(query, [req.body.idMenu],
        function (err, result) {
            respuesta.respuestaError(err, result, res)
        })
})
/** JFunez@09ABR2020 */
router.post('/pedidosRestaurante', autenticar, function (req,res,next){
    const query = `SELECT p.Fecha_Registro, pl.Nombre, p.Ubicacion, pd.Estado, p.idCompra, pd.idPedido_Detalle FROM pedido p 
    INNER JOIN pedido_detalle pd on p.idCompra = pd.Pedido_idCompra
    INNER JOIN platillo pl on pd.Platillo_idPlatillo = pl.idPlatillo
    INNER JOIN Menu m on pl.Menu_idMenu = m.idMenu
    INNER JOIN Restaurante r on m.Restaurante_idRestaurante = r.idRestaurante
    WHERE m.Restaurante_idRestaurante = ? AND pd.estado <> '' AND p.estado <> 'H'`
    db.query(query, [req.body.idRestaurante], function(err,result){
        respuesta.respuestaItems(err,result,res)
    })
})

/** JFunez@03MAY2020 */
router.post('/historialEspecificoRestaurante', autenticar, function (req,res,next){
    const query = `SELECT p.Fecha_Registro, pl.Nombre, p.Ubicacion, pd.Estado, p.idCompra, pd.idPedido_Detalle FROM pedido p 
    INNER JOIN pedido_detalle pd on p.idCompra = pd.Pedido_idCompra
    INNER JOIN platillo pl on pd.Platillo_idPlatillo = pl.idPlatillo
    INNER JOIN Menu m on pl.Menu_idMenu = m.idMenu
    INNER JOIN Restaurante r on m.Restaurante_idRestaurante = r.idRestaurante
    WHERE m.Restaurante_idRestaurante = ? AND pd.estado <> '' AND p.estado = 'H'`
    db.query(query, [req.body.idRestaurante], function(err,result){
        respuesta.respuestaItems(err,result,res)
    })
})

/** JFunez@03MAY2020 */
router.post('/historialGeneralRestaurante', autenticar, function (req,res,next){
    const query = `SELECT DISTINCT ht.Pedido_idPedido, ht.Monto, ht.Fecha_Transaccion, p.Metodo_Pago_idMetodo_Pago FROM historial_transaccion ht
    INNER JOIN pedido p on ht.Pedido_idPedido = p.idCompra
    WHERE ht.Restaurante_idRestaurante = ? AND p.Estado = 'H'`
    db.query(query, [req.body.idRestaurante], function(err,result){
        respuesta.respuestaItems(err,result,res)
    })
})



/** JFunez@03MAY2020 */
router.post('/obtenerPedidoDetalle', autenticar, function (req,res,next){
    const query = `SELECT p.Fecha_Registro, pl.Nombre, p.Ubicacion, p.idCompra, pd.idPedido_Detalle, pl.Precio FROM pedido p 
    INNER JOIN pedido_detalle pd on p.idCompra = pd.Pedido_idCompra
    INNER JOIN platillo pl on pd.Platillo_idPlatillo = pl.idPlatillo
    INNER JOIN Menu m on pl.Menu_idMenu = m.idMenu
    INNER JOIN Restaurante r on m.Restaurante_idRestaurante = r.idRestaurante
    WHERE m.Restaurante_idRestaurante = ? AND p.idCompra = ?;`
    db.query(query, [req.body.idRestaurante, req.body.idCompra], function(err,result){
        respuesta.respuestaItems(err,result,res)
    })
})

/** JFunez@09ABR2020 */
router.put('/cambiarEstadoPedido', autenticar, function(req,res,next){
    const query = ` UPDATE pedido_detalle
                    SET Estado = ? 
                    WHERE  idPedido_Detalle = ?`
    db.query(query, [req.body.nuevoEstado, req.body.idPedidoDetalle], function(err, result){
        respuesta.respuestaError(err, result, res)
    })
})

/** JFunez@09ABR2020 */
router.post('/moverPedidosAHistorial', autenticar, function(req,res){
    const query = `UPDATE pedido
                   SET estado = 'H'
                   WHERE idCompra = ? `
    db.query(query, [req.body.idCompra], function(err, result){
        respuesta.respuestaError(err,result,res)
    })
})
/** JFunez@30MAR2020**/
router.post('/platillosRestaurante', autenticar, function (req, res, next) {
    const query = `SELECT * FROM platillo 
  INNER JOIN Menu ON platillo.Menu_idMenu = Menu.idMenu
  INNER JOIN Restaurante ON Menu.Restaurante_idRestaurante = Restaurante.idRestaurante
  WHERE Restaurante.idRestaurante = ? AND platillo.Estado = 'A'`
    db.query(query, [req.body.idRestaurante], function (err, result) {
        respuesta.respuestaItems(err, result, res)
    })
})

/** JFunez@30MAR2020**/
router.post('/menusRestaurante', autenticar, function (req, res, next) {
    const query = `SELECT * FROM Menu 
  INNER JOIN Restaurante ON Menu.Restaurante_idRestaurante = Restaurante.idRestaurante
  WHERE Restaurante.idRestaurante = ? AND Menu.Estado = 'A'`
    db.query(query, [req.body.idRestaurante], function (err, result) {
        
        respuesta.respuestaItems(err, result, res)
    })
})

/** JFunez@04MAY2020**/
router.post('/platillos_menu', (req, res, next) => {
    const query = `SELECT idPlatillo, Nombre, Descripcion, Precio, Foto_Platillo FROM platillo 
                    WHERE Menu_idMenu = ?`
    db.query(query, [req.body.idMenu],
        function (err, result) {
            respuesta.respuestaItems(err, result, res)
        })
})

/** JFunez@30MAR2020**/
router.post('/platillosRestaurante', autenticar, function (req, res, next) {
    const query = `SELECT * FROM platillo 
  INNER JOIN Menu ON platillo.Menu_idMenu = Menu.idMenu
  INNER JOIN Restaurante ON Menu.Restaurante_idRestaurante = Restaurante.idRestaurante
  WHERE Restaurante.idRestaurante = ?`
    db.query(query, [req.body.idRestaurante], function (err, result) {
        
        respuesta.respuestaItems(err, result, res)
    })
})

router.post('/restauranteUsuario', autenticar, function (req, res, next) {
    const query = `SELECT * FROM Restaurante WHERE Usuario_idUsuario = ` + req.body.idUsuario;
    db.query(query,
        function (err, result) {
            let resultado = jsonResult;
            if (err) resultado.error = err;
            if (result == undefined) {
                resultado.items = null;
                res.send(resultado);
            } else {
                resultado.error = null;
                resultado.items = result;
                res.send(resultado);
            }
        }

    );
});

/** JFunez@30MAR2020**/
router.get('/tipo-platillos', autenticar, function (req, res, next) {
    const query = `SELECT * FROM tipo_platillo`;
    db.query(query,
        function (err, result) {
            respuesta.respuestaItems(err, result, res)
        }
    )

})


router.post('/admin_global_editar_menu', autenticar, function (req, res, next) {   
        const query = `CALL SP_ADMIN_EDITAR_MENU(?, ?, ?, @Mensaje); SELECT @Mensaje AS mensaje;`
        db.query(query, [req.body.idMenu, req.body.nombre, req.body.foto],
            function (err, result) {
               respuesta.respuestaError(err, result, res)
        })
 })


router.put('/admin-borrar-local', autenticar, function (req, res, next) {
    const query = `CALL SP_ADMIN_ELIMINAR_LOCAL(?, @MENSAJE); SELECT @MENSAJE AS mensaje;`
    db.query(query, [req.body.idRestaurante],
        function (err, result) {
            respuesta.respuestaError(err, result, res)            
        })
})

router.put('/admin_local_modificar-platillo', autenticar, function (req, res, next) {
    const query = `CALL SP_LOCAL_EDITAR_PLATILLO(?,?, ?, ?, ?, ?, ?, @MENSAJE); SELECT @MENSAJE AS mensaje;`
    db.query(query, [req.body.idPlatillo, req.body.descripcion, req.body.nombrePlatillo, req.body.precio, req.body.fotoPlatillo, req.body.idMenu, req.body.idTipoPlatillo],
        function (err, result) {
            let resultado = jsonResult
            if (err) resultado.error = err;
            if (result == undefined) {
                resultado.items = null;
                res.send(resultado);
            } else {
                resultado.error = result;
                resultado.items = null;
                res.send(resultado);
            }
        })
})



/** CVasquez@09ABR2020**/
/*platillos":, "idUsuario":, "idMetodoPago":, "ubicacion":, "tiempoEstimado": */
router.post('/agregar_pedido', autenticar, function (req, res, next) {
    const query = `CALL SP_INSERTAR_PEDIDO(?, ?, ?, ?, ?, @Mensaje); SELECT @Mensaje AS mensaje;`
    db.query(query, [req.body.platillos, req.body.idUsuario, req.body.idMetodoPago, req.body.ubicacion, req.body.tiempoEstimado],
        function (err, result) {
            respuesta.respuestaError(err, result, res)
        })
})

/**
 * CVásquez@05MAY2020
 * headers: id-Menu, access-token
 */
router.post('/cambiar_foto_menu', autenticar, async (req, res, next) => {

    const { idAdmin, rol } = decodedJWT_all_usuarios(req.headers['access-token'], res)
    let file = req.file;
    if (rol === 1) {
        let id = req.headers['id-menu'];
        let indice = file.filename.indexOf(".")
        let id_publica = file.filename.substring(0, indice)
        const resultado_cloudinary = await cloudinary.uploader.upload(file.path, { public_id: id_publica, folder: 'menus', user_filename: true })
        const query = `SELECT Foto_Menu FROM Menu Where idMenu = ?;
                        UPDATE Menu SET Foto_Menu = ? WHERE idMenu = ?`;
        db.query(query, [id, resultado_cloudinary.url, id],
            async function (err, result) {
                if (!err) {
                    console.log('Image Uploaded');
                    const old_image = result[0][0].Foto_Menu
                    let id_publica
                    if (old_image != null) {
                        if (old_image.length > 60) {
                            let old_image_split = old_image.split('/')
                            id_publica = old_image_split[8].substring(0, old_image_split[8].indexOf("."))
                        }
                    }
                    try {
                        // Borra la vieja foto de perfil 
                        let eliminar = await cloudinary.uploader.destroy('menus/' + id_publica, function (error, result) {
                            console.log(result, error)
                        });
                    } catch (error) {
                        console.log('complete')
                    }
                }

            });

        // console.log(result.url);
        res.send(resultado_cloudinary.url);
    }
    fs.unlink(file.path);
});




/**
 * CVásquez@06MAY2020
 * headers: id-platillo, access-token
 */
router.post('/cambiar_foto_platillo', autenticar, async (req, res, next) => {

    const { idAdmin, rol } = decodedJWT_all_usuarios(req.headers['access-token'], res)
    let file = req.file;
    if (rol === 1) {

        let id = req.headers['id-platillo'];
        let indice = file.filename.indexOf(".")
        let id_publica = file.filename.substring(0, indice)
        const resultado_cloudinary = await cloudinary.uploader.upload(file.path, { public_id: id_publica, folder: 'platillo', user_filename: true })
        const query = `SELECT Foto_Platillo FROM platillo Where idPlatillo = ?;
                        UPDATE platillo SET Foto_Platillo = ? WHERE idPlatillo = ?`;
        db.query(query, [id, resultado_cloudinary.url, id],
            async function (err, result) {
                if (!err) {
                    console.log('Image Uploaded');
                    const old_image = result[0][0].Foto_Platillo
                    let id_publica
                    if (old_image != null) {
                        if (old_image.length > 60) {
                            let old_image_split = old_image.split('/')
                            id_publica = old_image_split[8].substring(0, old_image_split[8].indexOf("."))
                        }
                    }
                    try {
                        // Borra la vieja foto de perfil 
                        let eliminar = await cloudinary.uploader.destroy('platillo/' + id_publica, function (error, result) {
                            console.log(result, error)
                        });
                    } catch (error) {
                        console.log(error)
                    }
                }

            });
        res.send(resultado_cloudinary.url);
    }
    fs.unlink(file.path);
    // console.log(result.url);
});




module.exports = router

