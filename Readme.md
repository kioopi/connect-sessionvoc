# Connect SessionVOC

connect-sessionvoc is a session store using a secure, reliable, external session
database, the SessionVOC (see https://github.com/triAGENS/SessionVoc-OPEN).

This is dependend on the fork of senchalabs/connect at  https://github.com/triAGENS/connect

## Installation

via npm:

	  $ npm install connect-sessionvoc

## Options

  - `host` hostname of the SessionVOC server, defaults to localhost
  - `port` port of the SessionVOC server, defaults to 8208

## Example

    var connect = require('connect')
      , svoc = require('connect-sessionvoc');

    connect.createServer(
      connect.cookieDecoder(),
      connect.session({ store: new svoc.SessionVocStore({ host: 'session-server' }) })
    );
