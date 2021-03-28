const router = require('express').Router()
const PostOfficeService = require('../controllers/PostOfficeService')

router.get('/consultZipCode', PostOfficeService.consultZipCode)

router.get('/orderTracking', PostOfficeService.orderTracking)

router.get('/fetchPrecoPrazo', PostOfficeService.calculaPrecoPrazo)
module.exports = function(server){
    server.use('/postoffice', router)
}