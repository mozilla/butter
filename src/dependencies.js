/* This Source Code Form is subject to the terms of the MIT license
 * If a copy of the MIT license was not distributed with this file, you can
 * obtain one at http://www.mozillapopcorn.org/butter-license.txt */

define([], function(){

  var VAR_REGEX = /\{([\w\-\._]+)\}/,
      CSS_POLL_INTERVAL = 10;

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
          // Load the CSS, either directly or using less.js

          // See if we need to render CSS client side with LESS
          if( config.value( "cssRenderClientSide" ) === true ){
            _loaders.js(
              config.value( "dirs" ).tools + "/less-1.3.0.min.js",
              null,
              function callback(){
                try{
                  new(less.Parser)({
                    optimization: less.optimization,
//                    paths: [ url.replace( /\.css$/, ".less" ) ],
//                    mime: 
                    filename: url.replace( /\.css$/, ".less" )
                  }).parse( data, function( e, href ){
                    if( e ){
                      error( e );
                    }
                    
                  });
                }catch( e ){
                  error(e);
                }

                loadStyleSheet(
                  url.replace( /\.css$/, ".less" ),
                  callback,
                  false,
                  null
                );
              },
              function checkFn(){
                return !!window.less;
              },
              error
            );
          } else {
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
