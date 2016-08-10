'use strict';

const fetch = require('node-fetch');
//const readline = require('readline');
const uuid = require('node-uuid');
//const log = require('./log');

const DEFAULT_API_VERSION = '20160516';
const DEFAULT_MAX_STEPS = 5;
const DEFAULT_WIT_URL = 'https://api.wit.ai';
const learnMore = 'Learn more at https://wit.ai/docs/quickstart';
const sessionId = uuid.v1();
let baseContext = {}; 

function Articulator(opts) {
  if (!(this instanceof Articulator)) {
    return new Articulator(opts);
  }

  const {
    accessToken, apiVersion, actions, headers, logger, witURL
  } = this.config = Object.freeze(validate(opts));

  this.converse = (server, sessionId, message, context) => {
    let qs = 'session_id=' + encodeURIComponent(sessionId);
    if (message) {
      qs += '&q=' + encodeURIComponent(message);
    }
    const method = 'POST';
    const fullURL = witURL + '/converse?' + qs;
    const handler = makeWitResponseHandler(logger, 'converse');
    logger.debug(method, fullURL);
    return fetch(fullURL, {
      method,
      headers,
      body: JSON.stringify(context),
    })
    .then(response => Promise.all([response.json(), response.status]))
    .then(handler);
  };

  const continueRunActions = (server, sessionId, message, prevContext, i) => {
    return (json) => {
      if (i < 0) {
        logger.warn('Max steps reached, stopping.');
        return prevContext;
      }
      logger.warn('json => \'' + json);
      if (!json.type) {
        throw new Error('Couldn\'t find type in Wit response');
      }

      logger.debug('Context: ' + JSON.stringify(prevContext));
      logger.debug('Response type: ' + json.type);

      // backwards-cpmpatibility with API version 20160516
      if (json.type === 'merge') {
        json.type = 'action';
        json.action = 'merge';
      }

      if (json.type === 'error') {
        throw new Error('Oops, I don\'t know what to do.');
      }

      if (json.type === 'stop') {
        return prevContext;
      }

      const request = {
        sessionId,
        context: clone(prevContext),
        text: message,
        entities: json.entities,
      };

      if (json.type === 'msg') {
        throwIfActionMissing(actions, 'send');
        const response = {
          text: json.msg,
          quickreplies: json.quickreplies,
        };
        return actions.send(server, request, response).then((ctx) => {
          if (ctx) {
            throw new Error('Cannot update context after \'send\' action');
          }
          return this.converse(server, sessionId, null, prevContext).then(
            continueRunActions(server, sessionId, message, prevContext, i - 1)
          );
        });
      } else if (json.type === 'action') {
        const action = json.action;
        throwIfActionMissing(actions, action);
        return actions[action](request).then((ctx) => {
          const nextContext = ctx || {};
          return this.converse(server, sessionId, null, nextContext).then(
            continueRunActions(server, sessionId, message, nextContext, i - 1)
          );
        });
      } else {
        logger.debug('unknown response type', json);
        throw new Error('unknown response type ' + json.type);
      }
    }
  };

  this.runActions = (server, sessionId, message, context, maxSteps) => {
    if (!actions) throwMustHaveActions();
    const steps = maxSteps ? maxSteps : DEFAULT_MAX_STEPS;
    return this.converse(server, sessionId, message, context).then(
      continueRunActions(server, sessionId, message, context, steps)
    );
  };

  this.getContext = () => {

  };

  this.interact = (server, line, initContext, maxSteps) => {
    if (!actions) throwMustHaveActions();
    let context = typeof initContext === 'object' ? initContext : {};
    //const sessionId = uuid.v1();
    logger.warn('Sessionid => \'' + sessionId);
    const steps = maxSteps ? maxSteps : DEFAULT_MAX_STEPS;
    this.runActions(server, sessionId, line, context, steps)
    .then((ctx) => {
      context = ctx;
      //prompt();
    })
    .catch((server) => {
      return server.reply('Internal Server Error.').code(500);
    })
    /*const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    rl.setPrompt('> ');
    const prompt = () => {
      rl.prompt();
      rl.write(null, {ctrl: true, name: 'e'});
    };
    prompt();
    rl.on('line', (line) => {
      line = line.trim();
      if (!line) {
        return prompt();
      }
      this.runActions(sessionId, line, context, steps)
      .then((ctx) => {
        context = ctx;
        prompt();
      })
      .catch(logger.error)
    });*/
  };
};

