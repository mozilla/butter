/* This Source Code Form is subject to the terms of the MIT license
 * If a copy of the MIT license was not distributed with this file, you can
 * obtain one at http://www.mozillapopcorn.org/butter-license.txt */

define(['util/xhr'], function(XHR) {

  function audience() {
    return location.protocol + "//" + location.hostname + ( location.port ? ":" + location.port : "" );
  }

  var Cornfield = function( butter, config ) {

    var email = "",
        server = config.server;

    this.login = function(callback) {
      navigator.id.get(function(assertion) {
        if (assertion) {
          XHR.post(server + "/browserid/verify",
            { audience: audience(), assertion: assertion },
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

    this.user = function() {
      return email;
    };

    this.logout = function(callback) {
      XHR.get(server + "/browserid/logout", function() {
        if (this.readyState === 4) {
          try {
            var response = JSON.parse(this.response);
            callback(response);
          } catch (err) {
            callback({ error: "an unknown error occured" });
          }
        }
      });
    }

    this.list = function(callback) {
      XHR.get(server + "/files", function() {
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

    // XXX I need to figure out a better API for this
    this.pull = function(name, callback) {
      XHR.get(server + "/files/" + name, function() {
        if (this.readyState === 4) {
          callback(this.response);
        }
      });
    };

    this.push = function(name, data, callback) {
      XHR.put(server + "/files/" + name, data, function() {
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
  };

  Cornfield.__moduleName = "cornfield";

  return Cornfield;
});
