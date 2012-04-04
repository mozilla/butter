define([], function(){
  
  return function( parentElement ){

    var outerElement = document.createElement( "div" ),
        innerElement = document.createElement( "div" );

    outerElement.className = "butter-logo-spin-outer";
    innerElement.className = "butter-logo-spin-inner";

    outerElement.appendChild( innerElement );

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