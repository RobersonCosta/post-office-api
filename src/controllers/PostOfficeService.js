const { consultarCep, calcularPrecoPrazo, rastrearEncomendas } = require("correios-brasil");
const querystring = require('querystring');
const { response } = require("express");
const fetch = require('node-fetch')

const iconv = require('iconv-lite');
const convert = require('xml-js');

const BASE_CEP='https://viacep.com.br/ws'
const BASE_CORREIOS='http://ws.correios.com.br/calculador/CalcPrecoPrazo.aspx'
const BASE_RASTREIO='https://www.linkcorreios.com.br'

const sanitization = (cep) => {
    /**
     * Função responsável por realizar a higienização dos ceps, deixando apenas caracteres válidos e do comprimento correto.
     */
    const regex = new RegExp(/[^0-9]|[/ /]/g, '');
    const sCep = cep.toString().trim().replace(regex, '');
    if (sCep.length !== 8) throw Error(`Cep: ${cep} inválido!`);
    return sCep;
}

const convertArrayBufferToString = (arrayBuffer, encoding) => {
    //Converte o Array Buffer para String com o encoding escolhido
    try {
        const strXml = iconv.decode(Buffer.from(arrayBuffer), encoding).toString();
        return strXml
    } catch (error) {
        console.log('Eroo ao converter Array Buffer em String')
        console.log(error)
        return
    }
    
}
const convertXMLStringToJson = (xmlString) => {
    //Converte o XLM para Json
    
    try {
        const strJson = JSON.parse(convert.xml2json(xmlString, { compact: true }));
        return strJson
    } catch (error) {
        console.log('Eroo ao converter o XLM para Json')
        console.log(error)
        return
    }
}
const formatResponse = async (apiResponse) => {
    try {
        
       const strXml = convertArrayBufferToString(await apiResponse.text(), 'iso-8859-1') //Converte o ojbeto retornado na resposta em uma string XML
       const strJson = convertXMLStringToJson(strXml) //converte a string XML em JSON
       
        return {
            Codigo: strJson.Servicos.cServico.Codigo._text,
            Valor: strJson.Servicos.cServico.Valor._text,
            PrazoEntrega: strJson.Servicos.cServico.PrazoEntrega._text,
            ValorSemAdicionais: strJson.Servicos.cServico.ValorSemAdicionais._text,
            ValorMaoPropria: strJson.Servicos.cServico.ValorMaoPropria._text,
            ValorAvisoRecebimento: strJson.Servicos.cServico.ValorAvisoRecebimento._text,
            ValorDeclarado: strJson.Servicos.cServico.ValorValorDeclarado._text,
            EntregaDomiciliar: strJson.Servicos.cServico.EntregaDomiciliar._text,
            EntregaSabado: strJson.Servicos.cServico.EntregaSabado._text,
            obsFim: strJson.Servicos.cServico.obsFim._text,
            Erro: strJson.Servicos.cServico.Erro._text,
            MsgErro: strJson.Servicos.cServico.MsgErro._cdata,
        }
    } catch (error) {
        console.log("Erro ao formatar a Resposta")
        console.log(error)
        return
    }
}


exports.consultZipCode = async(request, response) =>{
    /**
     * Função responsável por consultar as informações do CEP informado com
     * base no serviço VIACEP do IBGE
     */
    const cep = sanitization(request.body.cep) /**Validação do CEP */

    try {
        const apiResponse = await this.apiPostOfficeGET(`${BASE_CEP}/${cep}/json`)  /**Requisição a base ViaCEP */
        const address = await apiResponse.json() 
        response.status(200).send({message : 'Dados encaminhados com sucesso!', address})  /**Retorno da Resposta */   
    } catch (error) {
        response.status(500).send({message : `Houve um erro ao consultar o cep ${request.body.cep}!`, error : error})  /**Retorno do erro */
    }
}

exports.orderTracking = async(request, response) =>{
    try {
        // const status = await this.apiPostOfficeGET(`${BASE_RASTREIO}/${request.body.code}`)  /**Requisição a base dos correios para rastrear a encomenda */
        const status = await rastrearEncomendas(['LB473758526SE'])
        response.status(200).send({message : 'Dados encaminhados com sucesso!', status})  /**Retorno da Resposta */   
    } catch (error) {
        response.status(500).send({message : `Houve um erro ao Rastrear a encomenda ${request.body.code}!`, error : error})  /**Retorno do erro */
    }
}

exports.calculaPrecoPrazo = async(request, response) => {
    /**
        *PAC -> 04510
        *SEDEX -> 04014 
     */
    
    const serviceCodes =   ["04014",'04510']
    
    try {
        var precosPrazosArr = []
        
        for await (code of serviceCodes) {
            const qs = {
                ...request.body,
                ...{
                  nCdServico: code,
                  sCepOrigem: sanitization(request.body.sCepOrigem),
                  sCepDestino: sanitization(request.body.sCepDestino),
                  nCdEmpresa: '',
                  sDsSenha: '',
                  sCdMaoPropria: 'n',
                  nVlValorDeclarado: 0,
                  sCdAvisoRecebimento: 'n',
                  StrRetorno: 'xml',
                  nIndicaCalculo: 3,
                },
            };

            let precoPrazo = await formatResponse(
                await this.apiPostOfficeGET(`${BASE_CORREIOS}?${querystring.stringify(qs)}`)
            )
            precosPrazosArr.push(precoPrazo)
        }
        
        response.status(200).send({message : 'Dados encaminhados com sucesso!', precosPrazosArr})  /**Retorno da Resposta */   

    } catch (error) {
        response.status(500).send({message : `Houve um erro ao Rastrear calcular o preço e o Prazo da entrega!`, error : error})  /**Retorno do erro */

    }
}


exports.apiPostOfficeGET = async (apiUrl) => {
    /**
     * Função Responsável por realizar uma solicitação GET https
    */
    const options = {};
    options['method'] = 'GET';
    options['headers'] = {
      'content-type': 'application/json'
    }
    var apiResponse = await fetch(apiUrl, options)
    return apiResponse;
}