define( [ "core/logger", "core/eventmanager" ], function( Logger, EventManager ) {

  var POPCORN_URL = "../external/popcorn-js/popcorn.js",

  Page = function() {
    
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
  }; // page
  return Page;
});