const makeWitResponseHandler = (logger, endpoint) => {
  return rsp => {
    const error = err => {
      logger.error('[' + endpoint + '] Error: ' + err);
      throw err;
    };

    if (rsp instanceof Error) {
      return error(rsp);
    }

    const [json, status] = rsp;

    if (json instanceof Error) {
      return error(json);
    }

    const err = json.error || status !== 200 && json.body + ' (' + status + ')';

    if (err) {
      return error(err);
    }

    logger.debug('[' + endpoint + '] Response: ' + JSON.stringify(json));
    return json;
  }
};

const throwMustHaveActions = () => {
  throw new Error('You must provide the `actions` parameter to be able to use runActions. ' + learnMore)
};

const throwIfActionMissing = (actions, action) => {
  if (!actions[action]) {
    throw new Error('No \'' + action + '\' action found.');
  }
};

const validate = (opts) => {
  if (!opts.accessToken) {
    throw new Error('Could not find access token, learn more at https://wit.ai/docs');
  }
  opts.witURL = opts.witURL || DEFAULT_WIT_URL;
  opts.apiVersion = opts.apiVersion || DEFAULT_API_VERSION;
  opts.headers = opts.headers || {
    'Authorization': 'Bearer ' + opts.accessToken,
    'Accept': 'application/vnd.wit.' + opts.apiVersion + '+json',
    'Content-Type': 'application/json',
  };
  opts.logger = opts.logger || new Logger(INFO);
  if (opts.actions) {
    opts.actions = validateActions(opts.logger, opts.actions);
  }

  return opts;
};

const validateActions = (logger, actions) => {
  if (typeof actions !== 'object') {
    throw new Error('Actions should be an object. ' + learnMore);
  }
  if (!actions.send) {
    throw new Error('The \'send\' action is missing. ' + learnMore);
  }

  Object.keys(actions).forEach(key => {
    if (typeof actions[key] !== 'function') {
      logger.warn('The \'' + key + '\' action should be a function.');
    }

    if (key === 'say' && actions[key].length > 2 ||
      key === 'merge' && actions[key].length > 2 ||
      key === 'error' && actions[key].length > 2
    ) {
      logger.warn('The \'' + key + '\' action has been deprecated. ' + learnMore);
    }

    if (key === 'send') {
      if (actions[key].length !== 2) {
        logger.warn('The \'send\' action should accept 2 arguments: request and response. ' + learnMore);
      }
    } else if (actions[key].length !== 1) {
      logger.warn('The \'' + key + '\' action should accept 1 argument: request. ' + learnMore);
    }
  });

  return actions;
};

const clone = (obj) => {
  if (obj !== null && typeof obj === 'object') {
    if (Array.isArray(obj)) {
      return obj.map(clone);
    } else {
      const newObj = {};
      Object.keys(obj).forEach(k => {
        newObj[k] = clone(obj[k]);
      });
      return newObj;
    }
  } else {
    return obj;
  }
};

const DEBUG = 'debug';
const INFO  = 'info';
const WARN  = 'warn';
const ERROR = 'error';

const levels = [DEBUG, INFO, WARN, ERROR];
const funcs = {
  [DEBUG]: console.error.bind(console, '[Articulator][debug]'),
  [INFO]: console.log.bind(console, '[Articulator]'),
  [WARN]: console.warn.bind(console, '[Articulator]'),
  [ERROR]: console.error.bind(console, '[Articulator]'),
};
const noop = () => {}

const Logger = function(lvl) {
  this.level = lvl || INFO;

  levels.forEach((x) => {
    const should = levels.indexOf(x) >= levels.indexOf(lvl);
    this[x] = should ? funcs[x] : noop;
  });
};

module.exports = {
  Articulator
};
