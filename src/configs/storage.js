const multer = require('multer');//Modulo para gestion de imagenes
const uuid = require('uuid/v4');//Modulo para gestion de id de imagenes
const path = require('path');


const storage = multer.diskStorage({
    destination: path.join(__dirname, '../public/uploadsProfilePics'),
    filename: (req, file, cb) => {
        cb(null, uuid() + path.extname(file.originalname).toLocaleLowerCase());
    }
}); //Almacenamiento de imagenes de perfil



module.exports = storage