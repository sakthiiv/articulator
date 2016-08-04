'use strict';

const path = require('path');
const inert = require('inert');
const hapi = require('hapi');

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
