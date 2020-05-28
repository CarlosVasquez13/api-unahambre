const express = require('express')
const jsonResult = require('../models/result')
const router = express.Router()
const db = require('../connection/conexion')
const autenticar = require('../middlewares/autentication')
const jwt = require('jsonwebtoken')
const respuesta = require('../models/respuesta')
const cloudinary = require('../configs/credenciales')
const enviar_correo = require('../models/mail_service')
const fs = require('fs-extra');




// CVásquez@1ABR2020
// Sacar el id y rol del usuario adminUsuario que la petición. 
function decodedJWT_admin_usuarios(token, res) {
    const token_decoded = jwt.verify(token,'llave')
    const id = token_decoded.id
    const rol = token_decoded.rol
    if (rol != 0) {
        let resultado = jsonResult
        resultado.error = 'usuario no autorizado'
        // // 401 Unauthorized
        res.status(401).send(resultado)

    }
    return { id, rol }
}

/**RUta para pruebas */
router.get('/prueba', async (req, res, next) => {
    let resultado = await enviar_correo('hola', 'carlos1305vasquez@gmail.com')
    console.log('==============================')
    console.log('correo enviado, supongamos xD')
    console.log(resultado)
    res.send({"mensaje": "Ruta para realizar pruebas"})
})



// CVásquez@18MAR2020
/***************************Servicios admin global**************************** */
/**
* CVasquez@28Mar2020
*Si el mensaje está null entonces el usuario se registro correctamente, sino entonces el mensaje
*no estará vacio.
*/
router.post('/admin_global_insertar_usuario',  autenticar, function (req, res, next) {
    const { id, rol } = decodedJWT_admin_usuarios(req.headers['access-token'], res)
    if (rol === 0) {
        const query = `CALL SP_INSERTAR_USUARIO(?,?,?,?,?,?,?,?,@Mensaje);Select @Mensaje as mensaje`;
        db.query(query, [req.body.nombre, req.body.apellido, req.body.celular, req.body.sexo, req.body.numeroIdentidad, req.body.nombreUsuario, req.body.contrasena, req.body.correo],
            function (err, result) {
                respuesta.respuestaError (err, result, res)
            }

        );
    }
});

// Devuelve la lista de los restaurantes en la DB
/**
 * /g_mostrar_restaurantes
 * /restaurantes
 */
router.get('/g_mostrar_restaurantes',autenticar, function (req, res, next) {

    const query = `SELECT idRestaurante, Nombre_Local, Telefono, Correo, Ubicacion, Usuario_idUsuario, EstadoRestaurante, Nombre_Usuario FROM Restaurante
INNER JOIN usuario
WHERE idUsuario = Usuario_idUsuario`
    db.query(query,
        function (err, result) {
            respuesta.respuestaItems(err, result, res)
        }

    );
});

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
router.post('/admin_global_insertar-restaurante', autenticar, function (req, res, next) {
    const { id, rol } = decodedJWT_admin_usuarios(req.headers['access-token'], res)
    if (rol === 0) {
        const query = `CALL SP_INSERT_RESTAURANTE(?, ?, ?, ?, ?, ?, @MENSAJE); SELECT @MENSAJE AS mensaje;`
        db.query(query, [req.body.idUsuario, req.body.rolUsuario, req.body.nombreRestaurante, req.body.telefono, req.body.correo, req.body.ubicacion],
            function (err, result) {
                respuesta.respuestaError(err, result, res)
            })
    }
})

    // CVasquez@09Abr2020

router.post('/modificar-local', autenticar, function (req, res, next) {
    const { id, rol } = decodedJWT_admin_usuarios(req.headers['access-token'], res)
    if (rol === 0) {
        const query = `CALL SP_ADMIN_EDITAR_RESTAURANTE(?, ?, ?, ?, ?, @MENSAJE); SELECT @MENSAJE AS mensaje;`
        db.query(query, [req.body.idRestaurante ,req.body.nombreRestaurante, req.body.telefono, req.body.ubicacion, req.body.correo],
            function (err, result) {
                respuesta.respuestaError(err, result, res)
            })
    }
})
/**
 * CVasquez@30Mar2020
 *
{
  "idRestaurante":
}
 */
