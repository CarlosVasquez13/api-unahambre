/**
 * Aquí estarán todas las rutas que tengan que ver con la página administración de restaurante
 */

const express = require('express')
const jsonResult = require('../models/result')
const router = express.Router()
const db = require('../connection/conexion')
const autenticar = require('../middlewares/autentication')
const jwt = require('jsonwebtoken')
const respuesta = require('../models/respuesta')




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
            let resultado = jsonResult;
            resultado.error = result
            res.send(resultado);
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


/**Robindroide
MODIFICAR PLATILLOS PARA ADMIN
*/
router.put('/admin_local_modificar-platillo', autenticar, function (req, res, next) {
    const query = `CALL SP_LOCAL_EDITAR_PLATILLO(?, ?, ?, ?, ?, ?, @MENSAJE); SELECT @MENSAJE AS mensaje;`
    db.query(query, [req.body.descripcion, req.body.nombrePlatillo, req.body.precio, req.body.fotoPlatillo, req.body.idMenu, req.body.idTipoPlatillo],
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
/**Robindroide
MODIFICAR RESTAURANTE
*/
router.put('/admin_global_modificar-local', autenticar, router, function (req, res, next) {
    const { id, rol } = decodedJWT_admin_usuarios(req.headers['access-token'], res)
    if (rol === 0) {
        const query = `CALL SP_ADMIN_EDITAR_RESTAURANTE(?, ?, ?, ?, @MENSAJE); SELECT @MENSAJE AS mensaje;`
        db.query(query, [req.body.nombreRestaurante, req.body.telefono, req.body.ubicacion, req.body.idUsuario],
            function (err, result) {
                respuestaError(err, result, res)
            })
    }
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

/** JFunez@30MAR2020**/
router.post('/platillosRestaurante', autenticar, function (req, res, next) {
    const query = `SELECT * FROM platillo 
  INNER JOIN menu ON platillo.Menu_idMenu = menu.idMenu
  INNER JOIN restaurante ON menu.Restaurante_idRestaurante = restaurante.idRestaurante
  WHERE restaurante.idRestaurante = ?`
    db.query(query, [req.body.idRestaurante], function (err, result) {
        respuestaItems(err, result, res)
    })
})

/** JFunez@30MAR2020**/
router.post('/menusRestaurante', autenticar, function (req, res, next) {
    const query = `SELECT * FROM menu 
  INNER JOIN restaurante ON menu.Restaurante_idRestaurante = restaurante.idRestaurante
  WHERE restaurante.idRestaurante = ?`
    db.query(query, [req.body.idRestaurante], function (err, result) {
        respuestaItems(err, result, res)
    })
})

/** JFunez@30MAR2020**/
router.post('/platillosRestaurante', autenticar, function (req, res, next) {
    const query = `SELECT * FROM platillo 
  INNER JOIN menu ON platillo.Menu_idMenu = menu.idMenu
  INNER JOIN restaurante ON menu.Restaurante_idRestaurante = restaurante.idRestaurante
  WHERE restaurante.idRestaurante = ?`
    db.query(query, [req.body.idRestaurante], function (err, result) {
        respuestaItems(err, result, res)
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
            respuestaItems(err, result, res)
        }
    )

})


router.post('/admin_global_editar_menu', autenticar, function (req, res, next) {   
        const query = `CALL SP_ADMIN_EDITAR_MENU(?, ?, ?, @Mensaje); SELECT @Mensaje AS mensaje;`
        db.query(query, [req.body.idMenu, req.body.nombre, req.body.foto],
            function (err, result) {
                respuestaError(err, result, res)
        })
 })


router.put('/admin-borrar-local', autenticar, function (req, res, next) {
    const query = `CALL SP_ADMIN_ELIMINAR_LOCAL(?, @MENSAJE); SELECT @MENSAJE AS mensaje;`
    db.query(query, [req.body.idRestaurante],
        function (err, result) {
            respuesta.respuestaError(err, result, res)            
        })
})

/**Robindroide
MODIFICAR PLATILLOS PARA ADMIN
*/
router.put('/admin_local_modificar-platillo', autenticar, function (req, res, next) {
    const query = `CALL SP_LOCAL_EDITAR_PLATILLO(?, ?, ?, ?, ?, ?, @MENSAJE); SELECT @MENSAJE AS mensaje;`
    db.query(query, [req.body.descripcion, req.body.nombrePlatillo, req.body.precio, req.body.fotoPlatillo, req.body.idMenu, req.body.idTipoPlatillo],
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
/**IN PV_PLATILLOS VARCHAR(255),
IN PI_ID_USUARIO INT,
IN PI_ID_METODO_PAGO INT,
IN PV_UBICACION VARCHAR(200),
IN PV_TIEMPO_ESTIMADO VARCHAR(200),
OUT PV_MENSAJE VARCHAR(2000)) 
platillos, idUsuario, idMetodoPago, ubicacion, tiempoEstimado */
router.post('/admin_local_agregar_pedido', autenticar, function (req, res, next) {
    const query = `CALL SP_INSERTAR_PEDIDO(?, ?, ?, ?, ?, @Mensaje); SELECT @Mensaje AS mensaje;`
    db.query(query, [req.body.platillos, req.body.idUsuario, req.body.idMetodoPago, req.body.ubicacion, req.body.tiempoEstimado],
        function (err, result) {
            respuesta.respuestaError(err, result, res)
        })
})


module.exports = router

