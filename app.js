'use strict';

const path = require('path');
const inert = require('inert');
const hapi = require('hapi');
const client = require('./lib/handler.js');

const server = new hapi.Server();

server.register(inert, function () {
  server.connection({ port: 3000 });
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

server.route( {
  method: 'GET',
  path: '/converse',
  handler: function (request, reply) {
    client.interactive(request.query.message);
    return reply('Hello World!');
  }
});
