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


/**
 * Module dependencies.
 */

var connect = require('connect'),
    Session = connect.session.Session,
    Store = connect.session.Store,
    sessionvoc = require('sessionvoc-client'), 
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

exports.debug = false;

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
  this.description = 'Secure and reliable session store using a SessionVOC';
  this.svoc = this.client = sessionvoc.createClient(options.host, options.port); 
  //this.ready = false; 
  var self = this; 
  this.client.on('ready', function(){ 
    // executes after datainfo is fetched. 
  }); 

  // Publish the SessionVocClient to the Session so the functions can be used from 
  // within express-views. 
  Session.prototype.svoc = this.svoc; 
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
    if (err) return fn(err); 
    if (!data) return fn({}); 
    try { 
      var td = JSON.parse(data).transData; 
      fn(null, td); 
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
 * 
 */

SessionVocStore.prototype.set = function(sid, sess, fn){
  //  calls fn(err) 
  //  hack: all data in sess will be passed to the sessionvoc as transient-Data.
  //  fields that are not configured in the sessionvoc will not be saved.  
  //  TODO: maybe this should somehow be parsed. 
  var data = {transData: sess }; 
  this.client.updateSession(sid, data, function(err){ 
    fn(err); 
  }); 
};

SessionVocStore.prototype.destroy = function(sid, fn){
  this.client.deleteSession(sid, fn); 
}; 

/*
SessionVocStore.prototype.isSecretRequired = function(){
  return false; 
}; 
*/

SessionVocStore.prototype.verify = function(sid, secret, fingerprint, fn){
  fn(null, true); 
} 

SessionVocStore.prototype.create = function(sid, fn){
  // fn(err, data [, cookie]);
  // TODO:  load userdata 
  // try to patch the session obj. 
  var sess = {
    sid: sid 
  }; 
  fn(null, sess, {}); 
} 

SessionVocStore.prototype.generate = function(secret, fingerprint, fn){
  // will call the callback with fn(err, sid); 
  this.client.createSession(fn); 
} 

// Helper functions

/**
 * Log informational output if debug flag is set.
 */

function debuglog (msg) {
  if (exports.debug) {
    console.log('[connect-sessionvoc] ' + msg);
  }
}

/**
 * Parse data 
 * @param {string} data
 * @param {function} fn
 *
 * Passes a JSON-Object parsed from data to fn. 
 * The JSON-Obj is the second argument to fn, first is an error-flag.
 */

function parseJson(data, fn){ 
  try { 
    fn(null, JSON.parse(data)); 
  } catch (err) { 
    fn(err); 
  } 
} 