router.post('/admin_global_eliminar_restaurante',  autenticar, function (req, res, next) {
    const { id, rol } = decodedJWT_admin_usuarios(req.headers['access-token'], res)
    if (rol === 0) {
        const query = `CALL SP_ADMIN_ELIMINAR_LOCAL(?, @Mensaje); SELECT @Mensaje AS mensaje`
        db.query(query, [req.body.idRestaurante],
            function (err, result) {
                respuesta.respuestaError (err, result, res)
        })
    }
})

/** CVásquez@08MAR2020
 * Devuelve toda la información de usuarios y persona en la DB.
 */
router.get('/admin_global_mostrar_usuarios', autenticar, function (req, res, next) {
    const { id, rol } = decodedJWT_admin_usuarios(req.headers['access-token'], res)
    if (rol === 0) {
        const query = `SELECT * FROM Usuario INNER JOIN Persona ON idPersona = Persona_idPersona`;
        db.query(query,
            function (err, result) {
                respuesta.respuestaItems(err, result, res)
            })
    }
});


/**
 * CVásquez@23MAR2020
 * Ruta exclusiva para página de admin usuarios
 * en success irá la respuesta si mensaje está null todo funciono correctamente sino hubo algun error y el cambio no se hizo
 */
router.post('/admin_global_editar_usuario', autenticar, function (req, res, next) {
    const { id, rol } = decodedJWT_admin_usuarios(req.headers['access-token'], res)
    if (rol === 0) {
        if (req.body.usuario == "") req.body.usuario = null;
        if (req.body.nombre == "") req.body.nombre = null;
        if (req.body.apellido == "") req.body.apellido = null;
        const query = `CALL SP_ADMIN_EDITAR_USUARIO(?, ?, ?, ?, @MENSAJE); SELECT @MENSAJE AS mensaje;`
        db.query(query, [req.body.idUsuario, req.body.usuario, req.body.nombre, req.body.apellido],

            function (err, result) {
                respuesta.respuestaSuccess(err, result, res)
            })
    }
})

/**
{
  "idUsuario": 
}
 */
/**
 * CVasquez@28Mar2020
 * Eliminar usuarios desde la página de admin usuarios, mensaje = null : se borró el usuario
 */
router.post('/admin_global_eliminar_usuario',  autenticar, function (req, res, next) {
    const { id, rol } = decodedJWT_admin_usuarios(req.headers['access-token'], res)
    if (rol === 0) {
        const query = `CALL SP_ELIMINAR_USUARIO(?, @Mensaje); SELECT @Mensaje AS mensaje`
        db.query(query, [req.body.idUsuario],
            function (err, result) {
                respuesta.respuestaError (err, result, res)
            })
    }
})


/**CVásquez@18MAR2020
 * Retorna las solicitudes que tengan el estadoSolicitud igual al recibido
 * json: {estadoSolicitud: ("En espera", "Aprobada" o "Denegada")}
 */
router.post('/admin_gobal_solicitud_filtro_estado',  autenticar, function (req, res, next) {
    const { id, rol } = decodedJWT_admin_usuarios(req.headers['access-token'], res)
    if (rol === 0) {
        const query = `SELECT * FROM solicitud INNER JOIN restaurante ON Restaurante_idRestaurante = idRestaurante
                  WHERE EstadoSolicitud = ?`
        db.query(query, [req.body.estadoSolicitud],
            function (err, result) {
                respuesta.respuestaItems(err, result, res)
            })
    }
})
// CRUD PARA MENÚS

//Retorna todos los menus en la base
router.get('/g_mostrar_menus', autenticar, function (req, res, next) {

    const query = `SELECT * FROM Menu WHERE Estado = "A"`;
    db.query(query,
        function (err, result) {
            respuesta.respuestaItems(err, result, res)

        }
    )
});
/**
 * `(
{
"nombreMenu": ,
"idRestaurante": ,
"foto":  ,
"idCategoria": 
}
 */


