//Aqui fica a configuração do servidor
require('dotenv').config()
const express = require('express')
const bodyParser = require('body-parser')
const cors = require('cors')
const consign = require('consign')

const server = express()

server.use(bodyParser.json({limit: '50mb'}));
server.use(bodyParser.urlencoded({limit: '50mb', extended: true}));
server.use(cors({ origin: '*' }))

consign()
    .include('src/routes')
    .then('/src/controllers')
    .into(server)
module.exports = server