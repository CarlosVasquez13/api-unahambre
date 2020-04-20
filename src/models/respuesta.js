const express = require('express')
const jsonResult = require('../models/result')
const router = express.Router()


/**
 * 
 * <!---Estándar a usar cuando la respuesta no incluye datos
 *  Solo mensaje de exíto o fallo en la petición --->
 */

function respuestaSuccess(err, result, res) {
    let resultado = jsonResult
    if (err) resultado.error = err;
    if (result == undefined) {
        resultado.success = null
        res.send(resultado)
    } else {
        resultado.success = result
        resultado.error = null
        res.send(resultado)
    }
}

function respuestaError (err, result, res) {
    let resultado = jsonResult
    resultado.error = null
    resultado.items = null
    resultado.item = null
    if (err){
        resultado.error = err;  
        res.send(resultado)
    } else {
        if (result == undefined) {
            resultado.error = null
            res.send(resultado)
        } else {
            resultado.error = result
            res.send(resultado)
        }
    }

}
/**
 * 
 *Estándar a usar para cuando la respuesta incluya datos
 */
function respuestaItems(err, result, res) {
    let resultado = jsonResult
    if (err) resultado.error = err;
    if (result == undefined) {
        resultado.items = null
        res.send(resultado)
    } else {
        resultado.item = null
        resultado.items = result
        resultado.error = null
        res.send(resultado)
    }
}


module.exports = { respuestaError : respuestaError ,
                    respuestaSuccess: respuestaSuccess,
                    respuestaItems: respuestaItems
                }