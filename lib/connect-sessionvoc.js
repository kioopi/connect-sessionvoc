/*!
 * Session connector for a SessionVOC
 *
 * A session store, which uses an external server, namely a SessionVOC
 * (see http://www.worldofvoc.com) to store and manage the sessions. The
 * connector needs and extended connect-session handling, the sessionx
 * library which is based on the original connect-session.
 *
 *  DISCLAIMER
 * 
 *  Copyright 2010-2011 triagens GmbH, Cologne, Germany
 * 
 *  Licensed under the Apache License, Version 2.0 (the "License");
 *  you may not use this file except in compliance with the License.
 *  You may obtain a copy of the License at
 * 
 *      http://www.apache.org/licenses/LICENSE-2.0
 * 
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 * 
 *  Copyright holder is triAGENS GmbH, Cologne, Germany
 */

/* *****************************************************************************
   Imports and Exports
***************************************************************************** */

/**
 * Module dependencies.
 */

var connect = require('connect'),
    Session = connect.session.Session,
    Store = connect.session.Store,
    utils = connect.utils,
    http = require('http'),
    sys = require('sys');



/**
 * Exports.
 */

exports = module.exports;



/**
 * Exports the constructors.
 */

exports.SessionVocStore = SessionVocStore;



/**
 * Exports the debugging flag.
 */

exports.debug = true;

// Constants

/**
 * Client-server communication methods.
 */

var COMM_NONE = 0,
    COMM_SIMPLE = 1,
    COMM_CHALLENGE_RESPONSE = 2;

//   SessionVocStore constructors and methods

/**
 * Initializes a new `SessionVocStore`. You can define an options array to specifiy
 * the host and port.
 *
 * @param {Object} options
 * @api public
 */

function SessionVocStore (options) {
  Object.defineProperty(this, 'host', { value: (options && options.host) || 'localhost' });
  Object.defineProperty(this, 'port', { value: (options && options.port) || 8208 });

  this.description = 'Sescure and reliable session store using a SessionVOC';
  this.datainfo = null;
};



/**
 * Inherit from `Store.prototype`.
 */

SessionVocStore.prototype.__proto__ = Store.prototype;



/**
 * Creates a new session.
 *
 * @param {function} next
 */

SessionVocStore.prototype.createSession = function (next) {
  var host = this.host;
  var port = this.port;

  debuglog('createSession(' + host + ', ' + port + ')');

  checkDatainfo(this, next, function () {
    sessionvocRequest(svo(host, port, '/session', 'POST'), null, true, next);
  });
};



/**
 * Loads an existing session.
 *
 * @param {string} sid
 * @param {function} next
 */

SessionVocStore.prototype.loadSession = function (sid, next) {
  var host = this.host;
  var port = this.port;

  debuglog('loadSession(' + sid + ', ' + host + ', ' + port + ')');

  checkDatainfo(this, next, function () {
    sessionvocRequest(svo(host, port, '/session/' + sid, 'GET'),  null, true, next);
  });
};



/**
 * Updates an existing session.
 *
 * @param {string} sid
 * @param {Object} data
 * @param {function} next
 */

SessionVocStore.prototype.updateSession = function (sid, data, next) {
  var host = this.host;
  var port = this.port;

  debuglog('updateSession(' + sid + ', ' + host + ', ' + port + ')');

  checkDatainfo(this, next, function () {
    sessionvocRequest(svo(host, port, '/session/' + sid, 'PUT'), JSON.stringify(data), true, next);
  });
};



/**
 * Deletes an existing session.
 *
 * @param {string} sid
 * @param {function} next
 */

SessionVocStore.prototype.deleteSession = function (sid, next) {
  var host = this.host;
  var port = this.port;

  debuglog('deleteSession(' + sid + ', ' + host + ', ' + port + ')');

  checkDatainfo(this, next, function () {
    sessionvocRequest(svo(host, port, '/session/' + sid, 'DELETE'), null, true, next);
  });
};



/**
 * Logs in a session.
 *
 * @param {string} sid
 * @param {string} username
 * @param {string} password
 * @param {function} next
 */

SessionVocStore.prototype.login = function (sid, username, password, next) {
  var host = this.host;
  var port = this.port;

  debuglog('login(' + sid + ', ' + username + ', ..., ' + host + ', ' + port + ')');

  sessionvocRequest(
    svo(host, port, '/session/' + sid + '/authenticate', 'PUT'),
    JSON.stringify({ 'uid' : username, 'password' : password }),
    true,
    next
  );
}



/**
 * Logs out a session.
 *
 * @param {string} sid
 * @param {function} next
 */

SessionVocStore.prototype.logout = function (sid, next) {
  var host = this.host;
  var port = this.port;

  debuglog('login(' + sid + ', ' + host + ', ' + port + ')');

  sessionvocRequest(
    svo(host, port, '/session/' + sid + '/logout', 'PUT'),
    null, 
    true, 
    next
  );
}



