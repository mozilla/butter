(function() {

  define( [ "core/logger", "core/eventmanager", "./page", "./media" ], function( Logger, EventManager, Page, Media ) {

    var __guid = 0;

    var Previewer = function( butter, options ) {

      var _id = __guid++,
          _logger = new Logger( _id ),
          _media = [],
          _that = this;

        _logger.log( "Starting" );

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
    }; //Previewer

    return Previewer;
  }); //define
})();
