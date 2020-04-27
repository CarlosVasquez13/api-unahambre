const express = require('express')
const jsonResult = require('../models/result')
const router = express.Router()
const db = require('../connection/conexion')
const respuesta = require('../models/respuesta')
const autenticar = require('../middlewares/autentication')
const enviar_correo = require('../models/mail_service')
const jwt = require('jsonwebtoken')
const cloudinary = require('../configs/credenciales')
const fs = require('fs-extra');


// ruta para pruebas
router.post('/prueba', (req, res, next) => {

    res.send({"mensaje": "prueba completada  "})
})

/**Robindroide 
POST PARA SUBIR UNA IMAGEN DE PERFIL*/
router.post('/upload-profile-pic', autenticar, async (req, res, next) => {
    let file = req.file;
    const id = req.headers['idusuario'];
    let indice = file.filename.indexOf(".")
    let id_publica = file.filename.substring(0, indice)
    const result = await cloudinary.uploader.upload(file.path, {public_id: id_publica, folder: 'profile_pics', user_filename: true})
    const query = `SELECT Foto_Perfil FROM usuario Where idUsuario = ?;
                    UPDATE usuario SET Foto_Perfil = ? WHERE idUsuario = ?`;
    db.query(query, [id, result.url, id],
        async function (err, result) {
            if (!err) {
                console.log('Image Uploaded');               
                const old_image = result[0][0].Foto_Perfil
                let id_publica
                if (old_image != null) {
                    if (old_image.length > 60) {
                        let old_image_split = old_image.split('/')
                        id_publica = old_image_split[8].substring(0, old_image_split[8].indexOf("."))                                                  
                    }
                }
                try {      
                    // Borra la vieja foto de perfil             
                   let eliminar = await cloudinary.uploader.destroy('profile_pics/'+id_publica, function (error, result) {
                        console.log(result, error)
                    });          
                } catch (error) {
                    console.log(error)
                }                
            }
            
        });
    fs.unlink(file.path);
    // console.log(result.url);
    res.send(result.url);
});


/**
* CVasquez@02Mar2020
*Si el mensaje está vacio entonces el usuario se registro correctamente, sino entonces el mensaje
*no estará vacio.
* De esta forma debe acceder frontend al error, si el error es nulo el sp se ejecutò correctamente
* sino, que gestionen la excepciòn
*/
// FINAL POST Registrar usuarios
router.post('/registrar_usuario', function (req, res, next) {
    const query = `CALL SP_INSERTAR_USUARIO(?,?,?,?,?,?,?,?,@Mensaje);Select @Mensaje as mensaje`;
    db.query(query, [req.body.nombre, req.body.apellido, req.body.celular, req.body.sexo, req.body.numeroIdentidad, req.body.nombreUsuario, req.body.contrasena, req.body.correo],
        async function (err, result, rows) {
            if (!err) {
                // Nota_cambios : agregar contenido al mensaje, por ahora no es posible crear una activación por correo
                var mensaje = `<div>
                                <h1>Hola ${req.body.nombreUsuario}</h1>
                                <h2>Gracias por registrarte en nuestra plataforma.</h2>
                               </div>
                `
                try {
                   let mail = await enviar_correo(mensaje, req.body.correo)

                } catch (error) {
                 console.log(error)
                }
            }
            respuesta.respuestaError(err, result, res)
        }
    );
});


/** CVásquez@17MAR2020
 *Obtener la información del usuario que ya está debidamente logueado
 *Se recibe desde frontend el idUsuario
 *Se retorna la info de las tablas usurio y persona
 */
// /api/info-user
router.post('/informacion_usuario', autenticar, function (req, res, next) {
    const query = `SELECT Nombre, Apellidos, Nombre_Usuario, Celular, Sexo, Numero_Identidad, Correo  FROM Usuario
                INNER JOIN Persona 
                ON Persona_idPersona = idPersona
                WHERE idUsuario = ?`
    db.query(query, [req.body.idUsuario],
        function (err, result) {
            respuesta.respuestaItems(err, result, res)
        })
})

/** CVásquez@13MAR2020
 *Cambiar nombreUsuario, Celular de un usuario
 *Parametros del JSON a recibir, idUsuario, nombreUsuario, nuevoNombre, celular.
 *La respuesta, error.mensaje, irá null si los cambios se completaron con exito.
 */
/**
 * Ejemplo del json a recibir
 * {
	"idUsuario": 1,
	"nombreUsuario": "sujeto",
	"nuevoUsuario": "Sujeto0",
	"celular": "",
	"nuevoNombre": "",
  "nuevoApellido": "Primero" }
 */