/**
 * Creates a new form.
 *
 * @param {string} sid
 * @param {string} data
 * @param {function} next
 */

  SessionVocStore.prototype.createFormdata = function (sid, data, next) {
  var host = this.host;
  var port = this.port;

  debuglog('createForm(' + sid + ', ' + host + ', ' + port + ')');

  checkDatainfo(this, next, function () {
    sessionvocRequest(svo(host, port, '/formdata/' + sid, 'POST'), data, true, next);
  });
};



/**
 * Loads an existing form.
 *
 * @param {string} sid
 * @param {string} fid
 * @param {function} next
 */

SessionVocStore.prototype.loadFormdata = function (sid, fid, next) {
  var host = this.host;
  var port = this.port;

  debuglog('loadForm(' + sid + ', ' + fid + ', ' + host + ', ' + port + ')');

  checkDatainfo(this, next, function () {
    sessionvocRequest(svo(host, port, '/formdata/' + sid + '/' + fid, 'GET'),  null, false, next);
  });
};



/**
 * Updates an existing form.
 *
 * @param {string} sid
 * @param {string} fid
 * @param {string} data
 * @param {function} next
 */

SessionVocStore.prototype.updateFormdata = function (sid, fid, data, next) {
  var host = this.host;
  var port = this.port;

  debuglog('updateForm(' + sid + ', ' + fid + ', ' + host + ', ' + port + ')');

  checkDatainfo(this, next, function () {
    sessionvocRequest(svo(host, port, '/formdata/' + sid + '/' + fid, 'PUT'), data, true, next);
  });
};



/**
 * Deletes an existing form.
 *
 * @param {string} sid
 * @param {string} fid
 * @param {function} next
 */

SessionVocStore.prototype.deleteFormdata = function (sid, fid, next) {
  var host = this.host;
  var port = this.port;

  debuglog('deleteForm(' + sid + ', ' + fid + ', ' + host + ', ' + port + ')');

  checkDatainfo(this, next, function () {
    sessionvocRequest(svo(host, port, '/formdata/' + sid + '/' + fid, 'DELETE'), null, true, next);
  });
};

// Helper functions

/**
 * Log informational output if debug flag is set.
 */

function debuglog (msg) {
  if (exports.debug) {
    console.log('[sessionvoc] ' + msg);
  }
}



/**
 * Helper function to create options for the http.request call.
 */

function svo (host, port, path, method) {
  return {
    host: host,
    port: port,
    path: path,
    method: method,
    headers: {
      'connection': 'keep-alive',
    }
  };
}



/**
 * Calls the SessionVOC.
 *
 * This functions executes a request given by url with the body data. If the
 * request is successfull, then the function work is called. If an error occurs
 * the function next is called with the error is first argument.
 *
 * @param {string} url
 * @param {Object} data
 * @param {Boolean} parse
 * @param {Function} callback
 * @param {Function} work
 */

var sessionvocRequest = function (url, data, parse, next, work) {
  debuglog('sessionvocRequest: ' + JSON.stringify(url));

  if (data) {
    url.headers['content-length'] = data.length;
  }
  else {
    url.headers['content-length'] = 0;
  }

  var req = http.request(url, function (res) {
    var body = '';
    res.setEncoding('utf8');
    res.on('error', function (err) {
      debuglog('ERROR (http request): ' + JSON.stringify(err));
      next(err);
    });
    res.on('data', function (chunk) {
      body += chunk;
    });
    res.on('end', function (chunk) {
      debuglog('response: ' + body);
      debuglog('status code: ' + res.statusCode);
      
      var data = body;

      if (parse) {
        try {
          data = JSON.parse(body);
        } catch (err) {
          debuglog('ERROR (parsing body): ' + JSON.stringify(err));
          debuglog('body was: ' + body);
          next(err);
          return;
        }
      }

      try {
        if (res.statusCode == 200) {
          if (work) {
            work(data);
          } else {
            next(null, data);
          }
        } else {
          next(data);
        }
      } catch (err) {
        debuglog('ERROR (callback): ' + JSON.stringify(err));
        next(err);
        return;
      }
    });
  });

  req.on('error', function (err) {
    debuglog('ERROR (connect): ' + JSON.stringify(err));
    next(err);
  });

  if (data) {
    debuglog('sessionvocRequest body: ' + JSON.stringify(data));
    req.write(data);
  }

  req.end();
};



/**
 * load the session datainfo
 */

function loadInformation (store, next) {
  debuglog('loadInformation(' + store.host + ', ' + store.port + ')');

  sessionvocRequest(
    svo(store.host, store.port, '/datainfo', 'GET'),
    null,
    next,
    function (data) {
      store.datainfo = data;
      next();
    }
  );
};

/**
 * check if we need to load the session datainfo
 */

function checkDatainfo (store, next, work) {
  if (store.datainfo) {
    work();
  } else {
    debuglog('checkDatainfo: datainfo must be loaded');
    loadInformation(store, function (err) {
      err ? next(err) : work();
    });
  }
};