router.post('/admin_global_agregar_menu',  function (req, res, next) {
    const { id, rol } = decodedJWT_admin_usuarios(req.headers['access-token'], res)
    if (rol === 0) {
        const query = `CALL SP_INSERTAR_MENU(?, ?, ?, ?, @Mensaje); SELECT @Mensaje AS mensaje`
        db.query(query, [req.body.nombreMenu, req.body.idRestaurante, req.body.foto, req.body.idCategoria],
            function (err, result) {
                respuesta.respuestaError (err, result, res)
            })
    }
})
/**
 * {
 * "idMenu": ,
 * "nombre": ,
 * "foto": 
 * }
 * Actualización editar idCategoria 
 */
router.post('/admin_global_editar_menu',  autenticar, function (req, res, next) {
    const { id, rol } = decodedJWT_admin_usuarios(req.headers['access-token'], res)
    if (rol === 0) {
        if (req.body.idCategoria == "") {
            req.body.idCategoria = null
        }
        const query = `CALL SP_ADMIN_EDITAR_MENU(?, ?, ?, ?, @Mensaje); SELECT @Mensaje AS mensaje;`
        db.query(query, [req.body.idMenu, req.body.nombre, req.body.foto, req.body.idCategoria],
            function (err, result) {
                respuesta.respuestaError (err, result, res)
            })
    }
})
/**{
 * "idMenu":
 * } */
router.post('/admin_global_borrar_menu',  autenticar, function (req, res, next) {
    const { id, rol } = decodedJWT_admin_usuarios(req.headers['access-token'], res)
    if (rol === 0) {
        const query = `CALL SP_ELIMINAR_MENU(?, @Mensaje); SELECT @Mensaje AS mensaje`
        db.query(query, [req.body.idMenu],
            function (err, result) {
                respuesta.respuestaError (err, result, res)
            })
    }
})

// CRUD PARA PLATILLOS

/** CVasquez@04MAR2020
 *
 * Se devuelve un arreglo en el campo items con los platillos existentes en la base de datos
 */

router.get('/g_mostrar_platillos', autenticar, function (req, res, next) {

    const query = `SELECT * FROM Platillo WHERE Estado = 'A'`;
    db.query(query,
        function (err, result) {
            respuesta.respuestaItems(err, result, res)
        })
});

/**
 * 
    {
      
      "idMenu" , 
      "nombre" ,
      "descripcion" , 
      "precio" , 
      "tipoPlatillo" 
    }
)
 */
router.post('/admin_global_agregar_platillo',  autenticar, function (req, res, next) {
    const { id, rol } = decodedJWT_admin_usuarios(req.headers['access-token'], res)
    if (rol === 0) {
        const query = `CALL SP_INSERTAR_PLATILLO(?, ?, ?, ?, ?, @Mensaje); SELECT @Mensaje AS mensaje`
        db.query(query, [req.body.descripcion, req.body.idMenu, req.body.nombre, req.body.precio, req.body.tipoPlatillo],
            function (err, result) {
                respuesta.respuestaError (err, result, res)
            })
    }
})

/**
 *
{   
  "idPlatillo":  , 
  "nombre":  , 
  "descripcion":  , 
  "precio": , 
  "idTipoPlatillo": 
}
 */
router.post('/admin_global_editar_platillo',  autenticar, function (req, res, next) {
    const { id, rol } = decodedJWT_admin_usuarios(req.headers['access-token'], res)
    if (rol === 0) {
        const query = `CALL SP_EDITAR_PLATILLO(?, ?, ?, ?, ?, @Mensaje); SELECT @Mensaje AS mensaje`
        db.query(query, [req.body.idPlatillo, req.body.nombre, req.body.descripcion, req.body.precio, req.body.idTipoPlatillo],
            function (err, result) {
                respuesta.respuestaError (err, result, res)
            })
    }
})
/**
 * {
 * "idPlatillo":
 * }
 */