// /api/cambiar-info-usuario
router.put('/cambiar_informacion_usuario', autenticar, function (req, res, next) {
    if (req.body.nuevoUsuario == "") req.body.nuevoUsuario = null;
    if (req.body.celular == "") req.body.celular = null;
    if (req.body.nuevoNombre == "") req.body.nuevoNombre = null;
    if (req.body.nuevoApellido == "") req.body.nuevoApellido = null;
    const query = `CALL SP_CAMBIAR_INFO_USUARIO(?, ?, ?, ?, ?, ?, @MENSAJE); SELECT @MENSAJE AS mensaje;`
    db.query(query, [req.body.idUsuario, req.body.nombreUsuario, req.body.nuevoUsuario, req.body.celular, req.body.nuevoNombre, req.body.nuevoApellido],
        function (err, result) {
            respuesta.respuestaSuccess(err, result, res)
        })
})


/** CVásquez@08MAR2020
 * Cambio de contraseña para los usuarios, recibe: usuario, contrasena, nueva_contrasena
 *Si se logro el completar el cambio entonces el mensaje en el error sera null, caso contrario el mensaje no estará null
 *También se comprueba si la contraseña actual es la correcta, sino el cambio no se realiza
 *error. mensaje llevará la respuesta para frontend.
 */
router.post('/cambiar-contrasena', autenticar, function (req, res, next) {
    const query = `CALL SP_CAMBIAR_CONTRASENA(?, ?, ?, @MENSAJE); SELECT @MENSAJE AS mensaje;`

    db.query(query, [req.body.usuario, req.body.contrasena, req.body.nueva_contrasena],
        function (err, result) {

            let resultado = jsonResult
            if (err) resultado.error = err;
            if (result === undefined) {
                resultado.error = err
                resultado.items = null
                res.send("error al cambiar la contraseña" + resultado)
            } else {
                respuesta.respuestaError(err, result, res)
            }

        })
})


/** CVásquez@08MAR2020
 * RECUPERAR CONTRASEÑA
 * Si el correo ingresado existe, entonces se le enviará la contraseña al usuario a dicho correo
 * devuelve un 1 o 0  para frontend
 */
router.post('/recuperar_password', function (req, res, next) {
    const query = 'CALL SP_VERIFICAR_CORREO(?, @Mensaje); SELECT @MENSAJE AS mensaje';
    db.query(query, [req.body.correo],
        async function (err, result) {
            let resultado = jsonResult;
            if (!err) {
                resultado.items = null
                resultado.error = result
                
                if (resultado.error[1][0].mensaje != null) {
                    var mensaje = `
                  <div style="background-color: #dcd6f7; width: 50%; height: 100%; text-align: center; justify-content: center; border-radius: 1rem; padding: 1rem;">
                      <div>
                          <h3>Servicios Unahambre</h3>
                          <p>Has solicitado recuperar tu contraseña</p>
                          <p style="justify-content: center;">
                              Tu contraseña es:
                          </p>
                          <div">
                              
                              <h4 style="padding: 1rem; background-color: azure;">${ resultado.error[1][0].mensaje}</h4>
    
                          </div>
                        
                          <div>
                              <a href="https://webunahambre.herokuapp.com/login.html" style="text-decoration: none; background-color: #f8615a; padding: .5rem; color: white; border-radius: 0.4rem;">Login UNAHAMBRE</a>
                          </div>
                          <hr>
                          <p>Servicios UNAHAMBRE.</p>
                          <P>Gracias.</P>
                      </div>
                  </div>
            `;
                    let notificacion_mail = await enviar_correo(mensaje, req.body.correo)
                    if (notificacion_mail == true) {
                        resultado.error = null;
                        resultado.success = true;
                        res.send(resultado)
                    } else {
                        resultado.error = 'No fue posible realizar la recuperación de la contraseña. Intentalo más tarde.'
                        resultado.success = false;
                        res.send(resultado)
                    }
                    // res.send(resultado)
                } else {
                    // console.log('El correo no existe')
                    // res.send('0')
                    resultado.error = 'el correo ingresado no está registrado'
                    resultado.success = false
                    res.send(resultado)
                }
                
            } else {
                resultado.error = null
                resultado.error = err
                res.send(resultado)
            }

        })
})

//Stripe checkout
router.post('/checkout', async (req, res) => {
    console.log(req.body);
    const cargoTotal = req.body.cargoTotal;
    const customer = await stripe.customers.create({
        email: req.body.stripeEmail,
        source: req.body.stripeToken
    });
    const charge = await stripe.charges.create({
        amount: cargoTotal,
        currency: 'hnl',
        customer: customer.id,
        description: 'Comida'
    });
    console.log(charge.id);
    res.send('Received');
})

module.exports = router