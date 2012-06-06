/* This Source Code Form is subject to the terms of the MIT license
 * If a copy of the MIT license was not distributed with this file, you can
 * obtain one at http://www.mozillapopcorn.org/butter-license.txt */

define([ 'util/xhr' ], function( XHR ){

  var VAR_REGEX = /\{([\w\-\._]+)\}/,
      CSS_POLL_INTERVAL = 10,
      LESS = "/less-1.3.0.min.js";

  var DEFAULT_CHECK_FUNCTION = function(){
    var index = 0;
    return function(){
      return index++ > 0;
    };
  };

  return function( config ){

    var _configDirs = config.value( "dirs" );

    function fixUrl( url ){
      var match,
          replacement;

      while ( VAR_REGEX.test( url ) ) {
        match = VAR_REGEX.exec( url );
        replacement = _configDirs[ match[ 1 ] ] || "";
        url = url.replace( match[0], replacement );
      }
      return url.replace( "//", "/" );
    }

    function loadLessFile( loadJS, url, err ){
      // Load less.js so we can parse the *.less -> *.css
      loadJS(
        config.value( "dirs" ).tools + LESS,
        /* exclude= */ null,
        function jsLoadCallback(){
          // Assume *.less is beside *.css file
          var less = window.less,
              lessURL = url.replace( /\.css$/, ".less" ),
              lessFile;

          // Load the .less file, parse with LESS, and inject CSS <style>
          XHR.get( lessURL, function xhrCallback(){
            if ( this.readyState === 4) {
              var parser = new less.Parser();
              lessFile = this.response;

              parser.parse( lessFile, function( e, root ){
                if( e ){
                  // Problem parsing less file
                  err( "Butter: Error parsing LESS file [" + lessURL + "]", e.message );
                  return;
                }

                var css, styles;
                css = document.createElement( "style" ),
                css.type = "text/css";
                document.head.appendChild( css );
                styles = document.createTextNode( root.toCSS() );
                css.appendChild( styles );
              });
            }
          });
        },
        function checkFn(){
          return !!window.less;
        },
        err
      );
    }

    var _loaders = {
      js: function( url, exclude, callback, checkFn ){
        checkFn = checkFn || DEFAULT_CHECK_FUNCTION();

        url = fixUrl( url );

        if( !checkFn() ){
          var scriptElement = document.createElement( "script" );
          scriptElement.src = url;
          scriptElement.type = "text/javascript";
          document.head.appendChild( scriptElement );
          scriptElement.onload = scriptElement.onreadystatechange = callback;
        }
        else if( callback ){
          callback();
        }
      },
      css: function( url, exclude, callback, checkFn, error ){
        var link,
            interval;

        checkFn = checkFn || function(){
          return !!link;
        };

        function runCheckFn() {
          interval = setInterval( function(){
            if( checkFn() ){
              clearInterval( interval );
              if( callback ){
                callback();
              }
            }
          }, CSS_POLL_INTERVAL );
        }

        url = fixUrl( url );

        if( !checkFn() ){
          // See if we need to render CSS client side with LESS
          if( config.value( "cssRenderClientSide" ) === true ){
            loadLessFile( _loaders.js, url, error );
          }
          // Regular css file, inject <link> in head
          else {
            link = document.createElement( "link" );
            link.type = "text/css";
            link.rel = "stylesheet";
            link.onerror = error;
            link.onload = runCheckFn;
            link.href = url;
            document.head.appendChild( link );
          }
        }
        else if( callback ){
          callback();
        }
      }
    };

    function generateLoaderCallback( items, callback ){
      var loaded = 0;
      return function(){
        ++loaded;
        if( loaded === items.length ){
          if( callback ){
            callback();
          }
        }
      };
    }

    function generateNextFunction( items, callback ){
      var index = 0;
      function next(){
        if( index === items.length ){
          callback();
        }
        else{
          Loader.load( items[ index++ ], next );
        }
      }
      return next;
    }

    var Loader = {

      load: function( items, callback, error, ordered ){
        error = error || function(){
          if( console && console.log ){
            console.log.apply( console , arguments );
          }
        };

        if( items instanceof Array && items.length > 0 ){
          var onLoad = generateLoaderCallback( items, callback );
          if( !ordered ){
            for( var i = 0; i < items.length; ++i ){
              Loader.load( items[ i ], onLoad );
            }
          }
          else {
            var next = generateNextFunction( items, callback );
            next();
          }

        }
        else {
          var item = items;

          if( _loaders[ item.type ] ){
            if( item.url ){
              _loaders[ item.type ]( item.url, item.exclude, callback, item.check, error );
            }
            else{
              throw new Error( "Attempted to load resource without url." );
            }
          }
          else {
            throw new Error( "Loader type " + item.type + " not found! Attempted: " + item.url );
          }

        }
      }
    };

    return Loader;

  };

});
