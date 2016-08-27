'use strict';

const path = require('path');
const inert = require('inert');
const hapi = require('hapi');
const client = require('./lib/handler.js');

const server = new hapi.Server();
const port = Number(process.env.PORT || 3000)

server.register(inert, function (err) {
  server.connection({ port: port });
  server.route( {
    method: 'GET',
    path: '/{param*}',
    handler: {
      directory: { path: path.normalize(__dirname + '/public') }
    }
  });
  server.start((err) => { 
    console.log('Visit: http://127.0.0.1:3000') 
  });
});

/*
server.ext('onRequest', function (req, reply) {
  console.log({
    request: {
      method: req.method,
      url: req.url.path,
      headers: req.headers,
      ip: req.info.remoteAddress
    }
  });
  return reply.continue();
});

server.register({
    register: require('yar'),
    options: {
      storeBlank: false,
      cookieOptions: {
        password: 'articulator - a chat bot with voice input',
        isSecure: false
      }
    }
}, function (err) { });
*/

server.route({
  method: 'POST',
  path: '/converse',
  handler: function (request, reply) {
    let context = JSON.parse(request.payload.context);
    let session = request.payload.session;
    !session ? client.interact({request, reply}, request.payload.message) : client.runActions({request, reply}, session, request.payload.message, context);
  }
});
