define( [ "core/logger", "core/eventmanager" ], function( Logger, EventManager ) {

  var POPCORN_URL = "../external/popcorn-js/popcorn.js",

  Page = function() {
    
    var _eventManager = new EventManager( this );

    this.scrape = function() {
      var rootNode = document.body,
          targets = rootNode.querySelectorAll("*[data-butter='target']"),
          medias = rootNode.querySelectorAll("*[data-butter='media']");

      // Once #389 lands this can disappear and we can simply return the result of the two querySelectorAll results
      for( var i = 0, il = targets.length; i < il; i++ ) {
        $( targets[ i ] ).droppable({
          greedy: true,
          drop: function( event, ui ) {

            // we only care about it if it's not already on this track
            _eventManager.dispatch( "trackeventrequested", {
              event: event,
              ui: ui
            });
          }
        });
      }

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
