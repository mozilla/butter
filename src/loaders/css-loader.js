/* This Source Code Form is subject to the terms of the MIT license.
 * If a copy of the MIT license was not distributed with this file, you can
 * obtain one at http://www.mozillapopcorn.org/butter-license.txt */

define( [ "./base-loader" ], function( BaseLoader ) {

  var CSS_POLL_INTERVAL = 10;
  
  function CSSLoader( configDirs ) {
    BaseLoader.call( this, configDirs );
  }

  CSSLoader.prototype = Object.create( BaseLoader );
  CSSLoader.prototype.constructor = CSSLoader;

  CSSLoader.prototype.load = function( url, exclude, callback, checkFn, error ) {
    var link,
        interval,
        img,
        alreadyFired = false;

    // Run the load function if the link variable hasn't already been initialized.
    // TODO: Come up with a better check.
    checkFn = checkFn || function(){
      return !!link;
    };

    function runCheckFn() {
      if ( alreadyFired ) {
        return;
      }
      alreadyFired = true;
      interval = setInterval( function(){
        if( checkFn() ){
          clearInterval( interval );
          if( callback ){
            callback();
          }
        }
      }, CSS_POLL_INTERVAL );
    }

    url = this.fixUrl( url );

    if ( !checkFn() ) {
      link = document.createElement( "link" );
      link.type = "text/css";
      link.rel = "stylesheet";
      link.onerror = error;
      link.onload = runCheckFn;
      link.href = url;
      document.head.appendChild( link );

      // Crazy image onerror fallback for Safari 5.1.7 on Windows - Bug #2627
      img = document.createElement( "img" );
      img.onerror = runCheckFn;
      img.src = url;
    }
    else if ( callback ) {
      callback();
    }
  };

  return CSSLoader;

});

