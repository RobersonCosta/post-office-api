const router = require('express').Router()
const PostOfficeService = require('../controllers/PostOfficeService')

router.get('/consultZipCode/:cep', PostOfficeService.consultZipCode)

router.post('/fetchPrecoPrazo', PostOfficeService.calculaPrecoPrazo)
module.exports = function(server){
    server.use('/postoffice', router)
}