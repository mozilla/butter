/* This Source Code Form is subject to the terms of the MIT license
 * If a copy of the MIT license was not distributed with this file, you can
 * obtain one at http://www.mozillapopcorn.org/butter-license.txt */

define([], function(){

  var DEFAULT_DIRS = {
        "popcorn-js": "../external/popcorn-js",
        "css": "css"
      },
      CSS_POLL_INTERVAL = 10;

  var DEFAULT_CHECK_FUNCTION = function(){
    var index = 0;
    return function(){
      return index++ > 0;
    };
  };

  return function( config ){

    var _configDirs = config.dirs;

    function fixUrl( url ){
      var regex = /\{([\w\-\._]+)\}/g,
          replaceVars = url.match( regex );
      if( replaceVars ){
        for( var i = 0; i < replaceVars.length; ++i ){
          var rv = replaceVars[ i ],
              varOnly = regex.exec( rv )[ 1 ],
              regex = new RegExp( rv, "g" ),
              replacement = _configDirs[ varOnly ] || DEFAULT_DIRS[ varOnly ] || "";
          url = url.replace( regex, replacement );
        }
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
        else{
          callback();  
        }
      },
      css: function( url, exclude, callback, checkFn ){
        var scriptElement;
        checkFn = checkFn || function(){
          if( !scriptElement ){
            return false;
          }
          for( var i = 0; i < document.styleSheets.length; ++i ){
            if( document.styleSheets[ i ].href === scriptElement.href ){
              return true;
            }
          }
          return false;
        };

        url = fixUrl( url );
        if( !checkFn() ){
          scriptElement = document.createElement( "link" );
          scriptElement.rel = "stylesheet";
          scriptElement.href = url;
          document.head.appendChild( scriptElement );
        }

        var interval = setInterval(function(){
          if( checkFn() ){
            clearInterval( interval );
            callback();
          }
        }, CSS_POLL_INTERVAL );

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

      load: function( items, callback, ordered ){
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
              _loaders[ item.type ]( item.url, item.exclude, callback, item.check );
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