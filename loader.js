//Arquivo que roda o servidor
const server = require('./src/config/server')

const port = process.env.PORT || 3003;
server.listen(port, () => {
    console.log(`Servidor esta rodando na porta ${port}`)
})