(function( global ) {
    global.pdebug = (function() {
      var d = {};

      d.youtubeplz = "http://www.youtube.com/watch?v=qp0HIF3SfI4&feature=g-vrec";

      d.logComputed = function( el, property ) {
        var styles;
        if( !el ) { return; }
        styles = window.getComputedStyle( el );
        if ( styles ) {
          console.log( el.tagName, el.id, property, styles[ property ] );
        }
      };

      d.check = function() {
        d.logComputed( document.getElementById( "video" ), "width" );
        d.logComputed( document.querySelector( "#video > iframe" ), "width" );
        d.logComputed( document.getElementById( "video-overlay" ), "width" );
        d.logComputed( document.getElementById( "video" ), "height" );
        d.logComputed( document.querySelector( "#video > iframe" ), "height" );
        d.logComputed( document.getElementById( "video-overlay" ), "height" );
      };

      return d;

    }());
}( window ) );
