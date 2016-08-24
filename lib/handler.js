'use strict';

let Articulator = null;
try {
  // if running from repo
  Articulator = require('./articulator.js').Articulator;
} catch (e) {
  //Articulator = require('node-wit').Wit;
}

const accessToken = (() => {
  /*if (process.argv.length !== 3) {
    console.log('usage: node examples/quickstart.js <wit-access-token>');
    process.exit(1);
  }*/
  return 'JAMRL7E4XBOA7E6AUMD2FD4ONFUYRGRA';
})();

// Quickstart example
// See https://wit.ai/ar7hur/quickstart

const firstEntityValue = (entities, entity) => {
  const val = entities && entities[entity] &&
    Array.isArray(entities[entity]) &&
    entities[entity].length > 0 &&
    entities[entity][0].value
  ;
  if (!val) {
    return null;
  }
  return typeof val === 'object' ? val.value : val;
};

const actions = {
  send(server, request, response) {
    const {sessionId, context, entities} = request;
    const {text, quickreplies} = response;
    return new Promise(function(resolve, reject) {
      console.log('sending...', JSON.stringify(response));
      return resolve();
    }).then(() => {
      return server.reply(response);
    });
  },
  merge({entities, context}) {
    return new Promise(function(resolve, reject) {
      return resolve(context);
    });
  },  
  getShows({context, entities}) {
    const showtype = getEntity('showtype');
    console.log('showtype ============>', showtype);
    return new Promise(function(resolve, reject) {
      context.programType = 'Movies';
      context.listOfShows = 'X-Men, Captain America, Wolverine';
      return resolve(context);
    })
  },
  getBasetypes({context, entities}) {
    return new Promise(function(resolve, reject) {      
      context.baseType = ' Series, Movies or Events ';
      return resolve(context);
    })
  } 
};

const getEntity = (name) => {
    let entity = '';
    if (entities && entities.hasOwnProperty(name)) {
      let intent = entities[name];
      intent.forEach((obj) => {
        if (obj.value) {
          entity = obj.value;
        }
      });
    }
    return entity;
};

const client = new Articulator({accessToken, actions});
//client.interactive();

module.exports = client;
