/* This Source Code Form is subject to the terms of the MIT license
 * If a copy of the MIT license was not distributed with this file, you can
 * obtain one at http://www.mozillapopcorn.org/butter-license.txt */

(function() {

  function parameterize(data) {
    var s = [];

    if ( !data ) {
      return null;
    }

    for(var key in data){
      if( data.hasOwnProperty( key ) ){
        s[s.length] = encodeURIComponent(key) + "=" + encodeURIComponent(data[key]);
      }
    }

    return s.join("&").replace("/%20/g", "+");
  }

  define( [], function() {

    var XHR = {
      "get": function(url, callback) {
        var xhr = new XMLHttpRequest();
        xhr.open("GET", url, true);
        xhr.onreadystatechange = callback;
        xhr.setRequestHeader( "X-Requested-With", "XMLHttpRequest" );
        xhr.send(null);
      },
      "post": function(url, data, callback, type) {
        var xhr = new XMLHttpRequest();
        xhr.open("POST", url, true);
        xhr.onreadystatechange = callback;
        xhr.setRequestHeader( "X-Requested-With", "XMLHttpRequest" );
        if ( window.CSRF_TOKEN ) {
          xhr.setRequestHeader( "X-CSRFToken", window.CSRF_TOKEN );
        }
        if ( !type ) {
          xhr.setRequestHeader( "Content-Type", "application/x-www-form-urlencoded" );
          xhr.send( parameterize( data ));
        } else {
          xhr.setRequestHeader( "Content-Type", type );
          xhr.send( data );
        }
      }
    };

    return XHR;

  }); //define
}());
