/*!
 * Client for a SessionVOC
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


/**
 * Module dependencies.
 */

var http = require('http'),
    events = require('events'), 
    sys = require('sys');

/**
 * Exports.
 */

//exports = module.exports;



/**
 * Exports the constructors.
 */

module.exports.Client = Client;
module.exports.createClient = connect;



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

/**
 * 
 */
function connect(host, port){ 
  return (new Client({ 
    host: host || 'localhost', 
    port: port || 8208, 
  })).loadInfo(); 
} 


//   Client constructors and methods

/**
 * Initializes a new `Client`. You can define an options array to specifiy
 * the host and port.
 *
 * @param {Object} options
 * @api public
 */

function Client (options) {
  debuglog('SVS Constructor');
  
  events.EventEmitter.call(this);  // initialize the "parent" EventEmitter

  Object.defineProperty(this, 'host', { value: (options && options.host) || 'localhost' });
  Object.defineProperty(this, 'port', { value: (options && options.port) || 8208 });

  this.description = 'Client to interface with a SessionVOC';
  this.datainfo = null;
};

// inherit from EventEmitter to deal with async initialisation of voc
Client.prototype = Object.create(events.EventEmitter.prototype);  


Client.prototype.loadInfo = function (fn) {
  if (this.datainfo) return fn(null); 
  var self = this; 
  this._request(
    'GET', 
    '/datainfo',
    function (err, data) {
      debuglog('loadinfo', data); 
      if(err && fn){
        self.emit('error', err); 
        return fn(err); 
      } 
      self.datainfo = data; // TODO: should this be JSON.parsed?
      self.emit('ready', data); 
      fn && fn(null, data);
    }
  );
  return this; // chainability
}; 

/**
 * Creates a new session.
 *
 * @param {function} next
 */

Client.prototype.createSession = function (next) {
  debuglog('createSession(' + this.host + ', ' + this.port + ')');
  this._request('POST', '/session', next); // data is json, should be parsed 
};


/**
 * Loads an existing session.
 *
 * @param {string} sid
 * @param {function} next
 */

Client.prototype.loadSession = function (sid, next) {
  debuglog('client:loadSession(' + sid);
  this._request('GET', '/session/' + sid, next);  
};



/**
 * Updates an existing session.
 *
 * @param {string} sid
 * @param {Object} data
 * @param {function} next
 */

Client.prototype.updateSession = function (sid, data, next) {
  this._request('PUT', '/session/' + sid, JSON.stringify(data), next); 
};



/**
 * Deletes an existing session.
 *
 * @param {string} sid
 * @param {function} next
 */

Client.prototype.deleteSession = function (sid, next) {
  debuglog('deleteSession(' + sid + ')');
  this._request('DELETE', '/session/' + sid, next); 
};



/**
 * Logs in a session.
 *
 * @param {string} sid
 * @param {string} username
 * @param {string} password
 * @param {function} next
 */

Client.prototype.login = function (sid, username, password, next) {
  debuglog('login(' + sid + ', ' + username + ')');
  this._request('PUT', '/session/' + sid + '/authenticate', JSON.stringify({ 'uid' : username, 'password' : password }), next); 
}



/**
 * Logs out a session.
 *
 * @param {string} sid
 * @param {function} next
 */

Client.prototype.logout = function (sid, next) {
  debuglog('logout(' + sid + ')');
  this._request('PUT', '/session/' + sid + '/logout', next); 
}

/**
 * Creates a new form.
 *
 * @param {string} sid
 * @param {string} data
 * @param {function} next
 */

Client.prototype.createFormdata = function (sid, data, next) {
  debuglog('createForm(' + sid + ')');
  this._request('POST', '/formdata/' + sid, data, next); 
};



/**
 * Loads an existing form.
 *
 * @param {string} sid
 * @param {string} fid
 * @param {function} next
 */

Client.prototype.loadFormdata = function (sid, fid, next) {
  debuglog('loadForm(' + sid + ', ' + fid + ')');
  this._request('GET', '/formdata/' + sid + '/' + fid, next); 
};



/**
 * Updates an existing form.
 *
 * @param {string} sid
 * @param {string} fid
 * @param {string} data
 * @param {function} next
 */

Client.prototype.updateFormdata = function (sid, fid, data, next) {
  debuglog('updateForm(' + sid + ', ' + fid + ', ' + host + ', ' + port + ')');
  this._request('PUT', '/formdata/' + sid + '/' + fid, data, next); 
};



/**
 * Deletes an existing form.
 *
 * @param {string} sid
 * @param {string} fid
 * @param {function} next
 */

Client.prototype.deleteFormdata = function (sid, fid, next) {
  this._request('DELETE', '/formdata/' + sid + '/' + fid, next); 
};


Client.prototype._request = function (method, path, data, fn) { 
  // make data optional
  if(!fn && typeof data == 'function') fn = data; 
  var self = this; 

  var options = { 
    host: this.host, 
    port: this.port, 
    method: method, 
    path: path, 
    headers: {
      'connection': 'keep-alive',
    }
  }; 

  options.headers['content-length'] = (data && typeof data !== 'function') ? data.length : 0;

  var req = http.request(options, function (res) {
    var body = '';
    res.setEncoding('utf8');
    res.on('error', function (err) {
      debuglog('ERROR (http request): ' + JSON.stringify(err));
      fn(err);
      self.emit('error', err); 
    });
    res.on('data', function (chunk) {
      body += chunk;
    });
    res.on('end', function () {
      debuglog('response: ' + body);
      debuglog('status code: ' + res.statusCode);
      
      var data = body;
      try {
        if (res.statusCode == 200) {
          fn(null, data);
        } else {
          fn(data);
        }
      } catch (err) {
        debuglog('ERROR (callback): ' + JSON.stringify(err));
        return fn(err);
        self.emit('error', err); 
      }
    });
  });

  req.on('error', function (err) {
    debuglog('ERROR (connect): ' + JSON.stringify(err));
    self.emit('error', err); 
    fn(err);
  });

  // write data in the request body
  if (data && typeof data !== 'function') {
    debuglog('sessionvocRequest body: ' + JSON.stringify(data));
    req.write(data);
  }

  req.end();

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
