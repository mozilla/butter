/* This Source Code Form is subject to the terms of the MIT license
 * If a copy of the MIT license was not distributed with this file, you can
 * obtain one at http://www.mozillapopcorn.org/butter-license.txt */

define( [ "core/logger", "core/eventmanager" ], function( Logger, EventManagerWrapper ) {

  return function( loader, config ) {

    var PLAYER_TYPE_URL = "{popcorn-js}/players/{type}/popcorn.{type}.js";

    var _snapshot;

    EventManagerWrapper( this );

    this.scrape = function() {
      var rootNode = document.body,
          targets = rootNode.querySelectorAll("*[data-butter='target']"),
          medias = rootNode.querySelectorAll("*[data-butter='media']");

      return {
        media: medias,
        target: targets
      };
    }; // scrape

    this.prepare = function( readyCallback ){
      loader.load([
        {
          type: "js",
          url: "{popcorn-js}/popcorn.js",
          check: function(){
            return !!window.Popcorn;
          }
        },
        {
          type: "js",
          url: "{popcorn-js}/modules/player/popcorn.player.js",
          check: function(){
            return !!window.Popcorn && !!window.Popcorn.player;
          }
        }
      ], readyCallback, null, true );
    };

    this.addPlayerType = function( type, callback ){
      loader.load({
        type: "js",
        url: PLAYER_TYPE_URL.replace( /\{type\}/g, type ),
        check: function(){
          return !!Popcorn[ type ];
        }
      }, callback );
    };

    this.getHTML = function( popcornStrings ){
      var html, head, body, i, l, toClean, toExclude, node, newNode, base, mediaElements;

      //html tag to which body and head are appended below
      html = document.createElement( "html" );

      // if there is already a snapshot, clone it instead of cloning the current dom
      if( !_snapshot ){
        body = document.getElementsByTagName( "body" )[ 0 ].cloneNode( true );
      }
      else {
        body = _snapshot.body.cloneNode( true );
      }

      head = document.getElementsByTagName( "head" )[ 0 ].cloneNode( true );

      toExclude = Array.prototype.slice.call( head.querySelectorAll( "*[data-butter-exclude]" ) );
      toExclude = toExclude.concat( Array.prototype.slice.call( head.querySelectorAll( "*[data-requiremodule]" ) ) );
      for ( i = 0, l = toExclude.length; i < l; ++i ) {
        node = toExclude[ i ];
        node.parentNode.removeChild( node );
      }

      mediaElements = body.querySelectorAll( "*[data-butter='media']" );

      for ( i = 0, l = mediaElements.length; i < l; ++i ) {
        node = mediaElements[ i ];
        newNode = document.getElementById( node.id ).cloneNode( true );

        if( [ "VIDEO", "AUDIO" ].indexOf( newNode.nodeName ) === -1 ){
          newNode.innerHTML = "";
        }
        node.parentNode.replaceChild( newNode, node );
        newNode.removeAttribute( "data-butter-source" );
      }

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

      // Add <base> tag, but only for export
      base = document.createElement("base");
      base.href = window.location.href.substring( 0, window.location.href.lastIndexOf( "/" ) + 1 );
      head.insertBefore( base, head.firstChild );

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

      this.dispatch( "getHTML", html );

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
