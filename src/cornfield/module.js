/* This Source Code Form is subject to the terms of the MIT license
 * If a copy of the MIT license was not distributed with this file, you can
 * obtain one at https://raw.github.com/mozilla/butter/master/LICENSE */

define(['util/xhr'], function(XHR) {

  function hostname() {
    return location.protocol + "//" + location.hostname + ( location.port ? ":" + location.port : "" );
  }

  var Cornfield = function( butter, config ) {

    var authenticated = false,
        email = "",
        name = "",
        username = "",
        server = hostname(),
        xhrPostQueue = [];

    if ( !navigator.id ) {
      var script = document.createElement( "script" );
      script.src = "https://login.persona.org/include.js";
      script.type = "text/javascript";
      script.setAttribute( "data-butter-exclude", true );
      document.head.appendChild( script );
    }

    var sendXHRPost = function() {
      console.warn( "XHR.post occurred without a CSRF token. Buffering request." );
      xhrPostQueue.push( arguments );
    };

    XHR.setCSRFTokenAcquiredCallback( function() {
      var args;

      while ( xhrPostQueue.length ) {
        args = xhrPostQueue.shift();
        XHR.post.apply( this, args );
      }

      XHR.setCSRFTokenAcquiredCallback( null );

      sendXHRPost = XHR.post;
    });

    this.login = function(callback) {
      navigator.id.get(function(assertion) {
        if (assertion) {
          sendXHRPost(server + "/persona/verify",
            { assertion: assertion },
            function() {
              if (this.readyState === 4) {
                try {
                  var response = JSON.parse( this.response || this.responseText );
                  if (response.status === "okay") {

                    // Get email, name, and username after logging in successfully
                    whoami( function( data ) {
                      callback( data );
                    });
                    return;
                  }

                  // If there was an error of some sort, callback on that
                  callback(response);
                } catch (err) {
                  callback({ error: "an unknown error occured" });
                }
              }
            });
        } else {
          callback(undefined);
        }
      });
    };

    function whoami( callback ) {
      XHR.get( server + "/api/whoami", function() {
        if ( this.readyState === 4 ) {
          var response;

          try {
            response = JSON.parse( this.response || this.responseText );
            if ( this.status === 200 ) {
              authenticated = true;
              email = response.email;
              username = response.username;
              name = response.name;
            }
          } catch ( err ) {
            response = {
              error: "failed to parse data from server: \n" + this.response
            };
          }

          if ( callback ) {
            callback( response );
          }
        }
      });
    }

    // Check to see if we're already logged in
    butter.listen( "ready", function onMediaReady() {
      butter.unlisten( "ready", onMediaReady );

      whoami( function( response ) {
        if ( !response.error ) {
          butter.dispatch( "autologinsucceeded", response );
        }
      });
    });

    this.email = function() {
      return email;
    };

    this.name = function() {
      return name;
    };

    this.username = function() {
      return username;
    };

    this.authenticated = function() {
      return authenticated;
    };

    this.publish = function(id, callback) {
      sendXHRPost(server + "/api/publish/" + id, null, function() {
        if (this.readyState === 4) {
          var response;
          try {
            response = JSON.parse( this.response || this.responseText );
          } catch (err) {
            callback({ error: "an unknown error occured" });
            return;
          }

          callback(response);
        }
      });
    };

    this.logout = function(callback) {
      sendXHRPost(server + "/persona/logout", null, function() {
        email = "";
        if (this.readyState === 4) {
          var response;

          try {
            response = JSON.parse( this.response || this.responseText );
            authenticated = false;
            email = "";
            username = "";
            name = "";
          } catch (err) {
            response = { error: "an unknown error occured" };
          }

          if ( callback ) {
            callback( response );
          }
        }
      });
    };

    this.save = function(id, data, callback) {
      var url = server + "/api/project/";

      if ( id ) {
        url += id;
      }

      sendXHRPost( url, data, function() {
        if (this.readyState === 4) {
          try {
            var response = JSON.parse( this.response || this.responseText );
            callback(response);
          } catch (err) {
            callback({ error: "an unknown error occured" });
          }
        }
      }, "application/json" );
    };

  };

  Cornfield.__moduleName = "cornfield";

  return Cornfield;
});
