(function( Butter, EditorHelper, PositionDebugger ) {
  document.addEventListener( "DOMContentLoaded", function(){
    Butter({
      config: "butter/config.json",
      ready: function( butter ){
        var media = butter.currentMedia,
            popcorn = media.popcorn.pocporn,
            debug = true,
            pdebug;

        EditorHelper( butter, popcorn );

        if( debug === true ) {
          pdebug = new PositionDebugger();
          butter.listen("mediaready", function(){
            console.log( butter.currentMedia.url );
            pdebug.logComputed( document.getElementById( "video" ), "width" );
            pdebug.logComputed( document.getElementById( "video" ), "height" );
            pdebug.logComputed( document.querySelector( "#video > iframe" ), "height" );
            pdebug.logComputed( document.getElementById( "video-overlay" ), "width" );
            pdebug.logComputed( document.getElementById( "video-overlay" ), "height" );
          });
        }

      }
    }); //Butter
  }, false);
}( window.Butter, window.EditorHelper, window.PositionDebugger ));
