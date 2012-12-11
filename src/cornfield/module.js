/* This Source Code Form is subject to the terms of the MIT license.
 * If a copy of the MIT license was not distributed with this file, you can
 * obtain one at https://raw.github.com/mozilla/butter/master/LICENSE */

define([ "util/xhr", "jsSHA/sha1", "util/shims" ],
  function( XHR, SHA1 ) {

  // Shortcut to make lint happy. Constructor is capitalized, and reference is non-global.
  var JSSHA = window.jsSHA;

  var IMAGE_DATA_URI_PREFIX_REGEX = "data:image/(jpeg|png);base64,";

  function hostname() {
    return location.protocol + "//" + location.hostname + ( location.port ? ":" + location.port : "" );
  }

  var Cornfield = function( butter, config ) {

    var authenticated = false,
        email = "",
        name = "",
        username = "",
        server = hostname(),
        xhrPostQueue = [],
        self = this;

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

    function publishPlaceholder( id, callback ) {
      console.warn( "Warning: Popcorn Maker publish is already in progress. Ignoring request." );
      callback( { error: "Publish is already in progress. Ignoring request." } );
    }

    function publishFunction( id, callback ) {
      // Re-route successive calls to `publish` until a complete response has been
      // received from the server.
      self.publish = publishPlaceholder;

      sendXHRPost(server + "/api/publish/" + id, null, function() {
        if (this.readyState === 4) {
          var response;

          // Reset publish function to its original incarnation.
          self.publish = publishFunction;

          try {
            response = JSON.parse( this.response || this.responseText );
            callback(response);
          } catch (err) {
            callback({ error: "an unknown error occured" });
          }
        }
      });
    }

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

    function savePlaceholder( id, data, callback ) {
      console.warn( "Warning: Popcorn Maker save is already in progress. Ignoring request." );
      callback( { error: "Save is already in progress. Ignoring request." } );
    }

    function saveFunction( id, data, callback ) {
      // Re-route successive calls to `save` until a complete response has been
      // received from the server.
      self.save = savePlaceholder;

      var url = server + "/api/project/";

      if ( id ) {
        url += id;
      }

      var hashedTrackEvents = {};

      butter.orderedTrackEvents.forEach( function( trackEvent ) {
        var hash, regexMatch;

        if ( trackEvent.popcornOptions.src ) {
          regexMatch = trackEvent.popcornOptions.src.match( IMAGE_DATA_URI_PREFIX_REGEX );
          if ( regexMatch ) {
            hash = new JSSHA( trackEvent.popcornOptions.src.substr( regexMatch[ 0 ].length ), "TEXT" ).getHash( "SHA-1", "HEX" );
            hashedTrackEvents[ hash ] = trackEvent;
          }
        }
      });

      sendXHRPost( url, data, function() {
        if (this.readyState === 4) {

          // Reset save function to its original incarnation.
          self.save = saveFunction;

          try {
            var response = JSON.parse( this.response || this.responseText );

            if ( Array.isArray( response.imageURLs ) ) {
              response.imageURLs.forEach( function( image ) {
                var hashedTrackEvent = hashedTrackEvents[ image.hash ];
                if ( hashedTrackEvent ) {
                  hashedTrackEvent.update({
                    src: image.url
                  });
                }
                else {
                  console.warn( "Cornfield responded with invalid image hash:", image.hash );
                }
              });
            }

            callback(response);
          } catch (err) {
            callback({ error: "an unknown error occured" });
          }
        }
      }, "application/json" );
    }

    this.save = saveFunction;
    this.publish = publishFunction;

  };

  Cornfield.__moduleName = "cornfield";

  return Cornfield;
});
