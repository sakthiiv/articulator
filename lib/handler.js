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
  return 'XAIM6GRL3D64ETPHRPHGKP3TJ22HCHVQ';
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
  getShowtype({context, entities}) {
    var test = {
      'movies': ['X-Men', 'Captain America', 'Wolverine'],
      'series': ['Robot', 'Breaking Bad', 'Game of thrones'],
      'events': ['Olympics Gymnastics', 'Olympics Athletics']
    }
    return new Promise(function(resolve, reject) {
      if (entities && entities.hasOwnProperty('showtype')) {
 
      }
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

const client = new Articulator({accessToken, actions});
//client.interactive();

module.exports = client;
