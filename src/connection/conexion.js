/* Datos de conexión, editar según sea el caso */

/** Montada la BD a Azure JFunez@15032020 #SprintDeCarlosAmaya */
const mysql = require('mysql');
var connection = mysql.createConnection({
    host: 'devuh.mysql.database.azure.com',
    user: 'rootuh@devuh',
    password: 'UH_password',
    database: 'unahambre',
    multipleStatements: true,
    ssl: true
});

connection.connect(function (err) {
    if(err) {
        console.log(err)
        return
    } else {
        console.log('Conexión con la base de datos establecida')
    }
})

function ping() {
    return connection.ping(function (err) {
        if (err) {
            console.error('Ocurrió un error conectandose a Azure: ' + err.stack);
            return false;
        }
    });
}

setInterval(ping, 20000);

module.exports = connection;