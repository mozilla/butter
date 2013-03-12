define( [ "util/lang", "text!layouts/logo-spinner.html" ],
  function( LangUtils, LAYOUT_SRC ) {

  return function( parentElement ) {

    var outerElement = LangUtils.domFragment( LAYOUT_SRC, ".butter-logo-spin-outer" ),
        innerElement = outerElement.querySelector( ".butter-spinner" );

    if( parentElement ){
      parentElement.appendChild( outerElement );
    }

    return {
      element: outerElement,
      start: function(){
        outerElement.classList.remove( "fade-out" );
        innerElement.classList.add( "active" );
      },
      stop: function( callback ){
        outerElement.classList.add( "fade-out" );
        setTimeout(function(){
          innerElement.classList.remove( "active" );
          if( callback ){
            callback();
          }
        }, 500 );
      }
    };

  };

});
