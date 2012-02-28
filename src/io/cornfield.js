/**********************************************************************************

Copyright (C) 2012 by Mozilla Foundation

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.

**********************************************************************************/

(function() {

  define(['util/xhr'], function(XHR) {

    function audience() {
      return location.protocol + "//" + location.hostname + ( location.port ? ":" + location.port : "" );
    }

    function parameterize(data) {
      var s = [];
      
      for (var key in data) {
        s[s.length] = encodeURIComponent(key) + "=" + encodeURIComponent(data[key]);
      }

      return s.join("&").replace("/%20/g", "+");
    }

    var Cornfield = function( butter, config ) {

      var email = "",
          server = config.server,
          verifier = server + "/browserid/verify";

      this.authorize = function() {
        navigator.id.get(function(assertion) {
          if (assertion) {
            console.log("Successfully logged in to BrowserID");

            XHR.post(verifier,
              { audience: audience(), assertion: assertion },
              function() {
                if (this.readyState === 4 && this.response) {
                  var response = JSON.parse(this.response);
                  if (response.status === "okay") {
                    email = response.email;
                    console.log("Successfully logged in to cornfield with id " + email);
                  }
                }
              });
          } else {
            console.error("Failed to login to BrowserID");
          }
        });
      };

      this.whoami = function() {
        return email;
      };

      this.ls = function(callback) {
        XHR.get(server + "/files", function() {
          if (this.readyState === 4 && this.response) {
            var response = JSON.parse(this.response);
            callback(response);
          }
        });
      };

      this.pull = function(name, callback) {
        XHR.get(server + "/files/" + name, function() {
          if (this.readyState === 4 && this.response) {
            callback(this.response);
          }
        });
      };

      this.push = function(name, data, callback) {
        XHR.put(server + "/files/" + name, data, function() {
          if (this.readyState === 4 && this.response) {
            callback(this.response);
          }
        });
      };
    };

    return Cornfield;
  });
}());
