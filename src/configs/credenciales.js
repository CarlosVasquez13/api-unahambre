const cloudinary = require('cloudinary').v2;


/**Robindroide
 * Credenciales de cloudinary
*/
cloudinary.config({
    cloud_name: 'unahambre',
    api_key: '744654611134741',
    api_secret: 'KEoBbnCK9vKCrxv1z6znoKwsMP4'
});


module.exports = cloudinary