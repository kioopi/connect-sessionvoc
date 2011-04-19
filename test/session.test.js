////////////////////////////////////////////////////////////////////////////////
// Imports and Exports
////////////////////////////////////////////////////////////////////////////////

/**
 * Module dependencies.
 */

var connect = require('connect'),
    assert = require('assert'),
    should = require('should'),
    http = require('http'),
    SessionVocStore = require('connect-sessionvoc').SessionVocStore;



// SessionVOC store

var store1 = new SessionVocStore({ host: 'localhost', port: 8208 });
var store2 = new SessionVocStore({ host: 'localhost', port: 1234 });



/**
 * Module exports.
 */

module.exports = {
  'test.exports': function() {
    SessionVocStore.should.be.a('function');
  },



  /*
  'test.crud': function() {
    create1(store1,
            function(sid) {
              read1(store1, sid,
                    function(session) {
                      update1(store1, session.sid,
                              function(session) {
                                read1(store1, session.sid,
                                      function(session) {
                                        assert.isNotNull(session.transData.message);
                                        assert.equal(session.transData.message, 'Test Message');

                                        update2(store1, session.sid,
                                                function(session) {
                                                  read1(store1, session.sid,
                                                        function(session) {
                                                          assert.equal(session.transData.message, '');

                                                          delete1(store1, session.sid,
                                                                  function(result) {
                                                                  });
                                                        });
                                                });

                                      });
                                   });
                      });
               });
  },



  'test.read-unknown': function() {
    read2(store1, 'unknown',
          function(session) {
            assert.equal(session.error, true);
          });
  },
  */



  'test.login': function() {
    create1(store1,
            function(sid) {
              login1(store1, sid,
                     function(session) {
                       logout1(store1, sid,
                               function(session) {
                                 console.log("############## " + JSON.stringify(session));
                               });
                     });
            });
  }
};

////////////////////////////////////////////////////////////////////////////////
// Helper functions
////////////////////////////////////////////////////////////////////////////////

function create1 (store, next) {
  store.createSession(function(err, result) {
                        assert.isNull(err);
                        assert.isNotNull(result);
                        assert.isNotNull(result.sid);
                        
                        console.log('[SUCCESS] created session: ' + JSON.stringify(result.sid));
                        
                        next(result.sid);
                      });
}



function read1 (store, sid, next) {
  store.loadSession(sid, function(err, result) {
                      assert.isNull(err);
                      assert.isNotNull(result);
                      assert.isNotNull(result.sid);
                      assert.equal(result.sid, sid);
                      
                      console.log('[SUCCESS] read session: ' + result.sid);
                      
                      next(result);
                    });
};
    


function read2 (store, sid, next) {
  store.loadSession(sid, function(err, result) {
                      assert.isNotNull(err);
                      
                      console.log('[SUCCESS] read session failed: ' + JSON.stringify(err));
                      
                      next(err);
                    });
};
    


function update1 (store, sid, next) {
  var n = { transData: { message: 'Test Message' } };
      
  store.updateSession(sid, n, function(err, result) {
                        assert.isNull(err);
                        assert.isNotNull(result);
                        assert.isNotNull(result.sid);
                        assert.equal(result.sid, sid);
                        assert.equal(result.transData.message, 'Test Message');
                        
                        console.log('[SUCCESS] update session: ' + result.sid);
                        
                        next(result);
                      });
};



function update2 (store, sid, next) {
  var n = { transData: { message: '' } };
      
  store.updateSession(sid, n, function(err, result) {
                        assert.isNull(err);
                        assert.isNotNull(result);
                        assert.isNotNull(result.sid);
                        assert.equal(result.sid, sid);
                        assert.equal(result.transData.message, '');
                        
                        console.log('[SUCCESS] update session: ' + result.sid);
                        
                        next(result);
                      });
};

    

function delete1 (store, sid, next) {
  store.deleteSession(sid, function(err, result) {
                        assert.isNull(err);
                        assert.isNotNull(result);
                        assert.equal(result.deleted, true);
                        
                        console.log('[SUCCESS] delete session: ' + sid);
                        
                        next(result);
                      });
};



function login1 (store, sid, next) {
  store.login(sid, 'plain', 'plain', function(err, result) {
                assert.isNull(err);
                assert.isNotNull(result);
                assert.isNotNull(result.userData);
                        
                console.log('[SUCCESS] login session: ' + sid);
                        
                next(result);
              });
};
    

function logout1 (store, sid, next) {
  store.logout(sid, function(err, result) {
                assert.isNull(err);
                assert.isNotNull(result);
                assert.isNull(result.userData);
                        
                console.log('[SUCCESS] logout session: ' + sid);
                        
                next(result);
              });
};
    
