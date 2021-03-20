const router = require('express').Router()
const PostOfficeService = require('../controllers/PostOfficeService')

// router.get('/', PostOfficeService.get)

module.exports = function(server){
    server.use('/postoffice', router)
}