// error.affectedRows": si es igual a 1 entonces se logro borrar el platillo si es cero no se borró.
router.post('/admin_global_borrar_platillo', autenticar, function (req, res, next) {
    const { id, rol } = decodedJWT_admin_usuarios(req.headers['access-token'], res)
    if (rol == 0) {
        const query = `UPDATE platillo SET Estado = 'I'  WHERE idPlatillo = ?`
        db.query(query, [req.body.idPlatillo],
            function (err, result) {
                respuesta.respuestaError (err, result, res)
            })
    }
})

/**
 * {"idUsuario": }
 * Elimina un usuario y los restaurantes que le pertenezcan, asi como los menus y platillos. 
 */
router.post('/admin_global_eliminar_usuario_restaurante',autenticar, function (req, res, next) {
    const { id, rol } = decodedJWT_admin_usuarios(req.headers['access-token'], res)
    if (rol == 0) {
        const query = `CALL SP_ADMIN_ELIMINAR_USUARIO_RESTAURANTES(?, @Mensaje); SELECT @Mensaje AS mensaje`
        db.query(query, [req.body.idUsuario],
            function (err, result) {
                respuesta.respuestaError (err, result, res)
            })
    }
})

/******************************************************************************** */


/** CVásquez@17MAR2020
 *Retorna todos los menus y el restaurante al que pertenecen y el dueño del restaurante
 */
router.get('/admin_global_menus_restaurante', autenticar, function (req, res, next) {
    const { id, rol } = decodedJWT_admin_usuarios(req.headers['access-token'], res)
    if (rol === 0) {
        const query = `SELECT idMenu, Tipo_Menu as Nombre_Menu, Fecha_Registro, Foto_Menu, idCategoria, Nombre_Local, Nombre_Usuario as Dueño_Local FROM Menu INNER JOIN Restaurante
              ON Restaurante_idRestaurante = idRestaurante
              INNER JOIN Usuario
              ON idUsuario = Usuario_idUsuario
                WHERE Menu.Estado = "A";
              `
        db.query(query,
            function (err, result) {
                respuesta.respuestaItems(err, result, res)
            })
    }
})

/** CVásquez@17MAR2020
 *Retorna todos los platillos que pertenecen a un menu a si como también
 el que pertenecen y el restaurante
 */
router.get('/admin_global_platillos_menu', autenticar, function (req, res, next) {
    const { id, rol } = decodedJWT_admin_usuarios(req.headers['access-token'], res)
    if (rol === 0) {
        const query = `SELECT * FROM Platillo INNER JOIN Menu
              ON Menu_idMenu = idMenu
              INNER JOIN Restaurante
              ON idRestaurante = Restaurante_idRestaurante
              WHERE Platillo.Estado = "A";`
        db.query(query,
            function (err, result) {
                respuesta.respuestaItems(err, result, res)
            })
    }
})


/** CVásquez@08MAR2020
 * Devuelve los usuarios Filtrados por rol, 0:admin, 1:Propietario local, 2:cliente.
 * Si el parametro idRol es incorrecto, items estará vacio y error indicará que ese rol no existe.
 */
// FILTRO USUARIO POR TIPO ROL
router.post('/admin_global_usuario_filtro_rol', autenticar, function (req, res, next) {
    const { id, rol } = decodedJWT_admin_usuarios(req.headers['access-token'], res)
    if (rol === 0) {
        const query = `CALL SP_ADMIN_FILTRO_CLIENTES_ROL(?, @MENSAJE);`
        db.query(query, [req.body.idRol],
            function (err, result) {
                if (req.body.idRol > 2) {
                    let resultado = jsonResult
                    resultado.error = 'No existe el rol ingresado'
                    res.send(resultado)
                } else {
                    respuesta.respuestaItems(err, result, res)
                }
            })
    }
})

/**********************************RUTAS PARA CAMBIAR LAS FOTOS, PERFIL, PLATILLOS, MENÚS, RESTAURANTES**************************************************** */

/**
 * CVásquez@12ABR2020
 * headers: id-platillo, access-token
 */
