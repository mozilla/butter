/* This Source Code Form is subject to the terms of the MIT license
 * If a copy of the MIT license was not distributed with this file, you can
 * obtain one at http://www.mozillapopcorn.org/butter-license.txt */

define( [ "core/logger", "core/eventmanager" ], function( Logger, EventManager ) {

  return function( config ) {

    var POPCORN_BASE_URL = config.dirs[ "popcorn-js" ],
        POPCORN_URL = POPCORN_BASE_URL + "popcorn.js",
        PLAYER_URL = POPCORN_BASE_URL + "modules/player/popcorn.player.js",
        PLAYER_TYPE_URL = POPCORN_BASE_URL + "players/{type}/popcorn.{type}.js";

    var _eventManager = new EventManager( this ),
        _snapshot;

    this.scrape = function() {
      var rootNode = document.body,
          targets = rootNode.querySelectorAll("*[data-butter='target']"),
          medias = rootNode.querySelectorAll("*[data-butter='media']");

      return {
        media: medias,
        target: targets
      }; 
    }; // scrape

    this.preparePopcorn = function( readyCallback ) {

      function addScript( url ) {
        var script = document.createElement( "script" );
        script.src = url;
        document.head.appendChild( script );
      }

      function isPopcornReady( cb ) {
        if ( !window.Popcorn ) {
          setTimeout( function() {
            isPopcornReady( cb );
          }, 100 );
        }
        else {
          cb();
        } //if
      } //isPopcornReady

      function isPlayerReady() {
        if ( !window.Popcorn.player ) {
          setTimeout( function() {
            isPlayerReady();
          }, 100 );
        }
        else {
          readyCallback();
        }
      }

      function checkPlayer() {
        if( !window.Popcorn.player ) {
          addScript( PLAYER_URL );
          isPlayerReady();
        } else {
          readyCallback();
        }
      }

      if ( !window.Popcorn ) {
        addScript( POPCORN_URL );
        isPopcornReady( checkPlayer );
      } else {
        checkPlayer();
      }
    }; // preparePopcorn

    this.addPlayerType = function( type ){
      if( !Popcorn[ type ] ){
        var script = document.createElement( "script" );
        script.src = PLAYER_TYPE_URL.replace( /\{type\}/g, type );
        document.head.appendChild( script );
      }
    };

    this.getHTML = function( popcornStrings ){
      var html, head, body, i, toClean, toExclude, node;

      //html tag to which body and head are appended below
      html = document.createElement( "html" );

      // if there is already a snapshot, clone it instead of cloning the current dom
      if( !_snapshot ){
        head = document.getElementsByTagName( "head" )[ 0 ].cloneNode( true );
        body = document.getElementsByTagName( "body" )[ 0 ].cloneNode( true );
      }
      else{
        head = _snapshot.head.cloneNode( true );
        body = _snapshot.body.cloneNode( true );
      }

      toExclude = Array.prototype.slice.call( head.querySelectorAll( "*[data-butter-exclude]" ) );
      toExclude = toExclude.concat( Array.prototype.slice.call( head.querySelectorAll( "*[data-requiremodule]" ) ) );
      for ( i = 0, l = toExclude.length; i < l; ++i ) {
        node = toExclude[ i ];
        node.parentNode.removeChild( node );
      } //for

      toClean = body.querySelectorAll( "*[butter-clean=\"true\"]" );
      for ( i = 0, l = toClean.length; i < l; ++i ) {
        node = toClean[ i ];
        node.removeAttribute( "butter-clean" );
        node.removeAttribute( "data-butter" );
        node.removeAttribute( "data-butter-default" );

        // obviously, classList is preferred (https://developer.mozilla.org/en/DOM/element.classList)
        if( node.classList ){
          node.classList.remove( "ui-droppable" );
        }
        else{
          node.className = node.className.replace( /ui-droppable/g, "" );
        } //if
      } //for

      toExclude = body.querySelectorAll( "*[data-butter-exclude]" );
      for ( i = 0, l = toExclude.length; i < l; ++i ) {
        node = toExclude[ i ];
        node.parentNode.removeChild( node );
      } //for

      html.appendChild( head );
      html.appendChild( body );

      if( popcornStrings ){
        for ( i = 0; i < popcornStrings.length; ++i ) {
          var script = document.createElement( "script" );
          script.type = "text/javascript";
          script.innerHTML = "(function(){\n" + popcornStrings[ i ] + "\n}());";
          body.appendChild( script );
        } //for
      } //if

      return "<html>" + html.innerHTML + "</html>";
    }; //getHTML

    /* Take a snapshot of the current DOM and store it.
     * Mainly for use with generatePopcornString() so as to not export unwanted DOM objects,
     * a snapshot can be taken at any time (usually up to the template author).
     */
    this.snapshotHTML = function(){
      _snapshot = {
        head: document.getElementsByTagName( "head" )[ 0 ].cloneNode( true ),
        body: document.getElementsByTagName( "body" )[ 0 ].cloneNode( true )
      };
    };

    /* Forget DOM snapshots previously taken
     */
    this.eraseSnapshot = function(){
      _snapshot = null;
    };

  }; // page
});
