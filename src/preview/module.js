(function() {

  define( [ "core/logger", "core/eventmanager", "./page", "./media" ], function( Logger, EventManager, Page, Media ) {

    var __guid = 0;
 
    var Previewer = function( butter, options ) {

      var _id = __guid++,
          _logger = new Logger( _id ),
          _media = [],
          _that = this,
          _page = new Page();
          console.log( _page );

        _logger.log( "Starting" );

        _page.listen( "trackeventrequested", function( event ) {
          var te = butter.tracks[ 0 ].addTrackEvent({
            type: event.data.ui.draggable[ 0 ].id.split( "-" )[ 2 ], 
            popcornOptions: {
              start: butter.currentTime,
              end: ( butter.currentTime + 1 ) > butter.duration ? butter.duration : butter.currentTime + 1,
              target: event.data.event.target.id
            }
          });
          te.update();
        });

        function onMediaAdded( e ) {
          _media.push( new Media( e.data ) );
        } //onMediaAdded

        function onMediaChanged( e ) {
        } //onMediaChanged

        function onMediaRemoved( e ) {
          _media.splice( _media.indexOf( e.data ), 1 );
        } //onMediaRemoved

        butter.listen( "mediaadded", onMediaAdded );
        butter.listen( "mediachanged", onMediaChanged );
        butter.listen( "mediaremoved", onMediaRemoved );

        this.destroy = function() {
          butter.unlisten( "mediaadded", onMediaAdded );
          butter.unlisten( "mediachanged", onMediaChanged );
          butter.unlisten( "mediaremoved", onMediaRemoved );
        }; //destroy

        this.waitForMedia = function( media ) {
          for( var i=0; i<_media.length; ++i ){
            if( _media[ i ].media === media ){
              _media[ i ].wait();
            } //if
          } //for
        }; //waitForMedia

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