router.post('/cambiar_foto_platillo', autenticar, async (req, res, next) => {
    
    const { idAdmin, rol } = decodedJWT_admin_usuarios(req.headers['access-token'], res)
    let file = req.file;
    if (rol === 0) {

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
                        console.log('complete')
                    }
                }
                
            });
            res.send(resultado_cloudinary.url);
        }
        fs.unlink(file.path);
        // console.log(result.url);
});

/**
 * CVásquez@12ABR2020
 * headers: id-menu, access-token
 */
router.post('/cambiar_foto_menu', autenticar, async (req, res, next) => {

    const { idAdmin, rol } = decodedJWT_admin_usuarios(req.headers['access-token'], res)
    let file = req.file;
    if (rol === 0) {
        let id = req.headers['id-menu'];
        let indice = file.filename.indexOf(".")
        let id_publica = file.filename.substring(0, indice)
        const resultado_cloudinary = await cloudinary.uploader.upload(file.path, { public_id: id_publica, folder: 'menus', user_filename: true })
        const query = `SELECT Foto_Menu FROM menu Where idMenu = ?;
                        UPDATE menu SET Foto_Menu = ? WHERE idMenu = ?`;
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
 * CVásquez@12ABR2020
 * headers: id-restaurante, access-token
 */

// restaurant
router.post('/cambiar_foto_restaurante', autenticar, async (req, res, next) => {

    const { idAdmin, rol } = decodedJWT_admin_usuarios(req.headers['access-token'], res)
    let file = req.file;
    if (rol === 0) {
        let id = req.headers['id-restaurante'];
            let indice = file.filename.indexOf(".")
            let id_publica = file.filename.substring(0, indice)
        const resultado_cloudinary = await cloudinary.uploader.upload(file.path, { public_id: id_publica, folder: 'restaurant', user_filename: true })
            const query = `SELECT Foto_Restaurante FROM restaurante Where idRestaurante = ?;
                            UPDATE restaurante SET Foto_Restaurante = ? WHERE idRestaurante = ?`;
            db.query(query, [id, resultado_cloudinary.url, id],
                async function (err, result) {
                    if (!err) {
                        console.log('Image Uploaded');
                        const old_image = result[0][0].Foto_Restaurante
                        let id_publica
                        if (old_image != null) {
                            if (old_image.length > 60) {
                                let old_image_split = old_image.split('/')
                                id_publica = old_image_split[8].substring(0, old_image_split[8].indexOf("."))
                            }
                        }
                        try {
                            // Borra la vieja foto de perfil 
                            let eliminar = await cloudinary.uploader.destroy('restaurant/' + id_publica, function (error, result) {
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


/************************************Servicios para manejo de las solicitudes***************************************** */
/**CVásquez@18MAR2020
 * Retorna todos las solicitudes, de registro de restaurantes, existentes
 */
router.get('/admin_global_mostrar_solicitudes', autenticar, function (req, res, next) {
    const { id, rol } = decodedJWT_admin_usuarios(req.headers['access-token'], res)
    if (rol === 0) {
        const query = `SELECT idsolicitud, Restaurante_idRestaurante, Descripcion, EstadoSolicitud,
      FechaSolicitud, idRestaurante, Nombre_Local, Telefono, Correo, Ubicacion, EstadoRestaurante,
      Usuario_idUsuario, Nombre_Usuario
      FROM solicitud INNER JOIN restaurante ON Restaurante_idRestaurante = idRestaurante
                        INNER JOIN usuario ON Usuario_idUsuario = idUsuario;`
        db.query(query,
            function (err, result) {
                // respuesta.respuestaItems(err, result, res)
                respuesta.respuestaItems(err, result, res)
            })
    }
})

/**
 * CVásquez@18MAR2020
 * {"idSolicitud": }
 */
router.post('/aceptar_solicitud', autenticar, function (req, res, next) {
    const { idAdmin, rol } = decodedJWT_admin_usuarios(req.headers['access-token'], res)
    const query = `CALL SP_ACEPTAR_SOLICITUD(?,?, @MENSAJE)`
    if (rol === 0 ){
        db.query(query, [idAdmin, req.body.idSolicitud],
            (err, result) => {
                if(!err) {
                    // Nota_cambios : Notificar al cliente por correo
                    respuesta.respuestaError(err, result, res)
                } else {
                    respuesta.respuestaError(err, result, res)
                }
        })

    } else {
        res.send({"mensaje": "No tienes los permisos necesarios para realizar esta acción"})
    }
})

/**
 * CVásquez@18MAR2020
 * {"idSolicitud": }
 */
router.post('/rechazar_solicitud', autenticar, function (req, res, next) {
    const { idAdmin, rol } = decodedJWT_admin_usuarios(req.headers['access-token'], res)
    const query = `CALL SP_RECHAZAR_SOLICITUD(?,?, @MENSAJE)`
    if (rol === 0) {
        db.query(query, [idAdmin, req.body.idSolicitud],
            (err, result) => {
                if (!err) {
                    // Nota_cambios : Notificar al cliente por correo
                    // (async() => {
                    //     await enviar_correo(mensaje, correo, res)
                    // })();
                    respuesta.respuestaError(err, result, res)
                } else {
                    respuesta.respuestaError(err, result, res)
                }
            })

    } else {
        res.send({ "mensaje": "No tienes los permisos necesarios para realizar esta acción" })
    }
})


/**
 * CVásquez@18MAR2020
 * {"idSolicitud": }
 */
router.post('/eliminar_solicitud', autenticar, function (req, res, next) {
    const { idAdmin, rol } = decodedJWT_admin_usuarios(req.headers['access-token'], res)
    const query = `CALL SP_ELIMINAR_SOLICITUD(?,?, @MENSAJE)`
    if (rol === 0) {
        db.query(query, [idAdmin, req.body.idSolicitud],
            (err, result) => {
                if (!err) {
                    respuesta.respuestaError(err, result, res)
                } else {
                    respuesta.respuestaError(err, result, res)
                }
            })

    } else {
        res.send({ "mensaje": "No tienes los permisos necesarios para realizar esta acción" })
    }
})


/*********************< Servicio para mostrar historial de transacciones >***************************/

router.get('/mostrar_historial_transacciones', autenticar, function (req, res, next) {
    const { idAdmin, rol } = decodedJWT_admin_usuarios(req.headers['access-token'], res)
    const query = `SELECT idHistorial_Transaccion, Pedido_idPedido, Monto, Restaurante_idRestaurante, Fecha_Transaccion,
                    Nombre_Local, Nombre_Usuario
                    FROM historial_transaccion
                    INNER JOIN restaurante ON idRestaurante = historial_transaccion.Restaurante_idRestaurante
                    INNER JOIN pedido ON idCompra = Pedido_idPedido
                    INNER JOIN usuario ON idUsuario = Id_Usuario
                `
    if (rol === 0) {
        db.query(query, 
            (err, result) => {
                if (!err) {
                    respuesta.respuestaItems(err, result, res) 
                } else {
                    respuesta.respuestaError(err, result, res)
                }
            })
    }
})

/**
 * CVasquez@28MAY2020
 */
router.get('/mostrar_publicidad_contratada', autenticar, (req, res, next) => {
    const { idAdmin, rol } = decodedJWT_admin_usuarios(req.headers['access-token'], res)

    const query = `SELECT idRestaurante_has_publicidad, Nombre_Usuario, Nombre_Local, Plan_idPlan, Banner, Foto_Pop_ups, Restaurante_idRestaurante, Menu_idMenu, Platillo_idPlatillo FROM restaurante_has_publicidad
        INNER JOIN usuario 
        ON idUsuario = Usuario_idUsuario
        INNER JOIN restaurante
        ON idRestaurante = Restaurante_idRestaurante;`
    if (rol === 0) {
        db.query(query,
            (err, result) => {
                if (!err) {
                    respuesta.respuestaItems(err, result, res)
                } else {
                    respuesta.respuestaError(err, result, res)
                }
            })
    }
})
module.exports = router