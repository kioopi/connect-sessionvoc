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

console.log('SessionVoc!');

/**
 * Module dependencies.
 */

var connect = require('connect'),
    Session = connect.session.Session,
    Store = connect.session.Store,
    utils = connect.utils,
    http = require('http'),
    sys = require('sys');

var sessionvoc = require('./sessionvoc-client.js');  



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
  debuglog('SVS Constructor');
  this.description = 'Sescure and reliable session store using a SessionVOC';
  this.client = sessionvoc.connect(options.host, options.port); 
  this.ready = false; 
  var self = this; 
  this.client.on('ready', function(){ 
    // executes after datainfo is fetched. 
    self.client.createSession(err, function(sid){ // TODO rite params 4 cb? 
    }); 
  }); 

};



/**
 * Inherit from `Store.prototype`.
 */

SessionVocStore.prototype.__proto__ = Store.prototype;

/**
 * Attempt to fetch session by the given `sid`.
 *
 * @param {String} sid
 * @param {Function} fn
 * @api public
 */

SessionVocStore.prototype.get = function (sid, fn) {
  this.client.loadSession(sid, function(err, data){
    if(err) return fn(err); 
    try { 
      if(!data) return fn({}); 
      fn(null, JSON.parse(data)); 
    } catch (err) { 
      fn(err); 
    } 
  });  
  
}; 


/**
 * Commit the given `sess` object associated with the given `sid`.
 *
 * @param {String} sid
 * @param {Session} sess
 * @param {Function} fn
 * @api public
 */

SessionVocStore.prototype.set = function(sid, sess, fn){
  try {
    var maxAge = sess.cookie.maxAge
      , ttl = 'number' == typeof maxAge
        ? maxAge / 1000 | 0
        : oneDay
      , sess = JSON.stringify(sess);
    this.client.setex(sid, ttl, sess, function(){
      fn && fn.apply(this, arguments);
    });
  } catch (err) {
    fn && fn(err);
  } 
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
