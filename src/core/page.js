define( [ "core/logger", "core/eventmanager" ], function( Logger, EventManager ) {

  var POPCORN_URL = "../external/popcorn-js/popcorn.js";

  return function() {
    
    var _eventManager = new EventManager( this );

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

      function isPopcornReady() {
        if ( !window.Popcorn ) {
          setTimeout( function() {
            isPopcornReady();
          }, 1000 );
        }
        else {
          readyCallback();
        } //if
      } //isPopcornReady

      if ( !window.Popcorn ) {
        var popcornSourceScript = document.createElement( "script" );
        popcornSourceScript.src = POPCORN_URL;
        document.head.appendChild( popcornSourceScript );
        isPopcornReady();
      }
      else {
        readyCallback();
      } //if
    }; // preparePopcorn

    this.getHTML = function(){
      var html = document.createElement( "html" ),
          head = document.getElementsByTagName( "head" )[ 0 ].cloneNode( true ),
          body = document.getElementsByTagName( "body" )[ 0 ].cloneNode( true );
      var toClean, toExclude;

      toExclude = Array.prototype.slice.call( head.querySelectorAll( "*[butter-exclude]" ) );
      toExclude = toExclude.concat( Array.prototype.slice.call( head.querySelectorAll( "*[data-requiremodule]" ) ) );
      for( var i=0, l=toExclude.length; i<l; ++i ){
        var node = toExclude[ i ];
        node.parentNode.removeChild( node );
      } //for

      toClean = body.querySelectorAll( "*[butter-clean=\"true\"]" );
      for( var i=0, l=toClean.length; i<l; ++i ){
        var node = toClean[ i ];
        node.removeAttribute( "butter-clean" );
        node.removeAttribute( "data-butter" );
        node.className = node.className.replace( /ui-droppable/g, "" );
      } //for

      toExclude = body.querySelectorAll( "*[butter-exclude=\"true\"]" );
      for( var i=0, l=toExclude.length; i<l; ++i ){
        var node = toExclude[ i ];
        node.parentNode.removeChild( node );
      } //for

      html.appendChild( head );
      html.appendChild( body );

      return "<html>" + html.innerHTML + "</html>";
    }; //getHTML

  }; // page
});
