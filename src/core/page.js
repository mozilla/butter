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

      for( var i=head.childNodes.length - 1; i>=0; --i ){
        var node = head.childNodes[ i ];
        if( node.getAttribute && 
            ( node.getAttribute( "data-butter-exclude" ) === "true" ||
              node.getAttribute( "data-requiremodule" ) !== null ) ){
          head.removeChild( node );
        } //if
      } //for

      for( var i=body.childNodes.length - 1; i>=0; --i ){
        var node = body.childNodes[ i ];
        if( node.id && node.id.indexOf( "butter-" ) > -1 ){
          body.removeChild( node );
        } //if
      } //for

      html.appendChild( head );
      html.appendChild( body );

      return "<html>" + html.innerHTML + "</html>";
    }; //getHTML

  }; // page
});
