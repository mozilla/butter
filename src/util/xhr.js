/* This Source Code Form is subject to the terms of the MIT license
 * If a copy of the MIT license was not distributed with this file, you can
 * obtain one at http://www.mozillapopcorn.org/butter-license.txt */

(function() {

  function parameterize(data) {
    var s = [];

    for(var key in data){
      if( data.hasOwnProperty( key ) ){
        s[s.length] = encodeURIComponent(key) + "=" + encodeURIComponent(data[key]);
      }
    }

    return s.join("&").replace("/%20/g", "+");
  }

  var __types = {
    form: "application/x-www-form-urlencoded",
    json: "application/json"
  };

  define( [], function() {

    var XHR = {
      "get": function(url, callback) {
        var xhr = new XMLHttpRequest();
        xhr.open("GET", url, true);
        xhr.onreadystatechange = callback;
        xhr.send(null);
      },
      "post": function(url, data, callback, type) {
        var xhr = new XMLHttpRequest();
        xhr.open("POST", url, true);
        xhr.onreadystatechange = callback;
        if( !type || type === "form" ){
          xhr.setRequestHeader("Content-Type", __types.form);
          xhr.send(parameterize(data));
        }
        else if( __types[ type ] ){
          xhr.setRequestHeader("Content-Type", __types[ type ]);
          xhr.send(data);
        }
        else{
          xhr.setRequestHeader("Content-Type", "text/plain");
          xhr.send(data);
        }
      }
    };

    return XHR;

  }); //define
}());
