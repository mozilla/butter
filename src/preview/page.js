define( [ "core/logger", "core/eventmanager" ], function( Logger, EventManager ) {

  var POPCORN_URL = "../external/popcorn-js/popcorn.js",

  Page = function() {
    
    var _eventManager = new EventManager( this );

    this.scrape = function() {
      var medias = [], targets = [];

      function scrapeChildren( rootNode ) {
        var children = rootNode.children;

        for( var i=0; i<children.length; i++ ) {
          var thisChild = children[ i ];
          if ( !thisChild ) {
            continue;
          }
          // if DOM element has an data-butter tag that is equal to target or media,
          // add it to butters target list with a respective type
          if ( thisChild.getAttribute ) {
            if( thisChild.getAttribute( "data-butter" ) === "target" ) {
              $( thisChild ).droppable({
                greedy: true,
                drop: function( event, ui ) {

                  // we only care about it if it's not already on this track
                  _eventManager.dispatch( "trackeventrequested", {
                    event: event,
                    ui: ui
                  });
                }
              });
              targets.push( thisChild );
            }
            else if( thisChild.getAttribute( "data-butter" ) === "media" ) {
              medias.push( thisChild ); 
            } // else
          } //if
          if ( thisChild.children && thisChild.children.length > 0 ) {
            scrapeChildren( thisChild );
          } // if
        } // for
      } //scrapeChildren

      scrapeChildren( document.body );

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
