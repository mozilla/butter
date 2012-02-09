(function() {

  define( [ "core/logger", "core/eventmanager", "./page" ], function( Logger, EventManager, Page ) {

    var __guid = 0;
 
    var Previewer = function( butter, options ) {

      var _id = __guid++,
          _logger = new Logger( _id ),
          _media = [],
          _that = this,
          _page = new Page();

        _logger.log( "Starting" );

        _page.listen( "trackeventrequested", function( event ) {
          var te = butter.tracks[ 0 ].addTrackEvent({
            type: event.data.ui.draggable[ 0 ].id.split( "-" )[ 2 ], 
            popcornOptions: {
              start: ( butter.currentTime ) > butter.duration - 1 ? butter.duration - 1 : butter.currentTime,
              end: ( butter.currentTime + 1 ) > butter.duration ? butter.duration : butter.currentTime + 1,
              target: event.data.event.target.id
            }
          });
          te.update();
        });

        this.prepare = function( callback ) {

          var scrapedObject = _page.scrape(),
              targets = scrapedObject.target,
              medias = scrapedObject.media;

          _page.preparePopcorn(function() {
            for( var i = 0, l = targets.length; i < l; i++ ) {
              butter.addTarget({ object: targets[ i ].id });
            }
            for( var i = 0, l = medias.length; i < l; i++ ) {
              var url = "";
              if( ["VIDEO", "AUDIO" ].indexOf( medias[ i ].nodeName ) > -1 ) {
                url = medias[ i ].currentSrc;
              } else {
                url = medias[ i ].getAttribute( "data-butter-source" );
              }
              butter.addMedia({ target: medias[ i ].id, url: url });
            }

            callback && callback();
            butter.dispatch( "previewready" );
          });
        };
    }; //Previewer

    return Previewer;
  }); //define
})();
