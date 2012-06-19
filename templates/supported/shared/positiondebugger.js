(function( global ) {
    global.PositionDebugger = function( butter, popcorn ) {
      console.log( "Need youtube?" );
      console.log( "http://www.youtube.com/watch?v=qp0HIF3SfI4&feature=g-vrec" );

      this.logComputed = function( el, property ) {
        var styles;
        if( !el ) { return; }
        styles = window.getComputedStyle( el );
        if ( styles ) {
          console.log( el.tagName, el.id, property, styles[ property ] );
        }
      };

    };
}( window ) );
