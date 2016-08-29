'use strict';

let Articulator = null;
const dataEntities = require('../models/entities.json');

try {
  Articulator = require('./articulator.js').Articulator;
} catch (e) {
  
}

const accessToken = (() => {
  return process.env.ACCESS_TOKEN || '';
})();

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
      return resolve();
    }).then(() => {
      return server.reply(response);
    });
  },
  merge({entities, context}) {
    return new Promise(function(resolve, reject) {
      return resolve(entities);
    });
  },  
  getShows({context, entities}) {
    return new Promise(function(resolve, reject) {
      context.shows = getTimeBasedShows(context);
      return resolve(context);
    })
  }
};

const getTimeBasedShows = (context) => {
  let shows = '';
  const types = dataEntities.types;
  try {    
    if (context.hasOwnProperty('datetime') && context['datetime'].length) {
      let dateString = (context['datetime'][0].from && context['datetime'][0].from.value) || (context['datetime'][0].value);
      let showDate = new Date(dateString);
      let showDay = showDate.getDay();
      shows += 'Movies: ' + types['movies'][showDay] + '<br />';
      shows += 'Series: ' + types['series'][showDay] + '<br />';
      shows += 'Events: ' + types['events'][showDay] + '<br />';
    }
  } catch (e) {
    return shows;
  }
  return shows;
};

const client = new Articulator({accessToken, actions});

module.exports = client;
