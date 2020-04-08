const express = require('express')
const bodyParser = require('body-parser')
const cors = require('cors')
const config = require('./configs/config')
const storage = require('./configs/storage')
const path = require('path');
const multer = require('multer');//Modulo para gestion de imagenes



const app = express()
// cors
app.use(cors())

// multer
app.use(multer({
    storage: storage,
    dest: path.join(__dirname, 'public/uploadsProfilePics'),
    limits: { fileSize: 10000000 },
    fileFilter: (rq, file, cb) => {
        const filetypes = /jpeg|jpg|png/;
        const mimetype = filetypes.test(file.mimetype);
        const extname = filetypes.test(path.extname(file.originalname));
        if (mimetype && extname) {
           return cb(null, true);
        }
        cb("Error: Archivo debe ser imagen valida");
    }
}).single('image'));



// configuración del server
app.set('port', process.env.PORT || 3001)
app.set('llave', config.llave)
app.get('llave')

// Middlewares
app.use(express.json())

// body-parser
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Rutas
const ruta_usuario = require('./rutas/usuario')
const ruta_admins = require('./rutas/admins')
const login = require('./rutas/login')
const control = require('./rutas/control-navegacion')
const ruta_propietario = require('./rutas/propietario')
const productos = require('./rutas/restaurante')
app.use('/usuario', ruta_usuario)           //Para solicitudes que tengan que ver con mostrar o modificar datos de usuarios
app.use('/admin', ruta_admins)              //Página de administración de usuarios
app.use('/api/login', login)                //solo para el logueo, de cualquier usuario.
app.use('/control', control)                //Controlar la navegación en las paginas.
app.use('/propietario', ruta_propietario)   //Página de administración de restaurante
app.use('/producto', productos)             //Para mostrar restaurantes, platillos, menus,.. a los usuarios comunes(rol 2). Pag landing y menus


// catch 404 and forward to error handler
app.use(function (req, res, next) {
    console.log('ruta no reconocida')
    res.send('Esta ruta no existe').status(404)
    next()
    // next(createError(404));
});


// Iniciar el server

app.listen(app.get('port'), () => {
    console.log('server on port: ', app.get('port'))
})

