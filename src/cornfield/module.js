/* This Source Code Form is subject to the terms of the MIT license
 * If a copy of the MIT license was not distributed with this file, you can
 * obtain one at http://www.mozillapopcorn.org/butter-license.txt */

define(['util/xhr'], function(XHR) {

  function audience() {
    return location.protocol + "//" + location.hostname + ( location.port ? ":" + location.port : "" );
  }

  var Cornfield = function( butter, config ) {

    var email,
        username,
        name,
        server = audience();

    if ( !navigator.id ) {
      var script = document.createElement( "script" );
      script.src = "https://browserid.org/include.js";
      script.type = "text/javascript";
      script.setAttribute( "data-butter-exlude", true );
      document.head.appendChild( script );
    }

    this.login = function(callback) {
      navigator.id.get(function(assertion) {
        if (assertion) {
          XHR.post(server + "/browserid/verify",
            { audience: server, assertion: assertion },
            function() {
              if (this.readyState === 4) {
                try {
                  var response = JSON.parse(this.response);
                  if (response.status === "okay") {
                    email = response.email;
                  }
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

    this.whoami = function( callback ) {
      XHR.get( server + "/api/whoami", function() {
        if ( this.readyState === 4 ) {
          var response;

          try {
            response = JSON.parse( this.response );
            if ( this.status === 200 && response.email ) {
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
    };

    this.user = function() {
      return email;
    };

    this.publish = function(id, callback) {
      XHR.post(server + "/publish/" + id, null, function() {
        if (this.readyState === 4) {
          try {
            var response = JSON.parse(this.response);
            callback(response);
          } catch (err) {
            callback({ error: "an unknown error occured" });
          }
        }
      });
    };

    this.logout = function(callback) {
      XHR.get(server + "/browserid/logout", function() {
        email = null;
        if (this.readyState === 4) {
          try {
            var response = JSON.parse(this.response);
            callback(response);
          } catch (err) {
            callback({ error: "an unknown error occured" });
          }
        }
      });
    };

    this.list = function(callback) {
      XHR.get(server + "/projects", function() {
        if (this.readyState === 4) {
          try {
            var response = JSON.parse(this.response);
            callback(response);
          } catch (err) {
            callback({ error: "an unknown error occured" });
          }
        }
      });
    };

    this.refreshLoad = function( id ) {
      window.location = server + "/load/" + id;
    };

    // XXX I need to figure out a better API for this
    this.load = function(id, callback) {
      XHR.get(server + "/project/" + id, function() {
        if (this.readyState === 4) {
          try {
            var response = JSON.parse(this.response);
            callback(response);
          } catch (err) {
            callback({ error: "an unknown error occured" });
          }
        }
      });
    };

    this.save = function(data, callback) {
      XHR.post(server + "/project/", data, function() {
        if (this.readyState === 4) {
          try {
            var response = JSON.parse(this.response);
            callback(response);
          } catch (err) {
            callback({ error: "an unknown error occured" });
          }
        }
      });
    };

    this.saveas = function(id, data, callback) {
      XHR.post(server + "/project/" + id, data, function() {
        if (this.readyState === 4) {
          try {
            var response = JSON.parse(this.response);
            callback(response);
          } catch (err) {
            callback({ error: "an unknown error occured" });
          }
        }
      }, "json" );
    };
  };

  Cornfield.__moduleName = "cornfield";

  return Cornfield;
});
