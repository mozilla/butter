(function( Butter, EditorHelper ) {
  document.addEventListener( "DOMContentLoaded", function(){
    Butter({
      config: "butter/config.json",
      ready: function( butter ){
        var media = butter.currentMedia,
            popcorn = media.popcorn.pocporn;

        EditorHelper( butter, popcorn );

      }
    }); //Butter
  }, false);
}( window.Butter, window.EditorHelper ));
