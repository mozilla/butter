/* This Source Code Form is subject to the terms of the MIT license
 * If a copy of the MIT license was not distributed with this file, you can
 * obtain one at http://www.mozillapopcorn.org/butter-license.txt */

(function() {

  function parameterize(data) {
    var s = [];
    
    for (var key in data) {
      s[s.length] = encodeURIComponent(key) + "=" + encodeURIComponent(data[key]);
    }

    return s.join("&").replace("/%20/g", "+");
  }

  define( [], function() {

    var XHR = {
      "get": function(url, callback) {
        var xhr = new XMLHttpRequest();
        xhr.open("GET", url, true);
        xhr.onreadystatechange = callback;
        xhr.send(null);
      },
      "post": function(url, data, callback) {
        var xhr = new XMLHttpRequest();
        xhr.open("POST", url, true);
        xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
        console.log(data);
        xhr.send(parameterize(data));
        console.log(parameterize(data));
      }
    };

    return XHR;

  }); //define
}());
